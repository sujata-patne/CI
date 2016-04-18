
var daily = require('../controller/dailyactivity.controller');
module.exports = function (app) {
    app.route('/dailyactivity')
     .get(daily.dailyactivity)
}
