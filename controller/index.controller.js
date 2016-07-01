var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var contentTypeManager = require('../models/contentType');
var nodemailer = require('nodemailer');
var _ = require('underscore');
var async = require("async");
var crypto = require('crypto');
var algorithm = 'aes-256-ctr'; //Algorithm used for encrytion
var password = 'd6F3Efeq'; //Encryption password
var wlogger = require("../config/logger");
var curDate = new Date();
var config = require('../config')();
var reload = require('require-reload')(require);
var fs = require('fs');
var common = require('../helpers/common');

/**
 * @class
 * @classdesc create a log file if not exist.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.allAction = function (req, res, next) {
    var currDate = common.Pad("0",parseInt(new Date().getDate()), 2)+'_'+common.Pad("0",parseInt(new Date().getMonth() + 1), 2)+'_'+new Date().getFullYear();
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
/**
 * @class
 * @classdesc get data from env.json file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.getSitePath = function (req, res, next) {
   // console.log(config)
    res.send({"site_path": config.site_path,
        audio_preview_limit:config.audio_preview_limit,
        audio_download_limit:config.audio_download_limit,
        video_preview_limit:config.video_preview_limit,
        video_download_limit:config.video_download_limit,
        text_preview_limit:config.text_preview_limit,
        text_download_limit:config.text_download_limit,
        supporting_image_limit:config.supporting_image_limit,
        thumb_limit:config.thumb_limit,
        wallpaper_limit : config.wallpaper_limit,
        game_limit : config.game_limit,
        text_limit : config.text_limit,
        audio_limit : config.audio_limit,
        video_limit : config.video_limit,
        log_path:config.log_path});
}
/**
 * @class
 * @classdesc get menu pages details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.pages = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            var role = req.session.UserRole;
            if (role == "Super Admin" || role == "Content Manager" || role == "Moderator") {
                var pageData = getPages(role);
                var info = {
                    userName: req.session.UserName,
                    action : 'getPages',
                    responseCode: 200,
                    message: 'Get Page data'
                }
                wlogger.info(info); // for information
                res.render('index', { title: 'Express', username: req.session.FullName, Pages: pageData, userrole: req.session.UserRole, lastlogin: " " + (req.session.lastlogin ? common.getLoginDate(req.session.lastlogin) : "") + " " + (req.session.lastlogin ? common.setTime(req.session.lastlogin) : "") });
            }
            else {
                res.render('account-login', { error: "You can't access content Ingestion." });
            }
        }
        else {
            var error = {
                userName: "Unknown User",
                action : 'getPages',
                responseCode: 500,
                message: 'Not Valid Username'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    else {
        var error = {
            userName: "Unknown User",
            action : 'getPages',
            responseCode: 500,
            message: 'Not Valid User session'
        }
        wlogger.error(error); // for error
        res.redirect('/accountlogin');
    }
}

/**
 * @class
 * @classdesc check user is logged or not.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

//Login Page Get
exports.login = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            res.redirect("/");
        }
        else {
            if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if (err) {
                        //logger.writeLog('login : ' + JSON.stringify(err));
                        var error = {
                            userName: req.session.UserName,
                            action : 'Login',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for err
                    } else {
                        var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_id= ?  ', [common.decrypt(req.cookies.publish_userid)], function (err, row, fields) {
                            if (err) {
                                connection_ikon_cms.release();
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'Login',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for err
                                res.render('account-login', {error: 'Error in database connection.'});
                            } else {
                                if (row.length > 0) {
                                    if (row[0].ld_active == 1) {
                                        if (row[0].ld_role == "Super Admin" || row[0].ld_role == "Content Manager" || row[0].ld_role == "Moderator") {
                                            var session = req.session;
                                            session.UserId = row[0].ld_id;
                                            session.UserRole = row[0].ld_role;
                                            session.UserName = row[0].ld_user_id;
                                            session.FullName = row[0].ld_display_name;
                                            session.Password = row[0].ld_user_pwd;
                                            session.lastlogin = row[0].ld_last_login;
                                            session.Email = row[0].ld_email_id;
                                            var info = {
                                                userName: req.session.UserName,
                                                action : 'Login',
                                                responseCode: 200,
                                                message: 'User logged in successfully.'
                                            }
                                            wlogger.info(info); // for information

                                            connection_ikon_cms.release();
                                            res.redirect('/');
                                        }
                                        else {
                                            connection_ikon_cms.release();
                                            var error = {
                                                userName: req.session.UserName,
                                                action : 'Login',
                                                responseCode: 500,
                                                message: "You can't access content Ingestion."
                                            }
                                            wlogger.error(error); // for err
                                            res.render('account-login', {error: "You can't access content Ingestion."});
                                        }
                                    }
                                    else {
                                        connection_ikon_cms.release();
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'Login',
                                            responseCode: 500,
                                            message: "Your account has been disabled."
                                        }
                                        wlogger.error(error); // for err
                                        res.render('account-login', {error: 'Your account has been disable.'});
                                    }
                                } else {
                                    connection_ikon_cms.release();
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'Login',
                                        responseCode: 500,
                                        message: "Invalid Username / Password."
                                    }
                                    wlogger.error(error); // for err
                                    res.render('account-login', {error: 'Invalid Username / Password.'});
                                }
                            }
                        });
                    }
                })
            }
            else {
                res.render('account-login', { error: '' });
            }
        }
    }
    else {
        var error = {
            userName: "Unknown User",
            action : 'login',
            responseCode: 500,
            message: 'Not Valid Username'
        }
        wlogger.error(error); // for error
        res.render('account-login', { error: '' });
    }
}

/**
 * @class
 * @classdesc logout user.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//LogOut Page Get
exports.logout = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if (err) {
                        //logger.writeLog('login : ' + JSON.stringify(err));
                        var error = {
                            userName: req.session.UserName,
                            action : 'logout',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for err
                    } else {
                        var query = connection_ikon_cms.query('UPDATE icn_login_detail SET  ld_last_login = ?, ld_modified_on = ? ,ld_modified_by= ? WHERE ld_id = ?', [curDate, curDate, req.session.UserName, req.session.UserId], function (err, row11, fields) {
                            if (err) {
                                connection_ikon_cms.release();
                                var error = {
                                    userName: req.session.UserName,
                                    action: 'Login',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for err
                                res.render('account-login', {error: 'Error in database connection.'});
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action: 'logout',
                                    responseCode: 200,
                                    message: 'User logged out successfully.'
                                }
                                wlogger.info(info); // for information
                                AdminLog.adminlog(connection_ikon_cms, req.session.UserName + " logout successfully at " + curDate.toDateString(), "Logout User", req.body.username, true);
                                req.session = null;
                                res.clearCookie('publish_remember');
                                res.clearCookie('publish_userid');
                                res.redirect('/accountlogin');
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'logout',
                    responseCode: 500,
                    message: 'Not Valid Username'
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'logout',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.render('account-login', { error: err.message });
    }
}

/**
 * @class
 * @classdesc authenticate user by username and password.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//Login Page Post
exports.authenticate = function (req, res, next) {
    try {
        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
            if (err) {
                var error = {
                    userName: req.session.UserName,
                    action : 'authenticate',
                    responseCode: 500,
                    message: JSON.stringify(err.message)
                }
                wlogger.error(error); // for error
             } else {
                var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_user_id= ? and BINARY ld_user_pwd = ? ', [req.body.username, req.body.password], function (err, row, fields) {
                    if (err) {
                        var error = {
                            userName: req.session.UserName,
                            action : 'authenticate',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                        res.render('account-login', {error: 'Error in database connection.'});
                    } else {
                        if (row.length > 0) {
                            if (row[0].ld_active == 1) {
                                if (row[0].ld_role == "Super Admin" || row[0].ld_role == "Content Manager" || row[0].ld_role == "Moderator") {
                                    var query = connection_ikon_cms.query('UPDATE icn_login_detail SET  ld_last_login = ?, ld_modified_on = ? ,ld_modified_by= ? WHERE ld_id = ?', [curDate, curDate, req.body.username, row[0].ld_id], function (err, row11, fields) {
                                        if (err) {
                                            connection_ikon_cms.release();
                                            res.render('account-login', {error: 'Error in database connection.'});
                                        } else {
                                            if (req.body.rememberMe) {
                                                var minute = 10080 * 60 * 1000;
                                                res.cookie('publish_remember', 1, {maxAge: minute});
                                                res.cookie('publish_userid', common.encrypt(row[0].ld_id.toString()), {maxAge: minute});
                                            }
                                            AdminLog.adminlog(connection_ikon_cms, req.body.username + " successfully login at " + curDate.toDateString(), "Acccount Login", req.body.username, true);
                                            var session = req.session;
                                            session.UserId = row[0].ld_id;
                                            session.UserRole = row[0].ld_role;
                                            session.UserName = req.body.username;
                                            session.FullName = row[0].ld_display_name;
                                            session.Password = req.body.password;
                                            session.lastlogin = row[0].ld_last_login;
											session.Email = row[0].ld_email_id;
                                            var info = {
                                                userName: req.session.UserName,
                                                action : 'authenticate',
                                                responseCode: 200,
                                                message: req.body.username + " successfully logged in!"
                                            }
                                            wlogger.info(info); // for information

                                            if (req.body.password == "icon") {
                                                res.redirect('/#change-password');
                                            }
                                            else {
                                                res.redirect('/');
                                            }
                                        }
                                    });
                                }
                                else {
                                    connection_ikon_cms.release();
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'authenticate',
                                        responseCode: 500,
                                        message:  req.body.username + " can't access Content Ingestion."
                                    }
                                    wlogger.error(error); // for error
                                    res.render('account-login', {error: "You can't access content Ingestion."});
                                }
                            }
                            else {
                                connection_ikon_cms.release();
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'authenticate',
                                    responseCode: 500,
                                    message:  "Your account has been disabled."
                                }
                                wlogger.error(error); // for error
                                 res.render('account-login', {error: 'Your account has been disable.'});
                            }
                        } else {
                            connection_ikon_cms.release();
                            var error = {
                                userName: req.session.UserName,
                                action : 'authenticate',
                                responseCode: 500,
                                message:  "Invalid Username / Password."
                            }
                            wlogger.error(error); // for error
                             res.render('account-login', {error: 'Invalid Username / Password.'});
                        }
                    }
                });
            }
        })
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'authenticate',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.render('account-login', { error: err.message });
    }
}

//Get Page From UserRole
function getPages(role) {
    var pagesjson = [];
    if (role == "Super Admin") {
        pagesjson = [
            { 'pagename': 'Add/Edit User', 'href': '#user', 'id': 'addedituser', 'class': 'fa fa-user', 'submenuflag': '0', 'sub': [] },
            {
                'pagename': 'Vendor', 'href': '#about', 'id': 'managevendor', 'class': 'fa fa-hdd-o', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Vendor List ', 'subhref': '#vendor-list', 'id': 'vendorlist', 'subclass': 'fa fa-align-left' }
                ]
            },
            {
                'pagename': 'Property', 'href': '#about', 'id': 'manageproperty', 'class': 'fa fa-hdd-o', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Property List', 'subhref': '#property-list', 'id': 'propertylist', 'subclass': 'fa fa-align-left' }
                ]
            },
             {
                 'pagename': 'Master List', 'href': '#about', 'id': 'masterlistmanagement', 'class': 'fa fa-files-o', 'submenuflag': '1', 'sub': [
                       { 'subpagename': 'Master-List', 'subhref': '#master-list', 'id': 'masterlist', 'subclass': 'fa fa-money nav-icon' }
                 ]
             },

            {
                'pagename': 'Content Catalog', 'href': '#content-catalog', 'id': 'contentcatelog', 'class': 'fa fa-external-link', 'submenuflag': '0', 'sub': [
                ]
            },
			{ 'pagename': 'Change Password', 'href': '#change-password', 'id': 'changepassword', 'class': 'fa fa-align-left', 'submenuflag': '0', 'sub': [] },
            { 'pagename': 'Logs', 'href': '#admin-log', 'id': 'adminlog', 'class': 'fa fa-align-left', 'submenuflag': '0', 'sub': [] },
        ];
    }
    else if (role == "Content Manager") {
        pagesjson = [
            {
                'pagename': 'Property', 'href': '#about', 'id': 'manageproperty', 'class': 'fa fa-hdd-o', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Add Property', 'subhref': '#add-property', 'id': 'addproperty', 'subclass': 'fa fa-align-left' },
                      { 'subpagename': 'Property List', 'subhref': '#property-list', 'id': 'propertylist', 'subclass': 'fa fa-align-left' }
                ]
            },
            {
                'pagename': 'Add Content Metadata', 'href': '#about', 'id': 'addcontentmetadata', 'class': 'fa fa-desktop', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Imagery', 'subhref': '#imagery', 'id': 'wallpaper', 'subclass': 'fa fa-user nav-icon' },
                      { 'subpagename': 'Video', 'subhref': '#video', 'id': 'video', 'subclass': 'fa fa-bars nav-icon' },
                      { 'subpagename': 'Audio', 'subhref': '#audio', 'id': 'audio', 'subclass': 'fa fa-asterisk nav-icon' },
                      { 'subpagename': 'Apps & Games', 'subhref': '#appsgames', 'id': 'appsgames', 'subclass': 'fa fa-tasks nav-icon' },
                      { 'subpagename': ' Text', 'subhref': '#text', 'id': 'text', 'subclass': 'fa fa-hdd-o' }
                ]
            },
            { 'pagename': 'Add Content File', 'href': '#add-content-files', 'id': 'addcontentfile', 'class': 'fa fa-align-left', 'submenuflag': '0', 'sub': [] },
            {
                'pagename': 'Content Catalog', 'href': '#content-catalog', 'id': 'contentcatelog', 'class': 'fa fa-external-link', 'submenuflag': '0', 'sub': [
                ]
            },
			{ 'pagename': 'Change Password', 'href': '#change-password', 'id': 'changepassword', 'class': 'fa fa-align-left', 'submenuflag': '0', 'sub': [] }
        ];

    }
    else if (role == "Moderator") {
        pagesjson = [
            {
                'pagename': 'Vendor', 'href': '#about', 'id': 'managevendor', 'class': 'fa fa-hdd-o', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Add Vendor', 'subhref': '#add-vendor', 'id': 'addvendor', 'subclass': 'fa fa-align-left' },
                      { 'subpagename': 'Vendor List ', 'subhref': '#vendor-list', 'id': 'vendorlist', 'subclass': 'fa fa-align-left' }
                ]
            },
            {
                'pagename': 'Property', 'href': '#about', 'id': 'manageproperty', 'class': 'fa fa-hdd-o', 'submenuflag': '1', 'sub': [
                      { 'subpagename': 'Property List', 'subhref': '#property-list', 'id': 'propertylist', 'subclass': 'fa fa-align-left' }
                ]
            },
            {
                'pagename': 'Master List', 'href': '#about', 'id': 'masterlistmanagement', 'class': 'fa fa-files-o', 'submenuflag': '1', 'sub': [
                       { 'subpagename': 'Add MasterList', 'subhref': '#masterlist-add', 'id': 'addmaster', 'subclass': 'fa fa-user nav-icon' },
                       { 'subpagename': 'MasterList', 'subhref': '#master-list', 'id': 'masterlist', 'subclass': 'fa fa-money nav-icon' }
                ]
            },
            {
                'pagename': 'Content Catalog', 'href': '#content-catalog', 'id': 'contentcatelog', 'class': 'fa fa-external-link', 'submenuflag': '0', 'sub': [
                ]
            },
			{ 'pagename': 'Change Password', 'href': '#change-password', 'id': 'changepassword', 'class': 'fa fa-align-left', 'submenuflag': '0', 'sub': [] }
        ];
    }
    return pagesjson;
}

/**
 * @class
 * @classdesc get user details to retrieve forgotten password.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//Forgot Password Page Get
exports.viewForgotPassword = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            var info = {
                userName: req.session.UserName,
                action : 'viewForgotPassword',
                responseCode: 200,
                message: "viewForgotPassword"
            }
            wlogger.info(info); // for information
            res.redirect('/accountlogin');
        }
        else {
            if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
                var info = {
                    userName: req.session.UserName,
                    action : 'viewForgotPassword',
                    responseCode: 200,
                    message: "viewForgotPassword"
                }
                wlogger.info(info); // for information
                res.redirect('/accountlogin');
            }
            else {
                var error = {
                    userName: req.session.UserName,
                    action : 'viewForgotPassword',
                    responseCode: 400,
                    message:  "viewForgotPassword"
                }
                wlogger.error(error); // for error
                res.render('account-forgot', { error: '', msg: '' });
            }
        }
    }
    else {
        if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
            var info = {
                userName: req.session.UserName,
                action : 'viewForgotPassword',
                responseCode: 200,
                message: "viewForgotPassword"
            }
            wlogger.info(info); // for information
            res.redirect('/accountlogin');
        }
        else {
            var error = {
                userName: req.session.UserName,
                action : 'viewForgotPassword',
                responseCode: 400,
                message:  "viewForgotPassword"
            }
            wlogger.error(error); // for error
            res.render('account-forgot', { error: '', msg: '' });
        }
    }
}
/**
 * @class
 * @classdesc authenticate user to send forgotten password
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//Forgot Password Post
exports.forgotPassword = function (req, res, next) {
    try {
        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
            var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_user_id= ? and BINARY ld_email_id = ? ', [req.body.userid, req.body.emailid], function (err, row, fields) {
                if (err) {
                    var error = {
                        userName: req.session.UserName,
                        action : 'forgotPassword',
                        responseCode: 500,
                        message:  JSON.stringify(err)
                    }
                    wlogger.error(error); // for error
                     connection_ikon_cms.release();
                    res.render('account-forgot', { error: 'Error in database connection.', msg: '' });
                }
                else {
                    if (row.length > 0) {
                        var smtpTransport = nodemailer.createTransport({
                            service: "Gmail",
                            auth: {
                                user: "jetsynthesis@gmail.com",
                                pass: "j3tsynthes1s"
                            }
                        });
                        var mailOptions = {
                            to: req.body.emailid,
                            subject: 'Forgot Password',
                            html: "<p>Hi, " + row[0].ld_user_id + " <br />This is your password: " + row[0].ld_user_pwd + "</p>"
                        }
                        smtpTransport.sendMail(mailOptions, function (err, response) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'forgotPassword',
                                    responseCode: 500,
                                    message:  JSON.stringify(err)
                                }
                                wlogger.error(error); // for error
                                // res.end("error");
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action : 'forgotPassword',
                                    responseCode: 200,
                                    message: "Password successfully sent to " + req.body.emailid
                                }
                                wlogger.info(info); // for information
                                 AdminLog.adminlog(connection_ikon_cms, "Password successfully sent to " + req.body.emailid, "Forgot Password", row[0].ld_user_id, true);
                                res.render('account-forgot', { error: '', msg: 'Please check your mail. Password successfully sent to your email' });
                                res.end("sent");
                            }
                        });
                    }
                    else {
                        var error = {
                            userName: req.session.UserName,
                            action : 'forgotPassword',
                            responseCode: 500,
                            message:  "Invalid UserId / EmailId."
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                        res.render('account-forgot', { error: 'Invalid UserId / EmailId.', msg: '' });
                    }
                }
            });
        });
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'authenticate',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
         res.render('account-forgot', { error: err.message});
    }
}

/**
 * @class
 * @classdesc get user details to change existing password.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//Change Pasword Get
exports.viewChangePassword = function (req, res, next) {
    req.session = null;
    res.render('account-changepassword', { error: '' });
}

/**
 * @class
 * @classdesc change user password and send email.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.changePassword = function (req, res) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var session = req.session;
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'changePassword',
                            responseCode: 200,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for information
                    }else{
                        if(req.body.oldpassword == session.Password) {
                        var query = connection_ikon_cms.query('UPDATE icn_login_detail SET ld_user_pwd=?, ld_modified_on=? WHERE ld_id=?', [req.body.newpassword, curDate, session.UserId], function (err, result) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'changePassword',
                                    responseCode: 500,
                                    message:  JSON.stringify(err)
                                }
                                wlogger.error(error); // for error
                                 connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            }else {
                                session.Password = req.body.newpassword;
                                var smtpTransport = nodemailer.createTransport({
                                    service: "Gmail",
                                    auth: {
                                        user: "jetsynthesis@gmail.com",
                                        pass: "j3tsynthes1s"
                                    }
                                });
                                var mailOptions = {
                                    to: session.Email,
                                    subject: 'Change Password',
                                    html: "<p>Hi, " + session.UserName + " <br />This is your password: " + req.body.newpassword + "</p>"
                                }
								
                                smtpTransport.sendMail(mailOptions, function (error, response) {
                                    if (error) {
                                        connection_ikon_cms.release();
                                        res.end("error");
                                    } else {
                                        connection_ikon_cms.release();
                                        var info = {
                                            userName: req.session.UserName,
                                            action : 'changePassword',
                                            responseCode: 200,
                                            message: "Password updated successfully for user " + req.session.UserName
                                        }
                                        wlogger.info(info); // for information
                                        res.send({ success: true, message: 'Password updated successfully. Please check your mail' });
                                    }
                                });
                            }
                        }); 
                    }else {
                        connection_ikon_cms.release();
                            var error = {
                                userName: req.session.UserName,
                                action : 'changePassword',
                                responseCode: 500,
                                message:  "Old Password does not match."
                            }
                            wlogger.error(error); // for error
                        res.send({ success: false, message: 'Old Password does not match' });
                    }
                } 
                })
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'changePassword',
                    responseCode: 500,
                    message:  "Invalid Username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'changePassword',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
};

/**
 * @class
 * @classdesc get dashboard data to create chart and grid.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
//Get DashBoard Data
exports.getdashboarddata = function (req, res) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var session = req.session;
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'getdashboarddata',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                    }else {
                        var currentdate = common.setDate(curDate);
                        var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                        var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                        async.parallel({
                            ContentType: function (callback) {
                                contentTypeManager.getAllContentTypes(connection_ikon_cms, function (err, ContentType) {
                                    callback(err, ContentType);
                                });
                            },
                            FileStatus: function (callback) {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM catalogue_detail)cd inner join(select * from catalogue_master where cm_name in("Content Status","Content Type") )cm on(cm.cm_id = cd.cd_cm_id) order by cd_id', function (err, FileStatus) {
                                    callback(err, FileStatus);
                                });
                            },
                            Vendors: function (callback) {
                                var query = connection_ikon_cms.query('select * from (select * from icn_vendor_detail order by vd_name) vd ' + vendorquery, function (err, Vendors) {
                                    callback(err, Vendors);
                                });
                            },
                            VendorFiles: function (callback) {
                                var query = connection_ikon_cms.query('SELECT parentid,cm_vendor,cm_content_type, CASE WHEN cm_state = 6   THEN cm_state   WHEN cm_state = 5    THEN cm_state    WHEN cm_state =7   THEN cm_state WHEN propertyexpirydate < "' + currentdate + '"  THEN 6 WHEN propertyactive = 0   THEN 6  WHEN vd_end_on < "' + currentdate + '"   THEN 6 WHEN vd_is_active = 0   THEN 6  ELSE cm_state END AS cm_state  FROM  (select cm_vendor,cm_content_type,cm_property_id, CASE WHEN cm_state =5 THEN cm_state WHEN cm_state =7 THEN cm_state WHEN cm_expires_on < "' + currentdate + '" THEN 6 ELSE cm_state END AS cm_state from content_metadata WHERE cm_property_id is not null )cm inner join(SELECT cm_id as propertyid ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata)prop on(cm.cm_property_id =prop.propertyid) inner join(SELECT vd_id ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail )parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)' + vendorquery, function (err, VendorFiles) {
                                    callback(err, VendorFiles);
                                });
                            },
                            UserRole: function (callback) {
                                callback(null, req.session.UserRole);
                            }
                        },
                        function (err, results) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'getdashboarddata',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                 connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action : 'getdashboarddata',
                                    responseCode: 200,
                                    message: "Dashboard data retrived successfully"
                                }
                                wlogger.info(info); // for information
                                 connection_ikon_cms.release();
                                res.send(results);
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'getdashboarddata',
                    responseCode: 500,
                    message: "Invalid Username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'getdashboarddata',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
};
