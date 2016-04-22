
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var atob = require("atob");
var formidable = require('formidable');
var shell = require('shelljs');
var _ = require('underscore');
var config = require('../config')();
var fs = require('fs');
var btoa = require("btoa");
var wlogger = require("../config/logger");
var reload = require('require-reload')(require);

function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
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

exports.gethandsetgroup = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    mysql.getConnection('SITE', function (err, connection_ikon_site_user) {
                        async.parallel({
                            Devices: function (callback) {
                                var query = connection_ikon_site_user.query('SELECT  dc_id ,  dc_device_id ,  dc_make , CONCAT( dc_make," ", dc_model ) AS dc_model,  dc_architecture ,  dc_RAM , dc_internal_memory ,  dc_ROM ,  dc_GPU ,  dc_CPU ,  dc_chipset ,  dc_OS ,  dc_OS_version ,  dc_pointing_method ,  dc_width , dc_height FROM device_compatibility', function (err, Devices) {
                                    callback(err, Devices);
                                });
                            },
                            HandsetDeviceGroups: function (callback) {
                                var query = connection_ikon_cms.query('select * from(SELECT * FROM content_handset_group_reference)gp inner join(SELECT * FROM content_handset_group)gd on(gp.chgr_group_id = gd.chg_chgr_group_id)', function (err, HandsetDeviceGroups) {
                                    callback(err, HandsetDeviceGroups);
                                });
                            },
                            HandsetGroups: function (callback) {
                                var query = connection_ikon_cms.query('SELECT * FROM content_handset_group_reference', function (err, HandsetGroups) {
                                    callback(err, HandsetGroups);
                                });
                            },
                            UserName: function (callback) {
                                callback(null, req.session.UserName);
                            }
                        }, function (err, results) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'gethandsetgroup',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for information
                                connection_ikon_cms.release();
                                connection_ikon_site_user.release();
                                res.status(500).json(err.message);
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action : 'gethandsetgroup',
                                    responseCode: 200,
                                    message: "Retrieved Handsetgroup details successfully."
                                }
                                wlogger.info(info); // for information
                                connection_ikon_cms.release();
                                connection_ikon_site_user.release();
                                res.send(results);
                            }
                        });
                    });
                });
            }
            else {
                var error = {
                    userName: 'Unknown User',
                    action : 'gethandsetgroup',
                    responseCode: 500,
                    message: "Invalid UserName"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            var error = {
                userName: 'Unknown User',
                action : 'gethandsetgroup',
                responseCode: 500,
                message: "Invalid User session"
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: 'Unknown User',
            action : 'gethandsetgroup',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.addedithandset = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM content_handset_group_reference Where chgr_group_name =?', [req.body.groupname], function (err, result) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action : 'addedithandset',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            if (result.length > 0) {
                                if (result[0].chgr_group_id == req.body.groupid && req.body.status == "UpdateGroup") {
                                    EditHandsetGroup();
                                }
                                else {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'addedithandset',
                                        responseCode: 500,
                                        message: 'HandSet Group Name must be unique.'
                                    }
                                    wlogger.error(error); // for information
                                    connection_ikon_cms.release();
                                    res.send({ success: false, message: 'HandSet Group Name must be unique.' });
                                }
                            }
                            else {
                                if (req.body.status == "UpdateGroup") {
                                    EditHandsetGroup();
                                }
                                else {
                                    AddNewGroup();
                                }
                            }
                        }

                        function EditHandsetGroup() {
                            async.parallel({
                                EditHandSet: function (callback) {
                                    connection_ikon_cms.query('UPDATE content_handset_group_reference SET chgr_group_name=?,chgr_group_desc=?,chgr_modified_on=?,chgr_modified_by=? WHERE chgr_group_id =?', [req.body.groupname, req.body.disc, new Date(), req.session.UserName, req.body.groupid], function (err, result) {
                                        callback(err, null);
                                    });
                                },
                                DeleteHandset: function (callback) {
                                    if (req.body.DeleteHandSet.length > 0) {
                                        deleteloop(0);
                                        function deleteloop(dl) {
                                            var query = connection_ikon_cms.query('DELETE FROM content_handset_group WHERE chg_handset_id = ? and chg_chgr_group_id= ?  ', [req.body.DeleteHandSet[dl].chg_handset_id, req.body.groupid], function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'EditHandsetGroup',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dl = dl + 1;
                                                    if (req.body.DeleteHandSet.length == dl) {
                                                        callback(err, null);
                                                    }
                                                    else { deleteloop(dl); }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, []);
                                    }
                                },
                                AddHandSet: function (callback) {
                                    if (req.body.AddHandSet.length > 0) {
                                        AddHandsetGroup(req.body.groupid, callback);
                                    }
                                    else {
                                        callback(null, []);
                                    }
                                },
                                UserRole: function (callback) {
                                    callback(null, req.session.UserRole);
                                }
                            }, function (err, results) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'addedithandset',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                } else {
                                    var info = {
                                        userName: req.session.UserName,
                                        action : 'AddNewGroup',
                                        responseCode: 200,
                                        message:  "HandSet Group updated successfully."
                                    }
                                    wlogger.info(info); // for information
                                    connection_ikon_cms.release();
                                    res.send({ success: true, message: "HandSet Group updated successfully." });
                                }
                            });
                        }

                        function AddNewGroup() {
                            async.parallel({
                                AddNewGroup: function (callback) {
                                    var query = connection_ikon_cms.query('SELECT MAX(chgr_group_id) as id FROM content_handset_group_reference', function (err, result) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action : 'AddNewGroup',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            callback(err, null);
                                        }
                                        else {
                                            var groupid = result[0].id != null ? parseInt(result[0].id + 1) : 1;
                                            var handgroup = {
                                                chgr_group_id: groupid,
                                                chgr_group_name: req.body.groupname,
                                                chgr_group_desc: req.body.disc,
                                                chgr_created_on: new Date(),
                                                chgr_created_by: req.session.UserName,
                                                chgr_modified_on: new Date(),
                                                chgr_modified_by: req.session.UserName,
                                                chgr_crud_isactive: 1
                                            }
                                            var query = connection_ikon_cms.query('INSERT INTO content_handset_group_reference SET ?', handgroup, function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'AddNewGroup',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    if (req.body.AddHandSet.length > 0) {
                                                        AddHandsetGroup(groupid, callback);
                                                    }
                                                    else {
                                                        callback(null, null);
                                                    }
                                                }
                                            });
                                        }
                                    });

                                },
                                UserRole: function (callback) {
                                    callback(null, req.session.UserRole);
                                }
                            }, function (err, results) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'AddNewGroup',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                } else {
                                    var info = {
                                        userName: req.session.UserName,
                                        action : 'AddNewGroup',
                                        responseCode: 200,
                                        message:  "HandSet Group added successfully."
                                    }
                                    wlogger.info(info); // for information
                                    connection_ikon_cms.release();
                                    res.send({ success: true, message: "HandSet Group added successfully." });
                                }
                            });
                        }

                        function AddHandsetGroup(groupid, callback) {
                            addloop(0);
                            function addloop(al) {
                                var query = connection_ikon_cms.query('select * FROM content_handset_group WHERE chg_handset_id =? and chg_chgr_group_id= ?  ', [req.body.AddHandSet[al].dc_id, groupid], function (err, result) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'AddHandsetGroup',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        callback(err, null);
                                    }
                                    else {
                                        if (result.length > 0) {
                                            al = al + 1;
                                            if (req.body.AddHandSet.length == al) {
                                                callback(err, null);
                                            }
                                            else { addloop(al); }
                                        }
                                        else {
                                            var handgroup = {
                                                chg_chgr_group_id: groupid,
                                                chg_handset_id: req.body.AddHandSet[al].dc_id,
                                                chg_created_on: new Date(),
                                                chg_created_by: req.session.UserName,
                                                chg_modified_on: new Date(),
                                                chg_modified_by: req.session.UserName,
                                                chg_crud_isactive: 1
                                            }
                                            var query = connection_ikon_cms.query('INSERT INTO content_handset_group SET ?', handgroup, function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'AddHandsetGroup',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    al = al + 1;
                                                    if (req.body.AddHandSet.length == al) {
                                                        callback(err, null);
                                                    }
                                                    else { addloop(al); }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            }
            else {
                var error = {
                    userName: 'Unknown User',
                    action : 'AddHandsetGroup',
                    responseCode: 500,
                    message: "Invalid Username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            var error = {
                userName: 'Unknown User',
                action : 'AddHandsetGroup',
                responseCode: 500,
                message: "Invalid User session"
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: 'Unknown User',
            action : 'addedithandset',
            responseCode: 500,
            message: "Invalid User session"
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}


