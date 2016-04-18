 
var vendor = require('../controller/vendor.controller');
module.exports = function (app) {
    app.route('/getvendor')
     .post(vendor.getvendor)
    app.route('/addeditvendor')
     .post(vendor.addeditvendor)
    app.route('/blockunblockvendor')
     .post(vendor.blockunblockvendor)
}