/**
 * @memberof myApp
 * @name content-catalogCtrl
 * @desc Content Catalog Controller
 * @param $scope {service} controller scope
 * @param $state {service} controller scope
 * @param $http {service} controller scope
 */
myApp.controller('content-catalogCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, ContentCatalog, $q, _, Icon, Excel, Upload,FileSaver) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#contentcatelog').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    /**
     * @name loader
     * @type {boolean}
     */
    $scope.loader = true;
    $scope.uploading = false;
    $scope.CurrentPage = $state.current.name;
    $scope.PropertyId = $scope.CurrentPage == "propertycontent" ? $stateParams.id : null;
    $scope.currentPage = 0;
    $scope.pageSize = 50;
    $scope.base_url = '';
    $scope.ShowExportPopUp = false;
    $scope.ShowImportPopUp = false;
    $scope.ShowVcodeAddUpdatePopUp = false;
    $scope.hidevcodepromsubmit = $scope.ShowExportPopUpSubmit= false;
    //ngProgress.start();
    $scope.uploading = true;
    /**
     * @name getStatus
     * @desc Get status & color & edit
     * @param MetadataExpirydate
     * @param VendorExpirydate
     * @param PropertyExpirydate
     * @param Vendor_active
     * @param Property_active
     * @param cm_state
     * @returns {{color: string, cm_state: *, IsEdit: boolean, status: string, IsBlock: boolean}}
     */
    function getStatus(MetadataExpirydate, VendorExpirydate, PropertyExpirydate, Vendor_active, Property_active, cm_state) {
        var data = { color: "chartreuse", cm_state: cm_state, IsEdit: true, status: 'Active', IsBlock: false };
        if (cm_state == 7 || cm_state == 5 || cm_state == 1 || cm_state == 2) {
        }
        else if (Vendor_active != 1) {
            data.color = "red";
            data.IsEdit = false;
            data.status = "Vendor Blocked";
            data.IsBlock = false;
        }
        else if (Datewithouttime(VendorExpirydate) < Datewithouttime(new Date())) {
            data.color = "red";
            data.IsEdit = false;
            data.status = "Vendor Expired";
            data.IsBlock = false;
        }
        else if (Property_active != 1) {
            data.color = "red";
            data.IsEdit = false;
            data.status = "Property Blocked";
            data.IsBlock = false;
        }
        else if (Datewithouttime(PropertyExpirydate) < Datewithouttime(new Date())) {
            data.color = "red";
            data.IsEdit = false;
            data.status = "Property Expired";
            data.IsBlock = false;
        }
        else if (Datewithouttime(MetadataExpirydate) < Datewithouttime(new Date())) {
            data.color = "red";
            data.IsEdit = true;
            data.status = "Metadata Expired";
            data.IsBlock = false;
        }
        else if (cm_state == 6) {
            data.color = "red";
            data.IsEdit = true;
            data.status = "Metadata Blocked";
            data.IsBlock = true;
        }

        return data;
    }

    /**
     * @name ContentCatalog.getContentCatalog
     * @desc Get Content Catalog details to render on 'content-catalog-search' page
     * @memberOf Factories/Services ContentCatalog
     */
    ContentCatalog.getContentCatalog({ Id: $scope.PropertyId, state: $scope.CurrentPage }, function (content) {
        //ngProgress.complete();
        $scope.uploading = false;
        $scope.AllMetadata = content.ContentMetadata;
        _.each($scope.AllMetadata, function (meta) {
            var data = getStatus(content.UserRole, meta.cm_expires_on, meta.vd_end_on, meta.propertyexpirydate, meta.cm_state, meta.vd_is_active, meta.propertyactive, meta.cm_state)
            meta.color = data.color;
            meta.MetaId = Icon.GetEncode(meta.cm_id);
			meta.cm_thumb_url = meta.cm_thumb_url != null && meta.cm_thumb_url ?meta.cm_thumb_url.split(',')[0]:'';
			meta.IsEdit = data.IsEdit;
            meta.status = data.status;
            meta.edit = GetEditContentType(meta.parentname);
            meta.UserRole = content.UserRole;
            meta.IsBlock = data.IsBlock;
            meta.cm_created_on = setDate(meta.cm_created_on);
            meta.cm_starts_from = setDate(meta.cm_starts_from);
            meta.cm_expires_on = setDate(meta.cm_expires_on);
            meta.cm_modified_on = setDate(meta.cm_modified_on);

            meta.PublishArray = [{ id: 4, Name: "Publish" }, { id: 5, Name: "Rest All" }];
        });
        $scope.CountryOperator = content.CountryOperator;
        $scope.DownloadType = content.DownloadType;
        //console.log($scope.DownloadType);
        $scope.UserName = content.UserName;
        $scope.UserRole = content.UserRole;
        $scope.IsEditPermission = content.UserRole == "Moderator" ? true : false;

        $scope.Vendors = content.Vendors;
        $scope.ContentStatus = _.where(content.ContentStatus, { cm_name: "Content Status" });
        //$scope.ContentType = _.where(content.ContentStatus, { cm_name: "Content Type" });
        $scope.ContentType = content.ContentTypes;

        $scope.SearchByList = content.CatalogueMaster;
        _.each($scope.SearchByList, function (match) {
            if (match.cm_name == "Celebrity") {
                match.cm_name = "Actor / Actress Name"
            }
            else if (match.cm_name == "Raag Taal") {
                match.cm_name = "Raag / Taal"
            }
            else if (match.cm_name == "Property") {
                match.cm_name = "Property Title"
            }
        });
        if ($scope.CurrentPage == "contentsearch") {
            console.log('$stateParams.type')
            console.log($scope.ContentType)
            $scope.SelectedContentStatus = $stateParams.status == "0" ? null : parseInt($stateParams.status);
            $scope.SelectedVendor = $stateParams.vendor == "0" ? null : parseInt($stateParams.vendor);
            if ($stateParams.type != "0") {
                var match = _.find($scope.ContentType, function (val) { return val.parent_id == parseInt($stateParams.type) })
                if (match) {
                    $scope.SelectedType = match.cd_id;
                }
            }
            $scope.StatusChange();
        }
        
    }, function (error) {
        toastr.error(error);
    });
    /**
     * @name SwitchCaseForGrid
     * @param state
     * @desc To hide & show grid
     */
    function SwitchCaseForGrid(state) {
        switch (state) {
            case 'File Upload Pending':
                $scope.FileUploadPendingContentShow = true;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
            case 'In Process':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = true;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
            case 'Ready To Moderate':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = true;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
            case 'Published':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = true;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
            case 'Rejected':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = true;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
            case 'Inactive':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = true;
                $scope.DeletedContentShow = false;
                break;
            case 'Deleted':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = true;
                break;
            case '':
                $scope.FileUploadPendingContentShow = false;
                $scope.ContentInProgressShow = false;
                $scope.ReadyToModerateContentShow = false;
                $scope.PublishedContentShow = false;
                $scope.RejectedContentShow = false;
                $scope.InActiveContentShow = false;
                $scope.DeletedContentShow = false;
                break;
        }
    }

    /**
     * @name GetEditContentType
     * @param state
     * @returns {string}
     * @desc Set page state according to Content Type
     */
    function GetEditContentType(state) {
        var contenttype = '';
        switch (state) {
            case 'Imagery':
                contenttype = 'editimagery';
                break;
            case 'Video':
                contenttype = 'editvideo';
                break;
            case 'Audio':
                contenttype = 'editaudio';
                break;
            case 'AppsGames':
                contenttype = 'editapps-games';
                break;
            case 'Text':
                contenttype = 'edittext';
                break;
        }
        return contenttype;
    };
    /**
     * $desc content status change
     * @name StatusChange
     */ 

    $scope.StatusChange = function () {

        if ($scope.SelectedContentStatus) {
            var match = _.find($scope.ContentStatus, function (val) { return val.cd_id == $scope.SelectedContentStatus })
            if (match) {
                $scope.Status = match.cd_name;
                SwitchCaseForGrid(match.cd_name);
            }
            else {
                SwitchCaseForGrid('');
            }
        }
        else {
            SwitchCaseForGrid('');
        }
        $scope.SearchChange();
    }
    //other search Event 
    $scope.SearchChange = function () {
        var match = _.find($scope.ContentType, function (val) { return val.cd_id == parseInt($scope.SelectedType) })
        if (match) {
            $scope.SelectedContentType = match.cd_name;
         }
        var query = "";
        if ($scope.SelectedContentStatus) {
            query = '"cm_state" :' + $scope.SelectedContentStatus;
        }
        if ($scope.SelectedVendor) {
            query += (query != "" ? "," : "") + '"vd_id" :' + $scope.SelectedVendor;
        }
        if ($scope.SelectedType) {
            //query += (query != "" ? "," : "") + ' "parentname" : "' + $scope.SelectedType + '"';
            query += (query != "" ? "," : "") + ' "cm_content_type" : ' + parseInt($scope.SelectedType);
        }
        if (query != "") {
            query = "{" + query + "}";
            var obj = JSON.parse(query);
           // console.log(obj)

            $scope.MetaDatas = _.where($scope.AllMetadata, obj);
           // console.log($scope.MetaDatas)

            $scope.SearchContentBy();
            $scope.loading = true;
        }
    }
    //search content by
    $scope.SearchContentBy = function () {
        if ($scope.SearchContent && $scope.SearchContent != "" && $scope.SelectedSearchContentBy) {
            $scope.FilterData = _.filter($scope.MetaDatas, function (val) {
                if ($scope.SelectedSearchContentBy == "Content Title") {
                    return val.cm_title.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Property Title") {
                    return val.propertyname.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Actor / Actress Name") {
                    return val.celebrity_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Genres") {
                    return val.genre_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Sub Genres") {
                    return val.subgenre_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Mood") {
                    return val.mood_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Festival") {
                    return val.festival_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Religion") {
                    return val.religion_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Instruments") {
                    return val.instrument_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Raag / Taal") {
                    return val.raagtaal_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
                else if ($scope.SelectedSearchContentBy == "Languages") {
                    return val.language_name.toLowerCase().indexOf($scope.SearchContent.toLowerCase()) > -1;
                }
            });
        }
        else {
            $scope.FilterData = $scope.MetaDatas;
        }
        $scope.loading = true;
        $scope.currentPage = 0;
    }

    // get previous page
    $scope.PreviousClick = function () {
        var ChangedData = _.filter($scope.FilterData, function (item) { return item.SelectedPublishReject === 4 || item.SelectedPublishReject === 5; })
        if (ChangedData.length > 0) {
            bootbox.confirm("Are you sure want to go on Prevoius page?", function (result) {
                if (result) {
                    $scope.currentPage = parseInt($scope.currentPage) - 1;
                    _.each(ChangedData, function (val) {
                        val.SelectedPublishReject = '';
                    });
                    $scope.$apply();
                }
            });
        }
        else {
            $scope.currentPage = parseInt($scope.currentPage) - 1;
        }
    }
    // get next page
    $scope.NextClick = function () {
        var ChangedData = _.filter($scope.FilterData, function (item) { return item.SelectedPublishReject === 4 || item.SelectedPublishReject === 5; })
        if (ChangedData.length > 0) {
            bootbox.confirm("Are you sure want to go on Next page?", function (result) {
                if (result) {
                    $scope.currentPage = parseInt($scope.currentPage) + 1;
                    _.each(ChangedData, function (val) {
                        val.SelectedPublishReject = '';
                    })
                    $scope.$apply();
                }
            });
        }
        else {
            $scope.currentPage = parseInt($scope.currentPage) + 1;
        }

    }
    //Block & unblock Meta
    $scope.BlockUnBlockMetadata = function (Id, Title, IsBlock, cm_expires_on, Status, state) {
        if ((IsBlock && (state == 4)) || ((!IsBlock) && (state == 6))) {
            bootbox.confirm("Are you sure want to " + Status + " this Content Metadata ?", function (result) {
                if (result) {
                    var array = [];
                    array.push({ comment: null, id: Id, title: Title, state: state, oldstate: (state == 4) ? 6 : 4, status: (state == 4 ? 'unblocked' : 'blocked') })
                    var meta = { message: 'Content Metadata ' + (state == 4 ? 'unblocked' : 'blocked') + ' successfully.', meta: array }
                    ngProgress.start();
                    ContentCatalog.UpdateState(meta, function (data) {
                        if (data.success) {
                            _.each($scope.AllMetadata, function (meta) {
                                var match = _.find($scope.AllMetadata, function (val) { return val.cm_id == Id })
                                if (match) {
                                    match.cm_state = state;
                                    match.IsBlock = (state == 4 ? false : true);
                                    match.color = (state == 4 ? "chartreuse" : "red");
                                    match.cm_modified_on = setDate(new Date());
                                    match.cm_modified_by = $scope.UserName;
                                }
                            });
                            $scope.SearchChange();
                            // $scope.$apply();
                            toastr.success(data.message);
                        }
                        else {
                            toastr.error(data.message);
                        }
                        ngProgress.complete();
                    }, function (error) {
                        toastr.error(error);
                        ngProgress.complete();
                    });
                }
            });
        }
    }
    // delete metadata
    $scope.DeleteMetadata = function (Id, Title, state) {
        bootbox.confirm("Are you sure want to delete Content Metadata ?", function (result) {
            if (result) {
                var array = [];
                array.push({ comment: null, id: Id, title: Title, state: 7, status: 'deleted', oldstate: state });
                var meta = { message: 'Content Metadata deleted successfully.', meta: array };
                ngProgress.start();
                ContentCatalog.UpdateState(meta, function (data) {
                    if (data.success) {
                        toastr.success(data.message);
                        var match = _.find($scope.AllMetadata, function (val) { return val.cm_id == Id })
                        if (match) {
                            match.cm_state = 7;
                            match.cm_modified_on = setDate(new Date());
                            match.cm_modified_by = $scope.UserName;
                        }
                        $scope.SearchChange();
                        // $scope.$apply();
                    }
                    else {
                        toastr.error(data.message);
                    }
                    ngProgress.complete();
                }, function (error) {
                    toastr.error(error);
                    ngProgress.complete();
                });
            }
        });
    }
    // publish all metadata
    $scope.PublishAll = function () {
        if ($scope.FilterData.length > 0) {
            bootbox.confirm("Are you sure want to publish All Content Metadata ?", function (result) {
                if (result) {
                    var array = [];
                    _.each($scope.FilterData, function (val) {
                        array.push({ comment: null, id: val.cm_id, title: val.cm_title, state: 4, status: 'published', oldstate: 3 })
                    })
                    var meta = { message: 'Content Metadata published successfully.', meta: array }
                    ngProgress.start();
                    ContentCatalog.UpdateState(meta, function (data) {
                        if (data.success) {
                            _.each(array, function (item) {
                                var match = _.find($scope.AllMetadata, function (val) { return val.cm_id == item.id })
                                if (match) {
                                    match.cm_state = 4;
                                    match.cm_modified_on = setDate(new Date());
                                    match.cm_modified_by = $scope.UserName;
                                }
                            })
                            $scope.SearchChange();
                            toastr.success(data.message);
                        }
                        else {
                            toastr.error(data.message);
                        }
                        ngProgress.complete();
                    }, function (error) {
                        toastr.error(error);
                        ngProgress.complete();
                    });
                }
            });

        }
    }
    // publish all metadata on current page
    $scope.PublishAllFromCurrentPage = function (Id, Status, classtext) {
        if ($scope.FilterData.length > 0) {
            var begin = ($scope.currentPage * $scope.pageSize), end = begin + $scope.pageSize;
            $scope.CurrentPageMetadata = $scope.FilterData.slice(begin, end);
            if ($scope.CurrentPageMetadata.length > 0) {
                bootbox.confirm("Are you sure want to publish All Content From Current Page?", function (result) {
                    if (result) {
                        var array = [];
                        _.each($scope.CurrentPageMetadata, function (val) {
                            array.push({ comment: null, id: val.cm_id, title: val.cm_title, state: 4, status: 'published', oldstate: 3 })
                        })
                        var meta = { message: 'Content Metadata published successfully.', meta: array }
                        ngProgress.start();
                        ContentCatalog.UpdateState(meta, function (data) {
                            if (data.success) {
                                _.each(array, function (item) {
                                    var match = _.find($scope.AllMetadata, function (val) { return val.cm_id == item.id })
                                    if (match) {
                                        match.cm_state = 4;
                                        match.cm_modified_on = setDate(new Date());
                                        match.cm_modified_by = $scope.UserName;
                                    }
                                })
                                $scope.SearchChange();
                                toastr.success(data.message);
                            }
                            else {
                                toastr.error(data.message);
                            }
                            ngProgress.complete();
                        }, function (error) {
                            toastr.error(error);
                            ngProgress.complete();
                        });
                    }
                });
            }
        }
    }
    // save metadata events
    $scope.Submit = function (Id, Status, classtext) {
        if ($scope.FilterData.length > 0) {
            var begin = ($scope.currentPage * $scope.pageSize), end = begin + $scope.pageSize;
            $scope.CurrentPageMetadata = $scope.FilterData.slice(begin, end);
            var ChangedData = _.filter($scope.CurrentPageMetadata, function (item) { return item.SelectedPublishReject === 4 || item.SelectedPublishReject === 5; })
            if (ChangedData.length > 0) {
                var match = _.find($scope.CurrentPageMetadata, function (item) { return item.SelectedPublishReject == 5; });
                if (match) {
                    bootbox.prompt("Reject Comment", function (result) {
                        if (result) {
                            submitfunction(result);
                        }
                    });
                }
                else {
                    bootbox.confirm("Are you sure want to submit Current Page Content Changes?", function (result) {
                        if (result) {
                            submitfunction(null);
                        }
                    });
                }
                function submitfunction(comment) {
                    var array = [];
                    _.each(ChangedData, function (val) {
                        array.push({ comment: comment, id: val.cm_id, title: val.cm_title, oldstate: 3, state: val.SelectedPublishReject, status: (val.SelectedPublishReject == 4 ? 'published' : 'rejected') })
                    })
                    var meta = { message: 'Content Metadata changes submited successfully.', meta: array }
                    ngProgress.start();
                    ContentCatalog.UpdateState(meta, function (data) {
                        if (data.success) {
                            toastr.success(data.message);

                            //toastr.success(data.message);
                            _.each(array, function (item) {
                                var match = _.find($scope.AllMetadata, function (val) { return val.cm_id == item.id })
                                if (match) {
                                    match.cm_state = item.state;
                                    match.cm_modified_on = setDate(new Date());
                                    match.cm_modified_by = $scope.UserName;
                                    match.cm_comment = comment;
                                }
                            })
                            $scope.SearchChange();
                        }
                        else {
                            toastr.error(data.message);
                            //toastr.error(data.message);
                        }
                        ngProgress.complete();
                    }, function (error) {
                        toastr.error(error);
                        ngProgress.complete();
                    });
                }
            }
        }
    }
    // reset search criteria
    $scope.Reset = function (Id, Status, classtext) {
        if (scope.FilterData.length > 0) {
            var begin = ($scope.currentPage * $scope.pageSize), end = begin + $scope.pageSize;
            $scope.CurrentPageMetadata = $scope.FilterData.slice(begin, end);
            var ChangedData = _.filter($scope.CurrentPageMetadata, function (item) { return item.SelectedPublishReject === 4 || item.SelectedPublishReject === 5; })
            _.each(ChangedData, function (val) {
                val.SelectedPublishReject = '';
            })
        }
    }
    // set vcode file uploader
    $scope.vcodefileuploader = function () {
        $scope.vcodeError = false;
        $scope.VcodeFiles = [];
        if ($scope.vcodefile) {
            //console.log($scope.vcodefile)
        }
    };
    // upload excel for importing vcode and promocode
    $scope.upload = function (isValid) {
        if(isValid && $scope.vcodefile.name == $scope.MetadataId+'_'+$scope.SelectedDownloadType+'_NameList.xlsx') {
            var operators = {};
            _.each($scope.CountryOperator, function (val) {
                operators[_.property('cd_name')(val)] = _.property('cd_id')(val);
            })
            if (getExtension($scope.vcodefile.name).toLowerCase() == "xlsx") {
                ngProgress.start();
                $scope.uploading = true;
                $scope.loader = false;
                if($scope.SelectedDownloadType == 'Vcode'){
                    var httpUrl = '/importVcode';
                }else{
                    var httpUrl = '/importPromocode';
                }
                ContentCatalog.Upload(httpUrl, {
                    file: $scope.vcodefile,
                    MetaDataId: $scope.MetadataId,
                    operators: JSON.stringify(operators),
                }, function (resp) {
                    ngProgress.complete();
                    $scope.loader = true;
                    $scope.uploading = false;
                    if(resp.data.inValidOperators.length > 0){
                        toastr.error('There are invalid operators '+resp.data.inValidOperators);
                    }
                    if(resp.data.validOperators.length > 0) {
                         toastr.success(resp.data.message);
                        //toastr.success('Vcode imported successfully for valid operators ' + resp.data.validOperators);
                    }else {
                        toastr.error('No Vcode found for any operators ' + Object.keys(operators));
                    }
                    if (ngProgress.complete() == 100) {
                        $scope.CloseImportExport();
                        $scope.vcodefile = '';
                    }
                }, function (error) {
                    toastr.error(error);
                    ngProgress.complete();
                    $scope.loader = true;
                    $scope.uploading = false;
                    $scope.vcodefile = '';
                    if (ngProgress.complete() == 100) {
                        $scope.CloseImportExport();
                    }
                });
            } else {
                $scope.vcodefile = '';
                $scope.loader = true;
                toastr.error('Invalid Excel file extension or naming conventions.');
            }
        }else {
            $scope.vcodefile = '';
            toastr.error('Invalid Excel file extension or naming conventions.');
        }
    };
    // add and update vcode and promocode
    $scope.addUpdateVcodePromocode = function (isValid) {
        if ($scope.SelectedCountryOperator) {
            if ($scope.SelectedDownloadType == 'Vcode') {
                if ($scope.SelectedVcode) {
                    ngProgress.start();
                    $scope.uploading = true;
                    $scope.loader = false;
                    ContentCatalog.addUpdateVcode({
                        'cmId': $scope.MetadataId,
                        'operator': $scope.SelectedCountryOperator,
                        'vcode': $scope.SelectedVcode
                    }, function (data) {
                        ngProgress.complete();
                        $scope.loader = true;
                        $scope.uploading = false;
                        if (data.success) {
                            $scope.SelectedCountryOperator = "";
                            $scope.SelectedVcode = "";
                            $scope.SelectedPromocode = "";
                            toastr.success(data.message);
                            if (ngProgress.complete() == 100) {
                                $scope.CloseImportExport();
                            }

                        } else {
                            toastr.error(data.message);
                            if (ngProgress.complete() == 100) {
                                $scope.CloseImportExport();
                            }
                        }

                    }, function (error) {
                        toastr.error(error);
                        ngProgress.complete();
                        $scope.loader = true;
                        $scope.uploading = false;
                    });
                } else {
                    toastr.error('Provide Vcode');
                }
            } else {
                if ($scope.SelectedPromocode) {
                    ContentCatalog.addUpdatePromocode({
                        'cmId': $scope.MetadataId,
                        'operator': $scope.SelectedCountryOperator,
                        'promocode': $scope.SelectedPromocode
                    }, function (data) {
                        ngProgress.complete();
                        if (data.success) {
                            $scope.SelectedCountryOperator = "";
                            $scope.SelectedVcode = "";
                            $scope.SelectedPromocode = "";
                            toastr.success(data.message);
                            if (ngProgress.complete() == 100) {
                                $scope.CloseImportExport();
                            }
                        } else {
                            toastr.error(data.message);
                            if (ngProgress.complete() == 100) {
                                $scope.CloseImportExport();
                            }
                        }
                    }, function (error) {
                        toastr.error(error);
                        ngProgress.complete();
                    });
                } else {
                    toastr.error('Provide Promo code');
                }
            }
        }
    }
    // add and update vcode
    $scope.addUpdateVcode123 = function (isValid) {
        if(isValid) {
            ContentCatalog.addUpdateVcode({
                'cmId': $scope.MetadataId,
                'operator': $scope.SelectedCountryOperator,
                'vcode': $scope.SelectedVcode,
                'promocode': $scope.SelectedPromocode
            }, function (data) {
                ngProgress.complete();
                if (data.success) {
                    $scope.SelectedCountryOperator = "";
                    $scope.SelectedVcode = "";
                    $scope.SelectedPromocode = "";
                    toastr.success(data.message);
                    if (ngProgress.complete() == 100) {
                        $scope.CloseImportExport();
                    }
                }
                else {
                    toastr.error(data.message);
                    if (ngProgress.complete() == 100) {
                        $scope.CloseImportExport();
                    }
                }
                ngProgress.complete();
            }, function (error) {
                toastr.error(error);
                ngProgress.complete();
            });
        }
    }
    //  close popup of import/export
    $scope.CloseImportExport = function () {
        $scope.ShowExportPopUp = false;
        $scope.ShowImportPopUp = false;
        $scope.ShowVcodeAddUpdatePopUp = false;
    }
    //  open popup of  export
    $scope.ShowPopupForExport = function (cm_id) {
         $scope.MetadataId = cm_id;
        $scope.ShowExportPopUp = true;
        $scope.SelectedDownloadType = '';
        $scope.SelectedCountryOperator = '';
        $scope.hidevcodepromsubmit = $scope.ShowExportPopUpSubmit =  false;
    }
    //  open popup of import
    $scope.ShowPopupForImport = function (cm_id) {
         $scope.MetadataId = cm_id;
        $scope.ShowImportPopUp = true;
        $scope.SelectedDownloadType = '';
        $scope.vcodefile = '';
    }
   /* $scope.ShowPopupForVcode = function (cm_id) {
        $scope.MetadataId = cm_id;
        $scope.ShowVcodeAddUpdatePopUp = true;
    }*/
    //  get vcode for generic type metadata
    $scope.getVcodeForGeneric = function (cm_id) {
        var operators = {};
        if($scope.SelectedDownloadType && $scope.SelectedCountryOperator){
         $scope.hidevcodepromsubmit = true;
        }else{
         $scope.hidevcodepromsubmit = false;
        }
        if ($scope.SelectedCountryOperator) {
            if ($scope.SelectedCountryOperator != undefined) {
                var operatorName = _.pluck(_.filter($scope.CountryOperator, function (val) {
                    return val.cd_id == parseInt($scope.SelectedCountryOperator)
                }), "cd_name")[0];
                operators[_.pluck(_.toArray(_.filter($scope.CountryOperator, function (val) {
                    return val.cd_id == parseInt($scope.SelectedCountryOperator)
                })), "cd_name")] = null;
            }
            ContentCatalog.getPersonalizedDataForVcode({"metadata_id": $scope.MetadataId, "operators": operators, codeType: $scope.SelectedDownloadType}, function (content) {
                //console.log(content[0]);
                if (content[0] != undefined && content[0][operatorName] != '') {
                    if ($scope.SelectedDownloadType == 'Vcode') {
                        $scope.SelectedVcode = content[0][operatorName];
                    } else {
                        $scope.SelectedPromocode = content[0][operatorName];
                    }
                } else {
                    $scope.SelectedVcode = '';
                    $scope.SelectedPromocode = '';
                }
            })
        }
    }

    //  open popup of importing vcode
    $scope.ShowPopupForVcode = function (cm_id) {
        $scope.MetadataId = cm_id;

        $scope.SelectedVcode = '';
        $scope.SelectedPromocode = '';
        $scope.SelectedCountryOperator = '';
        $scope.SelectedDownloadType = '';
        $scope.ShowVcodeAddUpdatePopUp = true;
        $scope.ShowExportPopUpSubmit= false;
        $scope.hidevcodepromsubmit = $scope.ShowExportPopUpSubmit =  false;

    }
    //  open popup of exporting vcode

    $scope.showExportpopupsubmit = function () {
        if ($scope.SelectedDownloadType) {
            $scope.ShowExportPopUpSubmit = true;
        } else {
            $scope.ShowExportPopUpSubmit = false;
        }

    }

    function getExtension(filename) {
        var parts = filename.split('.');
        return parts[parts.length - 1];
    }
    //  export/download into excelsheet for vcode mapping

    $scope.ExportForVcode = function () {
         $scope.ShowExportPopUp = false;
        var operators = {};
        if($scope.SelectedCountryOperator != '' && $scope.SelectedCountryOperator != undefined){
            operators[_.pluck(_.toArray(_.filter($scope.CountryOperator, function(val){  return val.cd_id == parseInt($scope.SelectedCountryOperator) })),"cd_name")] = null;
        }else{
            _.each(_.pluck($scope.CountryOperator, "cd_name"), function (val) {
                operators[val] = null;
            })
        }
        //console.log($scope.SelectedCountryOperator);        console.log(operators);
        ContentCatalog.getPersonalizedDataForVcode({"metadata_id":$scope.MetadataId,"operators":operators,codeType:$scope.SelectedDownloadType}, function (content) {
            $scope.ContentFiles = content;
            if ($scope.ContentFiles.length > 0) {
                var contentForExport = [];
                var obj = [];
                _.each($scope.ContentFiles, function (val,index) {
                    if($scope.SelectedCountryOperator != '' && $scope.SelectedCountryOperator != undefined){
                        var operator = _.pluck(_.toArray(_.filter($scope.CountryOperator, function(val){  return val.cd_id == parseInt($scope.SelectedCountryOperator) })),"cd_name");
                        obj[operator] = val[operator];
                    }else{
                        _.each(_.pluck($scope.CountryOperator, "cd_name"), function (op) {
                            obj[op] = val[op];
                        })
                    }
                    contentForExport.push(_.extend({'MetadataId' : val.MetadataId, 'ChildId': val.ContentFileId, 'Username': val.Username },obj));
                })

                var data = ExportExcelVcodePromocode(contentForExport);

                Excel.ExportExcel({ data: data, 'FileName': $scope.MetadataId+'_'+$scope.SelectedDownloadType+'_NameList.xlsx' }, function (data) {
                    var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                    window.saveAs(blob, $scope.MetadataId+'_'+$scope.SelectedDownloadType+'_NameList.xlsx');
                }, function (error) {
                    toastr.error(error);
                });

                /*var data = ExportExcelNew(contentForExport);

                Excel.ExportVcode({ data: data, 'FileName': $scope.MetadataId+'_'+$scope.SelectedDownloadType+'_NameList.xlsx' },function (data, status, headers, config) {
                    var blob = new Blob([data], {type:"application/octet-stream"});
                    var fileName = headers('content-disposition');
                    FileSaver.saveAs(blob, fileName);
                }, function (error) {
                    toastr.error(error);
                });*/
            }else{
                toastr.error('No data found.');
           }
        }, function (error) {
            toastr.error(error);
        });
    }
    //  export/download into excelsheet for metadata
    $scope.ExportExcel = function () {
        if ($scope.FilterData.length > 0) {
            var array = [];
            _.each($scope.FilterData, function (val) {
                if ($scope.Status == "File Upload Pending" || $scope.Status == "In Process") {
                    array.push({ 'MetadataID': val.MetaId, 'ContentTitle': val.cm_title, 'PropertyTitle': val.propertyname, 'AddedOn': val.cm_created_on });
                }
                else if ( $scope.Status == "Ready To Moderate" || $scope.Status == "Published"){
                    array.push({'ContentId':val.cm_id, 'MetadataID': val.MetaId, 'ContentTitle': val.cm_title, 'PropertyTitle': val.propertyname, 'AddedOn': val.cm_created_on });
                }
                else if ($scope.Status == "Rejected") {
                    array.push({'ContentId':val.cm_id, 'MetadataID': val.MetaId, 'ContentTitle': val.cm_title, 'PropertyTitle': val.propertyname, 'Comments': val.cm_comment, 'AddedOn': val.cm_created_on });
                }
                else if ($scope.Status == "Inactive") {
                    array.push({'ContentId':val.cm_id, 'MetadataID': val.MetaId, 'ContentTitle': val.cm_title, 'PropertyTitle': val.propertyname, 'ExpiredOn': val.cm_expires_on });
                }
                else if ($scope.Status == "Deleted") {
                    array.push({'ContentId':val.cm_id, 'MetadataID': val.MetaId, 'ContentTitle': val.cm_title, 'PropertyTitle': val.propertyname, 'DeleteOn': val.cm_modified_on, 'DeleteBy': val.cm_modified_by });
                }
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': $scope.Status }, function (data) {
                var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                window.saveAs(blob, $scope.Status + '.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }
});