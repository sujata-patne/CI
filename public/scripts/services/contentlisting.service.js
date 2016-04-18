/**
* Created by sujata.patne on 24-07-2015.
*/
myApp.service('ContentListing', ['$http', 'Upload', function ($http, Upload) {
    var service = {};
    service.baseRestUrl = '';
    service.getContentListing = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentlisting',data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
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