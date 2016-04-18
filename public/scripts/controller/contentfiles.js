//HEWITT.H789@yopmail.com
myApp.controller('content-filesCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, ContentFile, _, Icon, Upload,Excel) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#addcontentfile').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;
    $scope.ThumbFiles = [];
    $scope.WallPaperFiles = [];
    $scope.VideoFiles = [];
    $scope.AudioFiles = [];
    $scope.GameImageFiles = [];
    $scope.GameVideoFiles = [];
    $scope.GameAppFiles = [];
    $scope.TextFiles = [];
    $scope.TextError = [];
    $scope.AudioZipFiles = [];
    $scope.AudioZipError = [];
    $scope.CommonFiles = [];
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

    Icon.GetDashBoardData(function (dashboard) {
        $scope.ContentType = _.where( dashboard.ContentType, { cm_name: "Content Type" });
    }, function (error) {
        toastr.error(error);
    });

    ContentFile.getContentFile({}, function (content) {

        content.UserRole === "Super Admin" || content.UserRole == "Moderator" ? location.href = "/" : "";
        $scope.Templates = content.Templates;
        //$scope.ContentType = _.where(content.ContentType, { cm_name: "Content Type" });
        $scope.OtherTemplates = content.OtherTemplates;
        $scope.DeviceModels = content.Devices;
        $scope.HandsetDeviceGroups = content.HandsetDeviceGroups;
        $scope.AllGroups = content.HandsetGroups;
    }, function (error) {
        toastr.error(error);
    });

    $scope.HandsetGroupChange = function () {
        if (!$scope.SelectedHandsetGroup || $scope.SelectedHandsetGroup == "") {
            $scope.GroupHandset = [];
            $scope.SelectedCriteriaHandset = [];
        }
        else {
            var grouphandset = _.where($scope.HandsetDeviceGroups, { chg_chgr_group_id: $scope.SelectedHandsetGroup });
            $scope.GroupHandset = [];
            $scope.SelectedCriteriaHandset = [];
            _.each(grouphandset, function (handset) {
                var data = _.find($scope.DeviceModels, function (device) { return device.dc_id == handset.chg_handset_id });
                if (data) {
                    $scope.SelectedCriteriaHandset.push(data);
                }
            });
        }
    }

    $scope.leftclick = function () {
        _.each($scope.SelectedGroupHandset, function (selected) {
            var index = _.findIndex($scope.GroupHandset, function (cnt) { return cnt.dc_id == selected })
            if (index > -1) {
                $scope.SelectedCriteriaHandset.push($scope.GroupHandset[index]);
                $scope.GroupHandset.splice(index, 1);
            }
        })
        $scope.SelectedGroupHandset = [];
    }
    $scope.rightclick = function () {
        _.each($scope.SelectedFilterCriteria, function (selected) {
            var index = _.findIndex($scope.SelectedCriteriaHandset, function (cnt) { return cnt.dc_id == selected })
            if (index > -1) {
                $scope.GroupHandset.push($scope.SelectedCriteriaHandset[index]);
                $scope.SelectedCriteriaHandset.splice(index, 1);
            }
        })
        $scope.SelectedFilterCriteria = [];
    }
    $scope.leftAllclick = function () {
        _.each($scope.GroupHandset, function (selected) {
            $scope.SelectedCriteriaHandset.push(selected);
        })
        $scope.GroupHandset = [];
    }
    $scope.rightAllclick = function () {
        _.each($scope.SelectedCriteriaHandset, function (selected) {
            $scope.GroupHandset.push(selected);
        })
        $scope.SelectedCriteriaHandset = [];
    }
    $scope.ContentTypeChange = function () {
        $scope.FileUploadVisible = false;
        $scope.Uploadervisible = false;
    }
    $scope.Suggestions = function () {
        $scope.FileUploadVisible = true;
        $("#thumbfile").val("");
        $("#wallpaperfile").val("");
        $("#videofile").val("");
        $("#audiofile").val("");
        $("#gameimagefile").val("");
        $("#gamevideofile").val("");
        $("#gameappfile").val("");
        $("#commonfile").val("");
        $("#supportfile").val("");
        $(".textfile").val("");
        $scope.SelectedHandsetGroup = "";
        $scope.HandsetGroupChange();
        $scope.WallpaperPartVisible = false;
        $scope.VideoPartVisible = false;
        $scope.AudioPartVisible = false;
        $scope.GamePartVisible = false;
        $scope.TextPartVisible = false;
        $scope.Uploadervisible = true;
        if ($scope.TypeName == "Imagery") {
            $scope.WallpaperPartVisible = true;
        }
        else if ($scope.TypeName == "Video") {
            $scope.VideoPartVisible = true;
        }
        else if ($scope.TypeName == "Audio") {
            $scope.AudioPartVisible = true;
        }
        else if ($scope.TypeName == "AppsGames") {
            $scope.GamePartVisible = true;
        }
        else if ($scope.TypeName == "Text") {
            $scope.TextPartVisible = true;
        }
    }
    // check metadata
    $scope.SearchMetadata = function (isvalid) {
        if (isvalid) {
            try {
                var match = _.find($scope.ContentType, function (val) { return val.cd_id == $scope.SelectedContentType; });
                if (match) {
                    $scope.TypeName = match.cd_name;
                    $scope.MetaId = Icon.GetDecode($scope.MetadataId);
                    ngProgress.start();
                    ContentFile.checkMetadata({ Id: $scope.MetaId, parentid: $scope.SelectedContentType, contenttype: match.cd_name }, function (metadata) {
                        if (metadata.Metadata.length > 0) {
                            var status = getStatus('', metadata.Metadata[0].cm_expires_on, metadata.Metadata[0].vd_end_on, metadata.Metadata[0].propertyexpirydate, '', metadata.Metadata[0].vd_is_active, metadata.Metadata[0].propertyactive, metadata.Metadata[0].cm_state)
                            if (!status) {
                                $scope.Files = metadata.Files;
                                $scope.ThumbDataFiles = metadata.ThumbFiles;
                                 $scope.cm_title = metadata.Metadata[0].cm_title;
                                if ($scope.TypeName == "Text") {
                                    $scope.LanguagesMetadata = metadata.Languages;
                                    _.each($scope.LanguagesMetadata, function (lang) {
                                        lang.MetaId = $scope.MetadataId + "_" + Icon.GetEncode(lang.ct_group_id);
                                        lang.file = '';
                                    })
                                }
                                else if ($scope.TypeName == "Audio") {
                                    $scope.LyricsLanguagesMetadata = metadata.LyricsLanguages;
                                     _.each($scope.LyricsLanguagesMetadata, function (lang) {
                                        lang.MetaId = Icon.GetEncode(lang.ct_group_id);
                                        lang.file = '';
                                    })
                                    //console.log(metadata.Metadata[0].cm_ispersonalized)
                                    if (metadata.Metadata[0].cm_ispersonalized == 1) {
                                        $scope.SingleAudioVisible = false;
                                        $scope.BulkAudioVisible = true;
                                    }
                                    else {
                                        $scope.SingleAudioVisible = true;
                                        $scope.BulkAudioVisible = false;
                                    }
                                }
                                $scope.Suggestions();
                            }
                            else {
                                $scope.ContentTypeChange();
                                toastr.error(status);
                            }
                        }
                        else {
                            $scope.ContentTypeChange();
                            toastr.error("Metadata id does not match with content type.");
                        }
                        ngProgress.complete();
                    }, function (error) {
                        $scope.ContentTypeChange();
                        toastr.error(error);
                        ngProgress.complete();
                    });
                }
            }
            catch (err) {
                $scope.ContentTypeChange();
                toastr.error("please enter valid Metadata Id.");
            }
        }
    }
    function getExtension(filename) {
        var parts = filename.split('.');
        return parts[parts.length - 1];
    }

    function isImage(filename) {
        var ext = getExtension(filename);
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'gif':
            case 'bmp':
            case 'png':
                //etc
                return true;
        }
        return false;
    }

    function isVideo(filename) {
        var ext = getExtension(filename);
        switch (ext.toLowerCase()) {
            case 'm4v':
            case 'avi':
            case 'mpg':
            case 'mp4':
                // etc
                return true;
        }
        return false;
    }

    $scope.thumbfileuploader = function (files) {
        $scope.thumberror = false;
        $scope.ThumbFiles = [];
        if ($scope.thumbfile) {
             var thumblength = $scope.thumbfile.length;
            if ((3 - $scope.ThumbDataFiles.length - thumblength) >= 0) {

                function thumbloop(t) {
                    var reader = new FileReader();
                    var ext = getExtension($scope.thumbfile[t].name).toLowerCase();
                    console.log(ext)
                    if (ext == "gif" || ext == "jpg" || ext == "png") {
                        reader.onload = function (e) {
                            var new_file = new Image();
                            new_file.src = e.target.result;
                            new_file.onload = function () {

                                ////if (!((this.height == 100 && this.width == 100) || (this.height == 125 && this.width == 125) || (this.height == 150 && this.width == 150))) {
                                ////    $scope.thumberror = true;
                                ////    $scope.thumberrormessage = "Invalid Dimension In " + $scope.thumbfile[t].name + ".";
                                ////    toastr.error($scope.thumberrormessage);
                                ////}
                                ////else {
                                $scope.ThumbFiles.push({ count: ($scope.ThumbFiles.length + $scope.ThumbDataFiles.length + 1), file: $scope.thumbfile[t], width: this.width, height: this.height });
                                t = t + 1;
                                if (!(thumblength == t)) {
                                    thumbloop(t);
                                }
                                ////}
                            }
                        }
                        reader.readAsDataURL($scope.thumbfile[t]);
                    }else{
                        $scope.wallpapererror = true;
                        $scope.wallpapererrormessage = "Please upload valid thumbnail files.";
                        toastr.error($scope.wallpapererrormessage);
                    }
                }
                thumbloop(0);
            }
            else {
                $scope.thumberror = true;
                if ($scope.ThumbDataFiles.length == 3) {
                    $scope.thumberrormessage = $scope.ThumbDataFiles.length + " thumb files already uploaded. you can't upload anymore.";
                }
                else {
                    if ($scope.ThumbDataFiles.length == 0) {
                        $scope.thumberrormessage = "you can upload only " + (3 - $scope.ThumbDataFiles.length) + " thumb files.";
                    }
                    else {
                        $scope.thumberrormessage = $scope.ThumbDataFiles.length + " thumb file already uploaded. you can upload only " + (3 - $scope.ThumbDataFiles.length) + " thumb files.";
                    }
                }
                toastr.error($scope.thumberrormessage);
            }
        }
		console.log($scope.ThumbFiles)
    }

    $scope.wallpaperfileuploader = function () {
        $scope.wallpapererror = false;
        $scope.WallPaperFiles = [];
        if ($scope.wallpaperfile) {

            if ($scope.wallpaperfile.length <= 3) {
                try {
                    imageloop(0);
                    function imageloop(cnt) {
                        var i = cnt;
                        console.log($scope.wallpaperfile[i])
                        var ext = getExtension($scope.wallpaperfile[i].name).toLowerCase();
                        console.log(ext)
                        if (ext == "gif" || ext == "jpg" || ext == "png") {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                var new_file = new Image();
                                new_file.src = e.target.result;
                                new_file.onload = function () {
                                    if ((this.height == 1280 && this.width == 1280) || (this.height == 1280 && this.width == 720) || (this.height == 720 && this.width == 1280)) {
                                        cnt = cnt + 1;
                                        var height = this.height;
                                        var width = this.width;
                                        var match = _.find($scope.Templates, function (val) {
                                            return ((val.width == width) && (val.height == height));
                                        })
                                        if (match) {
                                            $scope.WallPaperFiles.push({
                                                file: $scope.wallpaperfile[i],
                                                type: 'Imagery',
                                                ct_group_id: match.ct_group_id,
                                                cm_id: $scope.MetaId,
                                                width: this.width,
                                                height: this.height,
                                                other: null
                                            })
                                        }
                                        if (!(cnt == $scope.wallpaperfile.length)) {
                                            imageloop(cnt);
                                        }
                                        else {
                                            $scope.wallpapererror = false;
                                        }
                                    }
                                    else {
                                        $scope.wallpapererror = true;
                                        $scope.wallpapererrormessage = "Invalid Dimension In " + $scope.wallpaperfile[i].name + ".";
                                        toastr.error($scope.wallpapererrormessage);
                                    }
                                }
                            }
                            reader.readAsDataURL($scope.wallpaperfile[i]);
                        }else{
                            $scope.wallpapererror = true;
                            $scope.wallpapererrormessage = "Please upload valid wallpaper files.";
                            toastr.error($scope.wallpapererrormessage);
                        }

                    }
                }
                catch (err) {
                    $scope.wallpapererror = true;
                    $scope.wallpapererrormessage = "Invalid Image Format.";
                    toastr.error($scope.wallpapererrormessage);
                }
            }
            else {
                $scope.wallpapererror = true;
                $scope.wallpapererrormessage = "Maximum Three base Image file upload at a time.";
                toastr.error($scope.wallpapererrormessage);
            }

        }
    }

    $scope.videofileuploader = function (files) {
        $scope.videoerror = false;
        $scope.VideoFiles = [];
        if ($scope.videofile) {
            if (getExtension($scope.videofile.name).toLowerCase() == "mp4") {
                var match = _.find($scope.Templates, function (val) { return val.width == 640 && val.height == 320 })
                if (match) {
                    $scope.VideoFiles.push({ file: $scope.videofile, type: 'Video', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: 640, height: 320, other: null })
                }
            }
            else {
                $scope.videoerror = true;
                $scope.videoerrormessage = "Invalid video file extension.";
                toastr.error($scope.videoerrormessage);
            }
        }
    }

    $scope.audiofileuploader = function (files) {
        $scope.audioerror = false;
        $scope.AudioFiles = [];
        if ($scope.audiofile) {
            if (getExtension($scope.audiofile.name).toLowerCase() == "mp3") {
                var match = _.find($scope.OtherTemplates, function (val) { return val.ct_param == 128 })
                if (match) {
                    $scope.AudioFiles.push({ file: $scope.audiofile, type: 'Audio', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 128 })
                }
            }
            else {
                $scope.audioerror = true;
                $scope.audioerrormessage = "Invalid audio file extension.";
                toastr.error($scope.audioerrormessage);
            }
        }
    }

    $scope.audiozipfileuploader = function (audiofile, cm_id, ct_group_id, cd_name, MetaId, ct_param, ct_param_value) {
        if (audiofile) {
            if (getExtension(audiofile.name).toLowerCase() == "zip") {
                $scope.AudioZipFiles.push({ file: audiofile, type: 'audiozip', ct_param: ct_param, ct_param_value: ct_param_value, ct_group_id: ct_group_id, cm_id: cm_id, width: null, height: null, other: cd_name, langaugemetaid: MetaId })
            }
            else {
                $scope.ziperrormessage = "File extension must be zip for language " + cd_name + ".";
                $scope.AudioZipError.push({ error: $scope.ziperrormessage, ct_group_id: ct_group_id });
                toastr.error($scope.ziperrormessage);
            }
        }else {
            var temperror = [];
            _.each($scope.AudioZipError, function (err) {
                if (!(err.ct_group_id == ct_group_id)) {
                    temperror.push(err);
                }
            });
            $scope.AudioZipError = temperror;
            var tempfiles = [];
            _.each($scope.AudioZipFiles, function (val) {
                if (!(val.ct_group_id == ct_group_id)) {
                    tempfiles.push(val);
                }
            });
            $scope.AudioZipFiles = tempfiles;
        }

    };

    $scope.gameimagefileuploader = function () {
        $scope.gameimageerror = false;
        $scope.GameImageFiles = [];
        if ($scope.gameimagefile) {
            if ($scope.gameimagefile.length <= 5) {
                try {
                    var otherimages = _.where($scope.Files, { ct_param_value: 'otherimage' });
                    if (5 - otherimages.length - $scope.gameimagefile.length >= 0) {
                        var match = _.find($scope.OtherTemplates, function (val) { return val.ct_param_value == 'otherimage' })
                        if (match) {
                            gameimageloop(0);
                            function gameimageloop(gi) {
                                $scope.GameImageFiles.push({ count: (otherimages.length + $scope.GameImageFiles.length + 1), file: $scope.gameimagefile[gi], type: 'GameImage', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 128 })
                                gi = gi + 1;
                                if (!(gi == $scope.gameimagefile.length)) {
                                    gameimageloop(gi);
                                }
                            }
                        }
                    }
                    else {
                        $scope.gameimageerror = true;
                        if (otherimages.length == 5) {
                            $scope.gameimageerrormessage = otherimages.length + " supporting image file already uploaded. you can't upload anymore.";
                        }
                        else {
                            if (otherimages.length == 0) {
                                $scope.gameimageerrormessage = "you can upload only " + (5 - otherimages.length) + " supporting images.";
                            }
                            else {
                                $scope.gameimageerrormessage = otherimages.length + " supporting image file already uploaded. you can upload only " + (5 - otherimages.length) + " supporting images.";
                            }
                        }
                        toastr.error($scope.gameimageerrormessage);
                    }
                }
                catch (err) {
                    $scope.gameimageerror = true;
                    $scope.gameimageerrormessage = "Invalid Image Format.";
                    toastr.error($scope.gameimageerrormessage);
                }
            }
            else {
                $scope.gameimageerror = true;
                $scope.gameimageerrormessage = "Maximum five supporting Image file upload at a time.";
                toastr.error($scope.gameimageerrormessage);
            }
        }
    }

    $scope.gamevideofileuploader = function () {
        $scope.gamevideoerror = false;
        $scope.GameVideoFiles = [];
        if ($scope.gamevideofile) {
            if ($scope.gamevideofile.length <= 2) {
                try {
                    var othervideos = _.where($scope.Files, { ct_param_value: 'othervideo' });
                    if ((2 - othervideos.length - $scope.gamevideofile.length) >= 0) {
                        var match = _.find($scope.OtherTemplates, function (val) { return val.ct_param_value == 'othervideo' })
                        if (match) {
                            gamevideoloop(0);
                            function gamevideoloop(gv) {
                                $scope.GameVideoFiles.push({ count: (othervideos.length + $scope.GameVideoFiles.length + 1), file: $scope.gamevideofile[gv], type: 'gamevideo', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: null })
                                gv = gv + 1;
                                if (!(gv == $scope.gamevideofile.length)) {
                                    gamevideoloop(gv);
                                }
                            }
                        }
                    }
                    else {
                        $scope.gamevideoerror = true;
                        if (othervideos.length == 2) {
                            $scope.gamevideoerrormessage = othervideos.length + " supporting video file already uploaded. you can't upload anymore.";
                        }
                        else {
                            if (othervideos.length == 0) {
                                $scope.gamevideoerrormessage = "you can upload only " + (2 - othervideos.length) + " supporting video.";
                            }
                            else {
                                $scope.gamevideoerrormessage = othervideos.length + " supporting video file already uploaded. you can upload only " + (2 - othervideos.length) + " supporting video.";
                            }
                        }
                        toastr.error($scope.gamevideoerrormessage);
                    }
                }
                catch (err) {
                    $scope.gamevideoerror = true;
                    $scope.gamevideoerrormessage = "Invalid Video Format.";
                    toastr.error($scope.gamevideoerrormessage);
                }
            }
            else {
                $scope.gamevideoerror = true;
                $scope.gamevideoerrormessage = "Maximum two supporting video file upload at a time.";
                toastr.error($scope.gamevideoerrormessage);
            }
        }
    }

    $scope.gameappfileuploader = function () {
        $scope.gameapperror = false;
        $scope.GameAppFiles = [];
        if ($scope.gameappfile) {
            try {
                var apps = _.where($scope.Files, { ct_param_value: 'app' });
                var match = _.find($scope.OtherTemplates, function (val) { return val.ct_param_value == 'app' })
                if (match) {
                    _.each($scope.gameappfile, function (val) {
                        $scope.GameAppFiles.push({ count: (apps.length + $scope.GameAppFiles.length + 1), file: val, type: 'gameapp', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: null })
                    });
                }
            }
            catch (err) {
                $scope.gameapperror = true;
                $scope.gameapperrormessage = "Invalid App File Format.";
                toastr.error($scope.gameapperrormessage);
            }
        }
    }

    $scope.textfileuploader = function (textfile, cm_id, ct_group_id, cd_name, MetaId, ct_param, ct_param_value) {
        if (textfile) {
            var texts = _.where($scope.Files, { ct_group_id: ct_group_id });
             if ((10 - texts.length - textfile.length) >= 0) {
                _.each(textfile, function (val) {
                    var count = _.where($scope.TextFiles, { ct_group_id: ct_group_id });

                    if (getExtension(val.name).toLowerCase() == "txt") {
                        $scope.TextFiles.push({ count: (texts.length + count.length + 1), file: val, type: 'text', ct_param: ct_param, ct_param_value: ct_param_value, ct_group_id: ct_group_id, cm_id: cm_id, width: null, height: null, other: cd_name, langaugemetaid: MetaId })
                    }
                    else {
                        $scope.texterrormessage = "Invalid lyrics file extension for " + ct_param_value;
                        $scope.TextError.push({ error: $scope.texterrormessage, ct_group_id: ct_group_id });
                        toastr.error($scope.texterrormessage);

                    }
                });
            }
            else {
                if (texts.length == 10) {
                    $scope.texterrormessage = texts.length + " text file already uploaded for " + cd_name + ". you can't upload anymore.";
                }
                else {
                    if (texts.length == 0) {
                        $scope.texterrormessage = "you can upload only " + (10 - texts.length) + " text file for " + cd_name + ".";
                    }
                    else {
                        $scope.texterrormessage = texts.length + " text file already uploaded for " + cd_name + ". you can upload only " + (10 - texts.length) + " text file for " + cd_name + ".";
                    }
                }
                $scope.TextError.push({ error: $scope.texterrormessage, ct_group_id: ct_group_id });
                toastr.error($scope.texterrormessage);
            }
        }
        else {
            var temperror = [];
            _.each($scope.TextError, function (err) {
                if (!(err.ct_group_id == ct_group_id)) {
                    temperror.push(err);
                }
            });
            $scope.TextError = temperror;
            var tempfiles = [];
            _.each($scope.TextFiles, function (val) {
                if (!(val.ct_group_id == ct_group_id)) {
                    tempfiles.push(val);
                }
            });
            $scope.TextFiles = tempfiles;
        }
    };

    $scope.supportingfileuploader = function (files) {
        $scope.commonfileerror = false;
        $scope.CommonFiles = [];
        if ($scope.supportfile) {
            var imagecount = 0;
            var videocount = 0;
            _.each($scope.supportfile, function (val) {
                if (isImage(val.name)) {
                    imagecount++;
                }
                else if (isVideo(val.name)) {
                    videocount++;
                }
                else {
                    $scope.commonfileerror = true;
                    $scope.commonfileerrormessage = "Invalid Common File Extension.";
                    toastr.error($scope.commonfileerrormessage);
                }
            })
            if (!$scope.commonfileerror) {
                var flag = true;
                var otherimages = _.where($scope.Files, { ct_param_value: 'otherimage' });
                var othervideos = _.where($scope.Files, { ct_param_value: 'othervideo' });
                console.log(otherimages.length);
                if (imagecount != 0) {
                    if (!((3 - otherimages.length - imagecount) >= 0)) {
                        flag = false;
                        $scope.commonfileerror = true;
                        if (otherimages.length == 3) {
                            $scope.commonfileerrormessage = otherimages.length + " supporting image file already uploaded. you can't upload anymore.";
                        }
                        else {
                            if (otherimages.length == 0) {
                                $scope.commonfileerrormessage = "you can upload only " + (3 - otherimages.length) + " supporting images.";
                            }
                            else {
                                $scope.commonfileerrormessage = otherimages.length + " supporting image file already uploaded. you can upload only " + (3 - otherimages.length) + " supporting images.";
                            }
                        }
                        toastr.error($scope.commonfileerrormessage);
                    }
                }
                else {
                    if (!((1 - othervideos.length - videocount) >= 0)) {
                        flag = false;
                        $scope.commonfileerror = true;
                        if (othervideos.length == 1) {
                            $scope.commonfileerrormessage = othervideos.length + " supporting video file already uploaded. you can't upload anymore.";
                        }
                        else {
                            if (othervideos.length == 0) {
                                $scope.commonfileerrormessage = "you can upload only " + (1 - othervideos.length) + " supporting video.";
                            }
                            else {
                                $scope.commonfileerrormessage = othervideos.length + " supporting video file already uploaded. you can upload only " + (1 - othervideos.length) + " supporting video.";
                            }
                        }
                        toastr.error($scope.commonfileerrormessage);
                    }
                }
                if (flag) {
                    _.each($scope.supportfile, function (val) {
                        if (isImage(val.name)) {
                            var count = _.where($scope.CommonFiles, { type: 'image' });
                            var match = _.find($scope.OtherTemplates, function (item) { return item.ct_param_value == 'otherimage' })
                            if (match) {
                                $scope.CommonFiles.push({ count: (otherimages.length + count.length + 1), file: val, type: 'image', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 'common' })
                            }
                        }
                        else if (isVideo(val.name)) {
                            var count = _.where($scope.CommonFiles, { type: 'video' });
                            var match = _.find($scope.OtherTemplates, function (item) { return item.ct_param_value == 'othervideo' })
                            if (match) {
                                $scope.CommonFiles.push({ count: (othervideos.length + count.length + 1), file: val, type: 'video', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 'common' })
                            }
                        }
                    })
                }
                console.log($scope.CommonFiles)
            }
        }
    }

    $scope.commonfileuploader = function (files) {
        $scope.commonfileerror = false;
        $scope.CommonFiles = [];
        if ($scope.commonfile) {
            var imagecount = 0;
            var videocount = 0;
            _.each($scope.commonfile, function (val) {
                if (isImage(val.name)) {
                    imagecount++;
                }
                else if (isVideo(val.name)) {
                    videocount++;
                }
                else {
                    $scope.commonfileerror = true;
                    $scope.commonfileerrormessage = "Invalid Common File Extension.";
                    toastr.error($scope.commonfileerrormessage);
                }
            })
            if (!$scope.commonfileerror) {
                var flag = true;
				 var otherimages = _.where($scope.Files, { ct_param_value: 'otherimage' });
                 var othervideos = _.where($scope.Files, { ct_param_value: 'othervideo' });
                if (imagecount != 0) {
                    if (!((5 - otherimages.length - imagecount) >= 0)) {
                        flag = false;
                        $scope.commonfileerror = true;
                        if (otherimages.length == 5) {
                            $scope.commonfileerrormessage = otherimages.length + " common image file already uploaded. you can't upload anymore.";
                        } else {
                            if (otherimages.length == 0) {
                                $scope.commonfileerrormessage = "you can upload only " + (5 - otherimages.length) + " common images.";
                            }
                            else {
                                $scope.commonfileerrormessage = otherimages.length + " common image file already uploaded. you can upload only " + (5 - otherimages.length) + " common images.";
                            }

                        }
                        toastr.error($scope.commonfileerrormessage);
                    }
                }
                else {
                    if (!((2 - othervideos.length - videocount) >= 0)) {
                        flag = false;
                        $scope.commonfileerror = true;
                        if (othervideos.length == 2) {
                            $scope.commonfileerrormessage = othervideos.length + " common video file already uploaded. you can't upload anymore.";
                        }
                        else {
                            if (othervideos.length == 0) {
                                $scope.commonfileerrormessage = "you can upload only " + (2 - othervideos.length) + " common video.";
                            }
                            else {
                                $scope.commonfileerrormessage = othervideos.length + " common video file already uploaded. you can upload only " + (2 - othervideos.length) + " common video.";
                            }
                        }
                        toastr.error($scope.commonfileerrormessage);
                    }
                }
                if (flag) {

                    _.each($scope.commonfile, function (val) {
                        if (isImage(val.name)) {
                            var count = _.where($scope.CommonFiles, { type: 'image' });
                            var match = _.find($scope.OtherTemplates, function (item) { return item.ct_param_value == 'otherimage' })
                            if (match) {
                                $scope.CommonFiles.push({ count: (otherimages.length + count.length + 1), file: val, type: 'image', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 'common' })
                            }
                        }
                        else if (isVideo(val.name)) {
                            var count = _.where($scope.CommonFiles, { type: 'video' });
                            var match = _.find($scope.OtherTemplates, function (item) { return item.ct_param_value == 'othervideo' })
                            if (match) {
                                $scope.CommonFiles.push({ count: (othervideos.length + count.length + 1), file: val, type: 'video', ct_group_id: match.ct_group_id, cm_id: $scope.MetaId, width: null, height: null, other: 'common' })
                            }
                        }
                    })
                }
            }
        }
    }

    $scope.upload = function (files) {
        if ($scope.TypeName == "Imagery") {
            if ($scope.wallpaperfile || $scope.thumbfile) {
                if ($scope.thumberror || $scope.wallpapererror) {
                    toastr.error($scope.thumberror ? $scope.thumberrormessage : $scope.wallpapererrormessage);
                }
                else {
                    function wallpaperthumbupload(tu) {
                        ContentFile.Upload('/uploadThumb', { count: $scope.ThumbFiles[tu].count, file: $scope.ThumbFiles[tu].file, cm_title: $scope.cm_title, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, other: null, width: $scope.ThumbFiles[tu].width, height: $scope.ThumbFiles[tu].height, ct_group_id: null }, function (resp) {
                            $scope.ThumbDataFiles = resp.data.ThumbFiles;
                            toastr.success(resp.config.data.file.name + ' Thumb file uploaded successfully.');
                            tu = tu + 1;
                            if (tu == $scope.ThumbFiles.length) {
                                /*if ($scope.wallpaperfile) {
                                    WallpaperUpload(0);
                                }
                                else {*/
                                    $("#thumbfile").val("");
                                    $scope.ThumbFiles = [];
                                    $scope.thumbfile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                               // }
                            }
                            else {
                                wallpaperthumbupload(tu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    function WallpaperUpload(wu) {
                        var data = $scope.WallPaperFiles[wu];
                        ContentFile.Upload('/upload' + $scope.TypeName, { file: data.file, cm_title: $scope.cm_title, other: data.other, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' Base file uploaded successfully.');
                            wu = wu + 1;
                            if (wu == $scope.WallPaperFiles.length) {
                                $("#thumbfile").val("");
                                $("#wallpaperfile").val("");
                                $scope.WallPaperFiles = [];
                                $scope.thumbfile = null;
                                $scope.wallpaperfile = null;
                                $scope.uploading = false;
                                ngProgress.complete();
                            }
                            else {
                                WallpaperUpload(wu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    ngProgress.start();
                    $scope.uploading = true;
                    if ($scope.thumbfile) {
                        wallpaperthumbupload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }

                    if ($scope.wallpaperfile) {
                        WallpaperUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                }
            }
            else {
                toastr.error("Please upload base wallpaper file.");
            }
        }
        else if ($scope.TypeName == "Video") {
            if ($scope.videofile || $scope.thumbfile) {
                if ($scope.thumberror || $scope.videoerror) {
                    toastr.error($scope.thumberror ? $scope.thumberrormessage : $scope.videoerrormessage);
                }
                else {
                    function videothumbupload(tu) {
                        ContentFile.Upload('/uploadThumb', { count: $scope.ThumbFiles[tu].count, file: $scope.ThumbFiles[tu].file, cm_title: $scope.cm_title, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, other: null, width: $scope.ThumbFiles[tu].width, height: $scope.ThumbFiles[tu].height, ct_group_id: null }, function (resp) {
                            $scope.ThumbDataFiles = resp.data.ThumbFiles;
                            toastr.success(resp.config.data.file.name + ' Thumb file uploaded successfully.');
                            tu = tu + 1;
                            if (tu == $scope.ThumbFiles.length) {
                                /*if ($scope.videofile) {
                                    VideoUpload(0);
                                }
                                else {*/
                                    $("#thumbfile").val("");
                                    $scope.ThumbFiles = [];
                                    $scope.thumbfile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                                //}
                            }
                            else {
                                videothumbupload(tu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    function VideoUpload(vu) {
                        var data = $scope.VideoFiles[vu];
                        ContentFile.Upload('/upload' + $scope.TypeName, { file: data.file, cm_title: $scope.cm_title, other: data.other, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                            if (resp.data.success) {
                                $scope.Files = resp.data.Files;
                                toastr.success(resp.config.data.file.name + ' Base file uploaded successfully.');
                                vu = vu + 1;
                                if (vu == $scope.VideoFiles.length) {
                                    $("#thumbfile").val("");
                                    $("#videofile").val("");
                                    $scope.videofile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                                }
                                else {
                                    VideoUpload(vu);
                                }
                            }
                            else {
                                $("#thumbfile").val("");
                                $("#videofile").val("");
                                $scope.thumbfile = null;
                                $scope.videofile = null;
                                toastr.error(resp.data.message);
                                $scope.uploading = false;
                                ngProgress.complete();
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    ngProgress.start();
                    $scope.uploading = true;
                    if ($scope.thumbfile) {
                        videothumbupload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }

                    if ($scope.videofile) {
                        VideoUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                }
            }
            else {
                toastr.error("Please upload base video file.");
            }
        }
        else if ($scope.TypeName == "Audio") {
            //if ($scope.AudioZipError.length == 0) {
            if ($scope.audiofile || $scope.CommonFiles.length || $scope.thumbfile || $scope.TextFiles.length > 0 || ($scope.AudioZipFiles.length > 0)) {
                if ($scope.thumberror || $scope.audioerror) {
                    toastr.error($scope.thumberror ? $scope.thumberrormessage : $scope.audioerrormessage);
                } else {
                    function audiothumbupload(tu) {
                        ContentFile.Upload('/uploadThumb', {
                            bulkAudioVisible: $scope.BulkAudioVisible,
                            count: $scope.ThumbFiles[tu].count,
                            file: $scope.ThumbFiles[tu].file,
                            cm_title: $scope.cm_title,
                            TypeName: $scope.TypeName,
                            MetaDataId: $scope.MetadataId,
                            cm_id: $scope.MetaId,
                            other: null,
                            width: $scope.ThumbFiles[tu].width,
                            height: $scope.ThumbFiles[tu].height,
                            ct_group_id: null
                        }, function (resp) {
                            $scope.ThumbDataFiles = resp.data.ThumbFiles;
                            toastr.success(resp.config.data.file.name + ' Thumb file uploaded successfully.');
                            tu = tu + 1;
                            if (tu == $scope.ThumbFiles.length) {
                                $("#thumbfile").val("");
                                $scope.thumbfile = null;
                                $scope.ThumbFiles = [];
                                $scope.uploading = false;
                                ngProgress.complete();
                            }
                            else {
                                audiothumbupload(tu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }

                    function AudioUpload(au) {
                        var data = $scope.AudioFiles[au];
                        ContentFile.Upload('/upload' + $scope.TypeName, {
                            file: data.file,
                            cm_title: $scope.cm_title,
                            other: data.other,
                            TypeName: $scope.TypeName,
                            MetaDataId: $scope.MetadataId,
                            cm_id: $scope.MetaId,
                            width: data.width,
                            height: data.height,
                            ct_group_id: data.ct_group_id
                        }, function (resp) {
                            if (resp.data.success) {
                                $scope.Files = resp.data.Files;
                                toastr.success(resp.config.data.file.name + ' Base file uploaded successfully.');
                                au = au + 1;
                                console.log('file')
                                console.log(au)
                                if (au == $scope.AudioFiles.length) {
                                    $("#audiofile").val("");
                                    $scope.AudioFiles = [];
                                    $scope.audiofile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                                }
                                else {
                                    AudioUpload(au);
                                }
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }

                    function AudioCommonUpload(tcu) {
                        var data = $scope.CommonFiles[tcu];
                            ContentFile.Upload('/uploadotherfiles', {
                            count: data.count,
                            file: data.file,
                            cm_title: $scope.cm_title,
                            other: data.other,
                            type: data.type,
                            TypeName: $scope.TypeName,
                            MetaDataId: $scope.MetadataId,
                            cm_id: $scope.MetaId,
                            width: data.width,
                            height: data.height,
                            ct_group_id: data.ct_group_id
                        }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' supporting file uploaded successfully.');
                            tcu = tcu + 1;
                            if (tcu == $scope.CommonFiles.length) {
                                $("#supportfile").val("");
                                $scope.CommonFiles = [];
                                $scope.supportfile = null;
                                $scope.uploading = false;
                                ngProgress.complete();
                            }
                            else {
                                AudioCommonUpload(tcu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }

                    function LyricsTextFileUpload(tuf) {
                        var data = $scope.TextFiles[tuf];
                        ContentFile.Upload('/uploadText', {
                            count: data.count,
                            file: data.file,
                            cm_title: $scope.cm_title,
                            langaugemetaid: data.langaugemetaid,
                            TypeName: $scope.TypeName,
                            MetaDataId: $scope.MetadataId,
                            cm_id: $scope.MetaId,
                            width: data.width,
                            height: data.height,
                            ct_group_id: data.ct_group_id,
                            ct_param: data.ct_param,
                            ct_param_value: data.ct_param_value
                        }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' text file uploaded successfully.');
                            tuf = tuf + 1;
                            if (tuf == $scope.TextFiles.length) {
                                $(".textfile").val("");
                                $scope.TextFiles = [];
                                ngProgress.complete();
                                $scope.uploading = false;
                            }
                            else {
                                LyricsTextFileUpload(tuf);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }

                    ngProgress.start();
                    $scope.uploading = true;

                    if ($scope.thumbfile) {
                        audiothumbupload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                    if ($scope.audiofile != undefined) {
                        AudioUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                    if ($scope.CommonFiles.length > 0) {
                        AudioCommonUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                    if ($scope.TextError.length == 0 && $scope.TextFiles.length > 0) {
                         LyricsTextFileUpload(0);
                    }else {
                         $scope.uploading = false;
                         ngProgress.complete();
                    }
                    /*if ($scope.AudioZipFiles.length > 0) {
                        AudioZipUpload(0);
                    }else {
                         $scope.uploading = false;
                         ngProgress.complete();
                    }*/

                }
            }
            else {
                toastr.error("Please upload base audio file.");
            }
            /*}
            else {
                toastr.error($scope.AudioZipError[0].error);
            }*/
        }
        else if ($scope.TypeName == "AppsGames") {
            if ($scope.thumbfile || $scope.gameimagefile || $scope.gamevideofile || $scope.gameappfile) {
                if ($scope.thumberror || $scope.gameimageerror || $scope.gamevideoerror || $scope.gameapperror) {
                    toastr.error($scope.thumberror ? $scope.thumberrormessage : $scope.gameimageerror ? $scope.gameimageerrormessage : $scope.gamevideoerror ? $scope.gamevideoerrormessage : $scope.gameapperrormessage);
                }
                else if (!$scope.gameappfile || ($scope.gameappfile && $scope.GroupHandset.length > 0)) {
                    function gamethumbupload(tu) {
                        ContentFile.Upload('/uploadThumb', { count: $scope.ThumbFiles[tu].count, file: $scope.ThumbFiles[tu].file, cm_title: $scope.cm_title, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, other: null, width: $scope.ThumbFiles[tu].width, height: $scope.ThumbFiles[tu].height, ct_group_id: null }, function (resp) {
                            $scope.ThumbDataFiles = resp.data.ThumbFiles;
                            toastr.success(resp.config.data.file.name + ' Thumb file uploaded successfully.');
                            tu = tu + 1;
                            if (tu == $scope.ThumbFiles.length) {
                                /*if ($scope.gameimagefile) {
                                    GameImageUpload(0);
                                }
                                else if ($scope.gamevideofile) {
                                    GameVideoUpload(0);
                                }
                                else if ($scope.gameappfile) {
                                    GameAppUpload(0);
                                }
                                else {*/
                                    $("#thumbfile").val("");
                                    $scope.ThumbFiles = [];
                                    $scope.thumbfile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                               // }
                            }
                            else {
                                gamethumbupload(tu);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    function GameImageUpload(gi) {
                        var data = $scope.GameImageFiles[gi];
                        ContentFile.Upload('/uploadotherfiles', { count: data.count, file: data.file, cm_title: $scope.cm_title, other: data.other, type: 'image', TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' Game Image file uploaded successfully.');
                            gi = gi + 1;
                            if (gi == $scope.GameImageFiles.length) {
                                /*if ($scope.gamevideofile) {
                                    GameVideoUpload(0);
                                }
                                else if ($scope.gameappfile) {
                                    GameAppUpload(0);
                                }
                                else {*/
                                    $("#thumbfile").val("");
                                    $("#gameimagefile").val("");
                                    $scope.GameImageFiles = [];
                                    $scope.thumbfile = null;
                                    $scope.gameimagefile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                               // }
                            }
                            else {
                                GameImageUpload(gi);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    function GameVideoUpload(gv) {
                        var data = $scope.GameVideoFiles[gv];
                        ContentFile.Upload('/uploadotherfiles', { count: data.count, file: data.file, cm_title: $scope.cm_title, other: data.other, type: 'video', TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' Game Video file uploaded successfully.');
                            gv = gv + 1;
                            if (gv == $scope.GameVideoFiles.length) {
                                /*if ($scope.gameappfile) {
                                    GameAppUpload(0);
                                }
                                else {*/
                                    $("#thumbfile").val("");
                                    $("#gameimagefile").val("");
                                    $("#gamevideofile").val("");
                                    $scope.GameVideoFiles = [];
                                    $scope.thumbfile = null;
                                    $scope.gameimagefile = null;
                                    $scope.gamevideofile = null;
                                    $scope.uploading = false;
                                    ngProgress.complete();
                               // }
                            }
                            else {
                                GameVideoUpload(gv);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    function GameAppUpload(ga) {
                        var data = $scope.GameAppFiles[ga];
                        var handsets = _.unique(_.pluck($scope.GroupHandset, "dc_id"));
                        ContentFile.Upload('/upload' + $scope.TypeName, { count: data.count, Handsets: handsets.toString(), file: data.file, cm_title: $scope.cm_title, other: data.other, type: 'app', TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                            $scope.Files = resp.data.Files;
                            toastr.success(resp.config.data.file.name + ' Game App file uploaded successfully.');
                            ga = ga + 1;
                            if (ga == $scope.GameAppFiles.length) {
                                $("#thumbfile").val("");
                                $("#gameimagefile").val("");
                                $("#gamevideofile").val("");
                                $("#gameappfile").val("");
                                $scope.GameAppFiles = [];
                                $scope.thumbfile = null;
                                $scope.gameimagefile = null;
                                $scope.gamevideofile = null;
                                $scope.gameappfile = null;
                                $scope.uploading = false;
                                $scope.SelectedHandsetGroup = "";
                                $scope.HandsetGroupChange();

                                ngProgress.complete();
                            }
                            else {
                                GameAppUpload(ga);
                            }
                        }, function (error) {
                            toastr.error(error);
                            $scope.uploading = false;
                            ngProgress.complete();
                        });
                    }
                    ngProgress.start();
                    $scope.uploading = true;
                    if ($scope.thumbfile) {
                        gamethumbupload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                    if ($scope.gameimagefile) {
                        GameImageUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                    if ($scope.gamevideofile) {
                        GameVideoUpload(0);
                    }
                    if ($scope.gameappfile) {
                        GameAppUpload(0);
                    }else {
                        $scope.uploading = false;
                        ngProgress.complete();
                    }
                }
                else {
                    toastr.error("Please add Handset for map with App File.");
                }
            }
            else {
                toastr.error("Please upload app file or supporting files.");
            }
            $scope.GamePartVisible = true;
        }
        else if ($scope.TypeName == "Text") {
            if ($scope.TextError.length == 0) {
                if ($scope.thumbfile ||  ($scope.CommonFiles.length >0)  || ($scope.TextFiles.length > 0 || $scope.commonfileerror)) {
                    if ($scope.thumberror || $scope.commonfileerror) {
                        toastr.error($scope.thumberror ? $scope.thumberrormessage : $scope.commonfileerrormessage);
                    }
                    else {
                        function textthumbupload(tu) {
                            ContentFile.Upload('/uploadThumb', { count: $scope.ThumbFiles[tu].count, file: $scope.ThumbFiles[tu].file, cm_title: $scope.cm_title, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, other: null, width: $scope.ThumbFiles[tu].width, height: $scope.ThumbFiles[tu].height, ct_group_id: null }, function (resp) {
                                $scope.ThumbDataFiles = resp.data.ThumbFiles;
                                toastr.success(resp.config.data.file.name + ' Thumb file uploaded successfully.');
                                tu = tu + 1;
                                if (tu == $scope.ThumbFiles.length) {
                                   /* if ($scope.CommonFiles.length >0) {
                                        TextCommonUpload(0);
                                    }
                                    else if ($scope.TextFiles.length > 0) {
                                        TextFileUpload(0);
                                    }
                                    else {*/
                                        $("#thumbfile").val("");
                                        $scope.ThumbFiles = [];
                                        $scope.thumbfile = null;
                                        $scope.uploading = false;
                                        ngProgress.complete();
                                   // }
                                }
                                else {
                                    textthumbupload(tu);
                                }
                            }, function (error) {
                                toastr.error(error);
                                $scope.uploading = false;
                                ngProgress.complete();
                            });
                        }
                        function TextCommonUpload(tcu) {

                            var data = $scope.CommonFiles[tcu];
                            ContentFile.Upload('/uploadotherfiles', { count: data.count, file: data.file, cm_title: $scope.cm_title, other: data.other, type: data.type, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id }, function (resp) {
                                $scope.Files = resp.data.Files;
                                toastr.success(resp.config.data.file.name + ' common file uploaded successfully.');
                                tcu = tcu + 1;
                                if (tcu == $scope.CommonFiles.length) {
                                   /* if ($scope.TextFiles.length > 0) {
                                        TextFileUpload(0);
                                    }
                                    else {*/
                                        $("#thumbfile").val("");
                                        $("#commonfile").val("");
                                        $scope.CommonFiles = [];
                                        $scope.thumbfile = null;
                                        $scope.commonfile = null;
                                        $scope.uploading = false;
                                        ngProgress.complete();
                                    //}
                                }
                                else {
                                    TextCommonUpload(tcu);
                                }
                            }, function (error) {
                                toastr.error(error);
                                $scope.uploading = false;
                                ngProgress.complete();
                            });
                        }

                        function TextFileUpload(tuf) {

                            var data = $scope.TextFiles[tuf];
                            ContentFile.Upload('/upload' + $scope.TypeName, { count: data.count, file: data.file, cm_title: $scope.cm_title, langaugemetaid: data.langaugemetaid, TypeName: $scope.TypeName, MetaDataId: $scope.MetadataId, cm_id: $scope.MetaId, width: data.width, height: data.height, ct_group_id: data.ct_group_id, ct_param: data.ct_param, ct_param_value: data.ct_param_value }, function (resp) {
                                $scope.Files = resp.data.Files;
                                toastr.success(resp.config.data.file.name + ' text file uploaded successfully.');
                                tuf = tuf + 1;
                                if (tuf == $scope.TextFiles.length) {
                                    $("#thumbfile").val("");
                                    $(".textfile").val("");
                                    $("#commonfile").val("");
                                    $scope.thumbfile = null;
                                    $scope.TextFiles = [];
                                    $scope.commonfile = null;
                                    ngProgress.complete();
                                    $scope.uploading = false;
                                }
                                else {
                                    TextFileUpload(tuf);
                                }
                            }, function (error) {
                                toastr.error(error);
                                $scope.uploading = false;
                                ngProgress.complete();
                            });
                        }
                        ngProgress.start();
                        $scope.uploading = true;
                        if ($scope.thumbfile) {
                            textthumbupload(0);
                        }else {
                            $scope.uploading = false;
                            ngProgress.complete();
                        }

                        if ($scope.CommonFiles.length > 0) {
                            TextCommonUpload(0);
                        }else {
                            $scope.uploading = false;
                            ngProgress.complete();
                        }

                        if ($scope.TextFiles.length > 0) {
                            TextFileUpload(0);
                        }else {
                            $scope.uploading = false;
                            ngProgress.complete();
                        }
                    }
                }
                else {
                    toastr.error("Please upload common files or text files.");
                }
            }
            else {
                toastr.error($scope.TextError[0].error);

            }
        }
    }
    
});

