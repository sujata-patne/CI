/**
 * Created by sujata.patne on 17-02-2016.
 */
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var ContentFileManger = require("../models/contentfile.model");

var async = require("async");
var atob = require("atob");
var formidable = require('formidable');
var shell = require('shelljs');
var _ = require('underscore');
var config = require('../config')();
var fs = require('fs');
var unzip = require('unzip');
var dir = require("node-dir");
var XLSX = require('xlsx');
var fileArray = [];
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

var CronJob = require('cron').CronJob;
/*new CronJob('60 * * * * 1-5', function () {
    CronActivity();
}, null, true, 'Asia/Kolkata');*/

exports.uploadaudiozip = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var form = new formidable.IncomingForm();
                    form.parse(req, function (err, fields, files) {
                        if (fields.file != '') {
                            var date = new Date();
                            var ticks = date.getTime();
                            var folderpath = config.site_base_path + config.site_audio_path + (fields.cm_id + '_' + fields.ct_param_value + '_' + ticks).toLowerCase();
                            var audioFilepath = config.site_zip_path;
                            var query = connection_ikon_cms.query('SELECT vd.* FROM content_metadata as cm JOIN icn_vendor_detail as vd ON cm.cm_vendor = vd.vd_id WHERE cm.cm_id = '+fields.cm_id , function (err, Vendors) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action: 'uploadaudiozip',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                }else {
                                    dir.readFiles(audioFilepath + Vendors[0].vd_name, {
                                        match: /.xlsx$/,
                                        exclude: /^\./
                                    }, function (err, content, next) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'uploadaudiozip',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                        };
                                        next();
                                    }, function (err, files) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'uploadaudiozip',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            res.status(500).json(err.message);
                                        } else {
                                            if (files.length > 0) {
                                                //var query = connection_ikon_cms.query('select * from catalogue_master where cm_name IN ("Alias")', function (err, AliasMaster) {
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
                                                                    fs.exists(audioFilepath + Vendors[0].vd_name + '/Files/'+ obj.FileName, function (exists) {
                                                                        if (exists) {
                                                                            TotalData.push(obj);
                                                                            index = index + 1;
                                                                            if (index == records) {
                                                                                if (TotalError.length > 0) {
                                                                                    connection_ikon_cms.release();
                                                                                    res.send({
                                                                                        success: false,
                                                                                        Error: TotalError
                                                                                    });
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
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'uploadaudiozip',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(TotalError)
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                connection_ikon_cms.release();
                                                                                res.send({
                                                                                    success: false,
                                                                                    Error: TotalError
                                                                                });
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
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'uploadaudiozip',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(TotalError)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                        res.send({
                                                                            success: false,
                                                                            Error: TotalError
                                                                        });
                                                                    }else {
                                                                        CheckMetaFiles(index);
                                                                    }
                                                                }
                                                            }
                                                            function InsertMetaFiles(fileIndex) {
                                                                var obj = TotalData[fileIndex];
                                                                obj.FilePaths = [];
                                                                async.waterfall([
                                                                    function (callback) {
                                                                        ContentFileManger.existMetadataFile(connection_ikon_cms, fields.cm_id,fields.ct_group_id, function (err, maxChildId) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'uploadaudiozip',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                connection_ikon_cms.release();
                                                                                res.status(500).json(err.message);
                                                                            } else {
                                                                                var aliasId = (maxChildId) ? maxChildId : 0;
                                                                                callback(null, {'aliasId':aliasId});
                                                                            }
                                                                        });
                                                                    },
                                                                    function (value, callback) {
                                                                        var ticks = date.getTime();
                                                                        var file_ext = obj.FileName.split('.').pop();
                                                                        var Alias = obj.Alias.replace(/[ ,]+/g, "_");
                                                                        var childId = value.aliasId + 1;
                                                                        var copyFrom = audioFilepath + Vendors[0].vd_name + '/Files/'+ obj.FileName;
                                                                        var temppath = (config.site_temp_path + fields.cm_id + '_' + fields.langaugemetaid + '_' + childId + '.' + file_ext);//.toLowerCase();
                                                                        var newpath = (config.site_audio_path + fields.cm_id + '_' + fields.langaugemetaid + '_' + childId + '.' + file_ext);//.toLowerCase();
                                                                        fileArray.push({'copyFrom':copyFrom,'temppath':temppath, 'audioPath':config.site_base_path + newpath})
                                                                        //shell.exec('cp "' + copyFrom + '" "' + config.site_base_path + newpath128 + '"');
                                                                       // shell.exec('cp "' + copyFrom + '" "' + temppath + '"');
                                                                        obj.FilePaths.push({
                                                                            filepath: newpath,
                                                                            Basefile: 1,
                                                                            BaseUrl: newpath,
                                                                            TemplateId: fields.ct_group_id, //audioTempleteId,
                                                                            Alias: Alias,
                                                                            childId: childId
                                                                        });
                                                                        callback(null, null);
                                                                    },
                                                                    function (value, callback) {
                                                                        var filelength = obj.FilePaths.length;
                                                                        fileloop(0);
                                                                        function fileloop(fl) {
                                                                            var file = obj.FilePaths[fl];
                                                                            var query = connection_ikon_cms.query('select * from content_files WHERE cf_template_id = ? and cf_url =? and  cf_cm_id=?', [file.TemplateId, file.filepath, fields.cm_id], function (err, audiofile) {
                                                                                if (err) {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'uploadaudiozip',
                                                                                        responseCode: 500,
                                                                                        message: JSON.stringify(err.message)
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    callback(err, null);
                                                                                }else {
                                                                                    if (!(audiofile.length > 0)) {
                                                                                        var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                            if (err) {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'uploadaudiozip',
                                                                                                    responseCode: 500,
                                                                                                    message: JSON.stringify(err.message)
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                callback(err, null);
                                                                                            }else {
                                                                                                var file_data = {
                                                                                                    cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                                    cf_cm_id: fields.cm_id,
                                                                                                    cf_original_processed: file.Basefile,
                                                                                                    cf_url_base: file.BaseUrl,
                                                                                                    cf_url: file.filepath,
                                                                                                    cf_absolute_url: file.filepath,
                                                                                                    cf_template_id: file.TemplateId,
                                                                                                    cf_name: file.Alias,
                                                                                                    cf_name_alias: file.childId,
                                                                                                    cf_created_on: new Date(),
                                                                                                    cf_created_by: req.session.UserName,
                                                                                                    cf_modified_on: new Date(),
                                                                                                    cf_modified_by: req.session.UserName,
                                                                                                    cf_crud_isactive: 1
                                                                                                };
                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file_data, function (err, result) {
                                                                                                    if (err) {
                                                                                                        var error = {
                                                                                                            userName: req.session.UserName,
                                                                                                            action: 'uploadaudiozip',
                                                                                                            responseCode: 500,
                                                                                                            message: JSON.stringify(err.message)
                                                                                                        }
                                                                                                        wlogger.error(error); // for error
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
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'uploadaudiozip',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                callback(err, null);
                                                                            }
                                                                            else {
                                                                                var match = _.find(result, function (val) {
                                                                                    return val.url == null
                                                                                });
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
                                                                                            action: 'uploadaudiozip',
                                                                                            responseCode: 500,
                                                                                            message: JSON.stringify(err.message)
                                                                                        }
                                                                                        wlogger.error(error); // for error
                                                                                        callback(err, null);
                                                                                    }
                                                                                    else {
                                                                                        if (cm_state == 2) {
                                                                                            var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [fields.cm_id], function (err, files) {
                                                                                                if (err) {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action: 'uploadaudiozip',
                                                                                                        responseCode: 500,
                                                                                                        message: JSON.stringify(err.message)
                                                                                                    }
                                                                                                    wlogger.error(error); // for error
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
                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                            f = f + 1;
                                                                                                            if (f == file_length) {
                                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [fields.cm_id], function (err, Thumbs) {
                                                                                                                    if (err) {
                                                                                                                        var error = {
                                                                                                                            userName: req.session.UserName,
                                                                                                                            action: 'uploadaudiozip',
                                                                                                                            responseCode: 500,
                                                                                                                            message: JSON.stringify(err.message)
                                                                                                                        }
                                                                                                                        wlogger.error(error); // for error
                                                                                                                        callback(err, null);
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
                                                                                                                var error = {
                                                                                                                    userName: req.session.UserName,
                                                                                                                    action: 'uploadaudiozip',
                                                                                                                    responseCode: 500,
                                                                                                                    message: JSON.stringify(err.message)
                                                                                                                }
                                                                                                                wlogger.error(error); // for error
                                                                                                                callback(err, null);
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
                                                                                                                            callback(err, null);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            thumnloop(th);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                else {
                                                                                                                    var error = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action: 'uploadaudiozip',
                                                                                                                        responseCode: 500,
                                                                                                                        message: JSON.stringify(err.message)
                                                                                                                    }
                                                                                                                    wlogger.error(error); // for error
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
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'uploadaudiozip',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err.message)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                        res.status(500).json(err.message);
                                                                    }
                                                                    else {
                                                                        fileIndex = fileIndex + 1;

                                                                        if (fileIndex == TotalData.length) {
                                                                            var info = {
                                                                                userName: req.session.UserName,
                                                                                action: 'getadminlog',
                                                                                responseCode: 200,
                                                                                message: 'Audio Zip file Uploaded Successfully.'
                                                                            }
                                                                            wlogger.info(info); // for information
                                                                            AdminLog.adminlog(connection_ikon_cms, fields.ct_param_value + ' Audio Zip file Uploaded Successfully for ' + fields.cm_title + ' and MetadataId is ' + fields.cm_id + ".", fields.ct_param_value + " Audio Zip File ", req.session.UserName, true);
                                                                            res.send({
                                                                                success: true,
                                                                                message: 'Audio Zip file Uploaded Successfully.'
                                                                            });
                                                                        }
                                                                        else {
                                                                            InsertMetaFiles(fileIndex);
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                        }
                                                        else {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'uploadaudiozip',
                                                                responseCode: 500,
                                                                message: 'No sheet avaliable in ' + filename + '. Please check excel file in zip file.'
                                                            }
                                                            wlogger.error(error); // for error
                                                            connection_ikon_cms.release();
                                                            res.send({
                                                                success: false,
                                                                message: 'No data avaliable in ' + filename + '. Please check excel file in zip file.',
                                                                Error: []
                                                            });
                                                        }
                                                    })
                                                }else {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action: 'uploadaudiozip',
                                                        responseCode: 500,
                                                        message: 'No sheet avaliable in ' + filename + '. Please check excel file in zip file.'
                                                    }
                                                    wlogger.error(error); // for error
                                                    connection_ikon_cms.release();
                                                    res.send({
                                                        success: false,
                                                        message: 'No sheet avaliable in ' + filename + '. Please check excel file in zip file.',
                                                        Error: []
                                                    });
                                                }
                                            } else {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action: 'uploadaudiozip',
                                                    responseCode: 500,
                                                    message: 'No excel file avaliable. Please check excel file in zip file.'
                                                }
                                                wlogger.error(error); // for error
                                                res.send({
                                                    success: false,
                                                    message: 'No excel file avaliable in zip file. Please check zip file.',
                                                    Error: []
                                                });
                                            }
                                        }
                                    });
                                }
                            })
                        }
                    });
                })
            }else {
                var error = {
                    userName: "Unknown User",
                    action : 'uploadaudiozip',
                    responseCode: 500,
                    message: "Invalid username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        } else {
        var error = {
            userName: "Unknown User",
            action : 'uploadaudiozip',
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
        action : 'uploadaudiozip',
        responseCode: 500,
        message: JSON.stringify(err.message)
    }
    wlogger.error(error); // for error
    res.status(500).json(err.message);
}
}
