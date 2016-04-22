 
var adminlog = require('../controller/adminlog.controller');
module.exports = function (app) {
    app.route('/*')
        .all(adminlog.allAction);
    app.route('/getadminlog')
     .post(adminlog.getadminlog)
}