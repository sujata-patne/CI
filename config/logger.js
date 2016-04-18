/**
 * Created by sujata.patne on 05-04-2016.
 */
var winston = require( 'winston' ),
    fs = require( 'fs' ),
    logDir = 'logs/', // Or read from a configuration
    //logDir = '../../IconLogs/ContentIngestion/', // Or read from a configuration
    env = process.env.NODE_ENV || 'development',
    logger;


winston.setLevels( winston.config.npm.levels );
winston.addColors( winston.config.npm.colors );

var twoDigit = '2-digit';
var filename = logDir + 'logs_'+Pad("0",parseInt(new Date().getDate()), 2)+'_'+Pad("0",parseInt(new Date().getMonth() + 1), 2)+'_'+new Date().getFullYear()+'.log';
var options = {
    day: twoDigit,
    month: twoDigit,
    year: 'numeric',
    hour: twoDigit,
    minute: twoDigit,
    second: twoDigit
};

function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}
function getDate(val) {
    if (val) {
        var d = new Date(val);
        //var d = moment(new Date(val), "Asia/Kolkata").format("YYYY-MM-DD");
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = Pad("0", dt, 2)+ '-' + Pad("0", month, 2) + '-' + year  ;
        return selectdate;
    }
    else {
        var d = new Date();
        //var d = moment(curDate, "Asia/Kolkata");
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = Pad("0", dt, 2)+ '-' + Pad("0", month, 2) + '-' + year  ;
        return selectdate;
    }
}

function getTime(val) {
    var d = new Date(val);
    //var d = moment(new Date(val), "Asia/Kolkata");
    var minite = d.getMinutes();
    var hour = d.getHours();
    var second = d.getSeconds();
    var selectdate = Pad("0", hour, 2) + ':' + Pad("0", minite, 2) + ':' + Pad("0", second, 2);
    return selectdate;
}

function formatter(args) {

    var d = new Date();
    var date = getDate(d);
    var time = getTime(d);
    var logMessage = date +" "+ time ;
    return logMessage;
}

if ( !fs.existsSync( logDir ) ) {
    // Create the directory if it does not exist
    fs.mkdirSync( logDir );
}

var debug = new winston.Logger({
    levels: {
        debug: 0
    },
    transports: [
        new (winston.transports.File)({
            timestamp:formatter,
            level: env === 'development' || env === 'production'  ? 'debug' : 'info',
            filename: filename,
            maxsize: 1024 * 1024 * 10
        }),
        new (winston.transports.Console)({level: 'debug'})
    ]
});

var info = new winston.Logger({
    levels: {
        info: 1
    },
    transports: [
        new (winston.transports.File)({
            level: env === 'development' || env === 'production'  ? 'info' : 'debug',
            filename: filename,
            timestamp:formatter,
            maxsize: 1024 * 1024 * 10
        }),
        new (winston.transports.Console)({level: 'info'})
    ]
});

var error = new winston.Logger({
    levels: {
        error: 3
    },
    transports: [
        new (winston.transports.File)({
            level: env === 'development' || env === 'production'  ? 'error' : 'debug',
            filename: filename,
            timestamp:formatter,
            maxsize: 1024 * 1024 * 10
        }),
        new (winston.transports.Console)({level: 'error'})
    ]
});

var wlogger = {
    debug: function(msg){
        debug.debug(msg);
    },
    info: function(msg){
        info.info(msg);
    },
    error: function(msg){
        error.error(msg);
    },
    log: function(level,msg){
        var lvl = wlogger[level];
        lvl(msg);
    }
};

module.exports = wlogger;
