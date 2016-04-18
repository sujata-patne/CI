/**
* Created by sujata.patne on 14-07-2015.
*/
myApp.service('Icon', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';

    service.GetDashBoardData = function (success, error) {
        $http.get(service.baseRestUrl + '/getdashboarddata').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    service.GetEncode = function (data) {
        var hashids = new Hashids("content ingestion", 8);
        var id1 = hashids.encode(data);
        return id1;
    }
    service.GetDecode = function (data) {
        var hashids = new Hashids("content ingestion", 8);
        var numbers = hashids.decode(data);
        return numbers[0];
    }
    return service;
} ]);