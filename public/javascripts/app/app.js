var myApp = angular.module('myApp', ['ngRoute', 'angularFileUpload', 'ngProgress','ui.bootstrap']);

myApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider

        .when("/", {
            templateUrl: "partials/dashboard.html",
            controller: "dashboardCtrl"
        })
        .when("/wallpaper", {
            templateUrl: "partials/wallpaper.html",
            controller: "wallpaperCtrl"
        })
        .when("/editwallpaper/:id", {
            templateUrl: "partials/editwallpaper.html",
            controller: "editwallpaperCtrl"
        })
        .when("/video", {
            templateUrl: "partials/video.html",
            controller: "videoCtrl"
        })
        .when("/editvideo/:id", {
            templateUrl: "partials/editvideo.html",
            controller: "editvideoCtrl"
        })
        .when("/audio", {
            templateUrl: "partials/audio.html",
            controller: "audioCtrl"
        })
        .when("/editaudio/:id", {
            templateUrl: "partials/editaudio.html",
            controller: "editaudioCtrl"
        })
        .when("/apps-games", {
            templateUrl: "partials/apps-games.html",
            controller: "apps-gamesCtrl"
        })
        .when("/editapps-games/:id", {
            templateUrl: "partials/editapps-games.html",
            controller: "editapps-gamesCtrl"
        })
        .when("/add-content-files", {
            templateUrl: "partials/add-content-files.html",
            controller: "add-content-filesCtrl"
        })
        .when("/masterlist-add", {
            templateUrl: "partials/masterlist-add.html",
            controller: "masterlist-addCtrl"
        })
        .when("/masterlist-edit/:id", {
            templateUrl: "partials/masterlist-edit.html",
            controller: "masterlist-editCtrl"
        })
        .when("/master-list", {
            templateUrl: "partials/master-list.html",
            controller: "master-listCtrl"
        })
        .when("/content-catalog", {
            templateUrl: "partials/content-catalog.html",
            controller: "content-catalogCtrl"
        })
        .when("/content-catalog-search/:status/:vendor/:type", {
            templateUrl: "partials/content-catalog-search.html",
            controller: "content-catalog-search-Ctrl"
        })
        .when("/property-content-list/:id", {
            templateUrl: "partials/property-content-list.html",
            controller: "property-content-list-Ctrl"
        })
        .when("/add-edit", {
            templateUrl: "partials/add-edit-users.html",
            controller: "add-editCtrl"
        })
        .when("/edituser/:id", {
            templateUrl: "partials/edituser.html",
            controller: "edit-userCtrl"
        })
        .when("/add-vendor", {
            templateUrl: "partials/add-vendor.html",
            controller: "add-vendorCtrl"
        })
        .when("/edit-vendor/:id", {
            templateUrl: "partials/edit-vendor.html",
            controller: "edit-vendorCtrl"
        })
        .when("/add-property", {
            templateUrl: "partials/add-property.html",
            controller: "add-propertyCtrl"
        })
        .when("/edit-property/:id", {
            templateUrl: "partials/edit-property.html",
            controller: "edit-propertyCtrl"
        })
        .when("/vendor-list", {
            templateUrl: "partials/vendor-list.html",
            controller: "vendor-listCtrl"
        })
        .when("/property-list", {
            templateUrl: "partials/property-list.html",
            controller: "property-listCtrl"
        })
        .when("/vendor-property-list/:id", {
            templateUrl: "partials/vendor-property-list.html",
            controller: "vendor-property-list-Ctrl"
        })
        //.when("/content-catalog-listing", {
        //    templateUrl: "partials/content-catalog-listing.html",
        //    controller: "content-catalog-listingCtrl"
        //})
        .when("/content-catalog-listing/:id", {
            templateUrl: "partials/content-catalog-listing.html",
            controller: "content-catalog-listingCtrl"
        })
          .when("/change-password", {
              templateUrl: "partials/account-changepassword.html",
              controller: "change-passwordCtrl"
          })
           .when("/admin-log", {
               templateUrl: "partials/admin-log.html",
               controller: "admin-logCtrl"
           })
        // .otherwise({ redirectTo: "/" });
    }
  ]);
