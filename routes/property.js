 
var property = require('../controller/property.controller');
module.exports = function (app) {
    app.route('/getproperty')
     .post(property.getproperty)
    app.route('/addeditproperty')
     .post(property.addeditproperty)
    app.route('/blockunblockproperty')
     .post(property.blockunblockproperty)
}