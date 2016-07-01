/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Excel` service provides functionality like ExportExcel, ExportVcode for Excel List.
 * @param {$http} $http dependency.
 */
myApp.service('Excel', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Export Contents To Excel
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.ExportExcel = function (data, success, error) {
        $http({ method: "Post", url: service.baseRestUrl + '/exportexcel', data: data, headers: { 'Content-type': 'application/json' }, responseType: 'arraybuffer' }).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Export Vcode To Excel
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.ExportVcode = function (data, success, error) {
        $http({ method: "Post", url: service.baseRestUrl + '/exportVcode', data: data, headers: { 'Content-type': 'application/json',"Content-Disposition":"attachment;" }, responseType: 'arraybuffer' })
            //.success(function (items) {
            .success(function (items, status, headers, config) {
                success(items, status, headers, config);
        }).error(function (err) {
            error(err);
        });
    }
    return service;
}]);