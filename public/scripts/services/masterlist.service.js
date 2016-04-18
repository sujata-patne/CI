/**
* Created by sujata.patne on 14-07-2015.
*/
myApp.service('MasterLists', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getmasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    service.AddEditMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditmasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.DeleteMasterList = function (data, success, error) {
        $http.post(service.baseRestUrl + '/deletemasterlist', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);