
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
var unzip = require('unzip');
var dir = require("node-dir");
var XLSX = require('xlsx');
var wlogger = require("../config/logger");
var reload = require('require-reload')(require);

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

/**
 * @class
 * @classdesc create a log file if not exist.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
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
/**
 * @class
 * @classdesc  Get Content File data like Devices Details, ContentType, Templates.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.getcontentfile = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    mysql.getConnection('SITE', function (err, connection_ikon_site_user) {
                        if (err) {
                            //logger.writeLog('login : ' + JSON.stringify(err));
                            var error = {
                                userName: req.session.UserName,
                                action : 'getcontentfile',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for err
                        } else {
                            async.parallel({
                                ContentType: function (callback) {
                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd inner join(select * from catalogue_master where cm_name IN ("Content Type") ) cm on (cd.cd_cm_id = cm.cm_id )', function (err, ContentType) {
                                        callback(err, ContentType);
                                    });
                                },
                                Templates: function (callback) {
                                    var query = connection_ikon_cms.query('select heightgroupid as ct_group_id,width,height  from (select ct_param as width,ct_group_id as widthgroupid from content_template where ct_param_value = "width" )width inner join (select ct_param as height,ct_group_id as heightgroupid from content_template where ct_param_value = "height" )height on(width.widthgroupid =height.heightgroupid)', function (err, Templates) {
                                        callback(err, Templates);
                                    });
                                },
                                OtherTemplates: function (callback) {
                                    var query = connection_ikon_cms.query('select * from (select * from content_template where ct_param_value in ("bitrate","otherimage","othervideo","otheraudio","app","utf 16", "Preview","Supporting","Main"))other', function (err, OtherTemplates) {
                                        callback(err, OtherTemplates);
                                    });
                                },
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
                                UserRole: function (callback) {
                                    callback(null, req.session.UserRole);
                                },
                                UserName: function (callback) {
                                    callback(null, req.session.UserName);
                                },
                                ConfigData: function (callback) {
                                    callback(null, {
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
                                        log_path: config.log_path})
                                },
                                BGSongType: function (callback) {
                                    var query = connection_ikon_cms.query('select * from catalogue_detail as cd ' +
                                        'inner join(select * from catalogue_master where cm_name IN ("BG Song Type") ) cm on (cd.cd_cm_id = cm.cm_id )', function (err, ContentType) {
                                        callback(err, ContentType);
                                    });
                                }
                            }, function (err, results) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'getcontentfile',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for err
                                    connection_ikon_site_user.release();
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                } else {
                                    var info = {
                                        userName: req.session.UserName,
                                        action : 'getcontentfile',
                                        responseCode: 200,
                                        message: 'Retrieved content files details successfully.'
                                    }
                                    wlogger.info(info); // for information
                                    connection_ikon_site_user.release();
                                    connection_ikon_cms.release();
                                    res.send(results);
                                }
                            });
                        }
                    });
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'getcontentfile',
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
            action : 'getcontentfile',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

/**
 * @class
 * @classdesc get metadata details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.checkmetadata = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        Metadata: function (callback) {
                            var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                            var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                            var query = 'SELECT songtype, cm_id, cm_vendor,cm_ispersonalized, cm_content_type, cm_title ,cm_starts_from, cm_expires_on,  cm_is_active,cm_state, vd_id ,vd_end_on,vd_is_active,propertyid,propertyname,propertyexpirydate,propertyactive From';
                            query += ' (select *  from content_metadata ';
                            query += ' WHERE cm_property_id is not null and cm_id = ? )cm ';
                            query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                            query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail )vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                            query += ' inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type and  cnt.mct_parent_cnt_type_id = ?) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail)parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                            query += ' left join (SELECT cd_name as songtype ,cd_id FROM catalogue_detail)songtype on (songtype.cd_id = cm.cm_song_type)';
                            var query = connection_ikon_cms.query(query, [req.body.Id, req.body.parentid], function (err, Metadata) {
                                callback(err, Metadata);
                            });
                        },
                        Languages: function (callback) {
                            if (req.body.contenttype == "Text") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name)', [req.body.Id], function (err, Languages) {
                                    callback(err, Languages);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        LyricsLanguages: function (callback) {
                            //if (req.body.contenttype == "Audio") {
                            var query = 'select * from (SELECT cm_id,cm_lyrics_languages FROM content_metadata where cm_id =? and NOT ISNULL(cm_lyrics_languages) )meta ' +
                                'left join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) ' +
                                'left join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                'left join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)' +
                                'left join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) ' +
                                'left join (SELECT * FROM content_files )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id and file_category_id = 1) ';

                            var query123 = 'select cd.*, ct.* from (SELECT * FROM content_metadata where cm_id =? )meta ' +
                                'left join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) ' +
                                'left join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                'left join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)' +
                                'left join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name)';
                            //console.log(query)
                            var query = connection_ikon_cms.query(query, [req.body.Id], function (err, Languages) {
                                callback(err, Languages);
                            });
                            /* }
                             else {
                             callback(null, []);
                             }*/
                        },
                        Files: function (callback) {
                            var query = 'select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta ' +
                                'inner join(select * from content_files where cf_cm_id = ? and cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) ' +
                                'inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value ' +
                                'from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id )';
                            connection_ikon_cms.query(query, [req.body.Id, req.body.Id], function (err, Files) {
                                callback(err, Files);
                            });
                        },
                        ThumbFiles: function (callback) {
                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [req.body.Id], function (err, ThumbFiles) {
                                callback(err, ThumbFiles);
                            });
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        },
                        UserName: function (callback) {
                            callback(null, req.session.UserName);
                        }
                    }, function (err, results) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action : 'checkmetadata',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var info = {
                                userName: req.session.UserName,
                                action : 'checkmetadata',
                                responseCode: 200,
                                message: "Checkmetdata retrived successfully."
                            }
                            wlogger.info(info); // for information
                            connection_ikon_cms.release();
                            res.send(results);
                        }
                    });
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
}
/**
 * @class
 * @classdesc upload thumbnail file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadthumb = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    //console.log(fields.bulkAudioVisible);                     process.exit(0);
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var filenamedata = (fields.cm_id + '_thumb_' + fields.width + "_" + fields.height + '.' + file_ext).toLowerCase();
                        var save_path = config.site_thumb_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        var temp_path = config.site_temp_path + filenamedata;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadThumb',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        res.status(500).json(err.message);
                                    } else {
                                        if(fields.bulkAudioVisible){
                                            shell.exec('cp "' + old_path + '" "' + temp_path + '"');
                                            shell.exec('chmod 777 ' + temp_path);
                                        }
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    //console.log('select * from content_files_thumbnail WHERE cft_thumbnail_size = "'+ fields.width + "*" + fields.height +'" and cft_thumbnail_img_browse = "'+save_path+'" and  cft_cm_id = '+fields.cm_id)
                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail WHERE cft_thumbnail_size = ? and cft_thumbnail_img_browse =? and  cft_cm_id=?', [fields.width + "*" + fields.height, save_path, fields.cm_id], function (err, thumbfile) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'uploadThumb',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            res.status(500).json(err.message);
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            if (!(thumbfile.length > 0)) {
                                                                var thumb = {
                                                                    cft_cm_id: fields.cm_id,
                                                                    cft_thumbnail_size: fields.width + "*" + fields.height,
                                                                    cft_thumbnail_img_browse: save_path,
                                                                    cft_created_on: new Date(),
                                                                    cft_created_by: req.session.UserName,
                                                                    cft_modified_on: new Date(),
                                                                    cft_modified_by: req.session.UserName,
                                                                    cft_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadThumb',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        res.status(500).json(err.message);
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, ThumbFiles) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action : 'uploadThumb',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                res.status(500).json(err.message);
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                var info = {
                                                                                    userName: req.session.UserName,
                                                                                    action : 'uploadThumb',
                                                                                    responseCode: 200,
                                                                                    message: "Thumb File Uploaded for " + fields.cm_title + " and MetadataId is " + fields.cm_id + "."
                                                                                }
                                                                                wlogger.info(info); // for information
                                                                                AdminLog.adminlog(connection_ikon_cms, 'Thumb File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Thumb File Upload", req.session.UserName, true);
                                                                                res.send({ success: true, message: 'Thumb uploaded successfully', ThumbFiles: ThumbFiles });
                                                                            }
                                                                        });

                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, ThumbFiles) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadThumb',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadThumb',
                                                                            responseCode: 200,
                                                                            message: "Thumb File Uploaded for " + fields.cm_title + " and MetadataId is " + fields.cm_id + "."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        AdminLog.adminlog(connection_ikon_cms, 'Thumb File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Thumb File Upload", req.session.UserName, true);
                                                                        res.send({ success: true, message: 'Thumb uploaded successfully', ThumbFiles: ThumbFiles });
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'UploadThumb',
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
                action : 'login',
                responseCode: 500,
                message: 'User session not set'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'login',
            responseCode: 500,
            message: 'Not Valid Username'
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

/**
 * @class
 * @classdesc upload imagery content type file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadimagery = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var filenamedata = (fields.cm_id + '_' + fields.width + "_" + fields.height + '.' + file_ext).toLowerCase();
                        var save_path = config.site_wallpaper_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'uploadimagery',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadimagery',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'uploadimagery',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for error
                                                res.status(500).json(err.message);
                                            } else {
                                                var Formats = (fields.width == 1280 && fields.height == 1280) ? config.Base1 : (fields.width == 1280 && fields.height == 720) ? config.Base2 : (fields.width == 720 && fields.height == 1280) ? config.Base3 : [];
                                                if (Formats.length > 0) {
                                                    mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                        var IsThumb100 = true;
                                                        var IsThumb125 = true;
                                                        var IsThumb150 = true;
                                                        var ThumbFiles = [];
                                                        var query = connection_ikon_cms.query('select heightgroupid as ct_group_id,width,height  from (select ct_param as width,ct_group_id as widthgroupid from content_template where ct_param_value = "width" )width inner join (select ct_param as height,ct_group_id as heightgroupid from content_template where ct_param_value = "height" )height on(width.widthgroupid =height.heightgroupid)', function (err, Templates) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action : 'uploadimagery',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err.message)
                                                                }
                                                                wlogger.error(error); // for error
                                                                connection_ikon_cms.release();
                                                                res.status(500).json(err.message);
                                                            }
                                                            else {
                                                                var query = connection_ikon_cms.query('SELECT * FROM content_files_thumbnail WHERE cft_cm_id= ? ', [fields.cm_id], function (err, filedata) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadimagery',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        if (filedata.length > 0) {
                                                                            filedata.forEach(function (val) {
                                                                                if (val.cft_thumbnail_size == "100*100") {
                                                                                    IsThumb100 = false;
                                                                                }
                                                                                if (val.cft_thumbnail_size == "125*125") {
                                                                                    IsThumb125 = false;
                                                                                }
                                                                                if (val.cft_thumbnail_size == "150*150") {
                                                                                    IsThumb150 = false;
                                                                                }
                                                                            });
                                                                        }
                                                                        var length = Formats.length;
                                                                        function endloop(index, length) {
                                                                            index = index + 1;
                                                                            if (length == index) {
                                                                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_files where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [fields.cm_id], function (err, result) {
                                                                                    if (err) {
                                                                                        var error = {
                                                                                            userName: req.session.UserName,
                                                                                            action : 'uploadimagery',
                                                                                            responseCode: 500,
                                                                                            message: JSON.stringify(err.message)
                                                                                        }
                                                                                        wlogger.error(error); // for error
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        var cm_state = 1;
                                                                                        if (result.length > 0) {
                                                                                            if (result[0].cm_state == 4) {
                                                                                                cm_state = 4;
                                                                                            }
                                                                                        }
                                                                                        if (result.length >= 73 && cm_state != 4) {
                                                                                            cm_state = 2;
                                                                                        }
                                                                                        if (ThumbFiles.length > 0) {
                                                                                            var thumblength = ThumbFiles.length;
                                                                                            UploadThumbData(0);
                                                                                            function UploadThumbData(tf) {
                                                                                                var thumb = {
                                                                                                    cft_cm_id: fields.cm_id,
                                                                                                    cft_thumbnail_size: ThumbFiles[tf].width + "*" + ThumbFiles[tf].height,
                                                                                                    cft_thumbnail_img_browse: ThumbFiles[tf].filename,
                                                                                                    cft_created_on: new Date(),
                                                                                                    cft_created_by: req.session.UserName,
                                                                                                    cft_modified_on: new Date(),
                                                                                                    cft_modified_by: req.session.UserName,
                                                                                                    cft_crud_isactive: 1
                                                                                                }
                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                    if (err) {
                                                                                                        var error = {
                                                                                                            userName: req.session.UserName,
                                                                                                            action : 'uploadimagery',
                                                                                                            responseCode: 500,
                                                                                                            message: JSON.stringify(err.message)
                                                                                                        }
                                                                                                        wlogger.error(error); // for error
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.status(500).json(err.message);
                                                                                                    }
                                                                                                    else {
                                                                                                        tf = tf + 1;
                                                                                                        if (thumblength == tf) {
                                                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                                                if (err) {
                                                                                                                    var error = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action : 'uploadimagery',
                                                                                                                        responseCode: 500,
                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                    }
                                                                                                                    wlogger.error(error); // for error
                                                                                                                    connection_ikon_cms.release();
                                                                                                                    res.status(500).json(err.message);
                                                                                                                }
                                                                                                                else {
                                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                                        if (err) {
                                                                                                                            var error = {
                                                                                                                                userName: req.session.UserName,
                                                                                                                                action : 'uploadimagery',
                                                                                                                                responseCode: 500,
                                                                                                                                message: JSON.stringify(err.message)
                                                                                                                            }
                                                                                                                            wlogger.error(error); // for error
                                                                                                                            connection_ikon_cms.release();
                                                                                                                            res.status(500).json(err.message);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            if (cm_state == 2) {
                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                                    if (err) {
                                                                                                                                        var error = {
                                                                                                                                            userName: req.session.UserName,
                                                                                                                                            action : 'uploadimagery',
                                                                                                                                            responseCode: 500,
                                                                                                                                            message: JSON.stringify(err.message)
                                                                                                                                        }
                                                                                                                                        wlogger.error(error); // for error
                                                                                                                                        connection_ikon_cms.release();
                                                                                                                                        res.status(500).json(err.message);
                                                                                                                                    }
                                                                                                                                    else {
                                                                                                                                        if (files.length > 0) {
                                                                                                                                            var file_length = files.length
                                                                                                                                            fileloop(0);
                                                                                                                                            function fileloop(f) {
                                                                                                                                                var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                                                                var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                                                                //  shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                                f = f + 1;
                                                                                                                                                if (f == file_length) {
                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                                        if (err) {
                                                                                                                                                            var error = {
                                                                                                                                                                userName: req.session.UserName,
                                                                                                                                                                action : 'uploadimagery',
                                                                                                                                                                responseCode: 500,
                                                                                                                                                                message: JSON.stringify(err.message)
                                                                                                                                                            }
                                                                                                                                                            wlogger.error(error); // for error
                                                                                                                                                            connection_ikon_cms.release();
                                                                                                                                                            res.status(500).json(err.message);
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            if (Thumbs.length > 0) {
                                                                                                                                                                var thumb_length = Thumbs.length
                                                                                                                                                                thumnloop(0);
                                                                                                                                                                function thumnloop(th) {
                                                                                                                                                                    var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                                    var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                    th = th + 1;
                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                        var info = {
                                                                                                                                                                            userName: req.session.UserName,
                                                                                                                                                                            action : 'uploadimagery',
                                                                                                                                                                            responseCode: 200,
                                                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                                        }
                                                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                var info = {
                                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                                    action : 'uploadimagery',
                                                                                                                                                                    responseCode: 200,
                                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                                }
                                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    fileloop(f);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                                if (err) {
                                                                                                                                                    var error = {
                                                                                                                                                        userName: req.session.UserName,
                                                                                                                                                        action : 'uploadimagery',
                                                                                                                                                        responseCode: 500,
                                                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                                                    }
                                                                                                                                                    wlogger.error(error); // for error
                                                                                                                                                    connection_ikon_cms.release();
                                                                                                                                                    res.status(500).json(err.message);
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    if (Thumbs.length > 0) {
                                                                                                                                                        var thumb_length = Thumbs.length
                                                                                                                                                        thumnloop(0);
                                                                                                                                                        function thumnloop(th) {
                                                                                                                                                            var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                            var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                            //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                                            th = th + 1;
                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                var info = {
                                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                                    action : 'uploadimagery',
                                                                                                                                                                    responseCode: 200,
                                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                                }
                                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                thumnloop(th);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        var info = {
                                                                                                                                                            userName: req.session.UserName,
                                                                                                                                                            action : 'uploadimagery',
                                                                                                                                                            responseCode: 200,
                                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                        }
                                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                });
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                var info = {
                                                                                                                                    userName: req.session.UserName,
                                                                                                                                    action : 'uploadimagery',
                                                                                                                                    responseCode: 200,
                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                }
                                                                                                                                wlogger.info(info); // for information
                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        else {
                                                                                                            UploadThumbData(tf);
                                                                                                        }
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                                if (err) {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action : 'uploadimagery',
                                                                                                        responseCode: 500,
                                                                                                        message: JSON.stringify(err.message)
                                                                                                    }
                                                                                                    wlogger.error(error); // for error
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                        if (err) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action : 'uploadimagery',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err.message)
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            connection_ikon_cms.release();
                                                                                                            res.status(500).json(err.message);
                                                                                                        }
                                                                                                        else {
                                                                                                            if (cm_state == 2) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                    if (err) {
                                                                                                                        var error = {
                                                                                                                            userName: req.session.UserName,
                                                                                                                            action : 'uploadimagery',
                                                                                                                            responseCode: 500,
                                                                                                                            message: JSON.stringify(err.message)
                                                                                                                        }
                                                                                                                        wlogger.error(error); // for error
                                                                                                                        connection_ikon_cms.release();
                                                                                                                        res.status(500).json(err.message);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        if (files.length > 0) {
                                                                                                                            var file_length = files.length
                                                                                                                            fileloop(0);
                                                                                                                            function fileloop(f) {
                                                                                                                                var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                                                var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                                                //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                f = f + 1;
                                                                                                                                if (f == file_length) {
                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                        if (err) {
                                                                                                                                            var error = {
                                                                                                                                                userName: req.session.UserName,
                                                                                                                                                action : 'uploadimagery',
                                                                                                                                                responseCode: 500,
                                                                                                                                                message: JSON.stringify(err.message)
                                                                                                                                            }
                                                                                                                                            wlogger.error(error); // for error
                                                                                                                                            connection_ikon_cms.release();
                                                                                                                                            res.status(500).json(err.message);
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            if (Thumbs.length > 0) {
                                                                                                                                                var thumb_length = Thumbs.length
                                                                                                                                                thumnloop(0);
                                                                                                                                                function thumnloop(th) {
                                                                                                                                                    var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                    var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                    th = th + 1;
                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                        var info = {
                                                                                                                                                            userName: req.session.UserName,
                                                                                                                                                            action : 'uploadimagery',
                                                                                                                                                            responseCode: 200,
                                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                        }
                                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        thumnloop(th);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                var info = {
                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                    action : 'uploadimagery',
                                                                                                                                                    responseCode: 200,
                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                }
                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    fileloop(f);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                if (err) {
                                                                                                                                    var error = {
                                                                                                                                        userName: req.session.UserName,
                                                                                                                                        action : 'uploadimagery',
                                                                                                                                        responseCode: 500,
                                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                                    }
                                                                                                                                    wlogger.error(error); // for error
                                                                                                                                    connection_ikon_cms.release();
                                                                                                                                    res.status(500).json(err.message);
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    if (Thumbs.length > 0) {
                                                                                                                                        var thumb_length = Thumbs.length
                                                                                                                                        thumnloop(0);
                                                                                                                                        function thumnloop(th) {
                                                                                                                                            var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                            var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                            // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                            th = th + 1;
                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                var info = {
                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                    action : 'uploadimagery',
                                                                                                                                                    responseCode: 200,
                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                                }
                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                thumnloop(th);
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    else {
                                                                                                                                        var info = {
                                                                                                                                            userName: req.session.UserName,
                                                                                                                                            action : 'uploadimagery',
                                                                                                                                            responseCode: 200,
                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                                        }
                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                            else {
                                                                                                                var info = {
                                                                                                                    userName: req.session.UserName,
                                                                                                                    action : 'uploadimagery',
                                                                                                                    responseCode: 200,
                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                                                                                }
                                                                                                                wlogger.info(info); // for information
                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                            }
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {
                                                                                formatloop(index);
                                                                            }
                                                                        }
                                                                        formatloop(0);
                                                                        function formatloop(index) {
                                                                            var width = Formats[index].width;
                                                                            var height = Formats[index].height;
                                                                            var match = _.find(Templates, function (val) { return val.width == width && val.height == height; })
                                                                            if (match) {
                                                                                var subfile = (fields.cm_id + '_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                var subfilepath = config.site_wallpaper_path + subfile;
                                                                                var save_path1 = config.site_base_path + subfilepath;
                                                                                if (!(width == fields.width && height == fields.height)) {
                                                                                    if (1280 == fields.width && 1280 == fields.height) {
                                                                                        var thumbname = (fields.cm_id + '_thumb_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                        if (width == 100 && height == 100 && IsThumb100) {
                                                                                            var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                            ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 100, height: 100 });
                                                                                            shell.exec('ffmpeg -y  -i ' + new_path + ' -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                        }
                                                                                        if (width == 125 && height == 125 && IsThumb125) {
                                                                                            var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                            ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 125, height: 125 });
                                                                                            shell.exec('ffmpeg -y  -i ' + new_path + ' -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                        }
                                                                                        if (width == 150 && height == 150 && IsThumb150) {
                                                                                            var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                            ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 150, height: 150 });
                                                                                            shell.exec('ffmpeg -y  -i ' + new_path + ' -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                        }
                                                                                    }
                                                                                    shell.exec('ffmpeg -y  -i ' + new_path + ' -vf scale=' + width + ':' + height + ' ' + save_path1);
                                                                                }
                                                                                var query = connection_ikon_cms.query('SELECT * FROM content_files WHERE cf_cm_id= ? and cf_template_id= ?', [fields.cm_id, match.ct_group_id], function (err, filedata) {
                                                                                    if (err) {
                                                                                        var error = {
                                                                                            userName: req.session.UserName,
                                                                                            action : 'uploadimagery',
                                                                                            responseCode: 500,
                                                                                            message: JSON.stringify(err.message)
                                                                                        }
                                                                                        wlogger.error(error); // for error
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        if (filedata.length > 0) {
                                                                                            endloop(index, length);
                                                                                        }
                                                                                        else {
                                                                                            var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                if (err) {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action : 'uploadimagery',
                                                                                                        responseCode: 500,
                                                                                                        message: JSON.stringify(err.message)
                                                                                                    }
                                                                                                    wlogger.error(error); // for error
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var file = {
                                                                                                        cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                                        cf_cm_id: fields.cm_id,
                                                                                                        file_category_id: fields.fileCategory,

                                                                                                        cf_original_processed: (fields.width == width && height == fields.height) ? 1 : 0,
                                                                                                        cf_url_base: save_path,
                                                                                                        cf_url: subfilepath,
                                                                                                        cf_absolute_url: save_path,
                                                                                                        cf_template_id: match.ct_group_id,
                                                                                                        cf_name: null,
                                                                                                        cf_name_alias: fields.count,
                                                                                                        cf_created_on: new Date(),
                                                                                                        cf_created_by: req.session.UserName,
                                                                                                        cf_modified_on: new Date(),
                                                                                                        cf_modified_by: req.session.UserName,
                                                                                                        cf_crud_isactive: 1
                                                                                                    };
                                                                                                    var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                        if (err) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action : 'uploadimagery',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err.message)
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            connection_ikon_cms.release();
                                                                                                            res.status(500).json(err.message);
                                                                                                        }
                                                                                                        else {
                                                                                                            endloop(index, length);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {
                                                                                endloop(index, length);
                                                                            }
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    });
                                                }
                                                else {
                                                    var info = {
                                                        userName: req.session.UserName,
                                                        action : 'uploadimagery',
                                                        responseCode: 200,
                                                        message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + " successfully."
                                                    }
                                                    wlogger.info(info); // for information
                                                    res.send({ success: true, message: 'File uploaded successfully', Files: [] });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadimagery',
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
                action : 'uploadimagery',
                responseCode: 500,
                message: 'InValid User session'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'uploadimagery',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc upload video content type file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadvideo = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var filenamedata = (fields.cm_id + '_' + fields.width + "_" + fields.height + '.' + file_ext).toLowerCase();
                        var save_path = config.site_video_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        var data = shell.exec('ffprobe -v error -show_entries stream=width,height  -of default=noprint_wrappers=1 ' + old_path);
                        if (data.code == 0) {
                            var val1 = data.output;
                            var width = val1.substring(val1.indexOf("=") + 1, val1.indexOf("\n"));
                            var val2 = val1.substring(val1.indexOf("\n") + 1);
                            var height = val2.substring(val2.indexOf("=") + 1, val2.indexOf("\n"));
                            if ((parseInt(height) == 360 && parseInt(width) == 640) || (parseInt(height) == 320 && parseInt(width) == 640)) {
                                fs.readFile(old_path, function (err, data) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadvideo',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for information
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.writeFile(new_path, data, function (err) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'uploadvideo',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for information
                                                res.status(500).json(err.message);
                                            } else {
                                                fs.unlink(old_path, function (err) {
                                                    if (err) {
                                                        var error = {
                                                            userName: req.session.UserName,
                                                            action : 'uploadvideo',
                                                            responseCode: 500,
                                                            message: JSON.stringify(err.message)
                                                        }
                                                        wlogger.error(error); // for information
                                                        res.status(500).json(err.message);
                                                    } else {
                                                        var IsThumb100 = true;
                                                        var IsThumb125 = true;
                                                        var IsThumb150 = true;
                                                        var ThumbFiles = [];
                                                        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                            function endloop() {
                                                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_files where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [fields.cm_id], function (err, result) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadvideo',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for information
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var cm_state = 1;
                                                                        if (result.length > 0) {
                                                                            if (result[0].cm_state == 4) {
                                                                                cm_state = 4;
                                                                            }
                                                                        }
                                                                        if (result.length >= 1 && cm_state != 4) {
                                                                            cm_state = 2;
                                                                        }
                                                                        if (ThumbFiles.length > 0) {
                                                                            var thumblength = ThumbFiles.length;
                                                                            UploadThumbData(0);
                                                                            function UploadThumbData(tf) {
                                                                                var thumb = {
                                                                                    cft_cm_id: fields.cm_id,
                                                                                    cft_thumbnail_size: ThumbFiles[tf].width + "*" + ThumbFiles[tf].height,
                                                                                    cft_thumbnail_img_browse: ThumbFiles[tf].filename,
                                                                                    cft_created_on: new Date(),
                                                                                    cft_created_by: req.session.UserName,
                                                                                    cft_modified_on: new Date(),
                                                                                    cft_modified_by: req.session.UserName,
                                                                                    cft_crud_isactive: 1

                                                                                }
                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                    if (err) {
                                                                                        var error = {
                                                                                            userName: req.session.UserName,
                                                                                            action : 'uploadvideo',
                                                                                            responseCode: 500,
                                                                                            message: JSON.stringify(err.message)
                                                                                        }
                                                                                        wlogger.error(error); // for information
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        tf = tf + 1;
                                                                                        if (thumblength == tf) {
                                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                                if (err) {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action : 'uploadvideo',
                                                                                                        responseCode: 500,
                                                                                                        message: JSON.stringify(err.message)
                                                                                                    }
                                                                                                    wlogger.error(error); // for information
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                        if (err) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action : 'uploadvideo',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err.message)
                                                                                                            }
                                                                                                            wlogger.error(error); // for information
                                                                                                            connection_ikon_cms.release();
                                                                                                            res.status(500).json(err.message);
                                                                                                        }
                                                                                                        else {
                                                                                                            if (cm_state == 2) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                    if (err) {
                                                                                                                        var error = {
                                                                                                                            userName: req.session.UserName,
                                                                                                                            action : 'uploadvideo',
                                                                                                                            responseCode: 500,
                                                                                                                            message: JSON.stringify(err.message)
                                                                                                                        }
                                                                                                                        wlogger.error(error); // for information
                                                                                                                        connection_ikon_cms.release();
                                                                                                                        res.status(500).json(err.message);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        if (files.length > 0) {
                                                                                                                            var file_length = files.length
                                                                                                                            fileloop(0);
                                                                                                                            function fileloop(f) {
                                                                                                                                var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                                                var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                                                //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                f = f + 1;
                                                                                                                                if (f == file_length) {
                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                        if (err) {
                                                                                                                                            var error = {
                                                                                                                                                userName: req.session.UserName,
                                                                                                                                                action : 'uploadvideo',
                                                                                                                                                responseCode: 500,
                                                                                                                                                message: JSON.stringify(err.message)
                                                                                                                                            }
                                                                                                                                            wlogger.error(error); // for information
                                                                                                                                            connection_ikon_cms.release();
                                                                                                                                            res.status(500).json(err.message);
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            if (Thumbs.length > 0) {
                                                                                                                                                var thumb_length = Thumbs.length
                                                                                                                                                thumnloop(0);
                                                                                                                                                function thumnloop(th) {
                                                                                                                                                    var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                    var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                    th = th + 1;
                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                        var info = {
                                                                                                                                                            userName: req.session.UserName,
                                                                                                                                                            action : 'uploadvideo',
                                                                                                                                                            responseCode: 200,
                                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                                        }
                                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        thumnloop(th);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                var info = {
                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                    action : 'uploadvideo',
                                                                                                                                                    responseCode: 200,
                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                                }
                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    fileloop(f);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                if (err) {
                                                                                                                                    var error = {
                                                                                                                                        userName: req.session.UserName,
                                                                                                                                        action : 'uploadvideo',
                                                                                                                                        responseCode: 500,
                                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                                    }
                                                                                                                                    wlogger.error(error); // for information
                                                                                                                                    connection_ikon_cms.release();
                                                                                                                                    res.status(500).json(err.message);
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    if (Thumbs.length > 0) {
                                                                                                                                        var thumb_length = Thumbs.length
                                                                                                                                        thumnloop(0);
                                                                                                                                        function thumnloop(th) {
                                                                                                                                            var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                            var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                            //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                            th = th + 1;
                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                var info = {
                                                                                                                                                    userName: req.session.UserName,
                                                                                                                                                    action : 'uploadvideo',
                                                                                                                                                    responseCode: 200,
                                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                                }
                                                                                                                                                wlogger.info(info); // for information
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                thumnloop(th);
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    else {
                                                                                                                                        var info = {
                                                                                                                                            userName: req.session.UserName,
                                                                                                                                            action : 'uploadvideo',
                                                                                                                                            responseCode: 200,
                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                        }
                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                            else {
                                                                                                                var info = {
                                                                                                                    userName: req.session.UserName,
                                                                                                                    action : 'uploadvideo',
                                                                                                                    responseCode: 200,
                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                }
                                                                                                                wlogger.info(info); // for information
                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                            }
                                                                                                        }
                                                                                                    });

                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            UploadThumbData(tf);
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }
                                                                        }
                                                                        else {
                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                if (err) {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action : 'uploadvideo',
                                                                                        responseCode: 500,
                                                                                        message: JSON.stringify(err.message)
                                                                                    }
                                                                                    wlogger.error(error); // for information
                                                                                    connection_ikon_cms.release();
                                                                                    res.status(500).json(err.message);
                                                                                }
                                                                                else {
                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                        if (err) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action : 'uploadvideo',
                                                                                                responseCode: 500,
                                                                                                message: JSON.stringify(err.message)
                                                                                            }
                                                                                            wlogger.error(error); // for information
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            if (cm_state == 2) {
                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                    if (err) {
                                                                                                        var error = {
                                                                                                            userName: req.session.UserName,
                                                                                                            action : 'uploadvideo',
                                                                                                            responseCode: 500,
                                                                                                            message: JSON.stringify(err.message)
                                                                                                        }
                                                                                                        wlogger.error(error); // for information
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.status(500).json(err.message);
                                                                                                    }
                                                                                                    else {
                                                                                                        if (files.length > 0) {
                                                                                                            var file_length = files.length
                                                                                                            fileloop(0);
                                                                                                            function fileloop(f) {
                                                                                                                var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                                var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                                // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                f = f + 1;
                                                                                                                if (f == file_length) {
                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                        if (err) {
                                                                                                                            var error = {
                                                                                                                                userName: req.session.UserName,
                                                                                                                                action : 'uploadvideo',
                                                                                                                                responseCode: 500,
                                                                                                                                message: JSON.stringify(err.message)
                                                                                                                            }
                                                                                                                            wlogger.error(error); // for information
                                                                                                                            connection_ikon_cms.release();
                                                                                                                            res.status(500).json(err.message);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            if (Thumbs.length > 0) {
                                                                                                                                var thumb_length = Thumbs.length
                                                                                                                                thumnloop(0);
                                                                                                                                function thumnloop(th) {
                                                                                                                                    var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                    var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                    th = th + 1;
                                                                                                                                    if (th == thumb_length) {
                                                                                                                                        var info = {
                                                                                                                                            userName: req.session.UserName,
                                                                                                                                            action : 'uploadvideo',
                                                                                                                                            responseCode: 200,
                                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                        }
                                                                                                                                        wlogger.info(info); // for information
                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                    }
                                                                                                                                    else {
                                                                                                                                        thumnloop(th);
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                var info = {
                                                                                                                                    userName: req.session.UserName,
                                                                                                                                    action : 'uploadvideo',
                                                                                                                                    responseCode: 200,
                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                }
                                                                                                                                wlogger.info(info); // for information
                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                else {
                                                                                                                    fileloop(f);
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        else {
                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                if (err) {
                                                                                                                    var error = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action : 'uploadvideo',
                                                                                                                        responseCode: 500,
                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                    }
                                                                                                                    wlogger.error(error); // for information
                                                                                                                    connection_ikon_cms.release();
                                                                                                                    res.status(500).json(err.message);
                                                                                                                }
                                                                                                                else {
                                                                                                                    if (Thumbs.length > 0) {
                                                                                                                        var thumb_length = Thumbs.length
                                                                                                                        thumnloop(0);
                                                                                                                        function thumnloop(th) {
                                                                                                                            var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                            var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                            //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                            th = th + 1;
                                                                                                                            if (th == thumb_length) {
                                                                                                                                var info = {
                                                                                                                                    userName: req.session.UserName,
                                                                                                                                    action : 'uploadvideo',
                                                                                                                                    responseCode: 200,
                                                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                                }
                                                                                                                                wlogger.info(info); // for information
                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                thumnloop(th);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        var info = {
                                                                                                                            userName: req.session.UserName,
                                                                                                                            action : 'uploadvideo',
                                                                                                                            responseCode: 200,
                                                                                                                            message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                                        }
                                                                                                                        wlogger.info(info); // for information
                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                    }
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                var info = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action : 'uploadvideo',
                                                                                                    responseCode: 200,
                                                                                                    message: 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + '.'
                                                                                                }
                                                                                                wlogger.info(info); // for information
                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                            }
                                                                                        }
                                                                                    });

                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                });

                                                            }
                                                            var query = connection_ikon_cms.query('SELECT * FROM content_files_thumbnail WHERE cft_cm_id= ? ', [fields.cm_id], function (err, filedata) {
                                                                if (err) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action : 'uploadvideo',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for information
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    if (filedata.length > 0) {
                                                                        filedata.forEach(function (val) {
                                                                            if (val.cft_thumbnail_size == "100*100") {
                                                                                IsThumb100 = false;
                                                                            }
                                                                            if (val.cft_thumbnail_size == "125*125") {
                                                                                IsThumb125 = false;
                                                                            }
                                                                            if (val.cft_thumbnail_size == "150*150") {
                                                                                IsThumb150 = false;
                                                                            }
                                                                        })
                                                                    }
                                                                    if (IsThumb100) {
                                                                        var subfile = (fields.cm_id + '_thumb_' + 100 + "_" + 100 + '.' + 'jpg').toLowerCase();
                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile, width: 100, height: 100 });
                                                                        var thumbpath = config.site_base_path + config.site_thumb_path + subfile;
                                                                        shell.exec('ffmpeg -y -i ' + new_path + ' -ss 00:00:11.435 -s 100x100 -vframes 1 ' + thumbpath);
                                                                    }
                                                                    if (IsThumb125) {
                                                                        var subfile = (fields.cm_id + '_thumb_' + 125 + "_" + 125 + '.' + 'jpg').toLowerCase();
                                                                        var thumbpath1 = config.site_base_path + config.site_thumb_path + subfile;
                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile, width: 125, height: 125 });
                                                                        shell.exec('ffmpeg -y -i ' + new_path + ' -ss 00:00:11.435 -s 125x125 -vframes 1 ' + thumbpath1);
                                                                    }
                                                                    if (IsThumb150) {
                                                                        var subfile = (fields.cm_id + '_thumb_' + 150 + "_" + 150 + '.' + 'jpg').toLowerCase();
                                                                        var thumbpath2 = config.site_base_path + config.site_thumb_path + subfile;
                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile, width: 150, height: 150 });
                                                                        shell.exec('ffmpeg -y -i ' + new_path + ' -ss 00:00:11.435 -s 150x150 -vframes 1 ' + thumbpath2);
                                                                    }
                                                                    var query = connection_ikon_cms.query('SELECT * FROM content_files WHERE cf_cm_id= ? and cf_template_id= ?', [fields.cm_id, fields.ct_group_id], function (err, filedata) {
                                                                        if (err) {
                                                                            var error = {
                                                                                userName: req.session.UserName,
                                                                                action : 'uploadvideo',
                                                                                responseCode: 500,
                                                                                message: JSON.stringify(err.message)
                                                                            }
                                                                            wlogger.error(error); // for information
                                                                            connection_ikon_cms.release();
                                                                            res.status(500).json(err.message);
                                                                        }
                                                                        else {
                                                                            if (filedata.length > 0) {
                                                                                endloop();
                                                                            }
                                                                            else {
                                                                                var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                    if (err) {
                                                                                        var error = {
                                                                                            userName: req.session.UserName,
                                                                                            action : 'uploadvideo',
                                                                                            responseCode: 500,
                                                                                            message: JSON.stringify(err.message)
                                                                                        }
                                                                                        wlogger.error(error); // for information
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        var file = {
                                                                                            cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                            cf_cm_id: fields.cm_id,
                                                                                            file_category_id: fields.fileCategory,

                                                                                            cf_original_processed: 1,
                                                                                            cf_url_base: save_path,
                                                                                            cf_url: save_path,
                                                                                            cf_absolute_url: save_path,
                                                                                            cf_template_id: fields.ct_group_id,
                                                                                            cf_name: null,
                                                                                            cf_name_alias: fields.count,
                                                                                            cf_created_on: new Date(),
                                                                                            cf_created_by: req.session.UserName,
                                                                                            cf_modified_on: new Date(),
                                                                                            cf_modified_by: req.session.UserName,
                                                                                            cf_crud_isactive: 1
                                                                                        };
                                                                                        var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                            if (err) {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action : 'uploadvideo',
                                                                                                    responseCode: 500,
                                                                                                    message: JSON.stringify(err.message)
                                                                                                }
                                                                                                wlogger.error(error); // for information
                                                                                                connection_ikon_cms.release();
                                                                                                res.status(500).json(err.message);
                                                                                            }
                                                                                            else {
                                                                                                endloop();
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                fs.unlink(old_path, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadvideo',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for information
                                        res.status(500).json(err.message);
                                    } else {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadvideo',
                                            responseCode: 500,
                                            message: 'Video File Dimension must be 640x360'
                                        }
                                        wlogger.error(error); // for information
                                        res.send({ success: false, message: 'Video File Dimension must be 640x360' });
                                    }
                                });
                            }
                        }
                        else {
                            fs.unlink(old_path, function (err) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'uploadvideo',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for information
                                    res.status(500).json(err.message);
                                } else {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'uploadvideo',
                                        responseCode: 500,
                                        message: 'Error in Video FileUpload'
                                    }
                                    wlogger.error(error); // for information
                                    res.send({ success: false, message: 'Error in Video FileUpload' });
                                }
                            });
                        }
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadvideo',
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
                action : 'uploadvideo',
                responseCode: 500,
                message: 'InValid User session'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'uploadvideo',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc upload audio content type file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadaudio = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var filenamedata = (fields.cm_id + "_0" + '_' + fields.other + '.' + file_ext).toLowerCase();
                        var save_path = config.site_audio_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        var temp_path = config.site_temp_path + filenamedata;

                        var data = shell.exec('ffprobe -v error -show_entries stream=bit_rate  -of default=noprint_wrappers=1 ' + old_path);
                        if (data.code == 0) {
                            var val1 = data.output;
                            var bitrate = parseInt(val1.substring(val1.indexOf("=") + 1, val1.indexOf("\n"))/1000);
                            //if (parseInt(bitrate) == 128000) {
                            fs.readFile(old_path, function (err, data) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'uploadaudio',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for err
                                    res.status(500).json(err.message);
                                } else {
                                    fs.writeFile(new_path, data, function (err) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action : 'uploadaudio',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for err
                                            res.status(500).json(err.message);
                                        } else {
                                            shell.exec('chmod 777 ' + new_path);
                                            shell.exec('cp "' + new_path + '" "' + temp_path + '"');
                                            shell.exec('chmod 777 ' + temp_path);

                                            fs.unlink(old_path, function (err) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'uploadaudio',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for err
                                                    res.status(500).json(err.message);
                                                } else {
                                                    mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                        async.waterfall([
                                                            function (callback) {
                                                                var query = connection_ikon_cms.query('select * from content_template where ct_param_value in ("bitrate")', function (err, templates) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'uploadaudio',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for err
                                                                        callback(err, null);
                                                                    }
                                                                    else {
                                                                        callback(null, templates);
                                                                    }
                                                                })
                                                            },
                                                            function (templates, callback) {
                                                                /*insert original file*/
                                                                getClosestTemplateIdBitrate(templates, bitrate, function (err, closestBitRate) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadaudio',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for err
                                                                        callback(err, null);
                                                                    }
                                                                    else {
                                                                        addUpdateAudioFile(connection_ikon_cms, save_path, fields, closestBitRate['templateId'], 1,req.session, function (err, data) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action : 'uploadaudio',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for err
                                                                                //callback(err, {templates:metadata.templates, status:metadata.status, closestBitRate: closestBitRate['bitrate']});
                                                                                callback(err, {templates:templates, closestBitRate: closestBitRate['bitrate']});
                                                                            }
                                                                            else {
                                                                                var info = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'uploadaudio',
                                                                                    responseCode: 200,
                                                                                    message: "Original File along with formatted Audio Files uploaded successfully :" + save_path
                                                                                }
                                                                                wlogger.info(info); // for information
                                                                                //callback(null,{templates:metadata.templates, status:metadata.status, closestBitRate: closestBitRate['bitrate']});
                                                                                callback(err, {templates:templates, closestBitRate: closestBitRate['bitrate']});
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            },
                                                            function (metadata, callback) {
                                                                updateMetadata(connection_ikon_cms,fields,req.session, function (err, status) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'uploadaudio',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for err
                                                                        callback(err, null);
                                                                    }
                                                                    else {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'uploadaudio',
                                                                            responseCode: 200,
                                                                            message: "Metadata updated to state - "+status
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, {templates:metadata.templates, status:status, closestBitRate:metadata.closestBitRate});
                                                                    }
                                                                })
                                                            },
                                                            function (metadata, callback) {
                                                                /*insert converted file*/
                                                                function convertFile(cnt) {
                                                                    var j = cnt;
                                                                    if(metadata.closestBitRate > metadata.templates[j].ct_param) {

                                                                        var filenamedata = (fields.cm_id + "_0" + '_' + metadata.templates[j].ct_param + '.' + file_ext).toLowerCase();
                                                                        var audio_path = config.site_audio_path + filenamedata;
                                                                        var save_path = config.site_base_path + audio_path;
                                                                        var temp_path = config.site_temp_path + filenamedata;
                                                                        shell.exec('rm ! -f ' + save_path);

                                                                        var output = shell.exec('ffmpeg -i ' + new_path + ' -vn -ar 44100 -ac 2 -ab ' + metadata.templates[j].ct_param + 'k -f mp3 ' + save_path);
                                                                        shell.exec('cp "' + save_path + '" "' + temp_path + '"');
                                                                        shell.exec('chmod 777 ' + temp_path);

                                                                        if (metadata.status == 2) {
                                                                            addUpdateAudioFile(connection_ikon_cms, audio_path, fields, metadata.templates[j].ct_group_id, 0, req.session, function (err, data) {
                                                                                if (err) {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'uploadaudio',
                                                                                        responseCode: 500,
                                                                                        message: JSON.stringify(err.message)
                                                                                    }
                                                                                    wlogger.error(error); // for err
                                                                                    callback(err, null);
                                                                                }
                                                                                else {
                                                                                    cnt = cnt + 1;
                                                                                    if (cnt < metadata.templates.length) {
                                                                                        convertFile(cnt);
                                                                                    } else {
                                                                                        var info = {
                                                                                            userName: req.session.UserName,
                                                                                            action: 'uploadaudio',
                                                                                            responseCode: 200,
                                                                                            message: "Converted Audio File uploaded successfully for bitrate " +metadata.templates[j].ct_param + " :" + audio_path
                                                                                        }
                                                                                        wlogger.info(info); // for information
                                                                                        callback(null, metadata);
                                                                                        console.log("Converted Audio File uploaded successfully for bitrate " +metadata.templates[j].ct_param + " :" + audio_path);
                                                                                    }
                                                                                }
                                                                            })
                                                                        } else {
                                                                            cnt = cnt + 1;
                                                                            if (cnt < (metadata.templates.length)) {
                                                                                convertFile(cnt);
                                                                            }else{
                                                                                callback(null, metadata);
                                                                            }
                                                                        }
                                                                    }else{
                                                                        cnt = cnt + 1;
                                                                        if (cnt < (metadata.templates.length)) {
                                                                            convertFile(cnt);
                                                                        }else{
                                                                            callback(null, metadata);
                                                                        }
                                                                    }
                                                                }
                                                                convertFile(0);
                                                            }
                                                        ], function (err, results) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action : 'uploadaudio',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err.message)
                                                                }
                                                                wlogger.error(error); // for err
                                                                connection_ikon_cms.release();
                                                                res.status(500).json(err.message);
                                                            } else {
                                                                var info = {
                                                                    userName: req.session.UserName,
                                                                    action: 'uploadaudio',
                                                                    responseCode: 200,
                                                                    message: 'Audio File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                }
                                                                wlogger.info(info); // for information

                                                                AdminLog.adminlog(connection_ikon_cms, 'Audio File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                res.send({ success: true, message: 'Audio File uploaded successfully', Files: 'test' });
                                                            }
                                                        })
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            fs.unlink(old_path, function (err) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'uploadaudio',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for err
                                    res.status(500).json(err.message);
                                } else {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'uploadaudio',
                                        responseCode: 500,
                                        message: 'Error in Audio FileUpload'
                                    }
                                    wlogger.error(error); // for err
                                    res.send({ success: false, message: 'Error in Audio FileUpload' });
                                }
                            });
                        }
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadaudio',
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
                action : 'uploadaudio',
                responseCode: 500,
                message: 'Not Valid User session'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'uploadaudio',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc upload apps & games content type file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadappsgame = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.lastIndexOf('.'));
                        var filenamedata = (fields.cm_id + '_' + 'app' + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();
                        var save_path = config.site_game_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'uploadappsgame',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for err
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadappsgame',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for err
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    function endloop() {
                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM content_files where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id) inner join( select * from content_template where ct_param_value="app")template on(template.ct_group_id = cf.cf_template_id)', [fields.cm_id], function (err, result) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action : 'uploadappsgame',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err.message)
                                                                }
                                                                wlogger.error(error); // for err
                                                                connection_ikon_cms.release();
                                                                res.status(500).json(err.message);
                                                            }
                                                            else {
                                                                var cm_state = 1;
                                                                if (result.length > 0) {
                                                                    if (result[0].cm_state == 4) {
                                                                        cm_state = 4;
                                                                    }
                                                                }
                                                                if (result.length >= 1 && cm_state != 4) {
                                                                    cm_state = 2;
                                                                }
                                                                var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadappsgame',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for err
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action : 'uploadappsgame',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for err
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                if (cm_state == 2) {
                                                                                    var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                        if (err) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action : 'uploadappsgame',
                                                                                                responseCode: 500,
                                                                                                message: JSON.stringify(err.message)
                                                                                            }
                                                                                            wlogger.error(error); // for err
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            if (files.length > 0) {
                                                                                                var file_length = files.length
                                                                                                fileloop(0);
                                                                                                function fileloop(f) {
                                                                                                    var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                    var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                    f = f + 1;
                                                                                                    if (f == file_length) {
                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                            if (err) {
                                                                                                                var error = {
                                                                                                                    userName: req.session.UserName,
                                                                                                                    action : 'uploadappsgame',
                                                                                                                    responseCode: 500,
                                                                                                                    message: JSON.stringify(err.message)
                                                                                                                }
                                                                                                                wlogger.error(error); // for err
                                                                                                                connection_ikon_cms.release();
                                                                                                                res.status(500).json(err.message);
                                                                                                            }
                                                                                                            else {
                                                                                                                if (Thumbs.length > 0) {
                                                                                                                    var thumb_length = Thumbs.length
                                                                                                                    thumnloop(0);
                                                                                                                    function thumnloop(th) {
                                                                                                                        var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                        var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                        //  shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                        shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                        shell.exec('chmod 777 ' + newpath);
                                                                                                                        th = th + 1;
                                                                                                                        if (th == thumb_length) {
                                                                                                                            var info = {
                                                                                                                                userName: req.session.UserName,
                                                                                                                                action: 'uploadappsgame',
                                                                                                                                responseCode: 200,
                                                                                                                                message: 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                                            }
                                                                                                                            wlogger.info(info); // for information
                                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                                            res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            thumnloop(th);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                else {
                                                                                                                    var info = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action: 'uploadappsgame',
                                                                                                                        responseCode: 200,
                                                                                                                        message: 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                                    }
                                                                                                                    wlogger.info(info); // for information
                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                                    res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                                }
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        fileloop(f);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                    if (err) {
                                                                                                        var error = {
                                                                                                            userName: req.session.UserName,
                                                                                                            action : 'uploadappsgame',
                                                                                                            responseCode: 500,
                                                                                                            message: JSON.stringify(err.message)
                                                                                                        }
                                                                                                        wlogger.error(error); // for err
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.status(500).json(err.message);
                                                                                                    }
                                                                                                    else {
                                                                                                        if (Thumbs.length > 0) {
                                                                                                            var thumb_length = Thumbs.length
                                                                                                            thumnloop(0);
                                                                                                            function thumnloop(th) {
                                                                                                                var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                th = th + 1;
                                                                                                                if (th == thumb_length) {
                                                                                                                    var info = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action: 'uploadappsgame',
                                                                                                                        responseCode: 200,
                                                                                                                        message: 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                                    }
                                                                                                                    wlogger.info(info); // for information
                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                                    res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                                }
                                                                                                                else {
                                                                                                                    thumnloop(th);
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        else {
                                                                                                            var info = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'uploadappsgame',
                                                                                                                responseCode: 200,
                                                                                                                message: 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                            }
                                                                                                            wlogger.info(info); // for information
                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                            res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                        }
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var info = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'uploadappsgame',
                                                                                        responseCode: 200,
                                                                                        message: 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                    }
                                                                                    wlogger.info(info); // for information
                                                                                    AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                    res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                }
                                                                            }
                                                                        });

                                                                    }
                                                                });
                                                            }
                                                        });

                                                    }
                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'uploadappsgame',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for err
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var fileid = result[0].id == null ? 1 : parseInt(result[0].id + 1);
                                                            var file = {
                                                                cf_id: fileid,
                                                                cf_cm_id: fields.cm_id,
                                                                file_category_id: fields.fileCategory,

                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_name_alias: fields.count,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                if (err) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action : 'uploadappsgame',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for err
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var HandSets = fields.Handsets.split(',');
                                                                    if (HandSets.length > 0) {
                                                                        handsetloop(0)
                                                                        function handsetloop(hl) {
                                                                            var query = connection_ikon_cms.query('SELECT MAX(cahg_id) as id FROM content_app_handset_group', function (err, result) {
                                                                                if (err) {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action : 'uploadappsgame',
                                                                                        responseCode: 500,
                                                                                        message: JSON.stringify(err.message)
                                                                                    }
                                                                                    wlogger.error(error); // for err
                                                                                    connection_ikon_cms.release();
                                                                                    res.status(500).json(err.message);
                                                                                }
                                                                                else {
                                                                                    var handset = {
                                                                                        cahg_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                        cahg_app_id: fileid,
                                                                                        cahg_file_id: 1,
                                                                                        cahg_handset_id: HandSets[hl],
                                                                                        cahg_created_on: new Date(),
                                                                                        cahg_created_by: req.session.UserName,
                                                                                        cahg_modified_on: new Date(),
                                                                                        cahg_modified_by: req.session.UserName,
                                                                                        cahg_crud_isactive: 1
                                                                                    }
                                                                                    var query = connection_ikon_cms.query('INSERT INTO content_app_handset_group SET ?', handset, function (err, result) {
                                                                                        if (err) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action : 'uploadappsgame',
                                                                                                responseCode: 500,
                                                                                                message: JSON.stringify(err.message)
                                                                                            }
                                                                                            wlogger.error(error); // for err
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            hl = hl + 1;
                                                                                            if (HandSets.length == hl) {
                                                                                                endloop();
                                                                                            }
                                                                                            else {
                                                                                                handsetloop(hl);
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                    else {
                                                                        endloop();
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadappsgame',
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
                action : 'uploadappsgame',
                responseCode: 500,
                message: 'Not Valid User session'
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc upload text content type files.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadtext = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var fileCategory = (fields.fileCategory == 1) ?  '':(fields.fileCategory == 2) ?'_supporting':'_preview';

                        var filenamedata = (fields.cm_id + '_' + fields.ct_param_value + fileCategory + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();
                        var save_path = ((fields.fileCategory == 1) ? config.site_text_path :(fields.fileCategory == 2) ? config.supporting_text_path : config.preview_text_path)  + filenamedata;
                       // console.log(save_path); process.exit(0);
                       //var save_path = config.site_text_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'uploadtext',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for err
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadtext',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for err
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'uploadtext',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for err
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    function endloop() {
                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id,cm_language,cm_state FROM content_metadata where cm_id = ? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) left outer join (SELECT group_concat(cf_url) as url,cf_template_id,cf_cm_id FROM content_files group by cf_template_id,cf_cm_id  )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id)', [fields.cm_id], function (err, result) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action : 'uploadtext',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err.message)
                                                                }
                                                                wlogger.error(error); // for err
                                                                connection_ikon_cms.release();
                                                                res.status(500).json(err.message);
                                                            }
                                                            else {
                                                                var match = _.find(result, function (val) { return val.url == null });
                                                                var cm_state = 1;
                                                                if (result.length > 0) {
                                                                    if (result[0].cm_state == 4) {
                                                                        cm_state = 4;
                                                                    }
                                                                }
                                                                if (match && cm_state != 4) {
                                                                    cm_state = 1;
                                                                }
                                                                else if (result.length > 0 && cm_state != 4) {
                                                                    cm_state = 2;
                                                                }
                                                                var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action : 'uploadtext',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for err
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action : 'uploadtext',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for err
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                if (cm_state == 2) {
                                                                                    var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                        if (err) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action : 'uploadtext',
                                                                                                responseCode: 500,
                                                                                                message: JSON.stringify(err.message)
                                                                                            }
                                                                                            wlogger.error(error); // for err
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            if (files.length > 0) {
                                                                                                var file_length = files.length
                                                                                                fileloop(0);
                                                                                                function fileloop(f) {
                                                                                                    var oldpath = config.site_base_path + files[f].cf_url;
                                                                                                    var newpath = config.site_temp_path + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                    f = f + 1;
                                                                                                    if (f == file_length) {
                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                            if (err) {
                                                                                                                var error = {
                                                                                                                    userName: req.session.UserName,
                                                                                                                    action : 'uploadtext',
                                                                                                                    responseCode: 500,
                                                                                                                    message: JSON.stringify(err.message)
                                                                                                                }
                                                                                                                wlogger.error(error); // for err
                                                                                                                connection_ikon_cms.release();
                                                                                                                res.status(500).json(err.message);
                                                                                                            }
                                                                                                            else {
                                                                                                                if (Thumbs.length > 0) {
                                                                                                                    var thumb_length = Thumbs.length
                                                                                                                    thumnloop(0);
                                                                                                                    function thumnloop(th) {
                                                                                                                        var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                        var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                        shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                        shell.exec('chmod 777 ' + newpath);
                                                                                                                        //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                        th = th + 1;
                                                                                                                        if (th == thumb_length) {
                                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                            res.send({ success: true, message: 'Text File uploaded successfully', Files: Files });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            thumnloop(th);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                else {
                                                                                                                    var info = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action : 'uploadtext',
                                                                                                                        responseCode: 200,
                                                                                                                        message: 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                                    }
                                                                                                                    wlogger.info(info); // for information
                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                    res.send({ success: true, message: 'Text File uploaded successfully', Files: Files });
                                                                                                                }
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        fileloop(f);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                    if (err) {
                                                                                                        var error = {
                                                                                                            userName: req.session.UserName,
                                                                                                            action : 'uploadtext',
                                                                                                            responseCode: 500,
                                                                                                            message: JSON.stringify(err.message)
                                                                                                        }
                                                                                                        wlogger.error(error); // for err
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.status(500).json(err.message);
                                                                                                    }
                                                                                                    else {
                                                                                                        if (Thumbs.length > 0) {
                                                                                                            var thumb_length = Thumbs.length
                                                                                                            thumnloop(0);
                                                                                                            function thumnloop(th) {
                                                                                                                var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                th = th + 1;
                                                                                                                if (th == thumb_length) {
                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                    res.send({ success: true, message: 'Text File uploaded successfully', Files: Files });
                                                                                                                }
                                                                                                                else {
                                                                                                                    thumnloop(th);
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        else {
                                                                                                            var info = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action : 'uploadtext',
                                                                                                                responseCode: 200,
                                                                                                                message: 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                                            }
                                                                                                            wlogger.info(info); // for information
                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                            res.send({ success: true, message: 'Text File uploaded successfully', Files: Files });
                                                                                                        }
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var info = {
                                                                                        userName: req.session.UserName,
                                                                                        action : 'uploadtext',
                                                                                        responseCode: 200,
                                                                                        message: 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                                    }
                                                                                    AdminLog.adminlog(connection_ikon_cms, 'Text File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                    res.send({ success: true, message: 'Text File uploaded successfully', Files: Files });
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'uploadtext',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for err
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var data = shell.exec('ffprobe -v error -show_entries stream=width,height,bit_rate,duration -show_entries format=size -of default=noprint_wrappers=1 ' + new_path);

                                                            if (data.code == 0) {
                                                                var endOfLine = require('os').EOL;
                                                                var fileInfo = data.output.split(endOfLine);
                                                                fileInfo = fileInfo.filter(function (n) {
                                                                    return (n != '' && n != 'N/A')
                                                                });
                                                                var fileData = {};
                                                                var info = [];
                                                                fileInfo.forEach(function (val) {
                                                                    info = val.split("=");
                                                                    if (info[1] != 'N/A' && info[1] != '') {
                                                                        fileData[info[0]] = parseInt(info[1]);
                                                                    }
                                                                })

                                                                var bitRate = fileData.size;
                                                            }else{
                                                                var bitRate = '';
                                                            }

                                                            var file = {
                                                                cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                cf_cm_id: fields.cm_id,
                                                                file_category_id: fields.fileCategory,

                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_bitrate: bitRate,
                                                                cf_name_alias: fields.count,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                            //console.log(file)
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                if (err) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action : 'uploadtext',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for err
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    endloop();
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadtext',
                    responseCode: 500,
                    message: "Invalid Username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }
        else {
            var error = {
                userName: "Unknown User",
                action : 'uploadtext',
                responseCode: 500,
                message: "Invalid User session"
            }
            wlogger.error(error); // for error
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'uploadtext',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

/**
 * @class
 * @classdesc upload imagery/audio/video content type files as supporting and preview.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.uploadotherfiles = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    console.log('uploadotherfiles');

                    if (files.file) {
                        var date = new Date();
                        var ticks = date.getTime();
                        var old_path = files.file.path;
                        var file_size = files.file.size;
                        var file_ext = files.file.name.split('.').pop();
                        var index = old_path.lastIndexOf('/') + 1;
                        var file_name = old_path.substr(index);
                        var file_namepath = files.file.name.substring(0, files.file.name.indexOf('.'));
                        var fileCategory = (fields.fileCategory == 1) ?  '':(fields.fileCategory == 2) ?'_supporting':'_preview';

                        var filenamedata = (fields.type != 'text')? (fields.cm_id + '_' + fields.type + fileCategory + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase() : (fields.cm_id + '_' + fields.ct_param_value + fileCategory + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();
                        //var filenamedata = (fields.type != 'text')? (fields.cm_id + '_' + fields.type +  preview + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase() : (fields.cm_id + '_' + fields.ct_param_value + preview + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();

                        var save_path = ((fields.fileCategory == 1) ?  (fields.type == 'image' ? config.site_wallpaper_path : (fields.type == 'audio' ? config.site_audio_path :(fields.type == 'video' ? config.site_video_path:config.site_text_path ))) :(fields.fileCategory == 2) ? (fields.type == 'image' ? config.supporting_image_path : (fields.type == 'audio' ? config.supporting_audio_path :(fields.type == 'video' ? config.supporting_video_path:config.supporting_text_path ))) :(fields.type == 'image' ? config.preview_image_path : (fields.type == 'audio' ? config.preview_audio_path :(fields.type == 'video' ? config.preview_video_path:config.preview_text_path ))) ) + filenamedata;
//console.log(save_path); process.exit(0);
                        //var save_path = (fields.type == 'image' ? config.site_wallpaper_path : (fields.type == 'audio' ? config.site_audio_path :(fields.type == 'video' ? config.site_video_path:config.site_text_path ))) + filenamedata;
                        var new_path = config.site_base_path + save_path;

                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'uploadotherfiles',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for err
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'uploadotherfiles',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for err
                                        res.status(500).json(err.message);
                                    } else {
                                        var temp_path = config.site_temp_path + filenamedata;
                                      //  console.log(temp_path);
                                        shell.exec('cp "' + new_path + '" "' + temp_path + '"');
                                        shell.exec('chmod 777 ' + temp_path);
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'uploadotherfiles',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for err
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'uploadotherfiles',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for err
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var data = shell.exec('ffprobe -v error -show_entries stream=width,height,bit_rate,duration -show_entries format=size -of default=noprint_wrappers=1 ' + new_path);

                                                            if (data.code == 0) {
                                                                var endOfLine = require('os').EOL;
                                                                var fileInfo = data.output.split(endOfLine);
                                                                fileInfo = fileInfo.filter(function(n){ return (n != ''  &&  n != 'N/A') });
                                                                var fileData = {};
                                                                var info = [];
                                                                fileInfo.forEach(function(val){
                                                                    info = val.split("=");
                                                                    if(info[1] != 'N/A' && info[1] != ''){
                                                                        fileData[info[0]] = parseInt(info[1]);
                                                                    }
                                                                })
                                                                if(fields.type == 'image'){
                                                                    var bitRate = fileData.width +"x"+ fileData.height;
                                                                } else if (fields.type == 'audio'){
                                                                    var bitRate = parseInt(fileData.bit_rate / 1000);
                                                                } else if(fields.type == 'video'){
                                                                    var bitRate = parseInt(fileData.size/1024);
                                                                    //var bitRate = parseInt(fileData.duration);
                                                                }else{
                                                                    var bitRate = fileData.size;
                                                                }
                                                            }else{
                                                                var bitRate = '';
                                                            }
                                                            var file = {
                                                                cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                cf_cm_id: fields.cm_id,
                                                                file_category_id: fields.fileCategory,
                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_bitrate: bitRate,
                                                                cf_name_alias: fields.count,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                         //   console.log(file)
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                //console.log(query.sql);
                                                                if (err) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action : 'uploadotherfiles',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for err
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                        if (err) {
                                                                            var error = {
                                                                                userName: req.session.UserName,
                                                                                action : 'uploadotherfiles',
                                                                                responseCode: 500,
                                                                                message: JSON.stringify(err.message)
                                                                            }
                                                                            wlogger.error(error); // for err
                                                                            connection_ikon_cms.release();
                                                                            res.status(500).json(err.message);
                                                                        }
                                                                        else {
                                                                            var info = {
                                                                                userName: req.session.UserName,
                                                                                action : 'uploadotherfiles',
                                                                                responseCode: 200,
                                                                                message: 'Supporting File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                            }
                                                                            wlogger.info(info); // for information
                                                                            AdminLog.adminlog(connection_ikon_cms, 'Supporting File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Supporting File Upload", req.session.UserName, true);
                                                                            res.send({ success: true, message: 'File uploaded successfully', Files: file });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        var error = {
                            userName: req.session.UserName,
                            action : 'uploadotherfiles',
                            responseCode: 500,
                            message: 'File not found'
                        }
                        wlogger.error(error); // for err
                        res.status(500).json("file not found");
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadotherfiles',
                    responseCode: 500,
                    message: 'Invalid Username'
                }
                wlogger.error(error); // for err
                res.redirect('/accountlogin');
            }
        }
        else {
            var error = {
                userName: "Unknown User",
                action : 'uploadotherfiles',
                responseCode: 500,
                message: 'Invalid User session'
            }
            wlogger.error(error); // for err
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'getcontentcatalog',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

/**
 * @class
 * @classdesc replave existing file of any content type.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.replaceFile = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    //console.log(fields)
                    if (files.file) {
                        var filename = files.file.name;
                        var old_path = files.file.path;
                        new_path = config.site_base_path + fields.filepath;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'replaceFile',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                res.status(500).json(err.message);
                            } else {
                                shell.exec('chmod 777 ' + new_path);

                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action : 'replaceFile',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        res.status(500).json(err.message);
                                    } else {
                                        temp_path = config.site_temp_path;
                                        shell.exec('cp "' + new_path + '" "' + temp_path + filename+'"');
                                        shell.exec('chmod 777 ' + temp_path+filename);

                                       // shell.exec('cp "' + new_path + '" "' + temp_path + '"');
                                       // shell.exec('chmod 777 ' + temp_path);
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'replaceFile',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for error
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    var data = {
                                                        cm_state: 2,
                                                        cm_modified_on: new Date(),
                                                        cm_modified_by: req.session.UserName
                                                    }
                                                    //var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [2, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET ? WHERE cm_id=?', [data, fields.cm_id], function (err, Templates) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'replaceFile',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var data = shell.exec('ffprobe -v error -show_entries stream=width,height,bit_rate,duration -show_entries format=size -of default=noprint_wrappers=1 ' + new_path);

                                                            if (data.code == 0) {
                                                                var endOfLine = require('os').EOL;
                                                                var fileInfo = data.output.split(endOfLine);
                                                                fileInfo = fileInfo.filter(function(n){ return (n != ''  &&  n != 'N/A') });
                                                                var fileData = {};
                                                                var info = [];
                                                                fileInfo.forEach(function(val){
                                                                    info = val.split("=");
                                                                    if(info[1] != 'N/A' && info[1] != ''){
                                                                        fileData[info[0]] = parseInt(info[1]);
                                                                    }
                                                                })
                                                                if(fields.TypeName == 'Image'){
                                                                    var bitRate = fileData.width +"x"+ fileData.height;
                                                                } else if (fields.TypeName == 'Audio'){
                                                                    var bitRate = parseInt(fileData.bit_rate / 1000);
                                                                } else if(fields.TypeName == 'Video'){
                                                                    var bitRate = parseInt(fileData.size/1024);
                                                                    //var bitRate = parseInt(fileData.duration);
                                                                }else{
                                                                    var bitRate = fileData.size;
                                                                }
                                                            }else{
                                                                var bitRate = '';
                                                            }

                                                            var file = {
                                                                cf_id: fields.cf_id,
                                                                cf_cm_id: fields.cm_id,                                                                
                                                                cf_bitrate: bitRate,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName
                                                            };
                                                            //console.log(file);
                                                            var query = connection_ikon_cms.query('UPDATE content_files SET ? WHERE cf_id=?', [file, fields.cf_id], function (err, result) {
                                                                //console.log('UPDATE content_files SET '+file+' WHERE cf_cm_id='+fields.cf_id);
                                                                if (err) {
                                                                    console.log(err)
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action: 'uploadotherfiles',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for err
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'replaceFile',
                                                                        responseCode: 200,
                                                                        message: files.file.name + ' File replaced successfully for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    AdminLog.adminlog(connection_ikon_cms, files.file.name + ' File replaced successfully for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Replace File", req.session.UserName, true);
                                                                    res.send({
                                                                        success: true,
                                                                        message: 'File replaced successfully',
                                                                        Files: file
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        var error = {
                            userName: req.session.UserName,
                            action : 'replaceFile',
                            responseCode: 500,
                            message: 'File not found.'
                        }
                        wlogger.error(error); // for error
                        res.status(500).json("File not found.");
                    }
                });
            }
        }
    } catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'replaceFile',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message); }
}

/**
 * @class
 * @classdesc replace thumbnail file.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.replaceThumbFile = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        //console.log(files.file)
                        var filecname = files.file.name;
                        var old_path = files.file.path;
                        var new_path = config.site_base_path + fields.filepath;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                shell.exec('chmod 777 ' + new_path);

                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        var temp_path = config.site_temp_path;
                                        //shell.exec('cp "' + copyFrom + '" "' + config.site_base_path + newpath128 + '"');

                                        //console.log(temp_path)
                                        shell.exec('cp "' + new_path + '" "' + temp_path + filename+'"');
                                        shell.exec('chmod 777 ' + temp_path+filename);
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    AdminLog.adminlog(connection_ikon_cms, files.file.name + ' File replaced successfully for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Replace File", req.session.UserName, true);
                                                    res.send({ success: true, message: 'File replaced successfully' });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        res.status(500).json("File not found.");
                    }
                });
            }
        }
    } catch (err) { res.status(500).json(err.message); }
}

/**
 * Get Closest Bitrate template id
 * @param {Array} templates
 * @param {Number} bitrate
 * @return {Function} callback
 */
function getClosestTemplateIdBitrate(templates, bitrate,callback){
    var closest = null;
    var data = [];
    templates.forEach(function(value, key){
        if (closest === null || Math.abs(bitrate - closest) > Math.abs(value.ct_param - bitrate)) {
            closest = value.ct_param;
            data['templateId'] = value.ct_group_id;
            data['bitrate'] = value.ct_param;
        }
    })

    callback(null, data);
}

/**
 * Update Content Metadata
 * @param {Resource} connection_ikon_cms
 * @param {Array} fields
 * @param {Array} session
 * @return {Function} callback
 */
function updateMetadata(connection_ikon_cms,fields,session, callback){

    var query = connection_ikon_cms.query('select * FROM content_files as cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id) where cf.cf_cm_id =? ', [fields.cm_id], function (err, result) {
        if (err) {
            var error = {
                userName: session.UserName,
                action: 'updateMetadata',
                responseCode: 500,
                message: JSON.stringify(err.message)
            }
            wlogger.error(error); // for err
            connection_ikon_cms.release();
            res.status(500).json(err.message);
        }
        else {
            var cm_state = 1;
            //console.log('updateMetadata')
            //console.log(result[0].cm_state)
            if (result.length > 0) {
                if (result[0].cm_state == 4) {
                    cm_state = 4;
                }
            }
            if (result.length >= 1 && cm_state != 4) {
                cm_state = 2;
            }
            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), session.UserName, fields.cm_id], function (err, Templates) {
                if (err) {
                    var error = {
                        userName: session.UserName,
                        action: 'updateMetadata',
                        responseCode: 500,
                        message: JSON.stringify(err.message)
                    }
                    wlogger.error(error); // for err
                    connection_ikon_cms.release();
                    res.status(500).json(err.message);
                }
                else {
                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                        if (err) {
                            var error = {
                                userName: session.UserName,
                                action: 'updateMetadata',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for err
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var info = {
                                userName: session.UserName,
                                action : 'updateMetadata',
                                responseCode: 200,
                                message: 'Metadata updated successfully.'
                            }
                            wlogger.info(info); // for information
                            callback(null, cm_state);
                        }
                    })
                }
            })
        }
    })
}

/**
 * Add or Update Audio File
 * @param {Resource} connection_ikon_cms
 * @param {String} save_path
 * @param {Array} fields
 * @param {Number} templateID
 * @param {Number} isProcessed
 * @param {Array} session
 * @return {Function} callback
 */
function addUpdateAudioFile(connection_ikon_cms, save_path, fields, templateID, isProcessed, session, callback){
    var query = connection_ikon_cms.query('SELECT cf_id FROM content_files where cf_cm_id = ? and cf_template_id = ? ', [fields.cm_id,templateID], function (err, result) {
        if (err) {
            var error = {
                userName: session.UserName,
                action: 'addUpdateAudioFile',
                responseCode: 500,
                message: JSON.stringify(err.message)
            }
            wlogger.error(error); // for error
            callback(err, null);
            console.log(err);
        }
        else {
            if(result.length == 0){
                var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                    if (err) {
                        var error = {
                            userName: session.UserName,
                            action : 'addUpdateAudioFile',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                        callback(err, null);
                        console.log(err);
                    }
                    else {
                        var file = {
                            cf_id: result[0].id == null ? 1 : result[0].id + 1,
                            cf_cm_id: fields.cm_id,
                            file_category_id: fields.fileCategory,
                            cf_original_processed: isProcessed,
                            cf_url_base: save_path,
                            cf_url: save_path,
                            cf_absolute_url: save_path,
                            cf_template_id: templateID,
                            cf_name: '',
                            cf_name_alias: 0,
                            cf_created_on: new Date(),
                            cf_created_by: session.UserName,
                            cf_modified_on: new Date(),
                            cf_modified_by: session.UserName,
                            cf_crud_isactive: 1
                        };
                        var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                            if (err) {
                                var error = {
                                    userName: session.UserName,
                                    action : 'addUpdateAudioFile',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                callback(err, null);
                                console.log(err)
                            }
                            else {
                                var info = {
                                    userName: session.UserName,
                                    action : 'addUpdateAudioFile',
                                    responseCode: 200,
                                    message: "File inserted successfully."
                                }
                                wlogger.info(info); // for information
                                callback(null, result);
                            }
                        });
                    }
                })
            }else {
                callback(null, result);
            }
        }
    })
}

/**
 * Get file inforamtion like width,height,bit_rate,duration, size  of given filepath
 * @param {String} file_path
 * @param {String} file_type
 * @param {Array} session
 * @return {Function} callback
 */
function getBitrate(file_path, file_type, session, callback){
    var bitRate = '';

    fs.stat(file_path, function(err, stat) {
        if(err != null&& err.code == 'ENOENT') {

            var data = shell.exec('ffprobe -v error -show_entries stream=width,height,bit_rate,duration -show_entries format=size -of default=noprint_wrappers=1 ' + file_path);
            console.log(JSON.stringify(data))
            var info = {
                userName: session.UserName,
                action : 'getBitrate',
                responseCode: 200,
                message: "File information : " + JSON.stringify(data)
            }
            wlogger.info(info); // for information
            if (data.code == 0) {
                var endOfLine = require('os').EOL;
                var fileInfo = data.output.split(endOfLine);
                fileInfo = fileInfo.filter(function(n){ return (n != ''  &&  n != 'N/A') });
                var fileData = {};
                var info = [];
                fileInfo.forEach(function(val){
                    info = val.split("=");
                    if(info[1] != 'N/A' && info[1] != ''){
                        fileData[info[0]] = parseInt(info[1]);
                    }
                })
                if(file_type == 'image'){
                    bitRate = fileData.width +"x"+ fileData.height;
                } else if (file_type == 'audio'){
                    bitRate = parseInt(fileData.bit_rate / 1000);
                } else if(file_type == 'video'){
                    bitRate = parseInt(fileData.size/1024);
                    //bitRate = parseInt(fileData.duration);
                }else{
                    bitRate = fileData.size;
                }
             }
            callback(null, {'bitRate' : bitRate});

        }else {
            console.log('Some other error: ', err.code);
            callback(err, {'bitRate' : bitRate});
        }
    });
}
