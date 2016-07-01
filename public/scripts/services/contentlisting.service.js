/**
* Created by sujata.patne on 24-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `ContentListing` service provides functionality like getContentListing, uploadFile for ContentListing List.
 * @param {$http} $http dependency.
 */
myApp.service('ContentListing', ['$http', 'Upload', function ($http, Upload) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Content List
     * @param data
     * @param success
     * @param error
     */
    service.getContentListing = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentlisting',data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Upload Or Replace File
     * @param data
     * @param success
     * @param error
     */
    service.uploadFile = function (data, success, error) {
        Upload.upload({
            url: data.url,
            data: { file: data.file, cm_title: data.cm_title, TypeName: data.cm_content_type, MetaDataId: data.MetadataId, cm_id: data.MetaId, ct_group_id: data.ct_group_id }
        }).then(function (resp) {
            success(resp);
        }, function (resp) {
            error(resp);
        }, function (evt) {
        });
    }

    return service;
} ]);