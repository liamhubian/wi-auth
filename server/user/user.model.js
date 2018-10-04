"use strict";
let models = require("../models-master/index");
let User = models.User;
let Company = models.Company;
let SharedProject = models.SharedProject;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let md5 = require('md5');
let config = require('config').backend_service;
let async = require('async');

function createUser(userInfo, done) {
    userInfo.username = userInfo.username ? userInfo.username.toLowerCase() : "unknown";
    userInfo.password = md5(userInfo.password);
    User.create(userInfo).then(user => {
        done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    });
}

function infoUser(userInfo, done) {
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error no user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })
}

// function editUser(userInfo, done) {
//     // console.log(userInfo);
//     // userInfo.password = md5(userInfo.password);
//     if (userInfo.password === "") delete userInfo.password;
//     User.findById(userInfo.idUser).then(user => {
//         if (user) {
//             if (userInfo.password) {
//                 userInfo.password = md5(userInfo.password);
//             }
//             Object.assign(user, userInfo).save().then(rs => {
//                 done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", rs));
//             }).catch(err => {
//                 done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err));
//             });
//         } else {
//             done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
//         }
//     }).catch(err => {
//         done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
//     })

// }

function editUser(userInfo, done) {
    // console.log(userInfo);
    // userInfo.password = md5(userInfo.password);
    if (userInfo.password === "") delete userInfo.password;
    User.findById(userInfo.idUser).then(async user => {
        if (user) {
            if (userInfo.password) {
                userInfo.password = md5(userInfo.password);
            }

            if (userInfo.idCompany !== user.idCompany) {
                //remove all group allow in that user
                try {
                    const rs = await models.UserGroupPermission.destroy({
                        where: {
                            idUser: userInfo.idUser
                        }
                    })
                } catch (err) {
                    return done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err.message));
                }
            }

            if (userInfo.idGroup) {
                try {
                    const group = await models.Group.findById(userInfo.idGroup);
                    if (!group) {
                        return done(responseJSON(512, "No group found by id"));
                    }

                    await group.addUser(userInfo.idUser, {through: {permission: 2}});
                } catch (err) {
                    return done(responseJSON(512, err, err));
                }
            }


            Object.assign(user, userInfo).save().then(rs => {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", rs));
            }).catch(err => {
                done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err));
            });
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })

}

function checkLicense(idCompany, cb) {
    Company.findById(idCompany, {include: {model: User, where: {status: 'Active'}}}).then(company => {
        let activeUsers = company.users.length;
        if (company.licenses > activeUsers) {
            cb(true);
        } else {
            cb(false);
        }
    });
}

function changeUserStatus(userInfo, done) {
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            if (userInfo.status === "Active") {
                checkLicense(user.idCompany, function (pass) {
                    if (pass) {
                        Object.assign(user, userInfo).save().then(u => {
                            done(ResponseJSON(200, "Done", u));
                        }).catch(err => {
                            done(ResponseJSON(512, err.message, err.message));
                        });
                    } else {
                        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Your licenses limited. Can't avtive more user!"));
                    }
                })
            } else {
                Object.assign(user, userInfo).save().then(u => {
                    done(ResponseJSON(200, "Done", u));
                }).catch(err => {
                    done(ResponseJSON(512, err.message, err.message));
                });
            }
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
        }
    })
}

function listUser(userInfo, done, decoded) {
    if(userInfo.owner && userInfo.owner.indexOf('su_') === 0){
        userInfo.owner = userInfo.owner.substring(3);
    }
    if (decoded.whoami === 'main-service') {
        let conditions = userInfo.idCompany ? {idCompany: userInfo.idCompany} : {};
        User.findAll({where: conditions}).then(users => {
            if (userInfo.project_name && userInfo.owner) {
                let response = [];
                let user = users.find(u => u.username === userInfo.owner);
                SharedProject.findOne({
                    where: {project_name: userInfo.project_name, idOwner: user.idUser},
                    include: {model: models.Group}
                }).then(sp => {
                    if (sp) {
                        async.each(sp.groups, function (group, next) {
                            models.Group.findById(group.idGroup, {include: {model: models.User}}).then(g => {
                                async.each(g.users, function (u, nextU) {
                                    let find = response.find(_u => _u.username === u.username);
                                    if (!find) response.push(u);
                                    nextU();
                                }, function () {
                                    next();
                                });
                            });
                        }, function () {
                            done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
                        });
                    } else {
                        let r = [];
                        r.push(user);
                        done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", r));
                    }
                });
            } else {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", users));
            }
        }).catch(err => {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
        })
    } else {
        if (decoded.role === 0) {
            User.findAll().then(us => {
                done(ResponseJSON(200, "Done", us));
            });
        } else if (decoded.role === 1) {
            const Op = require('sequelize').Op;
            User.findOne({where: {username: decoded.username}}).then(user => {
                models.User.findAll({where: {idCompany: user.idCompany, role: {[Op.gte]: 1}}}).then(gs => {
                    done(ResponseJSON(200, "Done", gs));
                });
            });
        } else if (decoded.role === 2) {
            User.findAll({where: {username: decoded.username}}).then(u => {
                done(ResponseJSON(200, "Done", u));
            });
        }
    }
}

