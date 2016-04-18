/**
* Created by sujata.patne on 24-07-2015.
*/
myApp.service('HandSetGroup', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getHandSetGroup = function (data, success, error) {
        $http.post(service.baseRestUrl + '/gethandsetgroup').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.addEditHandSet = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addedithandset', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);