myApp.controller('handsetGroupCtrl', function ($scope, $http, ngProgress, $state, $stateParams, $window, HandSetGroup) {

    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#addcontentfile').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;

    function FilterData() {
        var query = "";
        if ($scope.Selectedbrand) {
            query = '"dc_make" :"' + $scope.Selectedbrand + '"';
        }
        if ($scope.Selectedos) {
            query += (query != "" ? "," : "") + '"dc_OS" :"' + $scope.Selectedos + '"';
        }
        if ($scope.Selectedarchitecture) {
            query += (query != "" ? "," : "") + '"dc_architecture" : "' + $scope.Selectedarchitecture + '"';
        }
        if ($scope.Selectedresow) {
            query += (query != "" ? "," : "") + '"dc_width" : ' + $scope.Selectedresow + '';
        }
        if ($scope.Selectedosversion) {
            query += (query != "" ? "," : "") + '"dc_OS_version" :"' + $scope.Selectedosversion + '"';
        }
        if ($scope.Selectedram) {
            query += (query != "" ? "," : "") + '"dc_RAM" : "' + $scope.Selectedram + '"';
        }
        if ($scope.Selectedresoh) {
            query += (query != "" ? "," : "") + '"dc_height" : ' + $scope.Selectedresoh + '';
        }
        if (query != "") {
            query = "{" + query + "}";
            var obj = JSON.parse(query);
            $scope.FilterDatas = _.where($scope.DeviceModels, obj);
        }
        else {
            $scope.FilterDatas = $scope.DeviceModels;
        }
        //Selectedbrand
        //Selectedos
        //Selectedarchitecture
        //Selectedresow
        //Selectedosversion
        //Selectedram
        //Selectedresoh
    }

    $scope.FilterChange = function () {
        $scope.SelectedCriteriaHandset = [];
        FilterData();
        _.each($scope.FilterDatas, function (handset) {
            var data = _.find($scope.GroupHandset, function (device) { return device.dc_id == handset.dc_id });
            if (!data) {
                $scope.SelectedCriteriaHandset.push(handset);
            }
        });
    }

    function BindPageData(handset) {
        $scope.BrandNames = _.unique(_.pluck(handset.Devices, "dc_make"));
        $scope.OS = _.unique(_.pluck(handset.Devices, "dc_OS"));
        $scope.OSVesions = _.unique(_.pluck(handset.Devices, "dc_OS_version"));
        $scope.Architectures = _.unique(_.pluck(handset.Devices, "dc_architecture"));
        $scope.RAMS = _.unique(_.pluck(handset.Devices, "dc_RAM"));
        $scope.ResoW = _.unique(_.pluck(handset.Devices, "dc_width"));
        $scope.ResoH = _.unique(_.pluck(handset.Devices, "dc_height"));
        $scope.DeviceModels = handset.Devices;
        $scope.HandsetDeviceGroups = handset.HandsetDeviceGroups;
        $scope.HandsetGroups = handset.HandsetGroups;
        $scope.SelectedHandsetGroup = "";
        $scope.AllGroups = handset.HandsetGroups;
        $scope.AllGroups.unshift({ chgr_group_id: -1, chgr_group_name: "Add New Group" });
        $scope.HandsetGroupChange();
    }

    HandSetGroup.getHandSetGroup({ state: $scope.CurrentPage }, function (handset) {
        $scope.PageAllData = handset;
        BindPageData(handset);
    }, function (error) {
        toastr.error(error);
    });

    $scope.resetform = function () {
        BindPageData($scope.PageAllData);
    }
    function GetAddHandset(OldData, TotalData) {
        var AddArray = [];
        _.each(TotalData, function (total) {
            var data = _.find(OldData, function (old) { return old.chg_handset_id == total.dc_id; });
            if (!data) {
                AddArray.push(total);
            }
        })
        return AddArray;
    }

    function GetDeleteHandset(OldData, TotalData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(TotalData, function (total) { return old.chg_handset_id == total.dc_id; });
            if (!data) {
                DeleteArray.push(old);
            }
        })
        return DeleteArray;
    }

    $scope.leftclick = function () {
        _.each($scope.SelectedGroupHandset, function (selected) {
            var index = _.findIndex($scope.GroupHandset, function (cnt) { return cnt.dc_id == selected })
            if (index > -1) {
                var data = _.find($scope.FilterDatas, function (device) { return device.dc_id == selected; });
                if (data) {
                    $scope.SelectedCriteriaHandset.push(data);
                }
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
            var data = _.find($scope.FilterDatas, function (device) { return device.dc_id == selected.dc_id; });
            if (data) {
                $scope.SelectedCriteriaHandset.push(data);
            }
        })
        $scope.GroupHandset = [];
    }
    $scope.rightAllclick = function () {
        _.each($scope.SelectedCriteriaHandset, function (selected) {
            $scope.GroupHandset.push(selected);
        })
        $scope.SelectedCriteriaHandset = [];
    }

    $scope.HandsetGroupChange = function () {
        if (!$scope.SelectedHandsetGroup || $scope.SelectedHandsetGroup == "") {
            $scope.IsDisable = true;
            $scope.handsetname = "";
            $scope.disc = "";
            $scope.GroupHandset = [];
            FilterData();
            $scope.SelectedCriteriaHandset = [];
            _.each($scope.FilterDatas, function (cnt) {
                $scope.SelectedCriteriaHandset.push(cnt);
            });
        }
        else if ($scope.SelectedHandsetGroup == -1) {
            $scope.handsetname = "";
            $scope.disc = "";
            $scope.GroupHandset = [];
            FilterData();
            $scope.SelectedCriteriaHandset = [];
            $scope.OldGroupHandset = [];
            _.each($scope.FilterDatas, function (cnt) {
                $scope.SelectedCriteriaHandset.push(cnt);
            });
            $scope.IsDisable = false;
        }
        else {
            var grouphandset = _.where($scope.HandsetDeviceGroups, { chg_chgr_group_id: $scope.SelectedHandsetGroup });
            $scope.GroupHandset = [];
            $scope.OldGroupHandset = grouphandset;
            var group = _.find($scope.HandsetGroups, function (grp) { return grp.chgr_group_id == $scope.SelectedHandsetGroup });
            if (group) {
                $scope.handsetname = group.chgr_group_name;
                $scope.disc = group.chgr_group_desc;
            }
            _.each(grouphandset, function (handset) {
                var data = _.find($scope.DeviceModels, function (device) { return device.dc_id == handset.chg_handset_id });
                if (data) {
                    $scope.GroupHandset.push(data);
                }
            });
            $scope.FilterChange();
            $scope.IsDisable = false;
        }
    }

    $scope.SubmitForm = function (isValid) {
        if (isValid) {
            if ($scope.GroupHandset) {
                if ($scope.GroupHandset.length > 0) {
                    var handset = {
                        AddHandSet: GetAddHandset($scope.OldGroupHandset, $scope.GroupHandset),
                        DeleteHandSet: GetDeleteHandset($scope.OldGroupHandset, $scope.GroupHandset),
                        groupid: $scope.SelectedHandsetGroup == -1 ? null : $scope.SelectedHandsetGroup,
                        status: $scope.SelectedHandsetGroup == -1 ? "AddGroup" : "UpdateGroup",
                        groupname: $scope.handsetname,
                        disc: $scope.disc
                    }
                    HandSetGroup.addEditHandSet(handset, function (data) {
                        if (data.success) {
                            toastr.success(data.message);
                            $window.location.href = "#add-content-files";
                        }
                        else {
                            toastr.error(data.message);
                        }
                        ngProgress.complete();
                    }, function (err) {
                        toastr.error(err);
                        ngProgress.complete();
                    });
                }
                else {
                    toastr.error("Please add handset in group.");
                }
            }
            else {
                toastr.error("Please add handset in group.");
            }

        }
    }

});