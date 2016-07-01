/**
* Created by sujata.patne on 14-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Vendors` service provides functionality like  GetVendors, AddEditVendor, BlockUnBlockVendor for Vendor List.
 * @param {$http} $http dependency.
 */
myApp.service('Vendors', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Vendors List
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.GetVendors = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getvendor', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Add and Edit Vendor
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.AddEditVendor = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditvendor', data).success(function (items) {
            console.log(items)
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Block & Unblock Vendors
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.BlockUnBlockVendor = function (data, success, error) {
        $http.post(service.baseRestUrl + '/blockunblockvendor', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);