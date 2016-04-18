
myApp.controller('masterListCtrl', function ($scope, $window, $http, $state, ngProgress, $stateParams, MasterLists, _, Excel) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#masterlistmanagement').addClass('active');
    $scope.CurrentPage = $state.current.name;
    $scope.CurrentPage == "addmasterlist" ? $('#addmaster').addClass('active') : '';
    $scope.CurrentPage == "masterlist" ? $('#masterlist').addClass('active') : '';
    $scope.CelebrityRoleDisable = true;
    $scope.PageTitle = $state.current.name == "addmasterlist" ? "Add" : "Edit";
    $scope.MasterDisable = $scope.CurrentPage == "addmasterlist" ? false : true;
    $scope.SelectedCelebrityRole = [];
    $scope.MasterlistExportData = [];
    $scope.chunkedFilterData = [];
    $scope.currentPage = 0;
    $scope.pageSize = 34;
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    MasterLists.getMasterList({ Id: $stateParams.id, state: $scope.CurrentPage }, function (master) {
        master.UserRole === "Content Manager" ? location.href = "/" : "";
        $scope.IsEditPermission = master.UserRole === "Moderator" ? false : true;
        $scope.MasterList = master.MasterList;
        $scope.SelectedContentType = _.pluck(master.SelectedContentTypes, "cd_id");
        $scope.ContentTypes = master.ContentTypes;
        $scope.CelebrityRole = master.CelebrityRole;
        var master_content = _.find($scope.MasterList, function (val) { return val.cm_name == "Celebrity Role"; })
        $scope.master_content_type = master_content ? master_content.cm_id : '';

        $scope.SubMasterList = master.SubMasterList;
        $scope.OldSubMasterList = $scope.SubMasterList;
        if ($scope.CurrentPage === "editmasterlist") {
            $scope.SubMasterList.length > 0 ? "" : location.href = "/";
            var data = _.find($scope.SubMasterList, function (val) { return val; });

            if (data) {
                $scope.SelectedMasterList = data.cd_cm_id;
                var masterdata = _.find($scope.MasterList, function (master, key) { return master.cm_id == $scope.SelectedMasterList; });
                $scope.MasterName = masterdata ? masterdata.cm_name : "";
                $scope.CelebrityRoleDisable = ($scope.MasterName == "Celebrity" && master.UserRole === "Moderator") ? false : true;
                $scope.MainTitle = data.cd_name;
                $scope.OldTitle = data.cd_name;
                $scope.DisplayTitle = data.cd_display_name;
                $scope.Alias = data.cd_desc1 != null ? data.cd_desc1 : "";
                $scope.cmd_group_id = data.cd_desc;
                $scope.contentTypeGroupId = data.cd_content_type_id;
                $scope.SelectedCelebrityRole = data.cmd_entity_detail != null ? _.pluck($scope.SubMasterList, "cmd_entity_detail") : [];
            }
        }
    }, function (error) {
        toastr.error(error);
    });
    $scope.ExportExcel = function () {
        if ($scope.MasterlistExportData.length > 0) {
            var array = [];
            _.each($scope.MasterlistExportData, function (val) {
                array.push({ 'Display Title': val.cd_name });
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': $scope.MasterName }, function (data) {
                var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                window.saveAs(blob, $scope.MasterName + '.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }

    // List Page functions
    $scope.MasterListChange = function () {
        var master = _.find($scope.MasterList, function (master, key) { return master.cm_id == $scope.SelectedMasterList; });
        $scope.MasterName = master ? master.cm_name : "";
        $scope.SelectedCelebrityRole = $scope.MasterName == "Celebrity" ? $scope.SelectedCelebrityRole : "";
        $scope.CelebrityRoleDisable = $scope.MasterName == "Celebrity" ? false : true;
        if ($scope.MasterName == "Celebrity") {
            $scope.filterData = [];
            var data = _.where($scope.SubMasterList, ($scope.SelectedCelebrityRole && $scope.SelectedCelebrityRole != "") ? { "cd_cm_id": $scope.SelectedMasterList, "cmd_entity_detail": $scope.SelectedCelebrityRole} : { "cd_cm_id": $scope.SelectedMasterList })
            var NewArray = [];
            _.each(data, function (val) {
                if (NewArray.indexOf(val.cd_id) == -1) {
                    NewArray.push(val.cd_id);
                    $scope.filterData.push(val);
                }
            })
        }
        else {
            $scope.filterData = _.where($scope.SubMasterList, { "cd_cm_id": $scope.SelectedMasterList });
        }
        createChunks();
    }
    function createChunks() {
        var masterList = [];
        var cnt = 1;
        if ($scope.searchcontentquery) {
            var data = _.filter($scope.filterData, function (item) {
                return item.cd_name.toLowerCase().indexOf($scope.searchcontentquery.toLowerCase()) > -1;
            });
            _.each(data, function (val) {
                val['srno'] = cnt;
                cnt++;
            })
            $scope.MasterlistExportData = data;
            $scope.chunkedFilterData = BindMasterList(data);
        } else {
            _.each($scope.filterData, function (val) {
                val['srno'] = cnt;
                cnt++;
            })
            $scope.MasterlistExportData = $scope.filterData;
            $scope.chunkedFilterData = BindMasterList($scope.filterData);
        }
    }
    $scope.CelebrityRoleChange = function () {
        if ($scope.MasterName == "Celebrity") {
            var data = _.where($scope.SubMasterList, ($scope.SelectedCelebrityRole && $scope.SelectedCelebrityRole != "") ? { "cd_cm_id": $scope.SelectedMasterList, "cmd_entity_detail": $scope.SelectedCelebrityRole} : { "cd_cm_id": $scope.SelectedMasterList })
            $scope.filterData = [];
            var NewArray = [];
            _.each(data, function (val) {
                if (NewArray.indexOf(val.cd_id) == -1) {
                    NewArray.push(val.cd_id);
                    $scope.filterData.push(val);
                }
            })
            createChunks();
        }
    }
    $scope.FilterContent = function (data) {
        $scope.searchcontentquery = $scope.Searchquery;
        createChunks();
    }

    // add edit Page Function
    $scope.resetform = function () {
        $scope.SelectedMasterList = "";
        $scope.CelebrityRoleDisable = true;
        $scope.masterlistform.$setPristine();
    }
    function GetAddRole(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return old.cmd_entity_detail == selected && $scope.cmd_group_id == old.cmd_group_id });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    function GetDeleteRole(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return old.cmd_entity_detail == selected && $scope.cmd_group_id == old.cmd_group_id });
            if (!data) {
                DeleteArray.push(old);
            }
        });
        return DeleteArray;
    }
    function addContentTypes(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return old.cmd_entity_detail == selected && $scope.contentTypeGroupId == old.contentTypeGroupId });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    function deleteContentTypes(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return old.cmd_entity_detail == selected && $scope.contentTypeGroupId == old.contentTypeGroupId });
            if (!data) {
                DeleteArray.push(old);
            }
        });
        return DeleteArray;
    }
    $scope.submitForm = function (isValid) {

        var addContentTypesList = addContentTypes($scope.OldSubMasterList, $scope.SelectedContentType);
        var deleteContentTypesList = deleteContentTypes($scope.OldSubMasterList, $scope.SelectedContentType);

        if (isValid) {
            var flag = $scope.MasterName == "Celebrity" ? $scope.SelectedCelebrityRole.length > 0 ? "" : "Please select Celebrity Role." : "";
            if (flag == "") {
                var addRole = $scope.MasterName == "Celebrity" ? GetAddRole($scope.OldSubMasterList, $scope.SelectedCelebrityRole) : [];
                var deleteRole = $scope.MasterName == "Celebrity" ? GetDeleteRole($scope.OldSubMasterList, $scope.SelectedCelebrityRole) : [];

                var masterlist = {
                    cd_id: $stateParams.id,
                    state: $scope.CurrentPage,
                    OldTitle: $scope.OldTitle,
                    Title: $scope.MainTitle,
                    MasterId: $scope.SelectedMasterList,
                    DisplayTitle: $scope.DisplayTitle,
                    MasterName: $scope.MasterName,
                    Alias: $scope.MasterName == "Celebrity" ? $scope.Alias : null,
                    CelebrityRole: addRole,
                    DeleteCelebrityRole: deleteRole,
                    ContentTypes: addContentTypesList,
                    DeleteContentTypes: deleteContentTypesList,
                    master_content_type: $scope.master_content_type,
                    cd_content_type_id: $scope.contentTypeGroupId,
                    cd_desc: $scope.cmd_group_id
                }
                ngProgress.start();
                MasterLists.AddEditMasterList(masterlist, function (data) {
                    if (data.success) {
                        toastr.success(data.message);
                        $window.location.href = "#master-list";
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
            else {
                toastr.error(flag);
            }
        }
    };
    $scope.DeleteMasterList = function (Id, cd_name, cm_name, cd_desc) {
        bootbox.confirm("Are you sure want to delete this " + cm_name + "?", function (result) {
            if (result) {
                var delete_data = {
                    cd_id: Id,
                    Title: cd_name,
                    MasterName: cm_name,
                    cd_desc: cd_desc
                }
                ngProgress.start();
                MasterLists.DeleteMasterList(delete_data, function (data) {
                    if (data.success) {
                        var deletedata = _.where($scope.filterData, { cd_id: Id });
                        _.each(deletedata, function (val) {
                            var index = _.findIndex($scope.filterData, function (filter) { return val.cd_id == filter.cd_id && val.cmd_entity_detail == filter.cmd_entity_detail });
                            if (index > -1) {
                                $scope.filterData.splice(index, 1);
                            }
                            var index = _.findIndex($scope.SubMasterList, function (filter) { return val.cd_id == filter.cd_id && val.cmd_entity_detail == filter.cmd_entity_detail });
                            if (index > -1) {
                                $scope.SubMasterList.splice(index, 1);
                            }
                        })
                        if (cm_name == "Celebrity Role") {
                            var index = _.findIndex($scope.CelebrityRole, function (filter) { return Id == filter.cd_id });
                            if (index > -1) {
                                $scope.CelebrityRole.splice(index, 1);
                            }
                        }
                        createChunks();
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

});
