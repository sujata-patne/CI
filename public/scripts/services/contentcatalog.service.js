/**
* Created by sujata.patne on 24-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `ContentCatalog` service provides functions like  getContentCatalog, addUpdateVcode, addUpdatePromocode, addUpdatePromocode,
 * getPersonalizedDataForVcode, UpdateState, Upload content files.
 *
 * @param {$http} $http dependency.
 * @param {Upload} ngFileUpload dependency.
 */
myApp.service('ContentCatalog', ['$http','Upload', function ($http,Upload) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @name getContentCatalog
     * @desc Get Content Catalog Data
     * @param data
     * @param success
     * @param error
     */
    service.getContentCatalog = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentcatalog', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @name addUpdateVcode
     * @param data
     * @param success
     * @param error
     */
    service.addUpdateVcode = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addUpdateVcode', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @name addUpdatePromocode
     * @param data
     * @param success
     * @param error
     */
    service.addUpdatePromocode = function (data, success, error) {
        $http.post(service.baseRestUrl + '/addUpdatePromocode', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @name Upload
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
    /**
     * @name getPersonalizedDataForVcode
     * @param data
     * @param success
     * @param error
     */
    service.getPersonalizedDataForVcode = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getPersonalizedDataForVcode',data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @name UpdateState
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.UpdateState = function (data, success, error) {
        $http.post(service.baseRestUrl + '/updatestate', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    return service;
} ]);