
myApp.service('Logs', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getAdminLog = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getadminlog', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
        return service;
} ]);