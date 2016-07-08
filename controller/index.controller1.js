
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var contentTypeManager = require('../models/contentType');
var nodemailer = require('nodemailer');
var _ = require('underscore');
var async = require("async");
var crypto = require('crypto');
algorithm = 'aes-256-ctr', //Algorithm used for encrytion
password = 'd6F3Efeq'; //Encryption password

function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

function getloginDate(val) {
    if (val) {
        var d = new Date(val);
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = Pad("0", dt, 2) + '/' + Pad("0", month, 2) + '/' + year.toString().substring(2);
        return selectdate;
    }
    else {
        var d = new Date();
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
        return selectdate;
    }
}

function getDate(val) {
    if (val) {
        var d = new Date(val);
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
        return selectdate;
    }
    else {
        var d = new Date();
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
        return selectdate;
    }
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

//Menu Pages
exports.pages = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            var role = req.session.UserRole;
            if (role == "Super Admin" || role == "Content Manager" || role == "Moderator") {
                var pageData = getPages(role);
                res.render('index', { title: 'Express', username: req.session.FullName, Pages: pageData, userrole: req.session.UserRole, lastlogin: " " + (req.session.lastlogin ? getloginDate(req.session.lastlogin) : "") + " " + (req.session.lastlogin ? getTime(req.session.lastlogin) : "") });
            }
            else {
                res.render('account-login', { error: "You can't access content Ingestion." });
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    else {
        res.redirect('/accountlogin');
    }
}

//Login Page Get
exports.login = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            res.redirect("/");
        }
        else {
            if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_id= ?  ', [decrypt(req.cookies.publish_userid)], function (err, row, fields) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.render('account-login', { error: 'Error in database connection.' });
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
                                        connection_ikon_cms.release();
                                        res.redirect('/');
                                    }
                                    else {
                                        connection_ikon_cms.release();
                                        res.render('account-login', { error: "You can't access content Ingestion." });
                                    }
                                }
                                else {
                                    connection_ikon_cms.release();
                                    res.render('account-login', { error: 'Your account has been disable.' });
                                }
                            } else {
                                connection_ikon_cms.release();
                                res.render('account-login', { error: 'Invalid Username / Password.' });
                            }
                        }
                    });
                })
            }
            else {
                res.render('account-login', { error: '' });
            }
        }
    }
    else {
        res.render('account-login', { error: '' });
    }
}

//LogOut Page Get
exports.logout = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('UPDATE icn_login_detail SET  ld_last_login = ?, ld_modified_on = ? ,ld_modified_by= ? WHERE ld_id = ?', [new Date(), new Date(), req.session.UserName, req.session.UserId], function (err, row11, fields) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.render('account-login', { error: 'Error in database connection.' });
                        } else {
                            AdminLog.adminlog(connection_ikon_cms, req.session.UserName + " logout successfully at " + new Date().toDateString(), "Logout User", req.body.username, true);
                            req.session = null;
                            res.clearCookie('publish_remember');
                            res.clearCookie('publish_userid');
                            res.redirect('/accountlogin');
                        }
                    });
                });
            }
            else {
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (error) {
        connection_ikon_cms.release();
        res.render('account-login', { error: error.message });
    }
}

