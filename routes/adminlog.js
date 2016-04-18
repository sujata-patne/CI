 
var adminlog = require('../controller/adminlog.controller');
module.exports = function (app) {
    app.route('/getadminlog')
     .post(adminlog.getadminlog)
}