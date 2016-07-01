/**
* Created by sujata.patne on 14-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Propertys` service provides functionality like getPropertys, AddEditProperty, BlockUnBlockProperty for Property List.
 * @param {$http} $http dependency.
 */
myApp.service('Propertys', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Property List
     * @param data
     * @param success
     * @param error
     */
    service.getPropertys = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getproperty', data).success(function (items) {
            success(items);
        }).error(function (err) {
            console.log(err)
            error(err);
        });
    }
    /**
     * @desc Add & Update Property
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.AddEditProperty = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditproperty', data).success(function (items) {
            success(items);
        }).error(function (err) {
            console.log(err)
            error(err);
        });
    }
    /**
     * @desc Block & Unblock Property
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.BlockUnBlockProperty = function (data, success, error) {
        $http.post(service.baseRestUrl + '/blockunblockproperty', data).success(function (items) {
            success(items);
        }).error(function (err) {
            console.log(err)
            error(err);
        });
    }
    return service;
} ]);