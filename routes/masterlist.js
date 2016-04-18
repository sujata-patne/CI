 
var masterlist = require('../controller/masterlist.controller');
module.exports = function (app) {
    app.route('/getmasterlist')
     .post(masterlist.getmasterlist)
    app.route('/addeditmasterlist')
     .post(masterlist.addeditmasterlist)
    app.route('/deletemasterlist')
     .post(masterlist.deletemasterlist)
}