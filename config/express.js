/**
 * Created by sujata.patne on 7/7/2015.
 */
var express         = require('express'),
    path            = require('path'),
    favicon         = require('serve-favicon'),
    logger          = require('morgan'),
    bodyParser      = require('body-parser'),
    methodOverride  = require('method-override'),
    cookieParser    = require('cookie-parser'),
    session         = require('cookie-session');
//console.log(path.join(__dirname, 'public'))

module.exports = function(){
    var app = express();
    // view engine setup
    app.set('views', path.join('./views'));
    app.set('view engine', 'ejs');
    app.use(logger('dev'));
    app.use(bodyParser.json({limit: '1gb'}));
    app.use(bodyParser.urlencoded({extended:false,limit: '1gb'}));
    app.use(methodOverride('_method'));
    app.use(cookieParser());
// parse static files in public derictory
    app.use(express.static(path.join(__dirname,'../public/')));
    app.use(session({
        keys: ['key1', 'key2', 'key3']
    }));
 
    // error handlers
// development error handler will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

// production error handler, no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
	/*process.on('uncaughtException', function (err) {
        console.error(err);
        console.log("Node NOT Exiting...");
    });*/
    return app;
}
