/**
* Created by sujata.patne on 14-07-2015.
*/
/**
 * @memberof myApp
 * @type {Service|angular.Service}
 * The `Icon` service provides functionality like GetDashBoardData, GetEncode, GetDecode for Icon List.
 * @param {$http} $http dependency.
 */
myApp.service('Icon', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    /**
     * @desc Get Dashboard Data for Chart and Grid
     * @param success
     * @param error
     * @constructor
     */
    service.GetDashBoardData = function (success, error) {
        $http.get(service.baseRestUrl + '/getdashboarddata').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    /**
     * @desc Get Hashid from Content Matadata id
     * @param data
     * @constructor
     */
    service.GetEncode = function (data) {
        var hashids = new Hashids("content ingestion", 8);
        var id1 = hashids.encode(data);
        return id1;
    }
    /**
     * @desc Get Content Matadata id from Hashid
     * @param data
     * @constructor
     */
    service.GetDecode = function (data) {
        var hashids = new Hashids("content ingestion", 8);
        var numbers = hashids.decode(data);
        return numbers[0];
    }
    return service;
} ]);