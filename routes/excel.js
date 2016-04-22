
var excel = require('../controller/excel.controller');
module.exports = function (app) {
    app.route('/*')
        .all(excel.allAction);
    app.route('/pdf')
     .get(excel.pdf)
    app.route('/exportexcel')
     .post(excel.exportexcel)
    app.route('/exportVcode')
     .post(excel.exportVcode)
}
