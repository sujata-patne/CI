/**
* Created by sujata.patne on 24-07-2015.
*/
myApp.service('ContentCatalog', ['$http','Upload', function ($http,Upload) {
    var service = {};
    service.baseRestUrl = '';
    service.getContentCatalog = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentcatalog', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.addUpdateVcode = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addUpdateVcode', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.Upload = function (url, data, success, error) {
        Upload.upload({
            url: url,
            data: data
        }).then(function (resp) {
            success(resp);
        }, function (resp) {
            error(resp.data);
        }, function (evt) {
        });
    }
    service.getPersonalizedDataForVcode = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getPersonalizedDataForVcode',data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.UpdateState = function (data, success, error) {
        $http.post(service.baseRestUrl + '/updatestate', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);