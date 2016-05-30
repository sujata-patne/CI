/**
 * Created by sujata.halwai on 16-05-2016.
 */

myApp.directive('loadingSpinner',function(){
    return {
        restrict:'EA',
        template:" <center><span class='center-block' data-ng-hide='loading'><i class='fa fa-3x fa-spinner fa-spin'></i></span></center>"
    }
});