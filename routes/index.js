 
var index = require('../controller/index.controller');

module.exports = function (app) {
    app.route('/*')
        .all(index.allAction);
    app.route('/')
        .get(index.pages);
    app.route('/accountlogin')
        .get(index.login)
        .post(index.authenticate);
    app.route('/logout')
        .get(index.logout)
    app.route('/accountforgot')
        .get(index.viewForgotPassword)
        .post(index.forgotPassword);
    app.route('/changepassword')
        .post(index.changePassword);
    app.route('/getdashboarddata')
       .get(index.getdashboarddata);
    app.route('/getSitePath')
        .get(index.getSitePath);
}