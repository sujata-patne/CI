
myApp.service('Metadatas', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';

    service.getMetadata = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.AddEditMetaData = function (data, success, error) {
        //data.url
        $http.post(service.baseRestUrl + 'addeditmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.SubmitMetadata = function (data, success, error) {
        //data.url
        $http.post(service.baseRestUrl + 'submitmeta', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);