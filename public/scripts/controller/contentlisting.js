
myApp.controller('content-listingCtrl', function ($scope, $rootScope, $state, $http, $stateParams, ngProgress, $window, ContentListing, _, Icon, Upload, ContentFile) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#contentcatelog').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;
    $scope.accept = '';
    $scope.SearchUsername = '';
    $scope.base_url = $rootScope.base_url;
    $scope.replacefile = '';
    $scope.success = "Metadata files uploaded successfully.";

    $scope.currentPage = 0;
    $scope.pageSize = 3;
    $scope.FileUploadVisible = false;
    $scope.ThumbUploadVisible = false;
    $scope.supportfile = [];
    $scope.BGSongType = [];
    $scope.filesdetail = [];
    $scope.audioFileDetails = [];
    $scope.replaceSupportingFile = [];
    $scope.supportingFilesDetail = [];
    $scope.previewFilesDetail = [];
    $scope.Main = 1;
    $scope.Supporting = 2;
    $scope.Preview = 3;
    $scope.Thumbuggestion = "Filename must be ContentId_thumb_Width_Height.extension like [2345_thumb_240_360.gif].";

    //ngProgress.start();
    $scope.uploading = true;

    ContentListing.getContentListing({ Id: $stateParams.id, isProperty:$stateParams.isProperty }, function (content) {
       // ngProgress.complete();
        $scope.uploading = false;
        
        content.ContentMetadata.length > 0 ? "" : location.href = "/";
        $scope.UserRole == "Super Admin"
        $scope.FileUploadVisible = $scope.UserRole == "Super Admin" ? false : $scope.FileUploadVisible;
        $scope.ThumbUploadVisible = $scope.UserRole == "Super Admin" ? false : $scope.ThumbUploadVisible;
        $scope.ConfigData = content.ConfigData;
        $scope.BGSongType = content.BGSongType;
        $scope.OtherTemplates = content.OtherTemplates;
        $scope.OtherTemplates.forEach(function(template){
            if(template.ct_param_value == "Main"){
                $scope.Main = template.ct_param;
            }
            if(template.ct_param_value == "Supporting"){
                $scope.Supporting = template.ct_param;
            }
            if(template.ct_param_value == "Preview"){
                $scope.Preview = template.ct_param;
            }
        })
        var meta = content.ContentMetadata[0];
        var data = getStatus(content.UserRole, meta.cm_expires_on, meta.vd_end_on, meta.propertyexpirydate, meta.cm_state, meta.vd_is_active, meta.propertyactive, meta.cm_state);
        if (data) {
            $scope.error = data;
            $scope.errorvisible = true;
        }
        if (meta.parentname == "Imagery") {
            $scope.Filesuggestion = "Filename must be ContentId_Width_Height.extension like [2345_240x360.gif].";
        }
        else if (meta.parentname == "Video") {
            $scope.Filesuggestion = "Filename must be ContentId_Width_Height.extension like [2345_240x360.mp4].";
        }

        $scope.MetaId = $stateParams.id;
        $scope.cm_title = meta.cm_title;
        if (meta.cm_ispersonalized == 1) {
            $scope.SingleAudioVisible = false;
            $scope.BulkAudioVisible = true;
            if (meta.parentname == "Audio") {
                $scope.Filesuggestion = " Filename must be ContentId_UsernameID_Bitrate.extension like [2345_5_128.mp3].";
            }
        }
        else {
            $scope.SingleAudioVisible = true;
            $scope.BulkAudioVisible = false;
            if (meta.parentname == "Audio") {
                $scope.Filesuggestion = " Filename must be ContentId_Bitrate.extension like [2345_0_128.mp3].";
            }
        }
        $scope.TypeName = meta.parentname;
        $scope.contentid = $stateParams.id;
        $scope.contenttitle = meta.cm_display_title;
        $scope.propertytitle = meta.propertyname;
        $scope.vendortitle = meta.vendorname;
        $scope.Content_type = meta.parentname;
        $scope.getTime = new Date().getTime();

        $scope.SupportingImages = content.SupportingImages;
        $scope.SupportingVideos = content.SupportingVideos;
        $scope.SupportingAudios = content.SupportingAudios;
        $scope.SupportingTexts = content.SupportingTexts;

        $scope.PreviewImages = content.PreviewImages;
        $scope.PreviewVideos = content.PreviewVideos;
        $scope.PreviewAudios = content.PreviewAudios;
        $scope.PreviewTexts = content.PreviewTexts;

        $scope.TextFiles = content.TextFiles;
        $scope.ThumbFiles = content.ThumbFiles;
        $scope.WallpaperFiles = content.WallpaperFiles;
        $scope.VideoFiles = content.VideoFiles;
        $scope.AppFiles = content.AppFiles;
        $scope.AudioFiles = content.AudioFiles;
        $scope.UserRole = content.UserRole;
         //if( $scope.OtherImages.length > 0 || $scope.OtherAudios.length > 0 || $scope.OtherVideos.length > 0 ){
            $scope.SupportingFiles = [];
            $scope.PreviewFiles = [];
            $scope.dummyFiles = [];

        if ($scope.AudioFiles.length > 0 ) {
            $scope.showAudio = true;
            $scope.getAudioData();
        }
        $scope.getContentFiles();
        $scope.getThumbFiles();
        $scope.getSupportingFiles();
        $scope.getPreviewFiles();
        //console.log( $scope.thumbdetail);
        $scope.loading = true;
    }, function (error) {
        toastr.error(error);
    });

    $scope.getThumbFiles = function () {
        if ($scope.ThumbFiles.length > 0) {
            $scope.Thumbs = [];
            $scope.ThumbUploadVisible = true;
            $scope.isThumbExist = false;
            _.each($scope.ThumbFiles, function (val) {
                val.cf_url = val.cft_thumbnail_img_browse;
                val.type = 'thumb';
                val.Name = 'Thumb File';
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                $scope.isThumbExist = true;
                $scope.Thumbs.push(val);
            });
            $scope.thumbdetail = BindMasterList($scope.Thumbs, 5);
//console.log($scope.Thumbs)
            $scope.ThumbUploadVisible = ($scope.thumbdetail.length > 0 ) ? true : $scope.ThumbUploadVisible;
        } else {
            $scope.ThumbUploadVisible = $scope.UserRole == "Super Admin" ? false : $scope.ThumbUploadVisible;
        }
    }
    $scope.getContentFiles = function () {
        if ($scope.WallpaperFiles.length > 0 || $scope.AppFiles.length > 0 || $scope.TextFiles.length > 0 || $scope.VideoFiles.length > 0) {
            $scope.Files = [];
            $scope.FileUploadVisible = true;
            $scope.isContentExist = false;
            _.each($scope.WallpaperFiles, function (val) {
                val.compressheight = "100%";
                val.compresswidth = "100%";
                if (val.height > val.width) {
                    val.compressheight = "100%"
                    val.compresswidth = (((val.width * 100) / val.height).toFixed(2)).toString() + "%";
                }
                else if (val.width > val.height) {
                    val.compresswidth = "100%"
                    val.compressheight = (((val.height * 100) / val.width).toFixed(2)).toString() + "%";
                }
                val.type = 'wallpaper';
                val.Name = 'Wallpaper File';
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                $scope.isContentExist = true;

                $scope.Files.push(val);
            });
            _.each($scope.VideoFiles, function (val) {
                val.type = 'video';
                val.Name = 'Video File';
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                $scope.isContentExist = true;

                $scope.Files.push(val);
            });
            _.each($scope.AppFiles, function (val) {
                val.type = 'app';
                val.Name = 'AppsGames File';
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                $scope.isContentExist = true;

                $scope.Files.push(val);
            });
            _.each($scope.TextFiles, function (val) {
                val.type = 'text';
                val.Name = 'Text File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.isContentExist = true;

                $scope.Files.push(val);
            });
            $scope.filesdetail = BindMasterList($scope.Files, 5);
            $scope.FileUploadVisible = ($scope.filesdetail.length > 0 ) ? true : $scope.FileUploadVisible;
        } else {
            $scope.FileUploadVisible = $scope.UserRole == "Super Admin" ? false : $scope.FileUploadVisible;
        }
       // console.log($scope.filesdetail);
    }
    $scope.getAudioData = function () {
        $scope.audioBitrateFiles = [];
        _.each($scope.AudioFiles, function (val) {
            val.type = 'audio';
            $scope.isContentExist = true;
            val.Name = 'Audio File';
            val.filename_128 = (val.high_url) ? val.high_url.substring(val.high_url.lastIndexOf("/") + 1).toLowerCase() : '';
            val.filename_64 = (val.medium_url) ? val.medium_url.substring(val.medium_url.lastIndexOf("/") + 1).toLowerCase() : '';
            val.filename_32 = (val.low_url) ? val.low_url.substring(val.low_url.lastIndexOf("/") + 1).toLowerCase() : '';

            if (val.filename_128 != '' || val.filename_64 != '' || val.filename_32 != '') {
                $scope.audioBitrateFiles.push(val);
            }
        });

       //$scope.audioFileDetails = $scope.audioBitrateFiles;
       $scope.audioFileDetails = BindMasterList($scope.audioBitrateFiles, 5);
        //$scope.filesdetail = BindMasterList($scope.audioBitrateFiles);

    }
    function getExtension(filename) {
        var parts = filename.split('.');
        return parts[parts.length - 1];
    }
    $scope.getSupportingFiles = function () {
        if($scope.SupportingImages.length > 0){
            var j = 0;
            _.each($scope.SupportingImages, function (val,index) {
                console.log(val.cf_name_alias)
                val.type = 'otherimage';
                val.Name = 'Image';
                val.indexno = $scope.SupportingFiles.length+1;
                val.file_category_id = $scope.Supporting;
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.cf_url = (val.cf_url != '' && val.cf_url != null)? val.cf_url:'/assets/img/icons/no_image.gif';
                val.ext = (val.cf_url != '' && val.cf_url != null)? getExtension(val.filename) : 'png';
                val.measure = (val.filename != 'no_image.gif') ? 'pixels' : '';
                j = val.cf_name_alias - 1;
                if(j > 0){
                    $scope.SupportingFiles[j] = val;
                    var i = j - 1;
                    if (!_.has($scope.SupportingFiles, i)) {
                        console.log('%%% '+ i)
                        var val = {};
                        val.ct_group_id = 78;
                        val.ct_param_value = 'otherimage';
                        val.type = 'otherimage';
                        val.Name = 'Image';
                        val.indexno = $scope.SupportingFiles.length+1;
                        val.file_category_id = $scope.Supporting;
                        val.filename = 'no_image.gif';
                        val.cf_url = '/assets/img/icons/no_image.gif';
                        val.measure = (val.filename != 'no_image.gif') ? 'pixels' : '';
                        val.ext = getExtension(val.filename);
                        $scope.SupportingFiles[i] = val;
                    }else{
                        console.log('%% Not exist '+i);
                    }
                }else{
                    if(val.cf_name_alias == 1){
                        console.log('###if')

                        $scope.SupportingFiles[j] = val;
                    }else{
                        console.log('###else')

                        $scope.SupportingFiles.push(val);
                    }
                }
            });
            if($scope.SupportingImages.length < $scope.ConfigData.supporting_image_limit){
                //val = $scope.SupportingImages[0];
                for(var i = 0 ; i < $scope.ConfigData.supporting_image_limit ; i++ ) {
                    console.log('*** '+i);
                    if (!_.has($scope.SupportingFiles, i)) {
                        var val = {};
                        val.ct_group_id = 78;
                        val.ct_param_value = 'otherimage';
                        val.type = 'otherimage';
                        val.Name = 'Image';
                        val.indexno = $scope.SupportingFiles.length+1;
                        val.measure = '';
                        val.file_category_id = $scope.Supporting;
                        val.filename = 'no_image.gif';
                        val.cf_url = '/assets/img/icons/no_image.gif';
                        val.ext = getExtension(val.filename);
                        //$scope.SupportingFiles.push(val);
                        $scope.SupportingFiles[i] = val;
                    }
                    else{
                        console.log('*** Not exist '+i);
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.supporting_image_limit; i++ ){
                console.log('$$$ '+i);
                if (!_.has($scope.SupportingFiles, i)) {
                    var val = {};
                    val.type = 'otherimage';
                    val.Name = 'Image';
                    val.ct_group_id = 78;
                    val.ext = getExtension(val.filename);
                    val.indexno = $scope.SupportingFiles.length+1;
                    val.measure = '';
                    val.filename = 'no_image.gif';
                    val.file_category_id = $scope.Supporting;
                    val.cf_url = '/assets/img/icons/no_image.gif';
                    // $scope.SupportingFiles.push(val);
                    $scope.SupportingFiles[i] = val;
                }else{
                    console.log('$$$ Not exist '+i);
                }
            }
        }
        if($scope.SupportingVideos.length > 0){
            _.each($scope.SupportingVideos, function (val,i) {
                val.type = 'othervideo';
                val.Name = 'Video';
                val.ext = 'mp4';
                val.indexno = $scope.SupportingFiles.length+1;
                val.file_category_id = $scope.Supporting;
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.measure = (val.filename != 'no_image.gif') ? 'kb' : '';
                $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
            });
            if($scope.SupportingVideos.length < $scope.ConfigData.video_download_limit){
                //val = $scope.SupportingVideos[0];
                for(var i = 0; i < $scope.ConfigData.video_download_limit - $scope.SupportingVideos.length; i++ ) {
                    if (!_.has($scope.SupportingFiles, i)) {
                        var val = {};
                        val.type = 'othervideo';
                        val.Name = 'Video';
                        val.ext = 'mp4';
                        val.measure = '';
                        val.file_category_id = $scope.Supporting;
                        val.indexno = $scope.SupportingFiles.length+1;
                        // val.cf_url = '/assets/img/no_image.gif';
                        val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                        //$scope.SupportingFiles.push(val);
                        $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.video_download_limit; i++ ) {
                if (!_.has($scope.SupportingFiles, i)) {
                    var val = {};
                    val.type = 'othervideo';
                    val.Name = 'Video';
                    val.ext = 'mp4';
                    val.filename = 'no_image.gif';
                    val.indexno = $scope.SupportingFiles.length+1;
                    val.measure = '';
                    val.file_category_id = $scope.Supporting;
                    //$scope.SupportingFiles.push(val);
                    $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
                }

            }
        }
        if($scope.SupportingAudios.length > 0){
            _.each($scope.SupportingAudios, function (val,i) {
                val.type = 'otheraudio';
                val.Name = 'Audio';
                val.ext = 'mp3';
                val.indexno = $scope.SupportingFiles.length+1;
                val.file_category_id = $scope.Supporting;
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.measure = (val.filename != 'no_image.gif') ? 'kbps' : '';
                $scope.SupportingFiles[$scope.SupportingFiles.length] = val;

            });
            if($scope.SupportingAudios.length < $scope.ConfigData.audio_download_limit){
                //val = $scope.SupportingAudios[0];
                for(var i = 0; i < $scope.ConfigData.video_download_limit - $scope.SupportingAudios.length; i++ ) {
                    if (!_.has($scope.SupportingFiles, i)) {
                        var val = {};
                        val.type = 'otheraudio';
                        val.Name = 'Audio';
                        val.ext = 'mp3';
                        val.indexno = $scope.SupportingFiles.length+1;
                        val.measure = '';
                        val.file_category_id = $scope.Supporting;
                        val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                        val.filename = 'no_image.gif';
                        //  $scope.SupportingFiles.push(val);
                        $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.audio_download_limit; i++ ) {
                if (!_.has($scope.SupportingFiles, i)) {
                    var val = {};
                    val.type = 'otheraudio';
                    val.Name = 'Audio';
                    val.ext = 'mp3';
                    val.indexno = $scope.SupportingFiles.length+1;
                    val.measure = '';
                    val.file_category_id = $scope.Supporting;
                    val.filename = 'no_image.gif';
                    //$scope.SupportingFiles.push(val);
                    $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
                }
            }
        }
        if($scope.SupportingTexts.length > 0){
            _.each($scope.SupportingTexts, function (val,i) {
                val.type = 'othertext';
                val.Name = 'Text';
                val.ext = 'txt';
               // val.indexno = $scope.SupportingFiles.length+1;
                val.indexno = i + 1;
                val.file_category_id = $scope.Supporting;
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.measure = (val.filename != 'no_image.gif') ? 'kb' : '';
                $scope.SupportingFiles[$scope.SupportingFiles.length] = val;
            });

        }

        $scope.supportingFilesDetail = $scope.SupportingFiles;
        //console.log($scope.SupportingFiles);
        $scope.FileUploadVisible =  ($scope.supportingFilesDetail.length > 0 )? true : $scope.FileUploadVisible;
    }

    $scope.getPreviewFiles = function () {
        if($scope.PreviewImages.length > 0){
            var j = 0;
            _.each($scope.PreviewImages, function (val,index) {
                val.type = 'otherimage';
                val.Name = 'Image';
                val.indexno = $scope.PreviewFiles.length+1;
                val.file_category_id = $scope.Preview;
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.cf_url = (val.cf_url != '' && val.cf_url != null)? val.cf_url:'/assets/img/icons/no_image.gif';
                val.ext = (val.cf_url != '' && val.cf_url != null)? getExtension(val.filename) : 'png';
                val.measure = (val.filename != 'no_image.gif') ? 'pixels' : '';
                j = val.cf_name_alias - 1;

                if(j > 0){
                    $scope.PreviewFiles[j] = val;
                    var i = j - 1;
                    //for(var i = j - 1; i == 0; i-- ) {
                        if (!_.has($scope.PreviewFiles, i)) {
                            var val = {};
                            val.ct_group_id = 78;
                            val.ct_param_value = 'otherimage';
                            val.type = 'otherimage';
                            val.Name = 'Image';
                            val.measure = '';
                            val.indexno = $scope.PreviewFiles.length+1;
                            val.file_category_id = $scope.Preview;
                            val.filename = 'no_image.gif';
                            val.cf_url = '/assets/img/icons/no_image.gif';
                            val.ext = getExtension(val.filename);
                            $scope.PreviewFiles[i] = val;
                        }
                    //}
                }else{
                    if(val.cf_name_alias == 1){
                        console.log('###if')

                        $scope.PreviewFiles[j] = val;
                    }else{
                        console.log('###else')

                        $scope.PreviewFiles.push(val);
                    }
                }
            });
            if($scope.PreviewImages.length < $scope.ConfigData.supporting_image_limit){
                //val = $scope.PreviewImages[0];
                for(var i = 0 ; i < $scope.ConfigData.supporting_image_limit ; i++ ) {
                    if (!_.has($scope.PreviewFiles, i)) {
                        var val = {};
                        val.ct_group_id = 78;
                        val.ct_param_value = 'otherimage';
                        val.type = 'otherimage';
                        val.Name = 'Image';
                        val.indexno = $scope.PreviewFiles.length+1;
                        val.measure = '';
                        val.file_category_id = $scope.Preview;
                        val.filename = 'no_image.gif';
                        val.cf_url = '/assets/img/icons/no_image.gif';
                        val.ext = getExtension(val.filename);
                        //$scope.SupportingFiles.push(val);
                        $scope.PreviewFiles[i] = val;
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.supporting_image_limit; i++ ){
                if (!_.has($scope.PreviewFiles, i)) {
                    var val = {};
                    val.type = 'otherimage';
                    val.Name = 'Image';
                    val.ct_group_id = 78;
                    val.ext = getExtension(val.filename);
                    val.indexno = $scope.PreviewFiles.length+1;
                    val.measure = '';
                    val.filename = 'no_image.gif';
                    val.file_category_id = $scope.Preview;
                    val.cf_url = '/assets/img/icons/no_image.gif';
                    // $scope.SupportingFiles.push(val);
                    $scope.PreviewFiles[i] = val;
                }
            }
        }
        if($scope.PreviewVideos.length > 0){
            _.each($scope.PreviewVideos, function (val,i) {
                val.type = 'othervideo';
                val.Name = 'Video';
                val.ext = 'mp4';
                val.indexno = $scope.PreviewFiles.length+1;
                val.file_category_id = $scope.Preview;
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.measure = (val.filename != 'no_image.gif') ? 'kb' : '';
                //$scope.SupportingFiles.push(val);
                $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
            });
            if($scope.PreviewVideos.length < $scope.ConfigData.video_preview_limit){
                //val = $scope.PreviewVideos[0];
                for(var i = 0; i < $scope.ConfigData.video_preview_limit - $scope.PreviewVideos.length; i++ ) {
                    if (!_.has($scope.PreviewFiles, i)) {
                        var val = {};
                        val.type = 'othervideo';
                        val.Name = 'Video';
                        val.ext = 'mp4';
                        val.indexno = $scope.PreviewFiles.length+1;
                        val.measure = '';
                        val.file_category_id = $scope.Preview;
                        // val.cf_url = '/assets/img/no_image.gif';
                        val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                        //$scope.SupportingFiles.push(val);
                        $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.video_preview_limit; i++ ) {
                if (!_.has($scope.PreviewFiles, i)) {
                    var val = {};
                    val.type = 'othervideo';
                    val.Name = 'Video';
                    val.ext = 'mp4';
                    val.filename = 'no_image.gif';
                    val.indexno = $scope.PreviewFiles.length+1;
                    val.measure = '';
                    val.file_category_id = $scope.Preview;
                    //$scope.SupportingFiles.push(val);
                    $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
                }
            }
        }
        if($scope.PreviewAudios.length > 0){
            _.each($scope.PreviewAudios, function (val,i) {
                val.type = 'otheraudio';
                val.Name = 'Audio';
                val.ext = 'mp3';
                val.file_category_id = $scope.Preview;
                val.indexno = $scope.PreviewFiles.length+1;
                 //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                val.measure = (val.filename != 'no_image.gif') ? 'kbps' : '';
                $scope.PreviewFiles[$scope.PreviewFiles.length] = val;

            });
            if($scope.PreviewAudios.length < $scope.ConfigData.audio_preview_limit){
                //val = $scope.PreviewAudios[0];
                for(var i = 0; i < $scope.ConfigData.audio_preview_limit - $scope.PreviewAudios.length; i++ ) {
                    if (!_.has($scope.PreviewFiles, i)) {
                        var val = {};
                        val.type = 'otheraudio';
                        val.Name = 'Audio';
                        val.ext = 'mp3';
                        val.indexno = $scope.PreviewFiles.length+1;
                        val.measure = '';
                        val.file_category_id = $scope.Preview;
                        val.filename = (val.cf_url != '' && val.cf_url != null) ? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase() : 'no_image.gif';
                        val.filename = 'no_image.gif';
                        //  $scope.SupportingFiles.push(val);
                        $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
                    }
                }
            }
        }
        else{
            for(var i = 0; i < $scope.ConfigData.audio_preview_limit; i++ ) {
                if (!_.has($scope.PreviewFiles, i)) {
                    var val = {};
                    val.type = 'otheraudio';
                    val.Name = 'Audio';
                    val.ext = 'mp3';
                    val.measure = '';
                    val.file_category_id = $scope.Preview;
                    val.indexno = $scope.PreviewFiles.length+1;
                    val.filename = 'no_image.gif';
                    //$scope.SupportingFiles.push(val);
                    $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
                }
            }
        }
       /* if($scope.PreviewTexts.length > 0){
            _.each($scope.PreviewTexts, function (val,i) {
                val.type = 'othertext';
                val.Name = 'Text';
                val.ext = 'txt';
                val.measure = 'kb';
                val.indexno = i + 1;
                //val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                val.filename = (val.cf_url != '' && val.cf_url != null)? val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase():'no_image.gif';
                //$scope.SupportingFiles.push(val);
                $scope.PreviewFiles[$scope.PreviewFiles.length] = val;
            });
        }*/

        $scope.previewFilesDetail = $scope.PreviewFiles;
       console.log($scope.PreviewFiles)
        $scope.FileUploadVisible =  ($scope.previewFilesDetail.length > 0 )? true : $scope.FileUploadVisible;
    }

    function getStatus(UserRole, MetadataExpirydate, VendorExpirydate, PropertyExpirydate, Meta_active, Vendor_active, Property_active, cm_state) {
        var status;
        if (cm_state == 7) {
            status = "Metadata deleted for this Metadata Id.";
        }
        else if (cm_state == 5) {
            status = "Metadata rejected for this Metadata Id.";
        }
        else if (Vendor_active != 1) {
            status = "Vendor blocked for this Metadata Id.";
        }
        else if (Datewithouttime(VendorExpirydate) < Datewithouttime(new Date())) {
            status = "Vendor expired for this Metadata Id.";
        }
        else if (Property_active != 1) {
            status = "Property blocked for this Metadata Id.";
        }
        else if (Datewithouttime(PropertyExpirydate) < Datewithouttime(new Date())) {
            status = "Property expired for this Metadata Id.";
        }
        else if (cm_state == 6) {
            status = "Metadata blocked for this Metadata Id.";
        }
        else if (Datewithouttime(MetadataExpirydate) < Datewithouttime(new Date())) {
            status = "Metadata expired for this Metadata Id.";
        }

        return status;
    }

});