function deleteUser(userInfo, done) {
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            User.destroy({where: {idUser: user.idUser}, individualHooks: true}).then(rs => {
                if (rs > 0) {
                    done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
                    // let request = require('request');
                    // let dbName = 'wi_' + user.username.toLowerCase();
                    // let host = config.host + ":" + config.port;
                    // let options = {
                    //     uri: host + '/database/update',
                    //     method: 'DELETE',
                    //     json: {
                    //         "dbName": dbName
                    //     }
                    // };
                    // request(
                    //     options,
                    //     function (error, response, body) {
                    //         if (error) {
                    //             return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
                    //         }
                    //
                    //         if (body.code === 200) {
                    //             return done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
                    //         }
                    //         done(body);
                    //     });
                }
            }).catch(err => {
                console.log(err);
                done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err.message));
            });
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })
}

function dropDb(payload, done) {
    let request = require('request');
    let dbName = 'wi_' + payload.username.toLowerCase();
    let host = config.host + ":" + config.port;
    let options = {
        uri: host + '/database/update',
        method: 'DELETE',
        json: {
            "dbName": dbName
        }
    };
    request(
        options,
        function (error, response, body) {
            if (error) {
                return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
            }

            if (body.code === 200) {
                return done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
            }
            done(body);
        });

}

function getPermission(payload, done, username) {
    let _user = payload.username || username;
    let permission = require('../utils/default-permission---------');
    for (let key in permission) {
        permission[key] = false;
    }
    if (!payload.project_name) {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Need projectname"));
    } else {
        User.findOne({
            where: {username: _user},
            include: {
                model: models.Group,
            }
        }).then(user => {
            async.each(user.groups, function (group, nextGroup) {
                models.Group.findById(group.idGroup, {
                    include: {
                        model: models.SharedProject,
                        where: {project_name: payload.project_name}
                    }
                }).then(g => {
                    if (g) {
                        async.each(g.shared_projects, function (sharedProject, next) {
                            for (let key in sharedProject.shared_project_group.permission) {
                                permission[key] = permission[key] || sharedProject.shared_project_group.permission[key];
                            }
                            next();
                        }, function () {
                            nextGroup();
                        });
                    } else {
                        nextGroup();
                    }
                })
            }, function () {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", permission));
            });
        });
    }
}

function forceLogOut(payload, done, username) {
    models.User.findById(payload.idUser).then(user => {
        if (user) {
            models.RefreshToken.destroy({where: {idUser: user.idUser}}).then(() => {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Done", user));
            }).catch(err => {
                done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err.message));
            });

        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found", "No user found"));
        }
    });
}

async function changePassword(payload, username) {
    const {oldPassword, newPassword} = payload;

    try {
        const user = await models.User.findOne({where: {username}});

        if (!user) throw new Error('Incorrect password!');
        if (md5(oldPassword) !== user.password) throw new Error('Incorrect password!');

        user.password = md5(newPassword);
        const savedUser = await user.save();
        const userObj = {...savedUser.toJSON()};
        delete userObj.password;

        return ResponseJSON(ErrorCodes.SUCCESS, "Successful", userObj);
    } catch (err) {
        return ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err.message);
    }
}

module.exports = {
    createUser: createUser,
    infoUser: infoUser,
    deleteUser: deleteUser,
    listUser: listUser,
    editUser: editUser,
    getPermission: getPermission,
    changeUserStatus: changeUserStatus,
    forceLogOut: forceLogOut,
    changePassword
};