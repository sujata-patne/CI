/**
* Created by sujata.patne on 14-07-2015.
*/
myApp.service('Vendors', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.GetVendors = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getvendor', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    service.AddEditVendor = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditvendor', data).success(function (items) {
            console.log(items)
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.BlockUnBlockVendor = function (data, success, error) {
        $http.post(service.baseRestUrl + '/blockunblockvendor', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);