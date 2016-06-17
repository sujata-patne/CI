/**
 * Created by Sujata.Halwai on 01-06-2016.
 */
myApp.directive('thumbFileListGrid', function () {
    return {
        scope: true,
        tranclude: true,
        templateUrl: '../../partials/views/thumb-file-list.html',
        controller: function ($scope, ngProgress, Upload, ContentFile) {
            $scope.IsEditPermission = ($scope.UserRole == "Moderator" || $scope.UserRole == "Super Admin") ? true : false;

            $scope.upload = function (isvalid) {
                if (isvalid) {
                    if ($scope.replaceThumbfile) {
                        if (!$scope.InvalidFileError) {
                            $scope.uploading = true;
                            ngProgress.start();
                            imageloop(0);
                            function imageloop(cnt) {

                                var match = _.find($scope.Thumbs, function (val) {
                                    return val.filename == $scope.replaceThumbfile[cnt].name.toLowerCase()
                                });

                                if (match) {
                                    ContentFile.Upload('/replaceThumbFile', {file: $scope.replaceThumbfile[cnt], filepath: match.cf_url, cm_title: $scope.cm_title, TypeName: $scope.TypeName, cm_id: $scope.MetaId}, function (resp) {
                                        $scope.getTime = new Date().getTime();
                                        toastr.success(resp.config.data.file.name + '  file replaced successfully.');
                                        cnt = cnt + 1;
                                        if (!(cnt == $scope.replaceThumbfile.length)) {
                                            imageloop(cnt);
                                        } else {
                                            $("#replaceThumbfile").val("");
                                            $scope.uploading = false;
                                            ngProgress.complete();
                                        }
                                    }, function (error) {
                                        toastr.error(error);
                                        $scope.uploading = false;
                                        ngProgress.complete();
                                    });
                                }
                            }
                        } else {
                            toastr.error($scope.InvalidFileErrorMessage);
                        }
                    } else {
                        toastr.error("Please upload file to replace file.");
                    }
                }
            }
            $scope.replaceThumbfileupload = function () {
                $scope.InvalidFileError = false;
                if ($scope.replaceThumbfile) {
                    imageloop(0);
                    function imageloop(cnt) {
                        var match = _.find($scope.Thumbs, function (val) {
                            return val.filename == $scope.replaceThumbfile[cnt].name.toLowerCase()
                        });
                        if (match) {
                            cnt = cnt + 1;
                            if (cnt == $scope.replaceThumbfile.length) {
                            } else {
                                imageloop(cnt);
                            }
                        } else {
                            $scope.InvalidFileError = true;
                            $scope.InvalidFileErrorMessage = $scope.replaceThumbfile[cnt].name + " File does not match any files.";
                            toastr.error($scope.InvalidFileErrorMessage);
                        }
                    }
                }
            }
            $scope.resetSearch = function () {
                $scope.currentPage = 0;
                $scope.SearchUsername = '';
            }
        }
    };
});
