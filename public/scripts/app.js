var myApp = angular.module('myApp', ['ui.router', 'ngProgress', 'ui.bootstrap', 'underscore', 'ngFileUpload','ngFileSaver']);
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-top-center",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}
myApp.config(function ($stateProvider,$httpProvider) {
    $stateProvider
    .state("dashboard", {
         templateUrl: 'partials/dashboard.html',
         controller: 'dashboardCtrl',
         url: '/'
    })
    .state("addedituser", {
         templateUrl: 'partials/user.html',
         controller: 'usersCtrl',
         url: '/user'
    })
    .state("edituser", {
         templateUrl: 'partials/edituser.html',
         controller: 'usersCtrl',
         url: '/edituser/:id'
    })
    .state("vendor", {
         templateUrl: 'partials/vendor-list.html',
         controller: 'vendorCtrl',
         url: '/vendor-list'
    })
    .state("addvendor", {
         templateUrl: 'partials/vendor.html',
         controller: 'vendorCtrl',
         url: '/add-vendor'
    })
    .state("editvendor", {
         templateUrl: 'partials/vendor.html',
         controller: 'vendorCtrl',
         url: '/edit-vendor/:id'
    })
    .state("vendorproperty", {
         templateUrl: 'partials/property-list.html',
         controller: 'propertyCtrl',
         url: '/vendor-property-list/:id'
    })
    .state("property", {
         templateUrl: 'partials/property-list.html',
         controller: 'propertyCtrl',
         url: '/property-list'
    })
    .state("addproperty", {
         templateUrl: 'partials/property.html',
         controller: 'propertyCtrl',
         url: '/add-property'
    })
    .state("editproperty", {
         templateUrl: 'partials/property.html',
         controller: 'propertyCtrl',
         url: '/edit-property/:id'
    })
    .state("propertycontent", {
         templateUrl: 'partials/content-catalog.html',
         controller: 'content-catalogCtrl',
         url: '/property-content-list/:id'
    })
    .state("contentcatalog", {
         templateUrl: 'partials/content-catalog.html',
         controller: 'content-catalogCtrl',
         url: '/content-catalog'
    })
    .state("contentsearch", {
         templateUrl: 'partials/content-catalog.html',
         controller: 'content-catalogCtrl',
         url: '/content-catalog-search/:status/:vendor/:type'
    })
    .state("contentlisting", {
         templateUrl: 'partials/content-catalog-listing.html',
         controller: 'content-listingCtrl',
         url: '/content-catalog-listing/:id'
    })
    .state("propertyfiles", {
         templateUrl: 'partials/property-files-listing.html',
         controller: 'content-listingCtrl',
         url: '/property-files-listing/:id/:isProperty'
    })
    .state("masterlist", {
         templateUrl: 'partials/master-list.html',
         controller: 'masterListCtrl',
         url: '/master-list'
    })
    .state("addmasterlist", {
         templateUrl: 'partials/masterlist-form.html',
         controller: 'masterListCtrl',
         url: '/masterlist-add'
    })
    .state("editmasterlist", {
         templateUrl: 'partials/masterlist-form.html',
         controller: 'masterListCtrl',
         url: '/masterlist-edit/:id'
    })
    .state("addwallpaper", {
         templateUrl: 'partials/wallpaper.html',
         controller: 'metadataCtrl',
         url: '/imagery'
    })
    .state("editwallpaper", {
         templateUrl: 'partials/wallpaper.html',
         controller: 'metadataCtrl',
         url: '/editimagery/:id'
    })
    .state("addvideo", {
         templateUrl: 'partials/video.html',
         controller: 'metadataCtrl',
         url: '/video'
    })
    .state("editvideo", {
         templateUrl: 'partials/video.html',
         controller: 'metadataCtrl',
         url: '/editvideo/:id'
    })
    .state("addaudio", {
         templateUrl: 'partials/audio.html',
         controller: 'metadataCtrl',
         url: '/audio'
    })
    .state("editaudio", {
         templateUrl: 'partials/audio.html',
         controller: 'metadataCtrl',
         url: '/editaudio/:id'
    })
    .state("addgame", {
         templateUrl: 'partials/apps-games.html',
         controller: 'metadataCtrl',
         url: '/appsgames'
    })
    .state("editgame", {
         templateUrl: 'partials/apps-games.html',
         controller: 'metadataCtrl',
         url: '/editapps-games/:id'
    })
    .state("addtext", {
         templateUrl: 'partials/text.html',
         controller: 'metadataCtrl',
         url: '/text'
    })
    .state("edittext", {
         templateUrl: 'partials/text.html',
         controller: 'metadataCtrl',
         url: '/edittext/:id'
    })
    .state("submitmeta", {
         templateUrl: 'partials/submitmeta.html',
         controller: 'submitmetaCtrl',
         url: '/submitmeta/:status/:contenttype/:id/:mode'
    })
    .state("addcontentfile", {
         templateUrl: 'partials/add-content-files.html',
         controller: 'content-filesCtrl',
         url: '/add-content-files'
    })
    .state("handsetgroup", {
        templateUrl: 'partials/handsetgroup.html',
        controller: 'handsetGroupCtrl',
        url: '/handsetgroup'
    })
    .state("changepassword", {
         templateUrl: 'partials/account-changepassword.html',
         controller: 'ChangerPasswordCtrl',
         url: '/change-password'
    })
    .state("adminlog", {
         templateUrl: "partials/admin-log.html",
         controller: "adminLogCtrl",
         url: "/admin-log"
    })

    /*.state('contentlisting.thumb', {
        templateUrl: 'partials/content-file-list.html'
    })
    .state('contentlisting.thumb', {
        templateUrl: 'partials/content-file-list.html'
    })
    .state('contentlisting.content', {
        templateUrl: 'partials/content-file-list.html'
    })
    .state('contentlisting.image', {
        templateUrl: 'partials/content-file-list.html'
    })
    .state('contentlisting.audio', {
        templateUrl: 'partials/content-file-list.html'
    })
    .state('contentlisting.video', {
        templateUrl: 'partials/content-file-list.html'
    })*/
}).run(function ($state,$http,$rootScope) {
        $state.go("dashboard");
        $http.get("/getSitePath").success(function (configData) {
            $rootScope.base_url = configData.site_path;
        })
    })
	
myApp.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
			 return false;
        });
    };
});


myApp.filter('filterWithOr', function ($filter) {
    var comparator = function (actual, expected) {
        if (angular.isUndefined(actual)) {
            // No substring matching against `undefined`
            return false;
        }
        if ((actual === null) || (expected === null)) {
            // No substring matching against `null`; only match against `null`
            return actual === expected;
        }
        if ((angular.isObject(expected) && !angular.isArray(expected)) || (angular.isObject(actual) && !hasCustomToString(actual))) {
            // Should not compare primitives against objects, unless they have custom `toString` method
            return false;
        }

        actual = angular.lowercase('' + actual);
        if (angular.isArray(expected)) {
            var match = false;
            expected.forEach(function (e) {
                e = angular.lowercase('' + e);
                if (actual.indexOf(e) !== -1) {
                    match = true;
                }
            });
            return match;
        } else {
            expected = angular.lowercase('' + expected);
            return actual.indexOf(expected) !== -1;
        }
    };
    return function (campaigns, filters) {
        return $filter('filter')(campaigns, filters, comparator);
    };
});
