
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var shell = require("shelljs");
var atob = require("atob");
var btoa = require("btoa");
var nodemailer = require('nodemailer');
var _ = require("underscore");
var fs = require("fs");
var wlogger = require("../config/logger");
var reload = require('require-reload')(require);
var config = require('../config')();
function getDate() {
    var d = new Date();
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
    return selectdate;
}
function getTime(val) {
    var d = new Date(val);
    var minite = d.getMinutes();
    var hour = d.getHours();
    var second = d.getSeconds();
    var selectdate = Pad("0", hour, 2) + ':' + Pad("0", minite, 2) + ':' + Pad("0", second, 2);
    return selectdate;
}
function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}

function setDate(val) {
    var d = new Date(val);
    var date = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate;
    if (month == 1) {
        selectdate = date + '-Jan-' + year;
    } else if (month == 2) {
        selectdate = date + '-Feb-' + year;
    } else if (month == 3) {
        selectdate = date + '-Mar-' + year;
    } else if (month == 4) {
        selectdate = date + '-Apr-' + year;
    } else if (month == 5) {
        selectdate = date + '-May-' + year;
    } else if (month == 6) {
        selectdate = date + '-Jun-' + year;
    } else if (month == 7) {
        selectdate = date + '-Jul-' + year;
    } else if (month == 8) {
        selectdate = date + '-Aug-' + year;
    } else if (month == 9) {
        selectdate = date + '-Sep-' + year;
    } else if (month == 10) {
        selectdate = date + '-Oct-' + year;
    } else if (month == 11) {
        selectdate = date + '-Nov-' + year;
    } else if (month == 12) {
        selectdate = date + '-Dec-' + year;
    }
    return selectdate;
}

exports.allAction = function (req, res, next) {
    var currDate = Pad("0",parseInt(new Date().getDate()), 2)+'_'+Pad("0",parseInt(new Date().getMonth() + 1), 2)+'_'+new Date().getFullYear();
    if (wlogger.logDate == currDate) {
        var logDir = config.log_path;
        var filePath = logDir + 'logs_'+currDate+'.log';
        fs.stat(filePath, function(err, stat) {
            if(err != null&& err.code == 'ENOENT') {
                wlogger = reload('../config/logger');
            }
        });
        next();
    } else {
        wlogger = reload('../config/logger');
        next();
    }
}

var CronJob = require('cron').CronJob;
new CronJob('00 00 09 * * 0-6', function () {
    Dailyactivityreport();
}, null, true, 'Asia/Kolkata');

