/**
* Created by sujata.patne on 14-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Users` service provides functionality like  getUsers, AddEditUsers, BlockUnBlockUser,changePassword for Users List.
 * @param {$http} $http dependency.
 */
myApp.service('Users', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Users List
     * @param data
     * @param success
     * @param error
     */
    service.getUsers = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getuser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Add & Update User
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.AddEditUsers = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addedituser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Block & Unblock User
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.BlockUnBlockUser = function (data, success, error) {
        $http.post(service.baseRestUrl + '/blockunblockuser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Change User's Password
     * @param data
     * @param success
     * @param error
     */
    service.changePassword = function (data, success, error) {
        $http.post(service.baseRestUrl + '/changepassword', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);