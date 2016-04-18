
var mysql = require('../config/db').pool;
var async = require("async");
var _ = require("underscore");
var wlogger = require("../config/logger");

exports.getadminlog = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        AdminLogs: function (callback) {
                            var query = connection_ikon_cms.query('SELECT * FROM icn_admin_log_detail Order By ald_id desc', function (err, AdminLogs) {
                                callback(err, AdminLogs);
                            });
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        }
                    }, function (err, results) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action: 'getadminlog',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var info = {
                                userName: req.session.UserName,
                                action: 'getadminlog',
                                responseCode: 200,
                                message: "Vcode imported for operator :" + req.body.operator
                            }
                            wlogger.info(info); // for information
                            connection_ikon_cms.release();
                            res.send(results);
                        }
                    });
                });
            }
        } else {
            var error = {
                userName: "Unknown User",
                action : 'getadminlog',
                responseCode: 500,
                message: "Invalid username"
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'getadminlog',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
