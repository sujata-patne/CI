/**
 * @memberof myApp
 * @type {controller|angular.Controller}
 * @desc Submit Metadata Controller
 */
myApp.controller('submitmetaCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, Metadatas, _, Icon) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    //$('#vendorlist').addClass('active');
    //$('#managevendor').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.MetaDataId;
    $scope.CurrentPage = $state.current.name;
    ngProgress.start();
    $scope.uploading = true;
    $scope.MetaId;
    /**
     * Redirect To Home Page on error
     */
    if ($stateParams.status.indexOf("add") > -1 || $stateParams.status.indexOf("edit") > -1 || $stateParams.status.indexOf("error") > -1) {
        if ($stateParams.mode == "a" || $stateParams.mode == "e") {
            try {
                if ($stateParams.id && $stateParams.id != "error") {
                    $scope.MetaDataId = $stateParams.id;
                    $scope.MetaId = Icon.GetDecode($stateParams.id);
                    $scope.retry = "#" + $stateParams.contenttype.toLowerCase();
                }
            }
            catch (err) {
                $window.location.href = err.message;
            };
        }
        else {
            $window.location.href = '/';
        }
    }
    else {
        $window.location.href = '/';
    }

    if ($stateParams.status.indexOf("add") > -1 || $stateParams.status.indexOf("edit") > -1) {
        $scope.success = "Metadata for Content Type " + $stateParams.contenttype + ($stateParams.status.indexOf("add") > -1 ? " added" : " updated") + " successfully."
        $scope.successvisible = true;
    }
    else if ($stateParams.status.indexOf("error") > -1) {
        $scope.error = "Error while" + ($stateParams.mode == "a" ? " adding" : " updating") + " Metadata for Content Type " + $stateParams.contenttype + "."
        $scope.errorvisible = true;
    }

    /**
     * @desc  save metadata form for different content types like imagery, audio, video, text ,games/apps
     */
    Metadatas.SubmitMetadata({ Id: $scope.MetaId, state: $scope.CurrentPage, contenttype: $stateParams.contenttype }, function (metadata) {
        ngProgress.complete();
        $scope.uploading = false;
        metadata.MasterList.length > 0 ? "" : location.href = "/";
        if (metadata.Languages.length > 0) {
            $scope.LanguagesMetadata = metadata.Languages;
            _.each($scope.LanguagesMetadata, function (lang) {
                lang.MetaId = $stateParams.id + "_" + Icon.GetEncode(lang.ct_group_id);
            })
            $scope.visible = true;
        }
    }, function (error) {
        toastr.error(error);
    })
});

 