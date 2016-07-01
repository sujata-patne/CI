/**
* Created by sujata.patne on 14-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `MasterLists` service provides functionality like getMasterList, AddEditMasterList, DeleteMasterList for Masterlist List.
 * @param {$http} $http dependency.
 */
myApp.service('MasterLists', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Master List
     * @param data
     * @param success
     * @param error
     */
    service.getMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getmasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Add & Update Masterlist
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.AddEditMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditmasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Delete Masterlist
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.DeleteMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/deletemasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);