
var site_base_path = '';
//var site_base_path = 'http://dailymagic.in';

myApp.controller('dashboardCtrl', function ($scope, $http, ngProgress, Icon, _) {
    $scope.base_url = site_base_path;
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#dashboard').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    // Left Grid & HighChart Data 
    function GetStatusFiles(filestatus, files) {
        var NewArray = [];
        var ChartArray = [];
        var total = 0;
        _.each(filestatus, function (status) {
            var DataArray = []
            var data = { count: 0 };
            data = _.find(files, function (file, key) { return file.cm_state == status.cd_id; });
            data = data ?data:{ count: 0};
            total = total + data.count;
            NewArray.push({ cd_id: status.cd_id, cd_name: status.cd_name, count: data.count, Url: '#content-catalog-search/' + status.cd_id + '/0/0' })
            DataArray.push(status.cd_name);
            DataArray.push(data.count);
            ChartArray.push(DataArray);
        })
        $scope.TotalUpload = total;
        var chartdata = { type: 'pie', name: 'Content Status', data: ChartArray };
        var Finaldata = { chartdata: chartdata, FileGridData: NewArray };
        return Finaldata;
    }

    //Get Metadata With Inactive Status
    function MakeFileStatusList(StatusList, Vendors, Metadata) {
        var state1 = 0;
        var state2 = 0;
        var state3 = 0;
        var state4 = 0;
        var state5 = 0;
        var state6 = 0;
        var state7 = 0;

        _.each(Metadata, function (meta) {
            if (meta.cm_state == 5 || meta.cm_state == 7 || meta.cm_state == 6) {
            }
            else {
                //var vendor = _.find(Vendors, function (vndr, key) { return vndr.vd_id == meta.cm_vendor; });
                //if (vendor) {
                //    if (vendor.vd_is_active == 1) {
                //        if (Datewithouttime(vendor.vd_end_on) < Datewithouttime(new Date())) {
                //            meta.cm_state = 6;
                //        }
                //    }
                //    else {
                //        meta.cm_state = 6;
                //    }
                //}
            }
            if (meta.cm_state == 1) {
                state1++;
            }
            else if (meta.cm_state == 2) {
                state2++;
            }
            else if (meta.cm_state == 3) {
                state3++;
            }
            else if (meta.cm_state == 4) {
                state4++;
            }
            else if (meta.cm_state == 5) {
                state5++;
            }
            else if (meta.cm_state == 6) {
                state6++;
            }
            else {
                state7++;
            }
        });
        var NewArray = [];
        NewArray.push({ cm_state: 1, count: state1 });
        NewArray.push({ cm_state: 2, count: state2 });
        NewArray.push({ cm_state: 3, count: state3 });
        NewArray.push({ cm_state: 4, count: state4 });
        NewArray.push({ cm_state: 5, count: state5 });
        NewArray.push({ cm_state: 6, count: state6 });
        NewArray.push({ cm_state: 7, count: state7 });
        return NewArray;
    }

    //Vendor Grid
    function MakeVendorStatusList(ContentType, Vendors, Metadata) {
        //_.each(Metadata, function (meta) {
        //    if (meta.cm_state == 5 || meta.cm_state == 7 || meta.cm_state == 6) {
        //    }
        //    else {
        //        var vendor = _.find(Vendors, function (vndr, key) { return vndr.vd_id == meta.cm_vendor; });
        //        if (vendor) {
        //            if (vendor.vd_is_active == 1) {
        //                if (Datewithouttime(vendor.vd_end_on) < Datewithouttime(new Date())) {
        //                    meta.cm_state = 6;
        //                }
        //            }
        //            else {
        //                meta.cm_state = 6;
        //            }
        //        }
        //    }
        //});
        var DataArray = [];

        _.each(Vendors, function (vendor) {
            var NewArray = [{ Id: vendor.vd_id, Name: vendor.vd_name, Count: 0, IsFirstRow: 1, Url: ''}];
            var cnt = 0;
            _.each(ContentType, function (ctype) {
                var count = (_.where(Metadata, { cm_vendor: vendor.vd_id, parentid: ctype.cd_id, cm_state: 4 })).length;
                cnt = count + cnt;
                NewArray.push({ Name: ctype.cd_name, IsFirstRow: 0, Count: count, Url: '#content-catalog-search/4/' + vendor.vd_id + '/' + ctype.cd_id });
            });
            NewArray.push({ Name: vendor.vd_name, IsFirstRow: 0, Count: cnt, Url: '#content-catalog-search/4/' + vendor.vd_id + '/' + 0 });
            DataArray.push({ Data: NewArray });
        });

        var NewArray = [{ Id: 0, Name: "Total", Count: 0, IsFirstRow: 1, Url: ''}];
        var cnt = 0;

        _.each(ContentType, function (ctype) {
            var count = (_.where(Metadata, { parentid: ctype.cd_id, cm_state: 4 })).length;
            cnt = count + cnt;
            NewArray.push({ Name: ctype.cd_name, IsFirstRow: 0, Count: count, Url: '#content-catalog-search/4/' + 0 + '/' + ctype.cd_id });
        });

        NewArray.push({ Name: 'Total', IsFirstRow: 0, Count: cnt, Url: '#content-catalog-search/4/' + 0 + '/' + 0 });
        DataArray.push({ Data: NewArray });

        return DataArray;
    }

    Icon.GetDashBoardData(function (dashboard) {
        $scope.FileNames = [];
        $scope.FilesStatus = [];
        _.each(dashboard.FileStatus, function (status) {
            if (status.cd_cm_id == 1) {
                $scope.FilesStatus.push(status);
            }
            else if (status.cd_cm_id == 2) {
                $scope.FileNames.push(status);
            }
        })
        $scope.Vendors = dashboard.Vendors;
        console.log($scope.Vendors)
        $scope.StatusFiles = MakeFileStatusList($scope.FilesStatus, $scope.Vendors, dashboard.VendorFiles);
        $scope.VendorGridData = MakeVendorStatusList($scope.FileNames, $scope.Vendors, dashboard.VendorFiles);
        var data = GetStatusFiles($scope.FilesStatus, $scope.StatusFiles);
        $scope.FileGridData = data.FileGridData;
        HighchartBind(data.chartdata);
    }, function (error) {
        toastr.error(error);
    });

});