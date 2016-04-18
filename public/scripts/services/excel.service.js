
myApp.service('Excel', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.ExportExcel = function (data, success, error) {
        $http({ method: "Post", url: service.baseRestUrl + '/exportexcel', data: data, headers: { 'Content-type': 'application/json' }, responseType: 'arraybuffer' }).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.ExportVcode = function (data, success, error) {
        $http({ method: "Post", url: service.baseRestUrl + '/exportVcode', data: data, headers: { 'Content-type': 'application/json',"Content-Disposition":"attachment;" }, responseType: 'arraybuffer' })
            //.success(function (items) {
            .success(function (items, status, headers, config) {
                success(items, status, headers, config);
        }).error(function (err) {
            error(err);
        });
    }
    return service;
}]);