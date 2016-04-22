
myApp.controller('usersCtrl', function ($scope, $http, ngProgress, $timeout, Users, $state, $stateParams, $window, _, Excel) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#addedituser').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;
    $scope.UserId = "";
    $scope.OldVendors = [];
    $scope.currentPage = 0;
    $scope.pageSize = 50;



    function GetVendors(UserId, Vendors) {
        var vdname = "";
        var vdids = [];
        var Vendors = _.where(Vendors, { vu_ld_id: UserId });
        _.each(Vendors, function (vendor) {
            vdname += vendor.vd_name + " ,";
            vdids.push(vendor.vd_id);
        });
        if (vdname != "") {
            vdname = vdname.substring(0, vdname.length - 1);
            return { vdname: vdname, vdid: vdids };
        }
        else {
            return { vdname: "", vdid: [] };
        }
    }

    function GetUsers(UserData, UserVendors) {
        var Users = [];
        _.each(UserData, function (user) {
            var vendordata = GetVendors(user.ld_id, UserVendors);
            Users.push({ ld_active: user.ld_active, ld_display_name: user.ld_display_name, ld_email_id: user.ld_email_id, ld_id: user.ld_id, ld_mobile_no: user.ld_mobile_no, ld_role: user.ld_role, ld_user_name: user.ld_user_name, Vendors: vendordata.vdname.toString(), VendorId: vendordata.vdid });
        });
        return Users;
    }

    function GetDeleteVendors(Oldvendors, SelectedVendors) {
        var DeleteArray = [];
        _.each(Oldvendors, function (oldvendor) {
            data = _.find(SelectedVendors, function (selected, key) { return selected == oldvendor.vu_vd_id; });
            if (!data) {
                DeleteArray.push(oldvendor.vu_vd_id);
            }
        });
        return DeleteArray;
    }

    function GetAddVendors(Oldvendors, SelectedVendors) {
        var AddArray = [];
        _.each(SelectedVendors, function (selected) {
            data = _.find(Oldvendors, function (oldvendor, key) { return selected == oldvendor.vu_vd_id; });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    Users.getUsers({ Id: $stateParams.id, state: $scope.CurrentPage }, function (users) {
        if (users.RoleUser === "Super Admin") {
            $scope.UserRole = angular.copy(users.UserRole);
            $scope.Vendor = angular.copy(users.VendorList);
            $scope.Users = angular.copy(users.Users);
            $scope.UserVendors = angular.copy(users.UserVendors);
            $scope.UserList = [];
            _.each($scope.Users, function (user) {
                var vendordata = GetVendors(user.ld_id, $scope.UserVendors);
                $scope.UserList.push({ ld_title: user.ld_active == 1 ? 'Block' : 'Un Block', ld_class: user.ld_active == 1 ? 'green' : 'red', ld_active: user.ld_active, ld_display_name: user.ld_display_name, ld_email_id: user.ld_email_id, ld_id: user.ld_id, ld_mobile_no: user.ld_mobile_no, ld_role: user.ld_role, ld_user_name: user.ld_user_name, Vendors: vendordata.vdname.toString(), VendorId: vendordata.vdid });
            });
            if ($scope.CurrentPage === "edituser") {
                $scope.OldVendors = $scope.UserVendors;
                $scope.UserList.forEach(function (user) {
                    $scope.FullName = user.ld_display_name;
                    $scope.UserName = user.ld_user_name;
                    $scope.EmailId = user.ld_email_id;
                    $scope.MobileNo = user.ld_mobile_no;
                    $scope.SelectedUserRole = user.ld_role;
                    $scope.UserId = user.ld_id;
                    $scope.SelectedVendorList = user.VendorId;
                });
            }
        }
        else {
            location.href = "/";
        }
    }, function (error) {
        toastr.error(error);
    });

    $scope.ExportExcel = function () {
        if ($scope.UserList.length > 0) {
            var array = [];
            _.each($scope.UserList, function (val) {
                array.push({ 'FullName': val.ld_display_name, 'UserName': val.ld_user_name, Role: val.ld_role, Vendors: val.Vendors });
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': 'Users' }, function (data) {
                //var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                var blob = new Blob([data], {type:"application/octet-stream"});
                window.saveAs(blob, 'Users.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }

    $scope.BackToList = function () {
        $window.location.href = "#user";
    }

    $scope.BlockUnBlockUser = function (Id, Status, classtext) {
        bootbox.confirm("Are you sure want to " + Status + " this user?", function (result) {
            if (result) {
                ngProgress.start();
                var user = {
                    ld_Id: Id,
                    active: Status == "Block" ? 0 : 1
                }
                Users.BlockUnBlockUser(user, function (data) {
                    if (data.success) {
                        user = _.find($scope.UserList, function (user, key) { return Id == user.ld_id; });
                        if (user) {
                            user.ld_title = (Status == "Block" ? "Un Block" : "Block");
                            user.ld_class = (classtext == "red" ? "green" : "red");
                            user.ld_active = (Status == "Block" ? 0 : 1);
                        }
                        toastr.success(data.message)
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

    $scope.resetform = function () {
        $scope.userform.$setPristine();
    }

    $scope.SaveUserDetails = function (isValid) {

        if (isValid) {
            if (parseInt($scope.MobileNo).toString().length == 10) {
                ngProgress.start();
                var user = {
                    state: $scope.CurrentPage,
                    ld_Id: $scope.UserId,
                    UserId: $stateParams.id,
                    FullName: $scope.FullName,
                    UserName: $scope.UserName,
                    EmailId: $scope.EmailId,
                    MobileNo: $scope.MobileNo,
                    Role: $scope.SelectedUserRole,
                    AddVendor: GetAddVendors($scope.OldVendors, $scope.SelectedVendorList),
                    DeleteVendor: GetDeleteVendors($scope.OldVendors, $scope.SelectedVendorList)
                }
                Users.AddEditUsers(user, function (data) {
                    if (data.success) {
                        if ($scope.CurrentPage == "edituser") {
                            $window.location.href = "#user";
                        }
                        else {
                            $scope.FullName = '';
                            $scope.UserName = '';
                            $scope.EmailId = '';
                            $scope.MobileNo = '';
                            $scope.SelectedUserRole = '';
                            $scope.UserId = '';
                            $scope.SelectedVendorList = [];
                            $scope.userform.$setPristine();
                            var vendordata = GetVendors(data.user.ld_id, data.UserVendors);
                            $scope.UserList.push({ ld_active: data.user.ld_active, ld_display_name: data.user.ld_display_name, ld_email_id: data.user.ld_email_id, ld_id: data.user.ld_id, ld_mobile_no: data.user.ld_mobile_no, ld_role: data.user.ld_role, ld_user_name: data.user.ld_user_name, Vendors: vendordata.vdname.toString(), VendorId: vendordata.vdid });
                        }
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
                toastr.error("Invalid Mobile Number.");
            }

        }
    }
});

myApp.controller('ChangerPasswordCtrl', function ($scope, $http, ngProgress, $timeout, Users, $state, $stateParams) {
    $scope.base_url = site_base_path;
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#changepassword').addClass('active');
    $scope.passwordtype = "password";
    $scope.newpasswordtype = "password";
    $scope.confirmpasswordtype = "password";
    $scope.OldPassword = "";
    $scope.NewPassword = "";
    $scope.ConfirmPassword = "";

    ngProgress.color('yellowgreen');
    ngProgress.height('3px');

    $scope.SaveChangedPassword = function (isValid) {
        if (isValid) {
            if ($scope.NewPassword == $scope.ConfirmPassword) {
                ngProgress.start();
                var datas = {
                    "oldpassword": $scope.OldPassword,
                    "newpassword": $scope.NewPassword
                };
                Users.changePassword(datas, function (data) {
                    ngProgress.complete();
                    if (data.success) {
                        // $scope.OldPassword = "";
                        // $scope.NewPassword = "";
                        // $scope.ConfirmPassword = "";
                        toastr.success(data.message);
						setTimeout(function(){
                        window.location.href = 'logout'; 
                    }, 1000 );
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
                toastr.error("Confirm Password does not match.");
            }
        }
    };

    $scope.Resetclick = function () {
        $scope.successvisible = false;
        $scope.errorvisible = false;
    };

    $scope.Passwordvisible = function (val) {
        if (val == 1) {
            $scope.passwordtype = $scope.passwordtype == "password" ? "text" : "password";
        }
        else if (val == 2) {
            $scope.newpasswordtype = $scope.passwordtype == "password" ? "text" : "password";
        }
        else {
            $scope.confirmpasswordtype = $scope.passwordtype == "password" ? "text" : "password";
        }
    }
});

myApp.filter('startFrom', function () {
    return function (input, start) {
        if (!input || !input.length) { return; }
        start = +start; //parse to int
        return input.slice(start);
    }
});

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);

}