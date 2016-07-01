/**
* Created by sujata.patne on 24-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `HandSetGroup` service provides functionality like getHandSetGroup, addEditHandSet for HandSetGroup List.
 * @param {$http} $http dependency.
 */
myApp.service('HandSetGroup', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Handset Group List
     * @param data
     * @param success
     * @param error
     */
    service.getHandSetGroup = function (data, success, error) {
        $http.post(service.baseRestUrl + '/gethandsetgroup').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Add & Update Handset
     * @param data
     * @param success
     * @param error
     */
    service.addEditHandSet = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addedithandset', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);