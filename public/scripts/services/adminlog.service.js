/**
 * @memberof myApp 
 * @type {Service|angular.Service}
 * The `Logs` service provides functionality like getAdminLog for Logs List.
 * @param {$http} $http dependency.
 */
myApp.service('Logs', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Administrator Log List
     * @param data
     * @param success
     * @param error
     */
    service.getAdminLog = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getadminlog', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    return service;
} ]);