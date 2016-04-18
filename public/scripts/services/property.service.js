/**
* Created by sujata.patne on 14-07-2015.
*/
myApp.service('Propertys', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getPropertys = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getproperty', data).success(function (items) {
            success(items);
        }).error(function (err) {
            console.log(err)
            error(err);
        });
    }
    service.AddEditProperty = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addeditproperty', data).success(function (items) {
            success(items);
        }).error(function (err) {
            console.log(err)
            error(err);
        });
    }


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