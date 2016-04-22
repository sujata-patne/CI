
var daily = require('../controller/dailyactivity.controller');
module.exports = function (app) {
    app.route('/*')
        .all(daily.allAction);
    app.route('/dailyactivity')
     .get(daily.dailyactivity)
}
