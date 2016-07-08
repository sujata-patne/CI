
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var contentTypeManager = require('../models/contentType');
var async = require("async");
//var atob = require("atob");
var formidable = require('formidable');
var shell = require('shelljs');
var _ = require('underscore');
var config = require('../config')();
var fs = require('fs');
//var btoa = require("btoa");
var unzip = require('unzip');
var dir = require("node-dir");
var XLSX = require('xlsx');

function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}

exports.getcontentfile = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    mysql.getConnection('SITE', function (err, connection_ikon_site_user) {
                        async.parallel({
                            /*ContentType: function (callback) {
                        		contentTypeManager.getAllContentTypes( connection_ikon_cms, function (err, ContentType ) {
                                    callback( err, ContentType );
                                });
                            },*/
                            Templates: function (callback) {
                            	contentTypeManager.getAllTemplates( connection_ikon_cms, function( err, Templates ){
                            		callback(err, Templates);
                            	});
                                
                            },
                            OtherTemplates: function (callback) {
                            	contentTypeManager.getAllTemplates( connection_ikon_cms, function( err, OtherTemplates ){
                            		callback(err, OtherTemplates);
                            	});
                                
                            },
                            Devices: function (callback) {
                                var query = connection_ikon_site_user.query('SELECT  dc_id ,  dc_device_id ,  dc_make , CONCAT( dc_make," ", dc_model ) AS dc_model,  dc_architecture ,  dc_RAM , dc_internal_memory ,  dc_ROM ,  dc_GPU ,  dc_CPU ,  dc_chipset ,  dc_OS ,  dc_OS_version ,  dc_pointing_method ,  dc_width , dc_height FROM device_compatibility', function (err, Devices) {
                                    callback(err, Devices);
                                });
                            },                          
                            HandsetDeviceGroups: function (callback) {
                            	contentTypeManager.getAllHandsetDeviceGroups( connection_ikon_cms, function( err, HandsetDeviceGroups ){
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
                            }
                        }, function (err, results) {
                            if (err) {
                                connection_ikon_site_user.release();
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                connection_ikon_site_user.release();
                                connection_ikon_cms.release();
                                res.send(results);
                            }
                        });
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
        res.status(500).json(err.message);
    }
}

exports.checkmetadata = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        Metadata: function (callback) {
                            var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                            var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                            var query = 'SELECT songtype, cm_id, cm_vendor, cm_content_type, cm_title ,cm_starts_from, cm_expires_on,  cm_is_active,cm_state, vd_id ,vd_end_on,vd_is_active,propertyid,propertyname,propertyexpirydate,propertyactive From';
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
                            if (req.body.contenttype == "Audio") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name)', [req.body.Id], function (err, Languages) {
                                    callback(err, Languages);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Files: function (callback) {
                            var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_cm_id = ? and cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [req.body.Id, req.body.Id], function (err, Files) {
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
        res.status(500).json(err.message);
    }
}

exports.uploadthumb = function (req, res, next) {
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
                        var filenamedata = (fields.cm_id + '_thumb_' + fields.width + "_" + fields.height + '.' + file_ext).toLowerCase();
                        var save_path = config.site_thumb_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail WHERE cft_thumbnail_size = ? and cft_thumbnail_img_browse =? and  cft_cm_id=?', [fields.width + "*" + fields.height, save_path, fields.cm_id], function (err, thumbfile) {
                                                        if (err) {
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
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, ThumbFiles) {
                                                                            if (err) {
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
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
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
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
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

exports.uploadwallpaper = function (req, res, next) {
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
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
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
                                                                connection_ikon_cms.release();
                                                                res.status(500).json(err.message);
                                                            }
                                                            else {
                                                                var query = connection_ikon_cms.query('SELECT * FROM content_files_thumbnail WHERE cft_cm_id= ? ', [fields.cm_id], function (err, filedata) {
                                                                    if (err) {
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
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.status(500).json(err.message);
                                                                                                    }
                                                                                                    else {
                                                                                                        tf = tf + 1;
                                                                                                        if (thumblength == tf) {
                                                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                                                if (err) {
                                                                                                                    connection_ikon_cms.release();
                                                                                                                    res.status(500).json(err.message);
                                                                                                                }
                                                                                                                else {
                                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                                        if (err) {
                                                                                                                            connection_ikon_cms.release();
                                                                                                                            res.status(500).json(err.message);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            if (cm_state == 2) {
                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                                    if (err) {
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
                                                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                f = f + 1;
                                                                                                                                                if (f == file_length) {
                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                                        if (err) {
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
                                                                                                                                                                    shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                    th = th + 1;
                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                            else {
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
                                                                                                                                                            shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                            th = th + 1;
                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                thumnloop(th);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                    else {
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
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                        if (err) {
                                                                                                            connection_ikon_cms.release();
                                                                                                            res.status(500).json(err.message);
                                                                                                        }
                                                                                                        else {
                                                                                                            if (cm_state == 2) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                    if (err) {
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
                                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                f = f + 1;
                                                                                                                                if (f == file_length) {
                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                        if (err) {
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
                                                                                                                                                    shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                    th = th + 1;
                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        thumnloop(th);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                            else {
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
                                                                                                                                            shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                            th = th + 1;
                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                thumnloop(th);
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    else {
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
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var file = {
                                                                                                        cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                                        cf_cm_id: fields.cm_id,
                                                                                                        cf_original_processed: (fields.width == width && height == fields.height) ? 1 : 0,
                                                                                                        cf_url_base: save_path,
                                                                                                        cf_url: subfilepath,
                                                                                                        cf_absolute_url: save_path,
                                                                                                        cf_template_id: match.ct_group_id,
                                                                                                        cf_name: null,
                                                                                                        cf_name_alias: null,
                                                                                                        cf_created_on: new Date(),
                                                                                                        cf_created_by: req.session.UserName,
                                                                                                        cf_modified_on: new Date(),
                                                                                                        cf_modified_by: req.session.UserName,
                                                                                                        cf_crud_isactive: 1
                                                                                                    };
                                                                                                    var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                        if (err) {
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
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

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
                            if (parseInt(height) == 360 && parseInt(width) == 640) {
                                fs.readFile(old_path, function (err, data) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.writeFile(new_path, data, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                fs.unlink(old_path, function (err) {
                                                    if (err) {
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
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        tf = tf + 1;
                                                                                        if (thumblength == tf) {
                                                                                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), req.session.UserName, fields.cm_id], function (err, Templates) {
                                                                                                if (err) {
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.status(500).json(err.message);
                                                                                                }
                                                                                                else {
                                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                                        if (err) {
                                                                                                            connection_ikon_cms.release();
                                                                                                            res.status(500).json(err.message);
                                                                                                        }
                                                                                                        else {
                                                                                                            if (cm_state == 2) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                    if (err) {
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
                                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                f = f + 1;
                                                                                                                                if (f == file_length) {
                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                        if (err) {
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
                                                                                                                                                    shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                    th = th + 1;
                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        thumnloop(th);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                            else {
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
                                                                                                                                            shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                            th = th + 1;
                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                thumnloop(th);
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    else {
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
                                                                                    connection_ikon_cms.release();
                                                                                    res.status(500).json(err.message);
                                                                                }
                                                                                else {
                                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                        if (err) {
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            if (cm_state == 2) {
                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                    if (err) {
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
                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                f = f + 1;
                                                                                                                if (f == file_length) {
                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                        if (err) {
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
                                                                                                                                    shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                    th = th + 1;
                                                                                                                                    if (th == thumb_length) {
                                                                                                                                        AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                        res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                    }
                                                                                                                                    else {
                                                                                                                                        thumnloop(th);
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            else {
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
                                                                                                                            shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                            th = th + 1;
                                                                                                                            if (th == thumb_length) {
                                                                                                                                AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                thumnloop(th);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                    else {
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
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        var file = {
                                                                                            cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                            cf_cm_id: fields.cm_id,
                                                                                            cf_original_processed: 1,
                                                                                            cf_url_base: save_path,
                                                                                            cf_url: save_path,
                                                                                            cf_absolute_url: save_path,
                                                                                            cf_template_id: fields.ct_group_id,
                                                                                            cf_name: null,
                                                                                            cf_name_alias: null,
                                                                                            cf_created_on: new Date(),
                                                                                            cf_created_by: req.session.UserName,
                                                                                            cf_modified_on: new Date(),
                                                                                            cf_modified_by: req.session.UserName,
                                                                                            cf_crud_isactive: 1
                                                                                        };
                                                                                        var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                            if (err) {
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
                                        res.status(500).json(err.message);
                                    } else {
                                        res.send({ success: false, message: 'Video File Dimension must be 640x360' });
                                    }
                                });
                            }
                        }
                        else {
                            fs.unlink(old_path, function (err) {
                                if (err) {
                                    res.status(500).json(err.message);
                                } else {
                                    res.send({ success: false, message: 'Error in Video FileUpload' });
                                }
                            });
                        }
                    }
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
        res.status(500).json(err.message);
    }
}

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
                        var filenamedata = (fields.cm_id + '_' + fields.other + '.' + file_ext).toLowerCase();
                        var save_path = config.site_audio_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        var data = shell.exec('ffprobe -v error -show_entries stream=bit_rate  -of default=noprint_wrappers=1 ' + old_path);
                        if (data.code == 0) {
                            var val1 = data.output;
                            var bitrate = val1.substring(val1.indexOf("=") + 1, val1.indexOf("\n"));
                            if (parseInt(bitrate) == 128000) {
                                fs.readFile(old_path, function (err, data) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.writeFile(new_path, data, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                fs.unlink(old_path, function (err) {
                                                    if (err) {
                                                        res.status(500).json(err.message);
                                                    } else {
                                                        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                            function endloop() {

                                                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_files where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [fields.cm_id], function (err, result) {
                                                                    if (err) {
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
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                                    if (err) {
                                                                                        connection_ikon_cms.release();
                                                                                        res.status(500).json(err.message);
                                                                                    }
                                                                                    else {
                                                                                        if (cm_state == 2) {
                                                                                            var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                if (err) {
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
                                                                                                            shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                            f = f + 1;
                                                                                                            if (f == file_length) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                    if (err) {
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
                                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                th = th + 1;
                                                                                                                                if (th == thumb_length) {
                                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                                    res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    thumnloop(th);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                        else {
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
                                                                                                                        shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                        th = th + 1;
                                                                                                                        if (th == thumb_length) {
                                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                                                            res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            thumnloop(th);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                else {
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
                                                                                            AdminLog.adminlog(connection_ikon_cms, 'Base File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Base File Upload", req.session.UserName, true);
                                                                                            res.send({ success: true, message: 'File uploaded successfully', Files: Files });
                                                                                        }
                                                                                    }
                                                                                });

                                                                            }
                                                                        });
                                                                    }
                                                                });

                                                            }
                                                            var query = connection_ikon_cms.query('SELECT * FROM content_files WHERE cf_cm_id= ? and cf_template_id= ?', [fields.cm_id, fields.ct_group_id], function (err, filedata) {
                                                                if (err) {
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
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                var file = {
                                                                                    cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                    cf_cm_id: fields.cm_id,
                                                                                    cf_original_processed: 1,
                                                                                    cf_url_base: save_path,
                                                                                    cf_url: save_path,
                                                                                    cf_absolute_url: save_path,
                                                                                    cf_template_id: fields.ct_group_id,
                                                                                    cf_name: null,
                                                                                    cf_name_alias: null,
                                                                                    cf_created_on: new Date(),
                                                                                    cf_created_by: req.session.UserName,
                                                                                    cf_modified_on: new Date(),
                                                                                    cf_modified_by: req.session.UserName,
                                                                                    cf_crud_isactive: 1
                                                                                };
                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                    if (err) {
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
                                        res.status(500).json(err.message);
                                    } else {
                                        res.send({ success: false, message: 'Audio Bitrate must be MP3 128 kbps.' });
                                    }
                                });
                            }
                        }
                        else {
                            fs.unlink(old_path, function (err) {
                                if (err) {
                                    res.status(500).json(err.message);
                                } else {
                                    res.send({ success: false, message: 'Error in Audio FileUpload' });
                                }
                            });
                        }

                    }
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
        res.status(500).json(err.message);
    }
}

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
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
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
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                            if (err) {
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                if (cm_state == 2) {
                                                                                    var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                        if (err) {
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
                                                                                                    f = f + 1;
                                                                                                    if (f == file_length) {
                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                            if (err) {
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
                                                                                                                        shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                        th = th + 1;
                                                                                                                        if (th == thumb_length) {
                                                                                                                            AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                                            res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            thumnloop(th);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                else {
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
                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                th = th + 1;
                                                                                                                if (th == thumb_length) {
                                                                                                                    AdminLog.adminlog(connection_ikon_cms, 'App File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "App File Upload", req.session.UserName, true);
                                                                                                                    res.send({ success: true, message: 'Game File uploaded successfully', Files: Files });
                                                                                                                }
                                                                                                                else {
                                                                                                                    thumnloop(th);
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        else {
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
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var fileid = result[0].id == null ? 1 : parseInt(result[0].id + 1);
                                                            var file = {
                                                                cf_id: fileid,
                                                                cf_cm_id: fields.cm_id,
                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_name_alias: null,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                if (err) {
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
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

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
                        var filenamedata = (fields.cm_id + '_' + fields.ct_param_value + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();
                        var save_path = config.site_text_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    function endloop() {
                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id,cm_language,cm_state FROM content_metadata where cm_id = ? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) left outer join (SELECT group_concat(cf_url) as url,cf_template_id,cf_cm_id FROM content_files group by cf_template_id,cf_cm_id  )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id)', [fields.cm_id], function (err, result) {
                                                            if (err) {
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
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                            if (err) {
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            }
                                                                            else {
                                                                                if (cm_state == 2) {
                                                                                    var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                        if (err) {
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
                                                                                                    f = f + 1;
                                                                                                    if (f == file_length) {
                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                            if (err) {
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
                                                                                                                        shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
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
                                                                                                                shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
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
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var file = {
                                                                cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                cf_cm_id: fields.cm_id,
                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_name_alias: null,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                if (err) {
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
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

exports.uploadaudiozip = function (req, res, next) {
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
                        var filenamedata = (fields.cm_id + '_' + fields.ct_param_value + '_' + ticks + '.' + file_ext).toLowerCase();
                        var save_path = config.site_zip_path + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        var folderpath = config.site_base_path + config.site_zip_path + (fields.cm_id + '_' + fields.ct_param_value + '_' + ticks).toLowerCase();
                        fs.createReadStream(old_path).pipe(unzip.Extract({ path: folderpath })).on('close', function (close) {
                            fs.unlink(old_path, function (err) {
                                if (err) {
                                    res.status(500).json(err.message);
                                } else {
                                    dir.readFiles(__dirname + '/../' + folderpath, {
                                        match: /.xlsx$/,
                                        exclude: /^\./
                                    }, function (err, content, next) {
                                        if (err) { res.status(500).json(err.message); } else {
                                            next();
                                        }
                                    }, function (err, files) {
                                        if (err) {
                                            res.status(500).json(err.message);
                                        }
                                        else {
                                            if (files.length > 0) {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    var query = connection_ikon_cms.query('select * from (select * from content_template where ct_param_value in ("bitrate"))other', function (err, OtherTemplates) {
                                                        if (err) {
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var query = connection_ikon_cms.query('select * from (select * from catalogue_master where cm_name IN ("Alias") ) cm', function (err, AliasMaster) {
                                                                if (err) {
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var filename = files[0].substr(files[0].lastIndexOf('\\') + 1);
                                                                    var workbook = XLSX.readFile(files[0]);
                                                                    if (workbook.SheetNames.length > 0) {
                                                                        workbook.SheetNames.forEach(function (sheetName) {
                                                                            var TotalError = [];
                                                                            var TotalData = [];
                                                                            var data = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                                                                            if (data.length > 0) {
                                                                                var records = data.length;
                                                                                CheckMetaFiles(0);

                                                                                function CheckMetaFiles(index) {
                                                                                    var obj = {};
                                                                                    var Error = [];
                                                                                    obj.Name = data[index]["Name"]; //complete
                                                                                    obj.FileName = data[index]["FileName"]; //complete
                                                                                    obj.Alias = data[index]["Alias"];
                                                                                    if (obj.Name != "" && obj.Name) {
                                                                                        fs.exists(folderpath + '/' + obj.FileName, function (exists) {
                                                                                            if (exists) {
                                                                                                TotalData.push(obj);
                                                                                                index = index + 1;
                                                                                                if (index == records) {
                                                                                                    if (TotalError.length > 0) {
                                                                                                        connection_ikon_cms.release();
                                                                                                        res.send({ success: false, Error: TotalError });
                                                                                                    }
                                                                                                    else {
                                                                                                        InsertMetaFiles(0);
                                                                                                    }
                                                                                                }
                                                                                                else {
                                                                                                    CheckMetaFiles(index);
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                TotalError.push("Data " + (index + 1) + " : " + obj.FileName + ' file does not exist');
                                                                                                index = index + 1;
                                                                                                if (index == records) {
                                                                                                    connection_ikon_cms.release();
                                                                                                    res.send({ success: false, Error: TotalError });
                                                                                                }
                                                                                                else {
                                                                                                    CheckMetaFiles(index);
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        TotalError.push("Data " + (index + 1) + " : Name is required.");
                                                                                        index = index + 1;

                                                                                        if (index == records) {
                                                                                            connection_ikon_cms.release();
                                                                                            res.send({ success: false, Error: TotalError });
                                                                                        }
                                                                                        else {
                                                                                            CheckMetaFiles(index);
                                                                                        }
                                                                                    }
                                                                                }

                                                                                function InsertMetaFiles(fileIndex) {
                                                                                    var obj = TotalData[fileIndex];
                                                                                    obj.FilePaths = [];
                                                                                    async.waterfall([
                                                                                               function (callback) {
                                                                                                   var ticks = date.getTime();
                                                                                                   var file_ext = obj.FileName.split('.').pop();
                                                                                                   var match128 = _.find(OtherTemplates, function (val) { return val.ct_param == 128 }).ct_group_id;
                                                                                                   var match64 = _.find(OtherTemplates, function (val) { return val.ct_param == 64 }).ct_group_id;
                                                                                                   var match32 = _.find(OtherTemplates, function (val) { return val.ct_param == 32 }).ct_group_id;
                                                                                                   var newpath128 = (config.site_audio_path + fields.cm_id + '_' + obj.Name + '_' + fields.ct_param_value + '_' + 128 + '.' + file_ext).toLowerCase();
                                                                                                   var newpath64 = (config.site_audio_path + fields.cm_id + '_' + obj.Name + '_' + fields.ct_param_value + '_' + 64 + '.' + file_ext).toLowerCase();
                                                                                                   var newpath32 = (config.site_audio_path + fields.cm_id + '_' + obj.Name + '_' + fields.ct_param_value + '_' + 32 + '.' + file_ext).toLowerCase();
                                                                                                   shell.exec('ffmpeg -y  -i "' + folderpath + '/' + obj.FileName + '" -c copy ' + config.site_base_path + newpath128);
                                                                                                   obj.FilePaths.push({ filepath: newpath128, Basefile: 1, BaseUrl: newpath128, TemplateId: fields.ct_group_id });

                                                                                                   //shell.exec('ffmpeg -y -i ' + folderpath + obj.FileName + ' -ab 64 ' + config.site_base_path + newpath64);
                                                                                                   //obj.FilePaths.push({ filepath: newpath64, Basefile: 0, BaseUrl: newpath128, TemplateId: match64 });

                                                                                                   //shell.exec('ffmpeg -y -i ' + folderpath + obj.FileName + ' -ab 32 ' + config.site_base_path + newpath32);
                                                                                                   //obj.FilePaths.push({ filepath: newpath32, Basefile: 0, BaseUrl: newpath128, TemplateId: match32 });

                                                                                                   callback(null, null);
                                                                                               },
                                                                                               function (value, callback) {
                                                                                                   if (obj.Alias != null && obj.Alias) {
                                                                                                       obj.AliasArray = [];
                                                                                                       var Aliases = obj.Alias.split(',');
                                                                                                       var aliasLength = Aliases.length;
                                                                                                       loop(0);
                                                                                                       function loop(als) {
                                                                                                           var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Alias"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [Aliases[als].toLowerCase()], function (err, alias) {
                                                                                                               if (alias[0]) {
                                                                                                                   obj.AliasArray.push(alias[0].cd_id);
                                                                                                                   als = als + 1;
                                                                                                                   if (als == aliasLength) {
                                                                                                                       callback(err, null);
                                                                                                                   }
                                                                                                                   else {
                                                                                                                       loop(als);
                                                                                                                   }
                                                                                                               }
                                                                                                               else {
                                                                                                                   var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                                                                                       if (err) {
                                                                                                                           callback(err, null);
                                                                                                                       }
                                                                                                                       else {
                                                                                                                           var New_cd_Id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                                           var data = {
                                                                                                                               cd_id: New_cd_Id,
                                                                                                                               cd_cm_id: AliasMaster[0].cm_id,
                                                                                                                               cd_name: Aliases[als].toLowerCase(),
                                                                                                                               cd_display_name: Aliases[als].toLowerCase(),
                                                                                                                               cd_crud_isactive: 1,
                                                                                                                               cd_desc: null,
                                                                                                                               cd_desc1: null,
                                                                                                                           };
                                                                                                                           var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                                                                                               if (err) {
                                                                                                                                   callback(err, null);
                                                                                                                               }
                                                                                                                               else {
                                                                                                                                   obj.AliasArray.push(New_cd_Id);
                                                                                                                                   //insert alias
                                                                                                                                   als = als + 1;
                                                                                                                                   if (als == aliasLength) {
                                                                                                                                       callback(err, null);
                                                                                                                                   }
                                                                                                                                   else {
                                                                                                                                       loop(als);
                                                                                                                                   }
                                                                                                                               }
                                                                                                                           });
                                                                                                                       }
                                                                                                                   });
                                                                                                               }
                                                                                                           });
                                                                                                       }
                                                                                                   }
                                                                                                   else {
                                                                                                       callback(err, null);
                                                                                                       obj.AliasArray = [];
                                                                                                   }
                                                                                               },
                                                                                               function (value, callback) {
                                                                                                   if (obj.AliasArray.length > 0) {
                                                                                                       var aliasloopLength = obj.AliasArray.length;
                                                                                                       aliasloop(0);
                                                                                                       function aliasloop(al) {
                                                                                                           var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                               if (err) {
                                                                                                                   callback(err, null);
                                                                                                               }
                                                                                                               else {
                                                                                                                   var cmd_group_id = obj.cf_name_alias ? obj.cf_name_alias : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                                   var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                                   obj.cf_name_alias = cmd_group_id;

                                                                                                                   var Multiselect_Data = {
                                                                                                                       cmd_id: cmd_id,
                                                                                                                       cmd_group_id: cmd_group_id,
                                                                                                                       cmd_entity_type: AliasMaster[0].cm_id,
                                                                                                                       cmd_entity_detail: obj.AliasArray[al],
                                                                                                                       cmd_crud_isactive: 1
                                                                                                                   }
                                                                                                                   var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                       if (err) {
                                                                                                                           callback(err, null);
                                                                                                                       }
                                                                                                                       else {
                                                                                                                           al = al + 1;
                                                                                                                           if (al == aliasloopLength) {
                                                                                                                               callback(null, null);
                                                                                                                           }
                                                                                                                           else {
                                                                                                                               aliasloop(al);
                                                                                                                           }
                                                                                                                       }
                                                                                                                   });
                                                                                                               }
                                                                                                           });
                                                                                                       }
                                                                                                   }
                                                                                                   else {
                                                                                                       obj.cf_name_alias = null;
                                                                                                       callback(null, null);
                                                                                                   }
                                                                                               },
                                                                                               function (value, callback) {
                                                                                                   var filelength = obj.FilePaths.length;
                                                                                                   fileloop(0);
                                                                                                   function fileloop(fl) {
                                                                                                       var file = obj.FilePaths[fl];
                                                                                                       var query = connection_ikon_cms.query('select * from content_files WHERE cf_template_id = ? and cf_url =? and  cf_cm_id=?', [file.TemplateId, file.filepath, fields.cm_id], function (err, audiofile) {
                                                                                                           if (err) {
                                                                                                               callback(err, null);
                                                                                                           }
                                                                                                           else {
                                                                                                               if (!(audiofile.length > 0)) {
                                                                                                                   var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                                       if (err) {
                                                                                                                           callback(err, null);
                                                                                                                       }
                                                                                                                       else {
                                                                                                                           var file_data = {
                                                                                                                               cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                                                               cf_cm_id: fields.cm_id,
                                                                                                                               cf_original_processed: file.Basefile,
                                                                                                                               cf_url_base: file.BaseUrl,
                                                                                                                               cf_url: file.filepath,
                                                                                                                               cf_absolute_url: file.filepath,
                                                                                                                               cf_template_id: file.TemplateId,
                                                                                                                               cf_name: obj.Name,
                                                                                                                               cf_name_alias: obj.cf_name_alias,
                                                                                                                               cf_created_on: new Date(),
                                                                                                                               cf_created_by: req.session.UserName,
                                                                                                                               cf_modified_on: new Date(),
                                                                                                                               cf_modified_by: req.session.UserName,
                                                                                                                               cf_crud_isactive: 1
                                                                                                                           };
                                                                                                                           var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file_data, function (err, result) {
                                                                                                                               if (err) {
                                                                                                                                   callback(err, null);
                                                                                                                               }
                                                                                                                               else {
                                                                                                                                   fl = fl + 1;
                                                                                                                                   if (fl == filelength) {
                                                                                                                                       callback(null, null);
                                                                                                                                   }
                                                                                                                                   else {
                                                                                                                                       fileloop(fl);
                                                                                                                                   }
                                                                                                                               }
                                                                                                                           });
                                                                                                                       }
                                                                                                                   });
                                                                                                               }
                                                                                                               else {
                                                                                                                   fl = fl + 1;
                                                                                                                   if (fl == filelength) {
                                                                                                                       callback(null, null);
                                                                                                                   }
                                                                                                                   else {
                                                                                                                       fileloop(fl);
                                                                                                                   }
                                                                                                               }
                                                                                                           }
                                                                                                       });
                                                                                                   }
                                                                                               },
                                                                                               function (value, callback) {
                                                                                                   var query = connection_ikon_cms.query('select * from (SELECT cm_id,cm_lyrics_languages,cm_state FROM content_metadata where cm_id = ? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) left outer join (SELECT group_concat(cf_url) as url,cf_template_id,cf_cm_id FROM content_files group by cf_template_id,cf_cm_id  )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id)', [fields.cm_id], function (err, result) {
                                                                                                       if (err) {
                                                                                                           callback(err, null);
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
                                                                                                                   callback(err, null);
                                                                                                               }
                                                                                                               else {
                                                                                                                   if (cm_state == 2) {
                                                                                                                       var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                                           if (err) {
                                                                                                                               callback(err, null);
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
                                                                                                                                       f = f + 1;
                                                                                                                                       if (f == file_length) {
                                                                                                                                           var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                                               if (err) {
                                                                                                                                                   callback(err, null);
                                                                                                                                               }
                                                                                                                                               else {
                                                                                                                                                   if (Thumbs.length > 0) {
                                                                                                                                                       var thumb_length = Thumbs.length
                                                                                                                                                       thumnloop(0);
                                                                                                                                                       function thumnloop(th) {
                                                                                                                                                           var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                           var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                           shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                           th = th + 1;
                                                                                                                                                           if (th == thumb_length) {
                                                                                                                                                               callback(null, null);
                                                                                                                                                           }
                                                                                                                                                           else {
                                                                                                                                                               thumnloop(th);
                                                                                                                                                           }
                                                                                                                                                       }
                                                                                                                                                   }
                                                                                                                                                   else {
                                                                                                                                                       callback(null, null);
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
                                                                                                                                           callback(err, null);
                                                                                                                                       }
                                                                                                                                       else {
                                                                                                                                           if (Thumbs.length > 0) {
                                                                                                                                               var thumb_length = Thumbs.length
                                                                                                                                               thumnloop(0);
                                                                                                                                               function thumnloop(th) {
                                                                                                                                                   var oldpath = config.site_base_path + Thumbs[th].cft_thumbnail_img_browse;
                                                                                                                                                   var newpath = config.site_temp_path + Thumbs[th].cft_thumbnail_img_browse.substr(Thumbs[th].cft_thumbnail_img_browse.lastIndexOf('/') + 1);
                                                                                                                                                   shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                   th = th + 1;
                                                                                                                                                   if (th == thumb_length) {
                                                                                                                                                       callback(err, null);
                                                                                                                                                   }
                                                                                                                                                   else {
                                                                                                                                                       thumnloop(th);
                                                                                                                                                   }
                                                                                                                                               }
                                                                                                                                           }
                                                                                                                                           else {
                                                                                                                                               callback(err, null);
                                                                                                                                           }
                                                                                                                                       }
                                                                                                                                   });
                                                                                                                               }
                                                                                                                           }
                                                                                                                       });
                                                                                                                   }
                                                                                                                   else {
                                                                                                                       callback(err, null);
                                                                                                                   }
                                                                                                               }
                                                                                                           });
                                                                                                       }
                                                                                                   });

                                                                                               }
                                                                                    ], function (err, value) {
                                                                                        if (err) {
                                                                                            connection_ikon_cms.release();
                                                                                            res.status(500).json(err.message);
                                                                                        }
                                                                                        else {
                                                                                            fileIndex = fileIndex + 1;
                                                                                            if (fileIndex == TotalData.length) {
                                                                                                AdminLog.adminlog(connection_ikon_cms, fields.ct_param_value + ' Audio Zip file Uploaded Successfully for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", fields.ct_param_value + " Audio Zip File ", req.session.UserName, true);
                                                                                                res.send({ success: true, message: 'Audio Zip file Uploaded Successfully.' });
                                                                                            }
                                                                                            else {
                                                                                                InsertMetaFiles(fileIndex);
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                }
                                                                            }
                                                                            else {
                                                                                connection_ikon_cms.release();
                                                                                res.send({ success: false, message: 'No data avaliable in ' + filename + '. Please check excel file in zip file.', Error: [] });
                                                                            }
                                                                        })
                                                                    }
                                                                    else {
                                                                        connection_ikon_cms.release();
                                                                        res.send({ success: false, message: 'No sheet avaliable in ' + filename + '. Please check excel file in zip file.', Error: [] });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                            else {
                                                res.send({ success: false, message: 'No excel file avaliable in zip file. Please check zip file.', Error: [] });
                                            }
                                        };
                                    });
                                }
                            });
                        });

                    }
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
        res.status(500).json(err.message);
    }
}

exports.uploadotherfiles = function (req, res, next) {
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
                        var filenamedata = (fields.cm_id + '_' + fields.type + '_' + Pad("0", fields.count, 2) + '.' + file_ext).toLowerCase();
                        var save_path = (fields.type == 'image' ? config.site_wallpaper_path : config.site_video_path) + filenamedata;
                        var new_path = config.site_base_path + save_path;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
                                        fs.unlink(old_path, function (err) {
                                            if (err) {
                                                res.status(500).json(err.message);
                                            } else {
                                                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                        if (err) {
                                                            connection_ikon_cms.release();
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            var file = {
                                                                cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                cf_cm_id: fields.cm_id,
                                                                cf_original_processed: 1,
                                                                cf_url_base: save_path,
                                                                cf_url: save_path,
                                                                cf_absolute_url: save_path,
                                                                cf_template_id: fields.ct_group_id,
                                                                cf_name: null,
                                                                cf_name_alias: null,
                                                                cf_created_on: new Date(),
                                                                cf_created_by: req.session.UserName,
                                                                cf_modified_on: new Date(),
                                                                cf_modified_by: req.session.UserName,
                                                                cf_crud_isactive: 1
                                                            };
                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                if (err) {
                                                                    connection_ikon_cms.release();
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id =? )meta inner join(select * from content_files where cf_original_processed = 1)files on(files.cf_cm_id = meta.cm_id) inner join(select ct_group_id ,group_concat(ct_param) as ct_param,group_concat(ct_param_value) as ct_param_value from content_template group by ct_group_id)template on(template.ct_group_id =files.cf_template_id)', [fields.cm_id], function (err, Files) {
                                                                        if (err) {
                                                                            connection_ikon_cms.release();
                                                                            res.status(500).json(err.message);
                                                                        }
                                                                        else {
                                                                            AdminLog.adminlog(connection_ikon_cms, 'Supporting File Uploaded for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", "Supporting File Upload", req.session.UserName, true);
                                                                            res.send({ success: true, message: 'File uploaded successfully', Files: Files });
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
                        res.status(500).json("file not found");
                    }
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
        res.status(500).json(err.message);
    }
}

exports.replaceFile = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                    if (files.file) {
                        var old_path = files.file.path;
                        new_path = config.site_base_path + fields.filepath;
                        fs.readFile(old_path, function (err, data) {
                            if (err) {
                                res.status(500).json(err.message);
                            } else {
                                fs.writeFile(new_path, data, function (err) {
                                    if (err) {
                                        res.status(500).json(err.message);
                                    } else {
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