//Login Page Post
exports.authenticate = function (req, res, next) {
    try {
        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
            var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_user_id= ? and BINARY ld_user_pwd = ? ', [req.body.username, req.body.password], function (err, row, fields) {
                if (err) {
                    connection_ikon_cms.release();
                    res.render('account-login', { error: 'Error in database connection.' });
                } else {
                    if (row.length > 0) {
                        if (row[0].ld_active == 1) {
                            if (row[0].ld_role == "Super Admin" || row[0].ld_role == "Content Manager" || row[0].ld_role == "Moderator") {
                                var query = connection_ikon_cms.query('UPDATE icn_login_detail SET  ld_last_login = ?, ld_modified_on = ? ,ld_modified_by= ? WHERE ld_id = ?', [new Date(), new Date(), req.body.username, row[0].ld_id], function (err, row11, fields) {
                                    if (err) {
                                        connection_ikon_cms.release();
                                        res.render('account-login', { error: 'Error in database connection.' });
                                    } else {
                                        if (req.body.rememberMe) {
                                            var minute = 10080 * 60 * 1000;
                                            res.cookie('publish_remember', 1, { maxAge: minute });
                                            res.cookie('publish_userid', encrypt(row[0].ld_id.toString()), { maxAge: minute });
                                        }
                                        AdminLog.adminlog(connection_ikon_cms, req.body.username + " successfully login at " + new Date().toDateString(), "Acccount Login", req.body.username, true);
                                        var session = req.session;
                                        session.UserId = row[0].ld_id;
                                        session.UserRole = row[0].ld_role;
                                        session.UserName = req.body.username;
                                        session.FullName = row[0].ld_display_name;
                                        session.Password = req.body.password;
                                        session.lastlogin = row[0].ld_last_login;
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
                                res.render('account-login', { error: "You can't access content Ingestion." });
                            }
                        }
                        else {
                            connection_ikon_cms.release();
                            res.render('account-login', { error: 'Your account has been disable.' });
                        }
                    } else {
                        connection_ikon_cms.release();
                        res.render('account-login', { error: 'Invalid Username / Password.' });
                    }
                }
            });
        })
    }
    catch (error) {
        res.render('account-login', { error: 'Error in database connection.' });
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
                      { 'subpagename': 'Wallpaper', 'subhref': '#wallpaper', 'id': 'wallpaper', 'subclass': 'fa fa-user nav-icon' },
                      { 'subpagename': 'Video', 'subhref': '#video', 'id': 'video', 'subclass': 'fa fa-bars nav-icon' },
                      { 'subpagename': 'Audio', 'subhref': '#audio', 'id': 'audio', 'subclass': 'fa fa-asterisk nav-icon' },
                      { 'subpagename': 'Apps & Games', 'subhref': '#appsgames', 'id': 'appsgames', 'subclass': 'fa fa-tasks nav-icon' },
                      { 'subpagename': 'Text', 'subhref': '#text', 'id': 'text', 'subclass': 'fa fa-hdd-o' }
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

//Forgot Password Page Get
exports.viewForgotPassword = function (req, res, next) {
    if (req.session) {
        if (req.session.UserName) {
            res.redirect('/accountlogin');
        }
        else {
            if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
                res.redirect('/accountlogin');
            }
            else {
                res.render('account-forgot', { error: '', msg: '' });
            }
        }
    }
    else {
        if (req.cookies.publish_remember == 1 && req.cookies.publish_userid != '') {
            res.redirect('/accountlogin');
        }
        else {
            res.render('account-forgot', { error: '', msg: '' });
        }
    }
}

//Forgot Password Post
exports.forgotPassword = function (req, res, next) {
    try {
        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
            var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where BINARY ld_user_id= ? and BINARY ld_email_id = ? ', [req.body.userid, req.body.emailid], function (err, row, fields) {
                if (err) {
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
                        smtpTransport.sendMail(mailOptions, function (error, response) {
                            if (error) {
                                res.end("error");
                            } else {
                                AdminLog.adminlog(connection_ikon_cms, "Password successfully sent to " + req.body.emailid, "Forgot Password", row[0].ld_user_id, true);
                                res.render('account-forgot', { error: '', msg: 'Please check your mail. Password successfully sent to your email' });
                                res.end("sent");
                            }
                        });
                    }
                    else {
                        connection_ikon_cms.release();
                        res.render('account-forgot', { error: 'Invalid UserId / EmailId.', msg: '' });
                    }
                }
            });
        });
    }
    catch (err) {
        connection_ikon_cms.release();
        res.render('account-forgot', { error: 'Error in database connection.' });
    }
}

//Change Pasword Get
exports.viewChangePassword = function (req, res, next) {
    req.session = null;
    res.render('account-changepassword', { error: '' });
}

//Change Password Post
exports.changePassword = function (req, res) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var session = req.session;
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if (req.body.oldpassword == session.Password) {
                        var query = connection_ikon_cms.query('UPDATE icn_login_detail SET ld_user_pwd=?, ld_modified_on=? WHERE ld_id=?', [req.body.newpassword, new Date(), session.UserId], function (err, result) {
                            if (err) {
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            }
                            else {
                                AdminLog.adminlog(connection_ikon_cms, req.session.UserName + " user password updated successfully and UserId is " + req.session.UserId, "Change Password", req.session.UserName, true);
                                session.Password = req.body.newpassword;
                                res.send({ success: true, message: 'Password updated successfully.' });
                            }
                        });
                    }
                    else {
                        connection_ikon_cms.release();
                        res.send({ success: false, message: 'Old Password does not match.' });
                    }
                })
            }
            else {
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        connection_ikon_cms.release();
        res.status(500).json(err.message);
    }
};

//Get DashBoard Data
exports.getdashboarddata = function (req, res) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var session = req.session;
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate(new Date());
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    async.parallel({
                        ContentType: function (callback) {
                    		contentTypeManager.getAllContentTypes( connection_ikon_cms, function (err, ContentType ) {
                                callback( err, ContentType );
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
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            connection_ikon_cms.release();
                            res.send(results);
                        }
                    });
                });
            }
            else {
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        connection_ikon_cms.release();
        connection_ikon_cms.release();
        res.status(500).json(err.message);
    }
};
