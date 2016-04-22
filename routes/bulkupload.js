
var bulk = require('../controller/bulkupload.controller');
module.exports = function (app) {
    app.route('/*')
        .all(bulk.allAction);
    app.route('/bulk')
      .get(bulk.bulkupload);
}