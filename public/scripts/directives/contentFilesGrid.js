/**
 * Created by Sujata.Halwai on 01-06-2016.
 */
/**
 * @name contentFileListGrid
 * @type {directive|angular.Directive}
 * @desc <content-file-list-grid> Directive
 */
myApp.directive('contentFileListGrid', function () {
    return {
        scope: false,
        tranclude: true,
        templateUrl: '../../partials/views/content-file-list.html',
        controller: function ($scope, ngProgress, Upload, ContentFile) {
            $scope.IsEditPermission = ($scope.UserRole == "Moderator" || $scope.UserRole == "Super Admin") ? true : false;
            /**
             * @name uploadAudio
             * @param isvalid
             */
            $scope.uploadAudio = function (isvalid) {
                if (isvalid) {
                    if ($scope.replacefile) {
                        if (!$scope.InvalidFileError) {
                            imageloop(0);
                            function imageloop(cnt) {
                                $scope.uploading = true;
                                ngProgress.start();
                                var match1 = _.find($scope.audioBitrateFiles, function (val) {
                                    return val.filename_128 == $scope.replacefile[cnt].name.toLowerCase()
                                });
                                var match2 = _.find($scope.audioBitrateFiles, function (val) {
                                    return val.filename_64 == $scope.replacefile[cnt].name.toLowerCase()
                                });
                                var match3 = _.find($scope.audioBitrateFiles, function (val) {
                                    return val.filename_32 == $scope.replacefile[cnt].name.toLowerCase()
                                });
                                var match = (match1) ? match1 : (match2) ? match2 : match3;

                                if (match) {
                                    ContentFile.Upload('/replaceFile', {
                                        file: $scope.replacefile[cnt],
                                        filepath: match.cf_url,
                                        cm_title: $scope.cm_title,
                                        TypeName: $scope.TypeName,
                                        cm_id: $scope.MetaId
                                    }, function (resp) {
                                        $scope.getTime = new Date().getTime();
                                        toastr.success(resp.config.data.file.name + '  file replaced successfully.');
                                        cnt = cnt + 1;
                                        if (!(cnt == $scope.replacefile.length)) {
                                            imageloop(cnt);
                                        } else {
                                            $("#replacefile").val("");
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
                            $scope.InvalidFileError = true;
                            $scope.InvalidFileErrorMessage = $scope.replacefile[cnt].name + " File does not match any files.";
                            toastr.error($scope.InvalidFileErrorMessage);
                        }
                    } else {
                        toastr.error("Please upload file to replace file.");
                    }
                }
            }
            /**
             * @name upload
             * @param isvalid
             */
            $scope.upload = function (isvalid) {
                if (isvalid) {
                    if ($scope.replacefile) {
                        if (!$scope.InvalidFileError) {
                            $scope.uploading = true;
                            ngProgress.start();
                            imageloop(0);
                            function imageloop(cnt) {

                                var match = _.find($scope.Files, function (val) {
                                    return val.filename == $scope.replacefile[cnt].name.toLowerCase()
                                });

                                if (match) {
                                    ContentFile.Upload('/replaceFile', {file: $scope.replacefile[cnt], filepath: match.cf_url, cm_title: $scope.cm_title, TypeName: $scope.TypeName, cm_id: $scope.MetaId}, function (resp) {
                                        $scope.getTime = new Date().getTime();
                                        toastr.success(resp.config.data.file.name + '  file replaced successfully.');
                                        cnt = cnt + 1;
                                        if (!(cnt == $scope.replacefile.length)) {
                                            imageloop(cnt);
                                        } else {
                                            $("#replacefile").val("");
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
            /**
             * @name replacefileupload
             */
            $scope.replacefileupload = function () {
                $scope.InvalidFileError = false;
                if ($scope.replacefile) {
                    imageloop(0);
                    function imageloop(cnt) {
                        var match = _.find($scope.Files, function (val) {
                            return val.filename == $scope.replacefile[cnt].name.toLowerCase()
                        });
                        if (match) {
                            cnt = cnt + 1;
                            if (cnt == $scope.replacefile.length) {
                            } else {
                                imageloop(cnt);
                            }
                        } else {
                            $scope.InvalidFileError = true;
                            $scope.InvalidFileErrorMessage = $scope.replacefile[cnt].name + " File does not match any files.";
                            toastr.error($scope.InvalidFileErrorMessage);
                        }
                    }
                }
            }
            /**
             * @name replaceAudioFileupload
             */
            $scope.replaceAudioFileupload = function () {
                $scope.InvalidFileError = false;
                if ($scope.replacefile) {
                    $scope.uploading = true;
                    ngProgress.start();
                    imageloop(0);
                    function imageloop(cnt) {
                        var match1 = _.find($scope.audioBitrateFiles, function (val) {
                            return val.filename_128 == $scope.replacefile[cnt].name.toLowerCase()
                        });
                        var match2 = _.find($scope.audioBitrateFiles, function (val) {
                            return val.filename_64 == $scope.replacefile[cnt].name.toLowerCase()
                        });
                        var match3 = _.find($scope.audioBitrateFiles, function (val) {
                            return val.filename_32 == $scope.replacefile[cnt].name.toLowerCase()
                        });
                        if (match1 || match2 || match3) {
                            cnt = cnt + 1;
                            if (cnt == $scope.replacefile.length) {
                                $("#replacefile").val("");
                                $scope.uploading = false;
                                ngProgress.complete();
                            } else {
                                imageloop(cnt);
                            }
                        } else {
                            $scope.InvalidFileError = true;
                            $scope.InvalidFileErrorMessage = $scope.replacefile[cnt].name + " File does not match any files.";
                            toastr.error($scope.InvalidFileErrorMessage);
                        }
                    }
                }
            }
            /**
             * @name getAudioData
             */
            $scope.getAudioData = function () {
                $scope.audioBitrateFiles = [];
                _.each($scope.AudioFiles, function (val) {
                    val.type = 'audio';
                    val.Name = 'Audio File';
                    val.filename_128 = (val.high_url) ? val.high_url.substring(val.high_url.lastIndexOf("/") + 1).toLowerCase() : '';
                    val.filename_64 = (val.medium_url) ? val.medium_url.substring(val.medium_url.lastIndexOf("/") + 1).toLowerCase() : '';
                    val.filename_32 = (val.low_url) ? val.low_url.substring(val.low_url.lastIndexOf("/") + 1).toLowerCase() : '';
                    if (val.filename_128 != '' || val.filename_64 != '' || val.filename_32 != '') {
                        $scope.audioBitrateFiles.push(val);
                    }
                });
                $scope.audioFileDetails = BindMasterList($scope.audioBitrateFiles);
            }
            /**
             * @name resetSearch
             */
            $scope.resetSearch = function () {
                $scope.currentPage = 0;
                $scope.SearchUsername = '';
            }
        }
    };
});
