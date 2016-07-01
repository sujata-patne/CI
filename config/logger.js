/**
 * Created by sujata.patne on 05-04-2016.
 */
var config = require('../config')();
var common = require('../helpers/common');
var winston = require( 'winston' ),
    fs = require( 'fs' ),
    logDir = config.log_path, // Or read from a configuration
    //logDir = '../../IconLogs/ContentIngestion/', // Or read from a configuration
    env = process.env.NODE_ENV || 'development',
    logger;
 
winston.setLevels( winston.config.npm.levels );
winston.addColors( winston.config.npm.colors );

var twoDigit = '2-digit';
var filename = logDir + 'logs_'+common.Pad("0",parseInt(new Date().getDate()), 2)+'_'+common.Pad("0",parseInt(new Date().getMonth() + 1), 2)+'_'+new Date().getFullYear()+'.log';
var options = {
    day: twoDigit,
    month: twoDigit,
    year: 'numeric',
    hour: twoDigit,
    minute: twoDigit,
    second: twoDigit
};

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
            timestamp:common.formatter,
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
            timestamp:common.formatter,
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
            timestamp:common.formatter,
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
    },
    logDate: common.Pad("0",parseInt(new Date().getDate()), 2)+'_'+common.Pad("0",parseInt(new Date().getMonth() + 1), 2)+'_'+new Date().getFullYear()
};

module.exports = wlogger;