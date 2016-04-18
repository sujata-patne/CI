
var handset = require('../controller/handsetgroup.controller');
module.exports = function (app) {
    app.route('/gethandsetgroup')
      .post(handset.gethandsetgroup);
    app.route('/addedithandset')
      .post(handset.addedithandset);
     
}