function Dailyactivityreport() {
    mysql.getConnection('CMS', function (err, connection_ikon_cms) {
        var currentdate = getDate();
        async.waterfall([
               function (callback) {
                   var query = connection_ikon_cms.query('SELECT * FROM  icn_login_detail WHERE ld_role = "Moderator" and ld_active = 1', function (err, LoginData) {
                       callback(err, LoginData);
                   });
               }
        ]
        , function (err, LoginData) {
            if (err) {
                var error = {
                    userName: 'User',
                    action: 'Dailyactivityreport',
                    responseCode: 500,
                    message: JSON.stringify(err.message)
                }
                wlogger.error(error); // for error
                connection_ikon_cms.release();
            } else {
                var Emails = [];
                if (LoginData.length > 0) {
                    Moderatorloop(0);
                    function Moderatorloop(ml) {
                        var Mail = "";
                        Mail += "<table style=\"border-collapse:collapse\" width=\"700\" cellpadding=\"0\" cellspacing=\"0\">";
                        Mail += "<thead>";
                        Mail += "<tr style=\"background-color: #f3f3f3;\">";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">MetaData-Id</th>";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Title</th>";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Vendor</th>";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Property</th>";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">ExpiryDate</th>";
                        Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Status</th>";
                        Mail += "</tr>";
                        Mail += "</thead>";
                        Mail += " <tbody>";
                        var vendorquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + LoginData[ml].ld_id + ")";
                        var query = 'select * from  (SELECT cm_id,  cm_title ,cm_starts_from, cm_expires_on, propertyname, vd_name,';
                        query += ' CASE  WHEN propertyexpirydate < "' + currentdate + '" THEN 6 ';
                        query += ' WHEN propertyactive = 0   THEN 6 ';
                        query += ' WHEN vd_end_on < "' + currentdate + '"   THEN 6 ';
                        query += ' WHEN vd_is_active = 0   THEN 6 ';
                        query += ' WHEN cm_expires_on < "' + currentdate + '" THEN 6 ';
                        query += ' ELSE cm_state END AS cm_state,';
                        query += ' CASE  WHEN propertyexpirydate < "' + currentdate + '" THEN "Property Expired" ';
                        query += ' WHEN propertyactive = 0   THEN "Property Blocked" ';
                        query += ' WHEN vd_end_on < "' + currentdate + '"   THEN "Vendor Expired" ';
                        query += ' WHEN vd_is_active = 0   THEN "Vendor Blocked" ';
                        query += ' WHEN cm_expires_on < "' + currentdate + '" THEN "Metadata Expired" ';
                        query += ' ELSE "Active" END AS status FROM  ';
                        query += ' (select cm_id, cm_vendor, cm_title ,cm_starts_from, cm_expires_on, cm_property_id,cm_state';
                        query += ' from content_metadata ';
                        query += ' WHERE cm_property_id is not null and cm_state = 4 )cm ';
                        query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                        query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active,vd_name  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery + ' )cmdata  where cm_state = 6 ';
                        var query1 = connection_ikon_cms.query(query, function (err, Metadatas) {
                            if (err) {
                                var error = {
                                    userName: 'User',
                                    action: 'Dailyactivityreport',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                            } else {
                                if (Metadatas.length > 0) {
                                    _.each(Metadatas, function (val) {
                                        Mail += " <tr>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.cm_id + "</td>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.cm_title + "</td>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.vd_name + "</td>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.propertyname + "</td>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + setDate(val.cm_expires_on) + "</td>";
                                        Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.status + "</td>";
                                        Mail += " </tr>"
                                    });
                                }
                                else {
                                    Mail += " <tr>";
                                    Mail += " <td colspan=\"6\" style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + "No Record Found. " + "</td>";
                                    Mail += " </tr>"
                                    Mail += " </tbody></table>";
                                }
                                Emails.push(LoginData[ml].ld_email_id);
                                var smtpTransport = nodemailer.createTransport({
                                    service: "Gmail",
                                    auth: {
                                        user: "jetsynthesis@gmail.com",
                                        pass: "j3tsynthes1s"
                                    }
                                });
                                var mailOptions = {
                                    to: LoginData[ml].ld_email_id,
                                    subject: 'Publish Expired Metadata',
                                    html: Mail
                                }
                                smtpTransport.sendMail(mailOptions, function (error, response) {
                                    if (err) {
                                        var error = {
                                            userName: 'User',
                                            action: 'Dailyactivityreport',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        connection_ikon_cms.release();
                                    } else {
                                        ml = ml + 1;
                                        if (LoginData.length == ml) {
                                            var info = {
                                                userName: 'User',
                                                action: 'getadminlog',
                                                responseCode: 200,
                                                message: "Daily Report sent to " + Emails.toString() + " successfully."
                                            }
                                            wlogger.info(info); // for information
                                            AdminLog.adminlog(connection_ikon_cms, "Daily Report sent to " + Emails.toString() + " successfully.", "Daily Activity Report", 'admin', true);
                                        }
                                        else {
                                            Moderatorloop(ml);
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    var error = {
                        userName: 'User',
                        action: 'Dailyactivityreport',
                        responseCode: 500,
                        message: "Login Data not Found"
                    }
                    wlogger.error(error); // for error
                    connection_ikon_cms.release();
                }
            }
        });
    });
}

exports.dailyactivity = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate();
                    async.waterfall([
                           function (callback) {
                               var query = connection_ikon_cms.query('SELECT * FROM  icn_login_detail WHERE ld_role = "Moderator" and ld_active = 1', function (err, LoginData) {
                                   callback(err, LoginData);
                               });
                           }
                    ]
                    , function (err, LoginData) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action: 'dailyactivity',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var Emails = [];
                            if (LoginData.length > 0) {
                                Moderatorloop(0);
                                function Moderatorloop(ml) {
                                    var Mail = "";
                                    Mail += "<table style=\"border-collapse:collapse\" width=\"700\" cellpadding=\"0\" cellspacing=\"0\">";
                                    Mail += "<thead>";
                                    Mail += "<tr style=\"background-color: #f3f3f3;\">";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">MetaData-Id</th>";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Title</th>";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Vendor</th>";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Property</th>";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">ExpiryDate</th>";
                                    Mail += "<th style=\"border-left: none; border-top: 0; color: #444; font-size: 12px; font-weight: 800; background-color: transparent; border-bottom-width: 1px; vertical-align: middle; border: 1px solid #ddd; border-bottom: 2px solid #ddd; padding: 8px; line-height: 1.42857143; text-align: left; box-sizing: border-box; display: table-cell;\">Status</th>";
                                    Mail += "</tr>";
                                    Mail += "</thead>";
                                    Mail += " <tbody>";
                                    var vendorquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + LoginData[ml].ld_id + ")";
                                    var query = 'select * from  (SELECT cm_id,  cm_title ,cm_starts_from, cm_expires_on, propertyname, vd_name,';
                                    query += ' CASE  WHEN propertyexpirydate < "' + currentdate + '" THEN 6 ';
                                    query += ' WHEN propertyactive = 0   THEN 6 ';
                                    query += ' WHEN vd_end_on < "' + currentdate + '"   THEN 6 ';
                                    query += ' WHEN vd_is_active = 0   THEN 6 ';
                                    query += ' WHEN cm_expires_on < "' + currentdate + '" THEN 6 ';
                                    query += ' ELSE cm_state END AS cm_state,';
                                    query += ' CASE  WHEN propertyexpirydate < "' + currentdate + '" THEN "Property Expired" ';
                                    query += ' WHEN propertyactive = 0   THEN "Property Blocked" ';
                                    query += ' WHEN vd_end_on < "' + currentdate + '"   THEN "Vendor Expired" ';
                                    query += ' WHEN vd_is_active = 0   THEN "Vendor Blocked" ';
                                    query += ' WHEN cm_expires_on < "' + currentdate + '" THEN "Metadata Expired" ';
                                    query += ' ELSE "Active" END AS status FROM  ';
                                    query += ' (select cm_id, cm_vendor, cm_title ,cm_starts_from, cm_expires_on, cm_property_id,cm_state';
                                    query += ' from content_metadata ';
                                    query += ' WHERE cm_property_id is not null and cm_state = 4 )cm ';
                                    query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                                    query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active,vd_name  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery + ' )cmdata  where cm_state = 6 ';
                                    var query1 = connection_ikon_cms.query(query, function (err, Metadatas) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'dailyactivity',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                            res.status(500).json(err.message);
                                        } else {
                                            if (Metadatas.length > 0) {
                                                _.each(Metadatas, function (val) {
                                                    Mail += " <tr>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.cm_id + "</td>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.cm_title + "</td>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.vd_name + "</td>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.propertyname + "</td>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + setDate(val.cm_expires_on) + "</td>";
                                                    Mail += " <td style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + val.status + "</td>";
                                                    Mail += " </tr>"
                                                });
                                            }
                                            else {
                                                Mail += " <tr>";
                                                Mail += " <td colspan=\"6\" style=\"padding: 8px;    line-height: 1.42857143;    vertical-align: top;    border-top: 1px solid #ddd; color: #428bca;    border-left: none;text-decoration: none; border: 1px solid #ddd; border-bottom: 2px solid #ddd;\">" + "No Record Found. " + "</td>";
                                                Mail += " </tr>"
                                                Mail += " </tbody></table>";
                                            }
                                            Emails.push(LoginData[ml].ld_email_id);
                                            var smtpTransport = nodemailer.createTransport({
                                                service: "Gmail",
                                                auth: {
                                                    user: "jetsynthesis@gmail.com",
                                                    pass: "j3tsynthes1s"
                                                }
                                            });
                                            var mailOptions = {
                                                to: LoginData[ml].ld_email_id,
                                                subject: 'Publish Expired Metadata',
                                                html: Mail
                                            }
                                           
                                            smtpTransport.sendMail(mailOptions, function (err, response) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action: 'dailyactivity',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    connection_ikon_cms.release();
                                                    res.status(500).json(err.message);
                                                } else {
                                                    ml = ml + 1;
                                                    if (LoginData.length == ml) {
                                                        //admin log
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action: 'dailyactivity',
                                                            responseCode: 200,
                                                            message: "Daily Report sent to " + Emails.toString() + " successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        AdminLog.adminlog(connection_ikon_cms, "Daily Report sent to " + Emails.toString() + " successfully.", "Daily Activity Report", 'admin', true);
                                                        res.send({ success: true, message: Metadatas, Mail: Mail });
                                                    }
                                                    else {
                                                        Moderatorloop(ml);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                            else {
                                var error = {
                                    userName: req.session.UserName,
                                    action: 'dailyactivity',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                                res.send({ success: true, LoginData: LoginData });
                            }
                        }
                    });
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'dailyactivity',
                    responseCode: 500,
                    message: "Invalid username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        } else {
            var error = {
                userName: "Unknown User",
                action : 'dailyactivity',
                responseCode: 500,
                message: "Invalid user session"
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'dailyactivity',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}