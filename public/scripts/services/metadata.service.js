/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Metadatas` service provides functionality like getMetadata, AddEditMetaData, SubmitMetadata for Metadata List.
 * @param {$http} $http dependency.
 */
myApp.service('Metadatas', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Matadata List
     * @param data
     * @param success
     * @param error
     */
    service.getMetadata = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Add and Update Metadata
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.AddEditMetaData = function (data, success, error) {
         $http.post(service.baseRestUrl + 'addeditmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Save Metadata
     * @param data
     * @param success
     * @param error
     * @constructor
     */
    service.SubmitMetadata = function (data, success, error) {
         $http.post(service.baseRestUrl + 'submitmeta', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    return service;
} ]);