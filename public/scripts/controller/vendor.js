/**
 * @memberof myApp
 * @type {controller|angular.Controller}
 * @desc Vendor List Controller
 */
myApp.controller('vendorCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, Vendors, _, Excel) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#managevendor').addClass('active');
    $scope.CurrentPage = $state.current.name;
    $scope.CurrentPage == "addvendor" ? $('#addvendor').addClass('active') : '';
    $scope.CurrentPage == "vendor" ? $('#vendorlist').addClass('active') : '';
    $scope.PageTitle = $state.current.name == "editvendor" ? "Edit" : "Add";
    $scope.IsDisable = $scope.CurrentPage == "addvendor" ? false : true;
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.Checked = true;
    $scope.currentPage = 0;
    $scope.pageSize = 50;
    $scope.open1 = false;
    $scope.open2 = false;
    //  ngProgress.start();
    $scope.uploading = true;
    /**
     * @desc open datepicker for start date
     * @param evt
     */
    $scope.openDatepicker = function (evt) {
        $scope.open2 = false;
        evt.preventDefault();
        evt.stopPropagation();
        $scope.open1 = !$scope.open1;
    }
    /**
     * @desc open datepicker for end date
     * @param evt1
     */
    $scope.openEndDatepicker = function (evt1) {
        $scope.open1 = false;
        evt1.preventDefault();
        evt1.stopPropagation();
        $scope.open2 = !$scope.open2;
    }
    /**
     * @desc Get Vendor Title
     * @param expirydate
     * @param active
     * @returns {string}
     * @constructor
     */
    function GetTitle(expirydate, active) {
        return active != 1 ? "UnBlock" : (Datewithouttime(expirydate) < Datewithouttime(new Date()) ? "Expired" : "Block");
    }

    /**
     * @desc Get Vendor Status
     * @param expirydate
     * @param active
     * @returns {string}
     * @constructor
     */
    function GetStatus(expirydate, active) {
        return active != 1 ? "Vendor Blocked" : (Datewithouttime(expirydate) < Datewithouttime(new Date()) ? "Vendor Expired" : "Active");
    }

    /**
     * @desc Change Button Color
     * @param expirydate
     * @param active
     * @returns {string}
     * @constructor
     */
    function ButtonColor(expirydate, active) {
        return active != 1 ? "red" : (Datewithouttime(expirydate) < Datewithouttime(new Date()) ? "darkorange" : "green");
    }

    /**
     * @desc Get Vendor Details
     * @param Vendors
     * @returns {*}
     * @constructor
     */
    function GetVendorData(Vendors) {
        _.each(Vendors, function (vendor) {
            vendor.vd_created_on = setDate(vendor.vd_created_on);
            vendor.title = GetTitle(vendor.vd_end_on, vendor.vd_is_active);
            vendor.status = GetStatus(vendor.vd_end_on, vendor.vd_is_active);
            vendor.buttoncolor = ButtonColor(vendor.vd_end_on, vendor.vd_is_active);
        });
        return Vendors;
    }

    /**
     * @desc Export/download vendors list in excel file
     * @constructor
     */
    $scope.ExportExcel = function () {
        if ($scope.vendorlist.length > 0) {
            var array = [];
            _.each($scope.vendorlist, function (val) {
                array.push({ 'VendorTitle': val.vd_name, 'AddedOn': val.vd_created_on, 'Status': val.status });
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': 'Vendors' }, function (data) {
                var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                window.saveAs(blob, 'Vendors.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }
    /**
     * @desc Select Icon Country Group's Country List
     * @param selectedcountry
     * @returns {Array}
     * @constructor
     */
    function CheckGroupSelection(selectedcountry) {
        var country = [];
        var tempcountry1 = [];
        _.each($scope.CountryGroups, function (item) {
            var groupcountry = _.where($scope.IconGroupCountry, { cm_name: item.cd_name });
            var flag = false;
            var tempcountry2 = [];
            _.each(groupcountry, function (item1) {
                var match = _.find(selectedcountry, function (country) { return country == item1.cd_id });

                if (!match) {
                    flag = true;
                }
                else {
                    tempcountry2.push(match);
                }
            });
            if (!flag) {
                country.push(item.cd_id);
                _.each(tempcountry2, function (item1) {
                    tempcountry1.push(item1);
                });
            }
        });
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });

            if (match) {
                if (!_.contains(tempcountry1, item)) {
                    country.push(item);
                }
            }
        });
         country = _.unique(country);

        return country;
    }

    /**
     * @desc Get Selected Country List
     * @param selectedcountry
     * @returns {Array}
     * @constructor
     */
    function GetSelectedCountry(selectedcountry) {
        var country = [];
        var group = [];
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                country.push(item);
            }
            else {
                group.push(item);
            }
        });
        _.each(group, function (item) {
            var match = _.find($scope.CountryGroups, function (country) { return country.cd_id == item });
            if (match) {
                var groupcountry = _.where($scope.IconGroupCountry, { cm_name: match.cd_name });
                _.each(groupcountry, function (item) {
                    country.push(item.cd_id);
                });
            }
        });
        country = _.unique(country);
        return country;
    }

    /**
     * @desc get Vendor details list
     */
    Vendors.GetVendors({ Id: $stateParams.id, state: $scope.CurrentPage }, function (vendordata) {
        //  ngProgress.complete();
        $scope.uploading = false;
        vendordata.UserRole === "Content Manager" ? location.href = "/" : "";
        vendordata.UserRole === "Super Admin" && $scope.CurrentPage == "addvendor" ? location.href = "/" : "";

        $scope.IsEdit = vendordata.UserRole === "Super Admin" ? true : false;
        $scope.vendorlist = GetVendorData(vendordata.VendorList);
        $scope.CountryGroups = _.where(vendordata.IconCountry, { group_status: "group" });
        $scope.IconOnlyCountry = _.where(vendordata.IconCountry, { group_status: null })
        $scope.CountryDistributionRights = vendordata.IconCountry;
        $scope.IconGroupCountry = vendordata.IconGroupCountry;
        $scope.ChannelDistributionRights = _.where(vendordata.MasterRights, { cm_name: "Channel Distribution" });
        $scope.AllowedContentType = _.where(vendordata.MasterRights, { cm_name: "Content Type" })
        var vendorcontent = _.find(vendordata.MasterRights, function (vdr) { return vdr.cm_name == "Vendor" });
        if (vendorcontent) {
            $scope.vendor_content_type = vendorcontent.cd_id;
        }
        if ($scope.CurrentPage == "editvendor") {
            //vendordata.VendorList.length > 0 ? "" : location.href = "/";
            $scope.OldRightsData = (vendordata.SelectedRightsData);
            $scope.SelectedAllowedContentType = _.unique(_.pluck(vendordata.SelectedRightsData, "r_allowed_content_type"));
            var selectedcountry = _.unique(_.pluck(vendordata.SelectedRightsData, "r_country_distribution_rights"));

            var country = CheckGroupSelection(selectedcountry);
            $scope.SelectedCountryDistributionRights = country;
            $scope.SelectedChannelDistributionRights = _.unique(_.pluck(vendordata.SelectedRightsData, "r_channel_distribution_rights"));
            vendordata.VendorList.forEach(function (value) {
                if (value.vd_id == $stateParams.id) {
                    $scope.VendorId = value.vd_id;
                    $scope.Title = value.vd_name;
                    $scope.OldTitle = value.vd_name;
                    $scope.ShortDescription = value.vd_desc;
                    $scope.PersonName = value.vd_display_name;
                    $scope.PersonEmail = value.vd_email_id;
                    $scope.PersonMobileNo = value.vd_mobile_no;
                    $scope.StartDate = value.vd_starts_on;
                    $scope.ExpiryDate = value.vd_end_on;
                    $scope.Checked = value.vp_rights_at_property_level;
                    $scope.vp_r_group_id = value.vp_r_group_id;
                }
            });
        }
        $scope.loading = true;
    },
    function (error) {
        toastr.error(error);
    });
    /**
     * @desc create search query for vendors
     * @param data
     * @constructor
     */
    $scope.SearchVendorclick = function (data) {
        $scope.searchvendorquery = $scope.vendorquery;
    }
    /**
     * @desc reset search form
     */
    $scope.resetform = function () {
        $scope.vendorForm.$setPristine();
    }
    /**
     * @desc Get added Rights List
     * @param OldData
     * @param SelectedData
     * @returns {Array}
     * @constructor
     */
    function GetAddRights(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return selected.AllowedContentType == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.ChannelDistributionRights && old.r_country_distribution_rights == selected.CountryDistributionRights });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    /**
     * @desc Get Deleted Rights List
     * @param OldData
     * @param SelectedData
     * @returns {Array}
     * @constructor
     */
    function GetDeleteRights(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return selected.AllowedContentType == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.ChannelDistributionRights && old.r_country_distribution_rights == selected.CountryDistributionRights });
            if (!data) {
                DeleteArray.push({ r_id: old.r_id, cmd_id: old.cmd_id });
            }
        });
        return DeleteArray;
    }

    /**
     * @desc Block and unblock vendors
     * @param Id
     * @param Status
     * @param classtext
     * @constructor
     */
    $scope.BlockUnBlockVendor = function (Id, Status, classtext) {
        if (Status !== "Expired" && classtext !== "darkorange") {
            bootbox.confirm("Are you sure want to " + Status + " this vendor?", function (result) {
                if (result) {
                    ngProgress.start();
                    var vendor_data = {
                        vd_Id: Id,
                        active: Status == "Block" ? 0 : 1
                    }
                    Vendors.BlockUnBlockVendor(vendor_data, function (data) {
                        if (data.success) {
                            vendor = _.find($scope.vendorlist, function (vdr, key) { return Id == vdr.vd_id; });
                            if (vendor) {
                                vendor.vd_is_active = vendor_data.active;
                                vendor.title = GetTitle(vendor.vd_end_on, vendor.vd_is_active);
                                vendor.status = GetStatus(vendor.vd_end_on, vendor.vd_is_active);
                                vendor.buttoncolor = ButtonColor(vendor.vd_end_on, vendor.vd_is_active);
                            }
                            toastr.success(data.message)
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
            });
        }

    }
    /**
     * @desc Save vendor details
     * @param isValid
     */
    $scope.submitForm = function (isValid) {
        if (isValid) {
            if (parseInt($scope.PersonMobileNo).toString().length == 10) {
                if (Datewithouttime($scope.StartDate) <= Datewithouttime($scope.ExpiryDate)) {
                    var NewRightsData = [];
                    var selectedcountry = GetSelectedCountry($scope.SelectedCountryDistributionRights);
                    _.each($scope.SelectedAllowedContentType, function (content) {
                        _.each(selectedcountry, function (country) {
                            _.each($scope.SelectedChannelDistributionRights, function (channel) {
                                NewRightsData.push({ AllowedContentType: content, CountryDistributionRights: country, ChannelDistributionRights: channel });
                            });
                        });
                    });

                    var vendor = {
                        "state": $scope.CurrentPage,
                        "vd_id": $scope.VendorId,
                        "OldTitle": $scope.OldTitle ? $scope.OldTitle : $scope.Title,
                        "Title": $scope.Title,
                        "Description": $scope.ShortDescription,
                        "PersonName": $scope.PersonName,
                        "PersonEmail": $scope.PersonEmail,
                        "PersonMobileNo": $scope.PersonMobileNo,
                        "AddRightsData": GetAddRights($scope.OldRightsData, NewRightsData),
                        "DeleteRightsData": GetDeleteRights($scope.OldRightsData, NewRightsData),
                        "AllowChange": $scope.Checked,
                        "StartDate": getDate($scope.StartDate),
                        "ExpiryDate": getDate($scope.ExpiryDate),
                        "vp_r_group_id": $scope.vp_r_group_id,
                        "vendor_content_type": $scope.vendor_content_type
                    }
                    ngProgress.start();
                    Vendors.AddEditVendor(vendor, function (data) {
                        if (data.success) {
                            $window.location.href = "#vendor-list";
                            toastr.success(data.message);
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
                    toastr.error("Expire date must be equal or greater than start date.");
                }
            }
            else {
                toastr.error("Invalid Mobile Number.");
            }
        }
    };
});

