
myApp.controller('adminLogCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, Logs, _, Excel) {
    
    $scope.CurrentPage = $state.current.name;
    $('.removeSubactiveClass').removeClass('active');
    $('.removeActiveClass').removeClass('active');
    $('#adminlog').addClass('active');
    $scope.adminlogcurrentPage = 0;
    $scope.adminlogpageSize = 50;
    $scope.currentPage = 0;
    $scope.pageSize = 50;
    //ngProgress.start();
    $scope.uploading = true;

    function GetAdminLogs(AdminLogs) {
        _.each(AdminLogs, function (log) {
            log.ald_created_on = getDate(log.ald_created_on) + " " + getTime(log.ald_created_on);
            log.ald_modified_on = getDate(log.ald_modified_on) + " " + getTime(log.ald_modified_on);
        });
        return AdminLogs;
    }
// Get admin logs details
    Logs.getAdminLog({ state: $scope.CurrentPage }, function (logs) {
      //  ngProgress.complete();
        $scope.uploading = false;
        logs.UserRole === "Super Admin" ? "" : location.href = "/";
        $scope.AdminLogs = GetAdminLogs(logs.AdminLogs);
        $scope.loading = true;
    },
    function (error) {
        toastr.error(error);
    });

// Export/Download excel for admin log
    $scope.ExportExcel = function () {
        if ($scope.AdminLogs.length > 0) {
            var array = [];
            _.each($scope.AdminLogs, function (val) {
                array.push({ 'LogMessage': val.ald_message, 'Action': val.ald_action, 'CreatedOn': val.ald_created_on, 'CreatedBy': val.ald_created_by, 'ModifiedOn': val.ald_modified_on, 'ModifiedBy': val.ald_modified_by });
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': 'AdminLogs' }, function (data) {
                var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                window.saveAs(blob, 'AdminLogs.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }

});

 