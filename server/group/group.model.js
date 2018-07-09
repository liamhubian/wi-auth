let Model = require('../models-master');
let responseJSON = require('../response');
let async = require('async');

async function createNewGroup(data, done, username) {
    let user = await Model.User.findOne({ where: { username: username } });
    Model.Group.create(data).then(group => {
        group.addUser(user, { through: { permission: 1 } });
        done(responseJSON(200, "Successfull", group));
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

async function listGroup(data, done, decoded) {
    if (decoded.whoami === 'main-service') {
        let conditions = data.idCompany ? { idCompany: data.idCompany } : {};
        let user = await Model.User.findOne({ where: { username: decoded.username } });
        Model.Group.findAll({
            include: [{ model: Model.User }, { model: Model.SharedProject }],
            where: conditions
        }).then(groups => {
            let response = [];
            async.each(groups, function (group, nextGroup) {
                group = group.toJSON();
                group.canDelete = false;
                // group.canEdit = false;
                let arr = [];
                async.each(group.shared_projects, function (shared_project, next) {
                    if (shared_project.idOwner === user.idUser) {
                        arr.push(shared_project);
                        next();
                    } else {
                        next();
                    }
                }, function () {
                    async.each(group.users, function (_user, nextUser) {
                        if (_user.user_group_permission.permission === 1 && _user.idUser === user.idUser) group.canDelete = true;
                        nextUser();
                    }, function () {
                        group.shared_projects = arr;
                        response.push(group);
                        nextGroup();
                    });
                });
            }, function () {
                response.sort((a, b) => {
                    let nameA = a.name.toUpperCase();
                    let nameB = b.name.toUpperCase();
                    return nameA == nameB ? 0 : nameA > nameB ? 1 : -1;
                });
                done(responseJSON(200, "Successfull", response));
            });
        }).catch(err => {
            done(responseJSON(512, err, err));
        });
    } else {
        if (decoded.role === 0) {
            Model.Group.findAll({ include: { all: true } }).then((gs) => {
                done(responseJSON(200, "Done", gs));
            }).catch(err => {
                done(responseJSON(512, err.message, err.message));
            });
        } else if (decoded.role === 1) {
            Model.User.findOne({ where: { username: decoded.username } }).then(user => {
                Model.Group.findAll({ where: { idCompany: user.idCompany }, include: { all: true } }).then(gs => {
                    done(responseJSON(200, "Done", gs));
                });
            });
        } else {
            done(responseJSON(512, "No permission", "No permission"));
        }
    }
}

function addUserToGroup(data, done) {
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.addUser(data.idUser, { through: { permission: 2 } });
            done(responseJSON(200, "Successfull", data));
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function deleteGroup(data, done) {
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.destroy().then(() => {
                done(responseJSON(200, "Successfull", group));
            })
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function removeUser(data, done) {
    Model.Group.findById(data.idGroup, { include: { model: Model.User, where: { idUser: data.idUser } } }).then(group => {
        if (group) {
            if (group.users[0].user_group_permission.permission === 1) {
                done(responseJSON(200, "CANT_REMOVE_OWNER", "CANT_REMOVE_OWNER"));
            } else {
                group.removeUser(data.idUser);
                done(responseJSON(200, "Successfull", data));
            }
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    });
}

function getProjectPermission(data, done) {
    if (!data.project_name) return done(responseJSON(512, "Need Project Name"));
    Model.Group.findById(data.idGroup, {
        include: {
            model: Model.SharedProject,
            where: { project_name: data.project_name }
        }
    }).then(group => {
        if (!group) {
            done(responseJSON(200, "Successfull", {}));
        } else {
            if (group.shared_projects.length !== 0) {
                done(responseJSON(200, "Successfull", group.shared_projects[0].shared_project_group.permission));
            } else {
                done(responseJSON(200, "Successfull", {}));
            }
        }
    });
}

function updateProjectPermission(data, done) {
    Model.Group.findById(data.idGroup, {
        include: {
            model: Model.SharedProject,
            where: { project_name: data.project_name }
        }
    }).then(group => {
        if (group.shared_projects.length !== 0) {
            group.setShared_projects([group.shared_projects[0].idSharedProject], { through: { permission: data.permission } });
            done(responseJSON(200, "Successfull", group));
        } else {
            done(responseJSON(200, "Successfull", {}));
        }
    })
}

async function addUserToGroups(data, done) {
    try {

        const listGroupPromise = data
            .idGroups
            .map(id => Model.Group.findById(id));

        const groups = await Promise.all(listGroupPromise);

        groups.forEach(group => {
            if(group) group.addUser(data.idUser, { through: { permission: 2 } });
        })

        done(responseJSON(200, "Successfull", data));



    } catch (err) { 
        done(responseJSON(512, err, err));
    }
}

module.exports = {
    createNewGroup: createNewGroup,
    listGroup: listGroup,
    deleteGroup: deleteGroup,
    addUserToGroup: addUserToGroup,
    removeUser: removeUser,
    getProjectPermission: getProjectPermission,
    updateProjectPermission: updateProjectPermission,
    addUserToGroups
};