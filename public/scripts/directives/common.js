/**
 * Created by sujata.halwai on 16-05-2016.
 */

myApp.directive('loadingSpinner',function(){
    return {
        restrict:'EA',
        templateUrl: '../../partials/views/loading.html'
    }
});

myApp.directive('dynamicModel', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function (scope, elem) {
            var name = $parse(elem.attr('dynamic-model'))(scope);
            elem.removeAttr('dynamic-model');
            elem.attr('data-ng-model', "replaceSupportingFile" + name);
            elem.attr('id', "replaceSupportingFile" + name);
            $compile(elem)(scope);
        }
    };
}]);

myApp.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            return false;
        });
    };
});