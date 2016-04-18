/**
* Created by sujata.patne on 14-07-2015.
*/
myApp.service('Users', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getUsers = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getuser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    service.AddEditUsers = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addedituser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.BlockUnBlockUser = function (data, success, error) {
        $http.post(service.baseRestUrl + '/blockunblockuser', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }


    service.changePassword = function (data, success, error) {
        $http.post(service.baseRestUrl + '/changepassword', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);