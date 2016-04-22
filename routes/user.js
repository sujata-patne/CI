 
var user = require('../controller/user.controller');

module.exports = function (app) {
    app.route('/*')
        .all(user.allAction);
    app.route('/getuser')
      .post(user.getuserdata)
    app.route('/addedituser')
      .post(user.addedituser)
    app.route('/blockunblockuser')
      .post(user.blockunblockuser);
}