class Perm {
    constructor() {
        this.permission = {
            'well.get': true,
            'well.create': true,
            'well.update': false,
            'well.delete': false,
            'dataset.get': true,
            'dataset.create': true,
            'dataset.update': false,
            'dataset.delete': false,
            'curve.get': true,
            'curve.create': true,
            'curve.update': false,
            'curve.delete': false,
            'plot.get': true,
            'plot.create': true,
            'plot.update': false,
            'plot.delete': false,
            'histogram.get': true,
            'histogram.create': true,
            'histogram.update': false,
            'histogram.delete': false,
            'cross-plot.get': true,
            'cross-plot.create': true,
            'cross-plot.update': false,
            'cross-plot.delete': false,
            'track.get': true,
            'track.create': true,
            'track.update': false,
            'track.delete': false,
            'line.get': true,
            'line.create': true,
            'line.update': false,
            'line.delete': false,
            'shading.get': true,
            'shading.create': true,
            'shading.update': false,
            'shading.delete': false,
            'marker.get': true,
            'marker.create': true,
            'marker.update': false,
            'marker.delete': false,
            'reference-curve.get': true,
            'reference-curve.create': true,
            'reference-curve.update': false,
            'reference-curve.delete': false,
            'zone-set.get': true,
            'zone-set.create': true,
            'zone-set.update': false,
            'zone-set.delete': false,
            'zone.get': true,
            'zone.create': true,
            'zone.update': false,
            'zone.delete': false,
            'combined-box.get': true,
            'combined-box.create': true,
            'combined-box.update': false,
            'combined-box.delete': false,
            'depth-axis.get': true,
            'depth-axis.create': true,
            'depth-axis.update': false,
            'depth-axis.delete': false,
            'image-track.get': true,
            'image-track.create': true,
            'image-track.update': false,
            'image-track.delete': false,
            'object-track.get': true,
            'object-track.create': true,
            'objecttrack.update': false,
            'object-track.delete': false,
            'zone-track.get': true,
            'zone-track.create': true,
            'zone-track.update': false,
            'zone-track.delete': false,
            'annotation.get': true,
            'annotation.create': true,
            'annotation.update': false,
            'annotation.delete': false,
            'image-of-track.get': true,
            'image-of-track.create': true,
            'image-of-track.update': false,
            'image-of-track.delete': false,
            'object-of-track.get': true,
            'object-of-track.create': true,
            'object-of-track.update': false,
            'object-of-track.delete': false,
            'polygon.get': true,
            'polygon.create': true,
            'polygon.update': false,
            'polygon.delete': false,
            'regression-line.get': true,
            'regression-line.create': true,
            'regression-line.update': false,
            'regression-line.delete': false,
            'ternary.get': true,
            'ternary.create': true,
            'ternary.update': false,
            'ternary.delete': false,
            'point-set.get': true,
            'point-set.create': true,
            'point-set.update': false,
            'point-set.delete': false,
            'user-define-line.get': true,
            'user-define-line.create': true,
            'user-define-line.update': false,
            'user-define-line.delete': false,
        }
    }
}

module.exports = (new Perm()).permission;