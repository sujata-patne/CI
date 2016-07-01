/**
* Created by sujata.patne on 24-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `ContentFile` service provides functionality like getContentFile, checkMetadata,Upload for ContentFile List.
 * @param {$http} $http dependency.
 */
myApp.service('ContentFile', ['$http', 'Upload', function ($http, Upload) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Content Files List
     * @param data
     * @param success
     * @param error
     */
    service.getContentFile = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentfile').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Check Matadata Validity to retrieve it's Details
     * @param data
     * @param success
     * @param error
     */
    service.checkMetadata = function (data, success, error) {
        $http.post(service.baseRestUrl + '/checkmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Upload Content Files
     * @param url
     * @param data
     * @param success
     * @param error
     * @constructor
     */
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
    return service;
}]);