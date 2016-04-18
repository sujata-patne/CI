
var metadata = require('../controller/metadata.controller');
var bulk = require('../controller/bulkupload.controller');
module.exports = function (app) {
    app.route('/getmetadata')
     .post(metadata.getmetadata);
    app.route('/addeditmetadata')
      .post(metadata.addeditmetadata);
    app.route('/submitmeta')
      .post(metadata.submitmeta);
    app.route('/bulk')
      .get(bulk.bulkupload);
}