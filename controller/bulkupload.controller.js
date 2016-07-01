/**
* Created by sujata.patne on 13-07-2015.
*/
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var dir = require("node-dir");
var fs = require('fs');
var XLSX = require('xlsx');
var _ = require("underscore");
var btoa = require("btoa");
var config = require('../config')();
var shell = require('shelljs');
var CronJob = require('cron').CronJob;
var wlogger = require("../config/logger");
var reload = require('require-reload')(require);
var common = require('../helpers/common');

/**
 * @class
 * @classdesc Create a log file if not exist.
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
 * Run Cron at every day at 9PM.
 */
new CronJob('00 00 09 * * 0-6', function () {
    CronActivity();
}, null, true, 'Asia/Kolkata');


/**
 * @class
 * @classdesc Bulk upload of metadata details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 * @param {function} next - callback function.
 */
exports.bulkupload = function (req, res, next) {
    try {
        res.send({ success: false, message: 'upload process in progress' });
        mysql.getConnection('CMS', function (err, connection_ikon_cms) {
            //var currentdate = getDate();
            var currentdate = common.setDBDate();
            var query = connection_ikon_cms.query('select * from (select * from icn_vendor_detail)vd', function (err, Vendors) {
                if (err) {
                    var error = {
                        userName: req.session.UserName,
                        action: 'bulkupload',
                        responseCode: 500,
                        message: JSON.stringify(err.message)
                    }
                    wlogger.error(error); // for error
                    connection_ikon_cms.release();
                }
                else {
                    if (Vendors.length > 0) {
                        var vendor_length = Vendors.length;
                        CheckVendorFiles(0);
                        function CheckVendorFiles(a) {
                            console.log(Vendors[a].vd_name)
                            if (Vendors[a].vd_is_active == 1) {
                                if (new Date(Vendors[a].vd_end_on) >= new Date(currentdate)) {
                                    dir.readFiles(__dirname + '/../public/Vendors/' + Vendors[a].vd_name, {
                                        match: /.xlsx$/,
                                        exclude: /^\./
                                    }, function (err, content, next) {
                                        if (err) { connection_ikon_cms.release(); };
                                        next();
                                    }, function (err, files) {
                                        if (err) { connection_ikon_cms.release(); };
                                        if (files && files.length > 0) {
                                            var fileslength = files.length;
                                            ExcelreadFile(0);
                                            function ExcelreadFile(f_index) {
                                                var filename = files[f_index].substr(files[f_index].lastIndexOf('\\') + 1);
                                                if (!(filename.indexOf('~$') == 0)) {
                                                    var workbook = XLSX.readFile(files[f_index]);
                                                    if (workbook.SheetNames.length > 0) {
                                                        workbook.SheetNames.forEach(function (sheetName) {
                                                            var TotalError = [];
                                                            var data = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                                                            if (data.length > 0) {
                                                                var records = data.length;
                                                                CheckMetadata(0);
                                                                function CheckMetadata(index) {
                                                                    var Error = [];
                                                                    //var currentdate = getDate();
                                                                    var currentdate = common.setDBDate();
                                                                    var obj = {};
                                                                    obj.Vendor_name = data[index]["Vendor Name"]; //complete
                                                                    obj.Property_name = data[index]["Property"]; //complete
                                                                    obj.Parent_Content_Type = data[index]["Parent Content Type"];
                                                                    obj.Content_type = data[index]["Video Type"]; //complete
                                                                    obj.Content_display_title = data[index]["Content Display Title"]; //complete
                                                                    obj.Short_description = data[index]["Short Description"];
                                                                    obj.Long_description = data[index]["Long Description"];
                                                                    obj.Celebrity = data[index]["Celebrity"]; //complete
                                                                    obj.Duration = data[index]["Duration"];
                                                                    obj.Photographer = data[index]["Photographer"]; //complete
                                                                    obj.Instrument = data[index]["Instrument"]; //complete
                                                                    obj.Raag_Taal = data[index]["Raag/Taal"]; //complete
                                                                    obj.Genre = data[index]["Genre"]; //complete
                                                                    obj.Sub_Genre = data[index]["Sub Genre"]; //complete
                                                                    obj.Support_In_APP_purchase = data[index]["Support In APP purchase"]; //complete
                                                                    obj.Plattform_Support = data[index]["Plattform Support"]; //complete
                                                                    obj.Mode = data[index]["Mode"]; //complete
                                                                    obj.Mood = data[index]["Mood"]; //complete
                                                                    obj.Singer = data[index]["Singer"]; //complete
                                                                    obj.Music_Director = data[index]["Music Director"]; //complete
                                                                    obj.Video_Quality = data[index]["Video Quality"]; //complete
                                                                    obj.Languages = data[index]["Languages"]; //complete
                                                                    obj.Nudity = data[index]["Nudity/Parental Control"]; //complete
                                                                    obj.Location = data[index]["Location"]; //complete
                                                                    obj.Festival_Occasion = data[index]["Festival/Occasion"]; //complete
                                                                    obj.Religion = data[index]["Religion"]; //complete
                                                                    obj.Self_Ranking = data[index]["Self Ranking"]; //complete
                                                                    obj.Go_Live_On = data[index]["Go Live On"]; //complete
                                                                    obj.Expired_On = data[index]["Expired On"]; //complete
                                                                    obj.Search_Keywords = data[index]["Search Keywords"]; //complete
                                                                    obj.CP_Content_id = data[index]["CP Content id"]; //complete
                                                                    obj.Country_Rights = data[index]["Country Rights"]; //complete
                                                                    obj.Channel_Rights = data[index]["Channel Rights"]; //complete
                                                                    obj.base_1280_1280_url = data[index]["base 1280 1280 url"]; //complete
                                                                    obj.base_1280_720_url = data[index]["base 1280 720 url"]; //complete
                                                                    obj.base_720_1280_url = data[index]["base 720 1280 url"]; //complete
                                                                    obj.Thumbnail_url_125_125 = data[index]["ThumbUrl"]; //complete
                                                                    obj.Thumbnail_url_100_100 = data[index]["Thumbnail url 100 100"]; //complete
                                                                    obj.Thumbnail_url_150_150 = data[index]["Thumbnail url 150 150"]; //complete
                                                                    obj.Audio_url = data[index]["Audio url"]; //complete
                                                                    obj.Video_url = data[index]["File Name"]; //complete
                                                                    if (obj.Vendor_name.toLowerCase() == Vendors[a].vd_name.toLowerCase()) {
                                                                        async.waterfall([
                                                                            //parent content type
                                                                            function (callback) {
                                                                                if (obj.Parent_Content_Type) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Content Type"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Parent_Content_Type.toLowerCase()], function (err, parentcontent) {
                                                                                        if (parentcontent[0]) {
                                                                                            obj.parent_type = parentcontent[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Parent_Content_Type + " Parent Content Type not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: 'Parent Content Type  is required'
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    obj.parent_type = null;
                                                                                    Error.push("Parent Content Type  is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            //vendor
                                                                            function (value, callback) {
                                                                                if (obj.Vendor_name) {
                                                                                    var query = connection_ikon_cms.query('select * from icn_vendor_detail where lower(vd_name) = ?', [obj.Vendor_name.toLowerCase()], function (err, vendor) {
                                                                                        if (vendor[0]) {
                                                                                            if (vendor[0].vd_is_active == 1) {
                                                                                                if (new Date(vendor[0].vd_end_on) >= new Date(currentdate)) {
                                                                                                    obj.cm_vendor = vendor[0].vd_id;
                                                                                                    var query = connection_ikon_cms.query('select * from  (select * from vendor_profile where vp_vendor_id =?)vp inner join (select * from multiselect_metadata_detail )mmd on (vp.vp_r_group_id=mmd.cmd_group_id) inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id  and r.r_allowed_content_type = ? )', [obj.cm_vendor, obj.parent_type], function (err, content_vendor_rights) {
                                                                                                        if (content_vendor_rights[0]) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'bulkupload',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err)
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'bulkupload',
                                                                                                                responseCode: 500,
                                                                                                                message: obj.Vendor_name + " vendor don't have rights to upload content for " + obj.Parent_Content_Type
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            Error.push(obj.Vendor_name + " vendor don't have rights to upload content for " + obj.Parent_Content_Type);
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action: 'bulkupload',
                                                                                                        responseCode: 500,
                                                                                                        message: obj.Vendor_name + " vendor is expired"
                                                                                                    }
                                                                                                    wlogger.error(error); // for error
                                                                                                    Error.push(obj.Vendor_name + " vendor is expired");
                                                                                                    callback(err, null);
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'bulkupload',
                                                                                                    responseCode: 500,
                                                                                                    message: obj.Vendor_name + " vendor is blocked"
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                Error.push(obj.Vendor_name + " vendor is blocked");
                                                                                                callback(err, null);
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: obj.Vendor_name + " vendor is not avaliable in database"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            Error.push(obj.Vendor_name + " vendor not avaliable in database");
                                                                                            callback(err, null);
                                                                                        }

                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: 'Vendor name is required'
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    obj.cm_vendor = null;
                                                                                    Error.push("Vendor name is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Property
                                                                            function (value, callback) {
                                                                                if (obj.Property_name) {
                                                                                    var query = connection_ikon_cms.query('select * from content_metadata where lower(cm_title) = ? and cm_property_id is null and cm_vendor = ?', [obj.Property_name.toLowerCase(), obj.cm_vendor], function (err, Property) {
                                                                                        //var cm_property_id = Property ? Property[0] ? Property[0].cm_id : null : null;
                                                                                        if (Property[0]) {
                                                                                            obj.cm_property_id = Property[0].cm_id;
                                                                                            obj.cm_starts_from = Property[0].cm_starts_from;
                                                                                            obj.cm_expires_on = Property[0].cm_expires_on;
                                                                                            if (Property[0].cm_is_active == 1) {
                                                                                                if (new Date(Property[0].cm_expires_on) >= new Date(currentdate)) {
                                                                                                    var query = connection_ikon_cms.query('select * from(select cm_r_group_id,cm_vendor from content_metadata where cm_id= ? and cm_property_id is null)cn_mt inner join (select * from multiselect_metadata_detail )mmd on (cn_mt.cm_r_group_id=mmd.cmd_group_id)inner join (select * from rights) r on (mmd.cmd_entity_detail = r.r_group_id and  r.r_allowed_content_type = ?)', [Property[0].cm_id, obj.parent_type], function (err, property_rights) {
                                                                                                        if (property_rights[0]) {
                                                                                                            obj.r_rights_at_content_level = property_rights[0].r_rights_at_content_level;
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'bulkupload',
                                                                                                                responseCode: 500,
                                                                                                                message: obj.Property_name + " property  don't have rights to upload content for " + obj.Parent_Content_Type
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            Error.push(obj.Property_name + " property  don't have rights to upload content for " + obj.Parent_Content_Type);
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    var error = {
                                                                                                        userName: req.session.UserName,
                                                                                                        action: 'bulkupload',
                                                                                                        responseCode: 500,
                                                                                                        message: obj.Property_name + " Property is expired"
                                                                                                    }
                                                                                                    wlogger.error(error); // for error
                                                                                                    callback(err, null);
                                                                                                    Error.push(obj.Property_name + " Property is expired");
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'bulkupload',
                                                                                                    responseCode: 500,
                                                                                                    message: obj.Property_name + " Property is blocked"
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                callback(err, null);
                                                                                                Error.push(obj.Property_name + " Property is blocked");
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: obj.Property_name + " property not avaliable in database"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            callback(err, null);
                                                                                            Error.push(obj.Property_name + "property not avaliable in database");
                                                                                        }

                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: "Property name is required"
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    obj.cm_property_id = null;
                                                                                    Error.push("Property name is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Content_type
                                                                            function (value, callback) {
                                                                                if (obj.Content_type) {
                                                                                    var query = connection_ikon_cms.query('select * from (SELECT * FROM icn_manage_content_type)cnt inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name = ? )parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)  inner join (select cd_id ,cd_name from catalogue_detail where cd_name = ? )content on(content.cd_id  = cnt.mct_cnt_type_id)', [obj.Parent_Content_Type, obj.Content_type.toLowerCase()], function (err, content_type) {
                                                                                        //var cm_content_type = content_type ? content_type[0] ? content_type[0].cd_id : null : null;
                                                                                        if (content_type[0]) {
                                                                                            obj.cm_content_type = content_type[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: obj.Content_type + " content type not avaliable in database"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            Error.push(obj.Content_type + " content type not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: "Content Type is required"
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    obj.cm_content_type = null;
                                                                                    Error.push("Content Type is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Content_display_title
                                                                            function (value, callback) {
                                                                                if (obj.Content_display_title) {
                                                                                    var query = connection_ikon_cms.query('SELECT * FROM content_metadata WHERE cm_title = ?', [obj.Content_display_title.toLowerCase()], function (err, display_title) {
                                                                                        if (display_title[0]) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: "content display title must be unique"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            Error.push("content display title must be unique");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: "content display title  is required"
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    Error.push("content display title is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // celebrity
                                                                            function (value, callback) {
                                                                                if (obj.Celebrity) {
                                                                                    obj.celebrityList = [];
                                                                                    var celebrityArray = obj.Celebrity.split(',');
                                                                                    var celebrityLength = celebrityArray.length;
                                                                                    loop(0);
                                                                                    function loop(cnt) {
                                                                                        var c = cnt;
                                                                                        var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Celebrity"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [celebrityArray[c].toLowerCase()], function (err, celebrity) {
                                                                                            //var cm_celebrity = celebrity ? celebrity[0] ? celebrity[0].cd_id : null : null;
                                                                                            if (celebrity[0]) {
                                                                                                obj.celebrityList.push(celebrity[0].cd_id);
                                                                                            }
                                                                                            else {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'bulkupload',
                                                                                                    responseCode: 500,
                                                                                                    message: celebrityArray[c] + " celebrity not avaliable in database"
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                Error.push(celebrityArray[c] + " celebrity not avaliable in database");
                                                                                            }
                                                                                            cnt = cnt + 1;
                                                                                            if (cnt == celebrityLength) {
                                                                                                callback(err, null);
                                                                                            }
                                                                                            else {
                                                                                                loop(cnt);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Genre
                                                                            function (value, callback) {
                                                                                if (obj.Genre) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Genres"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Genre.toLowerCase()], function (err, genre) {
                                                                                        //var cm_genre = genre ? genre[0] ? genre[0].cd_id : null : null;
                                                                                        if (genre[0]) {
                                                                                            obj.cm_genre = genre[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: obj.Genre + " Genre not avaliable in database"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            Error.push(obj.Genre + " Genre not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_genre = null;
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: "Genre is required."
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    Error.push("Genre is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Sub_Genre
                                                                            function (value, callback) {
                                                                                if (obj.Sub_Genre) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Sub Genres"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Sub_Genre.toLowerCase()], function (err, sub_genre) {
                                                                                        //var cm_sub_genre = sub_genre ? sub_genre[0] ? sub_genre[0].cd_id : null : null;
                                                                                        if (sub_genre[0]) {
                                                                                            obj.cm_sub_genre = sub_genre[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: obj.Sub_Genre + " SubGenre not avaliable in database"
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            Error.push(obj.Sub_Genre + " SubGenre not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_sub_genre = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Mood
                                                                            function (value, callback) {
                                                                                if (obj.Mood) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Mood"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Mood.toLowerCase()], function (err, mood) {
                                                                                        //var cm_mood = mood ? mood[0] ? mood[0].cd_id : null : null;
                                                                                        if (mood[0]) {
                                                                                            obj.cm_mood = mood[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Mood + " Mood not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.Mood = null;
                                                                                    callback(null, null);
                                                                                }

                                                                            },
                                                                            // Photographer
                                                                            function (value, callback) {
                                                                                callback(null, null);
                                                                            },
                                                                            // Languages
                                                                            function (value, callback) {
                                                                                if (obj.Languages) {
                                                                                    obj.languageList = [];
                                                                                    var lanuageArray = obj.Languages.split(',');
                                                                                    var languagesLength = lanuageArray.length;
                                                                                    loop(0);
                                                                                    function loop(cnt) {
                                                                                        var l = cnt;
                                                                                        var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Languages"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [lanuageArray[l].toLowerCase()], function (err, language) {
                                                                                            if (language[0]) {
                                                                                                obj.languageList.push(language[0].cd_id);
                                                                                            }
                                                                                            else {
                                                                                                Error.push(lanuageArray[l] + " Language not avaliable in database");
                                                                                            }
                                                                                            cnt = cnt + 1;
                                                                                            if (cnt == languagesLength) {
                                                                                                callback(err, null);
                                                                                            }
                                                                                            else {
                                                                                                loop(cnt);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Nudity
                                                                            function (value, callback) {
                                                                                if (obj.Nudity) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Nudity"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Nudity.toLowerCase()], function (err, nudity) {
                                                                                        //var cm_nudity = nudity ? nudity[0] ? nudity[0].cd_id : null : null;
                                                                                        if (nudity[0]) {
                                                                                            obj.cm_nudity = nudity[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Nudity + " Nudity not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_nudity = null;
                                                                                    Error.push("Nudity is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Location
                                                                            function (value, callback) {
                                                                                //if (obj.Location) {
                                                                                //}
                                                                                //else {
                                                                                //    callback(null, null);
                                                                                //}
                                                                                callback(null, null);
                                                                            },
                                                                            // Festival_Occasion
                                                                            function (value, callback) {
                                                                                if (obj.Festival_Occasion) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Festival"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Festival_Occasion.toLowerCase()], function (err, festival_occasion) {
                                                                                        //var cm_festival_occasion = festival_occasion ? festival_occasion[0] ? festival_occasion[0].cd_id : null : null;
                                                                                        if (festival_occasion[0]) {
                                                                                            obj.cm_festival_occasion = festival_occasion[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Festival_Occasion + " festival or occasion not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_festival_occasion = null;
                                                                                    callback(null, null);
                                                                                }

                                                                            },
                                                                            // Religion
                                                                            function (value, callback) {
                                                                                if (obj.Religion) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Religion"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Religion.toLowerCase()], function (err, religion) {
                                                                                        // var cm_religion = religion ? religion[0] ? religion[0].cd_id : null : null;
                                                                                        if (religion[0]) {
                                                                                            obj.cm_religion = religion[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Religion + " religion not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_religion = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Singer
                                                                            function (value, callback) {
                                                                                if (obj.Singer) {
                                                                                    obj.singerList = [];
                                                                                    var singerArray = obj.Singer.split(',');
                                                                                    var singerLength = singerArray.length;
                                                                                    loop(0);
                                                                                    function loop(cnt) {
                                                                                        var s = cnt;
                                                                                        var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Singers"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [singerArray[s].toLowerCase()], function (err, singer) {
                                                                                            if (singer[0]) {
                                                                                                obj.singerList.push(singer[0].cd_id);
                                                                                            }
                                                                                            else {
                                                                                                Error.push(singerArray[s] + " singer not avaliable in database");
                                                                                            }
                                                                                            cnt = cnt + 1;
                                                                                            if (cnt == singerLength) {
                                                                                                callback(err, null);
                                                                                            }
                                                                                            else {
                                                                                                loop(cnt);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Music_Director
                                                                            function (value, callback) {
                                                                                if (obj.Music_Director) {
                                                                                    obj.music_directorList = [];
                                                                                    var music_directorArray = obj.Music_Director.split(',');
                                                                                    var music_directorLength = music_directorArray.length;
                                                                                    loop(0);
                                                                                    function loop(cnt) {
                                                                                        var md = cnt;
                                                                                        var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Music Directors"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [music_directorArray[md].toLowerCase()], function (err, music_direct) {
                                                                                            if (music_direct[0]) {
                                                                                                obj.music_directorList.push(music_direct[0].cd_id);
                                                                                            }
                                                                                            else {
                                                                                                Error.push(music_directorArray[md] + " music director not avaliable in database");
                                                                                            }
                                                                                            cnt = cnt + 1;
                                                                                            if (cnt == music_directorLength) {
                                                                                                callback(err, null);
                                                                                            }
                                                                                            else {
                                                                                                loop(cnt);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Video_Quality
                                                                            function (value, callback) {
                                                                                if (obj.Video_Quality) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Video Quality"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Video_Quality.toLowerCase()], function (err, content_quality) {
                                                                                        //var cm_content_quality = content_quality ? content_quality[0] ? content_quality[0].cd_id : null : null;
                                                                                        if (content_quality[0]) {
                                                                                            obj.cm_content_quality = content_quality[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Video_Quality + " video quality not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    if (obj.Parent_Content_Type == 'Video') {
                                                                                        Error.push("video quality is required");
                                                                                    }
                                                                                    obj.cm_content_quality = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Search_Keywords
                                                                            function (value, callback) {
                                                                                if (!obj.Search_Keywords) {
                                                                                    Error.push("search keywords is required");
                                                                                }
                                                                                callback(null, null);
                                                                            },
                                                                            // Raag_Taal
                                                                            function (value, callback) {
                                                                                if (obj.Raag_Taal) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Raag Taal"))cm inner join(select * from catalogue_detail where lower(cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Raag_Taal.toLowerCase()], function (err, raag_tal) {
                                                                                        //var cm_raag_tal = raag_tal ? raag_tal[0] ? raag_tal[0].cd_id : null : null;
                                                                                        if (raag_tal[0]) {
                                                                                            obj.cm_raag_tal = raag_tal[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Raag_Taal + " raag taal not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_raag_tal = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Instrument
                                                                            function (value, callback) {
                                                                                if (obj.Instrument) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Instruments"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Instrument.toLowerCase()], function (err, instruments) {
                                                                                        //var cm_instruments = instruments ? instruments[0] ? instruments[0].cd_id : null : null;
                                                                                        if (instruments[0]) {
                                                                                            obj.cm_instruments = instruments[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Instrument + " instrument not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_instruments = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Mode
                                                                            function (value, callback) {
                                                                                if (obj.Mode) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Mode"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Mode.toLowerCase()], function (err, mode) {
                                                                                        //var cm_mode = mode ? mode[0] ? mode[0].cd_id : null : null;
                                                                                        if (mode[0]) {
                                                                                            obj.cm_mode = mode[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Mode + " mode not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    if (obj.Parent_Content_Type == 'AppsGames') {
                                                                                        Error.push("Mode is required");
                                                                                    }
                                                                                    obj.cm_mode = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Support_In_APP_purchase
                                                                            function (value, callback) {
                                                                                if (obj.Support_In_APP_purchase) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("InAppPurchase"))cm inner join(select * from catalogue_detail where lower( cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Support_In_APP_purchase.toLowerCase()], function (err, app_store_purchase) {
                                                                                        //var cm_is_app_store_purchase = app_store_purchase ? app_store_purchase[0] ? app_store_purchase[0].cd_id : null : null;
                                                                                        if (app_store_purchase[0]) {
                                                                                            obj.cm_is_app_store_purchase = app_store_purchase[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Support_In_APP_purchase + " support in App purchase not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_is_app_store_purchase = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Self_Ranking
                                                                            function (value, callback) {
                                                                                if (obj.Self_Ranking) {
                                                                                    var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Self Ranking"))cm inner join(select * from catalogue_detail where lower(cd_name) = ?) cd on (cd.cd_cm_id = cm.cm_id )', [obj.Self_Ranking.toLowerCase()], function (err, rank) {
                                                                                        //var cm_rank = rank ? rank[0] ? rank[0].cd_id : null : null;
                                                                                        if (rank[0]) {
                                                                                            obj.cm_rank = rank[0].cd_id;
                                                                                        }
                                                                                        else {
                                                                                            Error.push(obj.Self_Ranking + " self ranking not avaliable in database");
                                                                                        }
                                                                                        callback(err, null);

                                                                                    });
                                                                                }
                                                                                else {
                                                                                    obj.cm_rank = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Country_Rights
                                                                            function (value, callback) {
                                                                                if (obj.cm_vendor && obj.cm_property_id && obj.r_rights_at_content_level && obj.r_rights_at_content_level != 0) {
                                                                                    if (obj.Country_Rights) {
                                                                                        obj.country_rightsList = [];
                                                                                        var country_rightsArray = obj.Country_Rights.split(',');
                                                                                        var country_rightsLength = country_rightsArray.length;
                                                                                        loop(0);
                                                                                        function loop(cnt) {
                                                                                            var cr = cnt;
                                                                                            //var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("global_country_list"))cm
                                                                                            // inner join(select * from catalogue_detail where cd_name = ?) cd on (cd.cd_cm_id = cm.cm_id )', [country_rightsArray[cr].toLowerCase()], function (err, country_right_cd_id) {
                                                                                            var query = connection_ikon_cms.query('select * from icn_country_currency WHERE icc_country_name = ?', [country_rightsArray[cr].toLowerCase()], function (err, country_right_cd_id) {
                                                                                                if (country_right_cd_id[0]) {
                                                                                                    var query = connection_ikon_cms.query('select * from (select * from vendor_profile where vp_vendor_id= ? )  vp inner join (select * from multiselect_metadata_detail ) mmd on (vp.vp_r_group_id=mmd.cmd_group_id) inner join (select * from rights where r_country_distribution_rights = ? )  r on (mmd.cmd_entity_detail = r.r_group_id)', [obj.cm_vendor, country_right_cd_id[0].cd_id], function (err, country_rights_vendor) {
                                                                                                        if (country_rights_vendor[0]) {
                                                                                                            var query = connection_ikon_cms.query('select * from (select * from(select cm_r_group_id,cm_vendor from content_metadata where cm_id= ? and cm_property_id is null)cn_mt inner join (select * from multiselect_metadata_detail )mmd on (cn_mt.cm_r_group_id=mmd.cmd_group_id)inner join (select * from rights where r_country_distribution_rights = ? ) r on (mmd.cmd_entity_detail = r.r_group_id)) cm', [obj.cm_property_id, country_right_cd_id[0].cd_id], function (err, country_rights_property) {
                                                                                                                if (country_rights_property[0]) {
                                                                                                                    obj.country_rightsList.push(country_right_cd_id[0].cd_id);
                                                                                                                }
                                                                                                                else {
                                                                                                                    Error.push(obj.Property_name + " Property don't have rights for " + country_rightsArray[cr] + " country");
                                                                                                                }
                                                                                                                cnt = cnt + 1;
                                                                                                                if (cnt == country_rightsLength) {
                                                                                                                    callback(err, null);
                                                                                                                }
                                                                                                                else {
                                                                                                                    loop(cnt);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        else {
                                                                                                            Error.push(obj.Vendor_name + " vendor don't have rights for " + country_rightsArray[cr] + " country");
                                                                                                            cnt = cnt + 1;
                                                                                                            if (cnt == country_rightsLength) {
                                                                                                                callback(err, null);
                                                                                                            }
                                                                                                            else {
                                                                                                                loop(cnt);
                                                                                                            }
                                                                                                        }

                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    Error.push(country_rightsArray[cr] + " country name is not available in database");
                                                                                                    cnt = cnt + 1;
                                                                                                    if (cnt == country_rightsLength) {
                                                                                                        callback(err, null);
                                                                                                    }
                                                                                                    else {
                                                                                                        loop(cnt);
                                                                                                    }
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        Error.push("country rights is not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Channel_Rights
                                                                            function (value, callback) {
                                                                                if (obj.cm_vendor && obj.cm_property_id && obj.r_rights_at_content_level && obj.r_rights_at_content_level != 0) {
                                                                                    if (obj.Channel_Rights) {
                                                                                        obj.channel_rightsList = [];
                                                                                        var channel_rightsArray = obj.Channel_Rights.split(',');
                                                                                        var channel_rightsLength = channel_rightsArray.length;
                                                                                        loop(0);
                                                                                        function loop(cnt) {
                                                                                            var cnr = cnt;
                                                                                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Channel Distribution"))cm inner join(select * from catalogue_detail where cd_name = ? ) cd on (cd.cd_cm_id = cm.cm_id )', [channel_rightsArray[cnr].toLowerCase()], function (err, channel_right_cd_id) {
                                                                                                if (channel_right_cd_id[0]) {
                                                                                                    var query = connection_ikon_cms.query('select * from (select * from vendor_profile where vp_vendor_id= ? )  vp inner join (select * from multiselect_metadata_detail ) mmd on (vp.vp_r_group_id=mmd.cmd_group_id) inner join (select * from rights where r_channel_distribution_rights = ? )  r on (mmd.cmd_entity_detail = r.r_group_id)', [obj.cm_vendor, channel_right_cd_id[0].cd_id], function (err, channel_rights_vendor) {
                                                                                                        if (channel_rights_vendor[0]) {
                                                                                                            var query = connection_ikon_cms.query('select * from (select * from(select cm_r_group_id,cm_vendor from content_metadata where cm_id= ? and cm_property_id is null)cn_mt inner join (select * from multiselect_metadata_detail )mmd on (cn_mt.cm_r_group_id=mmd.cmd_group_id)inner join (select * from rights where r_channel_distribution_rights = ? ) r on (mmd.cmd_entity_detail = r.r_group_id)) cm', [obj.cm_property_id, channel_right_cd_id[0].cd_id], function (err, channel_rights_property) {
                                                                                                                if (channel_rights_property[0]) {
                                                                                                                    obj.channel_rightsList.push(channel_right_cd_id[0].cd_id);
                                                                                                                }
                                                                                                                else {
                                                                                                                    Error.push(obj.Property_name + " Property don't have rights for " + channel_rightsArray[cnr] + " channel");
                                                                                                                }
                                                                                                                cnt = cnt + 1;
                                                                                                                if (cnt == channel_rightsLength) {
                                                                                                                    callback(err, null);
                                                                                                                }
                                                                                                                else {
                                                                                                                    loop(cnt);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        else {
                                                                                                            Error.push(obj.Vendor_name + " vendor don't have rights for " + channel_rightsArray[cnr] + " channel");
                                                                                                            cnt = cnt + 1;
                                                                                                            if (cnt == channel_rightsLength) {
                                                                                                                callback(err, null);
                                                                                                            }
                                                                                                            else {
                                                                                                                loop(cnt);
                                                                                                            }
                                                                                                        }

                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    Error.push(channel_rightsArray[cnr] + " channel name is not available in database");
                                                                                                    cnt = cnt + 1;
                                                                                                    if (cnt == channel_rightsLength) {
                                                                                                        callback(err, null);
                                                                                                    }
                                                                                                    else {
                                                                                                        loop(cnt);
                                                                                                    }
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        Error.push("channel rights is not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Plattform_Support
                                                                            function (value, callback) {
                                                                                if (obj.Plattform_Support) {
                                                                                    obj.Plattform_SupportList = [];
                                                                                    var Plattform_SupportArray = obj.Plattform_Support.split(',');
                                                                                    var Plattform_SupportLength = Plattform_SupportArray.length;
                                                                                    loop(0);
                                                                                    function loop(cnt) {
                                                                                        var ps = cnt;
                                                                                        var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Platform Supports"))cm inner join(select * from catalogue_detail where cd_name = ?) cd on (cd.cd_cm_id = cm.cm_id )', [Plattform_SupportArray[ps].toLowerCase()], function (err, platform_support) {
                                                                                            if (platform_support[0]) {
                                                                                                obj.Plattform_SupportList.push(platform_support[0].cd_id);
                                                                                            }
                                                                                            else {
                                                                                                Error.push(Plattform_SupportArray[ps] + " plattform support not avaliable in database");
                                                                                            }
                                                                                            cnt = cnt + 1;
                                                                                            if (cnt == Plattform_SupportLength) {
                                                                                                callback(err, null);
                                                                                            }
                                                                                            else {
                                                                                                loop(cnt);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // CP_Content_id
                                                                            function (value, callback) {
                                                                                if (obj.CP_Content_id) {
                                                                                    var query = connection_ikon_cms.query('SELECT * FROM content_metadata WHERE cm_cp_content_id = ?', [obj.CP_Content_id.toLowerCase()], function (err, cp_content_id) {
                                                                                        if (cp_content_id[0]) {
                                                                                            Error.push("cp content id  must be unique");
                                                                                        }
                                                                                        callback(err, null);
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Go_Live_On
                                                                            function (value, callback) {
                                                                                if (obj.Go_Live_On) {
                                                                                    if (obj.cm_starts_from) {
                                                                                        if (new Date(obj.Go_Live_On) < new Date(obj.cm_starts_from)) {
                                                                                            Error.push("Go Live On date must be greter then property start date");
                                                                                        }
                                                                                    }
                                                                                    callback(null, null);
                                                                                }
                                                                                else {
                                                                                    Error.push("Go Live On date is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Expired_On
                                                                            function (value, callback) {

                                                                                if (obj.Expired_On) {
                                                                                    if (obj.cm_expires_on) {
                                                                                        if (new Date(obj.Expired_On) > new Date(obj.cm_expires_on)) {
                                                                                            Error.push("Expired On date must be less then property expire date");
                                                                                        }
                                                                                    }
                                                                                    callback(null, null);
                                                                                }
                                                                                else {
                                                                                    Error.push("Expired On date is required");
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // base_1280_1280_url
                                                                            function (value, callback) {
                                                                                if (obj.base_1280_1280_url) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_1280_url)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("base_1280_1280_url " + obj.base_1280_1280_url + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // base_1280_720_url
                                                                            function (value, callback) {
                                                                                if (obj.base_1280_720_url) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_720_url)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("base_1280_720_url " + obj.base_1280_720_url + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // base_720_1280_url
                                                                            function (value, callback) {
                                                                                if (obj.base_720_1280_url) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_720_1280_url)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("base_720_1280_url " + obj.base_720_1280_url + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Thumbnail_url_100_100
                                                                            function (value, callback) {
                                                                                if (obj.Thumbnail_url_100_100) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_100_100)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("Thumbnail_url_100_100 " + obj.Thumbnail_url_100_100 + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Thumbnail_url_125_125
                                                                            function (value, callback) {
                                                                                if (obj.Thumbnail_url_125_125) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_125_125)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("Thumbnail_url_125_125 " + obj.Thumbnail_url_125_125 + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Thumbnail_url_150_150
                                                                            function (value, callback) {
                                                                                if (obj.Thumbnail_url_150_150) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_150_150)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("Thumbnail_url_150_150 " + obj.Thumbnail_url_150_150 + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Audio_url
                                                                            function (value, callback) {
                                                                                if (obj.Audio_url) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Audio_url)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("Audio_url " + obj.Audio_url + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Video_url
                                                                            function (value, callback) {
                                                                                if (obj.Video_url) {
                                                                                    if (fs.existsSync('public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Video_url)) {
                                                                                        callback(null, null);
                                                                                    }
                                                                                    else {
                                                                                        Error.push("Video_url " + obj.Video_url + " file not available");
                                                                                        callback(null, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback(null, null);
                                                                                }
                                                                            },
                                                                            // Duration
                                                                            function (value, callback) {
                                                                                if (obj.Duration) {
                                                                                    try {
                                                                                        var val = common.toSeconds(obj.Duration);
                                                                                        if (!isNaN(val)) {
                                                                                            obj.cm_content_duration = val;
                                                                                            callback(null, null);
                                                                                        }
                                                                                        else {
                                                                                            Error.push("Duration is not valid");
                                                                                            callback(null, null);
                                                                                        }
                                                                                    }
                                                                                    catch (err) {
                                                                                        Error.push("Duration is not valid");
                                                                                        callback(err, null);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    if (obj.Parent_Content_Type == 'Video' || obj.Parent_Content_Type == 'Audio') {
                                                                                        Error.push("Duration is required");
                                                                                    }
                                                                                    obj.cm_content_duration = null;
                                                                                    callback(null, null);
                                                                                }
                                                                            }

                                                                        ], function (err, value) {
                                                                            if (err) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'bulkupload',
                                                                                    responseCode: 500,
                                                                                    message: JSON.stringify(err.message)
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                connection_ikon_cms.release();
                                                                            }
                                                                            else {
                                                                                if (Error.length > 0) {
                                                                                    var str = "";
                                                                                    for (var i in Error) {
                                                                                        str += " " + Error[i] + "\r\n";
                                                                                    }
                                                                                    var str1 = " Data : " + parseInt(index + 1) + "\r\n" + str;
                                                                                    TotalError.push(str1);
                                                                                    index = index + 1;
                                                                                    if (records == index) {
                                                                                        var str = "Success : " + (records - TotalError.length) + "   Error : " + TotalError.length + "\r\n \r\n";
                                                                                        for (var i in TotalError) {
                                                                                            str += " " + TotalError[i] + "\r\n";
                                                                                        }
                                                                                        var str1 = filename + ' \r\n \r\n' + str;
                                                                                        fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt',
                                                                                        str1, function (err) {
                                                                                            if (err) {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'bulkupload',
                                                                                                    responseCode: 500,
                                                                                                    message: JSON.stringify(err.message)
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                connection_ikon_cms.release();
                                                                                            }
                                                                                        });
                                                                                        f_index = f_index + 1;
                                                                                        if (fileslength == f_index) {
                                                                                            a = a + 1;
                                                                                            if (a == vendor_length) {
                                                                                                var error = {
                                                                                                    userName: req.session.UserName,
                                                                                                    action: 'bulkupload',
                                                                                                    responseCode: 500,
                                                                                                    message: str1
                                                                                                }
                                                                                                wlogger.error(error); // for error
                                                                                                connection_ikon_cms.release();
                                                                                            }
                                                                                            else {
                                                                                                CheckVendorFiles(a);
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            ExcelreadFile(f_index);
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        CheckMetadata(index);
                                                                                    }

                                                                                }
                                                                                else {
                                                                                    // Insert Function 
                                                                                    async.waterfall([
                                                                                        // get master Id 
                                                                                        function (callback) {
                                                                                            var query = connection_ikon_cms.query('select * from (select * from catalogue_master where cm_name IN ("Search Keywords","Location","Photographer") ) cm', function (err, CatalogueMaster) {
                                                                                                _.each(CatalogueMaster, function (item) {
                                                                                                    if (item.cm_name == "Photographer") {
                                                                                                        obj.photographer_master = item.cm_id;
                                                                                                    }
                                                                                                    else if (item.cm_name == "Location") {
                                                                                                        obj.location_master = item.cm_id;
                                                                                                    }
                                                                                                    else if (item.cm_name == "Search Keywords") {
                                                                                                        obj.keyword_master = item.cm_id;
                                                                                                    }
                                                                                                });
                                                                                                callback(err, null);
                                                                                            });
                                                                                        },
                                                                                        // photographer
                                                                                        function (value, callback) {
                                                                                            if (obj.Photographer) {
                                                                                                var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                                                                    if (err) {
                                                                                                        callback(err, null);
                                                                                                    }
                                                                                                    else {
                                                                                                        var New_cd_Id = result[0].id != null ? parseInt(result[0].id) + 1 : 1;
                                                                                                        var data = {
                                                                                                            cd_id: New_cd_Id,
                                                                                                            cd_cm_id: obj.photographer_master,
                                                                                                            cd_name: obj.Photographer,
                                                                                                            cd_display_name: obj.Photographer,
                                                                                                            cd_desc: null,
                                                                                                            cd_desc1: null,
                                                                                                            cd_crud_isactive: 1
                                                                                                        };
                                                                                                        var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                                                                            obj.cm_photographer = New_cd_Id;
                                                                                                            callback(err, New_cd_Id);
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Location
                                                                                        function (value, callback) {
                                                                                            if (obj.Location) {
                                                                                                var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                                                                    if (err) {
                                                                                                        callback(err, null);
                                                                                                    }
                                                                                                    else {
                                                                                                        var New_cd_Id = result[0].id != null ? parseInt(result[0].id) + 1 : 1;
                                                                                                        var data = {
                                                                                                            cd_id: New_cd_Id,
                                                                                                            cd_cm_id: obj.location_master,
                                                                                                            cd_name: obj.Location,
                                                                                                            cd_display_name: obj.Location,
                                                                                                            cd_desc: null,
                                                                                                            cd_desc1: null,
                                                                                                            cd_crud_isactive: 1
                                                                                                        };
                                                                                                        var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                                                                            obj.cm_location = New_cd_Id;
                                                                                                            callback(err, New_cd_Id);
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Search keyword
                                                                                        function (value, callback) {
                                                                                            if (obj.Search_Keywords) {
                                                                                                var search_keywordArray = obj.Search_Keywords.split(',');
                                                                                                var key_length = search_keywordArray.length;
                                                                                                addkeyword(0);
                                                                                                function addkeyword(k) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var New_cd_Id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                            var data = {
                                                                                                                cd_id: New_cd_Id,
                                                                                                                cd_cm_id: obj.keyword_master,
                                                                                                                cd_name: search_keywordArray[k],
                                                                                                                cd_display_name: search_keywordArray[k],
                                                                                                                cd_crud_isactive: 1,
                                                                                                                cd_desc: null,
                                                                                                                cd_desc1: null,
                                                                                                            };
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                                                                                var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, null);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        var cmd_group_id = obj.cm_key_words ? obj.cm_key_words : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                                        var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                                        obj.cm_key_words = cmd_group_id;
                                                                                                                        var Multiselect_Data = {
                                                                                                                            cmd_id: cmd_id,
                                                                                                                            cmd_group_id: cmd_group_id,
                                                                                                                            cmd_entity_type: obj.cm_content_type,
                                                                                                                            cmd_entity_detail: New_cd_Id,
                                                                                                                            cmd_crud_isactive: 1
                                                                                                                        }
                                                                                                                        var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                            k = k + 1;
                                                                                                                            if (k == key_length) {
                                                                                                                                callback(err, obj.cm_key_words);
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                addkeyword(k);
                                                                                                                            }
                                                                                                                        });
                                                                                                                    }
                                                                                                                });
                                                                                                            });
                                                                                                        }
                                                                                                    });

                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // celebrity
                                                                                        function (value, callback) {
                                                                                            if (obj.Celebrity) {
                                                                                                var celb_length = obj.celebrityList.length;
                                                                                                addcelebrity(0);
                                                                                                function addcelebrity(c) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var cmd_group_id = obj.cm_celebrity ? obj.cm_celebrity : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                            var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                            obj.cm_celebrity = cmd_group_id;
                                                                                                            var Multiselect_Data = {
                                                                                                                cmd_id: cmd_id,
                                                                                                                cmd_group_id: cmd_group_id,
                                                                                                                cmd_entity_type: obj.cm_content_type,
                                                                                                                cmd_entity_detail: obj.celebrityList[c],
                                                                                                                cmd_crud_isactive: 1

                                                                                                            }
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                c = c + 1;
                                                                                                                if (c == celb_length) {
                                                                                                                    callback(err, obj.cm_celebrity);
                                                                                                                }
                                                                                                                else {
                                                                                                                    addcelebrity(c);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_celebrity = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // language
                                                                                        function (value, callback) {
                                                                                            if (obj.Languages) {
                                                                                                var lang_length = obj.languageList.length;
                                                                                                addlanguage(0);
                                                                                                function addlanguage(l) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var cmd_group_id = obj.cm_language ? obj.cm_language : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                            var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                            obj.cm_language = cmd_group_id;
                                                                                                            var Multiselect_Data = {
                                                                                                                cmd_id: cmd_id,
                                                                                                                cmd_group_id: cmd_group_id,
                                                                                                                cmd_entity_type: obj.cm_content_type,
                                                                                                                cmd_entity_detail: obj.languageList[l],
                                                                                                                cmd_crud_isactive: 1
                                                                                                            }
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                l = l + 1;
                                                                                                                if (l == lang_length) {
                                                                                                                    callback(err, obj.cm_language);
                                                                                                                }
                                                                                                                else {
                                                                                                                    addlanguage(l);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_language = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // singer
                                                                                        function (value, callback) {
                                                                                            if (obj.Singer) {
                                                                                                var singer_length = obj.singerList.length;
                                                                                                addsinger(0);
                                                                                                function addsinger(s) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var cmd_group_id = obj.cm_singer ? obj.cm_singer : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                            var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                            obj.cm_singer = cmd_group_id;
                                                                                                            var Multiselect_Data = {
                                                                                                                cmd_id: cmd_id,
                                                                                                                cmd_group_id: cmd_group_id,
                                                                                                                cmd_entity_type: obj.cm_content_type,
                                                                                                                cmd_entity_detail: obj.singerList[s],
                                                                                                                cmd_crud_isactive: 1
                                                                                                            }
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                s = s + 1;
                                                                                                                if (s == singer_length) {
                                                                                                                    callback(err, obj.cm_singer);
                                                                                                                }
                                                                                                                else {
                                                                                                                    addsinger(s);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_singer = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // music director
                                                                                        function (value, callback) {
                                                                                            if (obj.Music_Director) {
                                                                                                var musicdirectors_length = obj.music_directorList.length;
                                                                                                addmusicdirectors(0);
                                                                                                function addmusicdirectors(m) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var cmd_group_id = obj.cm_music_director ? obj.cm_music_director : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                            var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                            obj.cm_music_director = cmd_group_id;
                                                                                                            var Multiselect_Data = {
                                                                                                                cmd_id: cmd_id,
                                                                                                                cmd_group_id: cmd_group_id,
                                                                                                                cmd_entity_type: obj.cm_content_type,
                                                                                                                cmd_entity_detail: obj.music_directorList[m],
                                                                                                                cmd_crud_isactive: 1
                                                                                                            }
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                m = m + 1;
                                                                                                                if (m == musicdirectors_length) {
                                                                                                                    callback(err, obj.cm_music_director);
                                                                                                                }
                                                                                                                else {
                                                                                                                    addmusicdirectors(m);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_music_director = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // platform support 
                                                                                        function (value, callback) {
                                                                                            if (obj.Plattform_Support) {
                                                                                                var plat_length = obj.Plattform_SupportList.length;
                                                                                                addplatform(0);
                                                                                                function addplatform(p) {
                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var cmd_group_id = obj.cm_platform_support ? obj.cm_platform_support : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                                                                            var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                                                            obj.cm_platform_support = cmd_group_id;
                                                                                                            var Multiselect_Data = {
                                                                                                                cmd_id: cmd_id,
                                                                                                                cmd_group_id: cmd_group_id,
                                                                                                                cmd_entity_type: obj.cm_content_type,
                                                                                                                cmd_entity_detail: obj.Plattform_SupportList[p],
                                                                                                                cmd_crud_isactive: 1
                                                                                                            }
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                                                                p = p + 1;
                                                                                                                if (p == plat_length) {
                                                                                                                    callback(err, obj.cm_platform_support);
                                                                                                                }
                                                                                                                else {
                                                                                                                    addplatform(p);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_platform_support = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Create Rights Array For Insert
                                                                                        function (value, callback) {
                                                                                            if (obj.Country_Rights && obj.Channel_Rights) {
                                                                                                if (obj.country_rightsList.length > 0 && obj.channel_rightsList.length > 0) {
                                                                                                    var addrights = [];
                                                                                                    for (var k in obj.channel_rightsList) {
                                                                                                        for (var j in obj.country_rightsList) {
                                                                                                            addrights.push({ country_id: obj.country_rightsList[j], channel_id: obj.channel_rightsList[k] });
                                                                                                        }
                                                                                                    }
                                                                                                    callback(null, addrights);
                                                                                                }
                                                                                                else {
                                                                                                    callback(null, []);
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, []);
                                                                                            }
                                                                                        },
                                                                                        // Insert Rights 
                                                                                        function (addrights, callback) {
                                                                                            if (addrights.length > 0) {
                                                                                                var rightslength = addrights.length;
                                                                                                var query = connection_ikon_cms.query('SELECT MAX(cmd_group_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                                                                                    if (err) {
                                                                                                        callback(err, null);
                                                                                                    }
                                                                                                    else {
                                                                                                        var cmd_group_id = obj.cm_r_group_id ? obj.cm_r_group_id : result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                        obj.cm_r_group_id = cmd_group_id;
                                                                                                        loop(0);
                                                                                                        function loop(cnt) {
                                                                                                            var j = cnt;
                                                                                                            var query = connection_ikon_cms.query('SELECT MAX(r_id) as id, MAX(r_group_id) as groupid FROM rights', function (err, result) {
                                                                                                                if (err) {
                                                                                                                    callback(err, null);
                                                                                                                }
                                                                                                                else {
                                                                                                                    var r_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                                    var r_group_id = result[0].groupid != null ? (parseInt(result[0].groupid) + 1) : 1;
                                                                                                                    var Rights_datas = {
                                                                                                                        r_id: r_id,
                                                                                                                        r_group_id: r_group_id,
                                                                                                                        r_entity_type: obj.cm_content_type,
                                                                                                                        r_allowed_content_type: obj.cm_content_type,
                                                                                                                        r_country_distribution_rights: addrights[j].country_id,
                                                                                                                        r_channel_distribution_rights: addrights[j].channel_id,
                                                                                                                        r_created_on: new Date(),
                                                                                                                        r_modified_on: new Date(),
                                                                                                                        r_created_by: "admin",
                                                                                                                        r_modified_by: "admin",
                                                                                                                        r_crud_isactive: 1
                                                                                                                    };
                                                                                                                    var query = connection_ikon_cms.query('INSERT INTO rights SET ?', Rights_datas, function (err, result) {
                                                                                                                        if (err) {
                                                                                                                            callback(err, null);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                                                                                                                if (err) {
                                                                                                                                    callback(err, null);
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    var cmd_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                                                    var cmd_data = {
                                                                                                                                        cmd_id: cmd_id,
                                                                                                                                        cmd_group_id: cmd_group_id,
                                                                                                                                        cmd_entity_type: obj.cm_content_type,
                                                                                                                                        cmd_entity_detail: r_group_id,
                                                                                                                                        cmd_crud_isactive: 1
                                                                                                                                    };
                                                                                                                                    var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', cmd_data, function (err, result) {
                                                                                                                                        cnt = cnt + 1;
                                                                                                                                        if (cnt == rightslength) {
                                                                                                                                            callback(err, null);
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            loop(cnt);
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                obj.cm_r_group_id = null;
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Insert Meta Data 
                                                                                        function (value, callback) {
                                                                                            var query = connection_ikon_cms.query('SELECT MAX(cm_id) as id FROM content_metadata', function (err, result) {
                                                                                                if (err) {
                                                                                                    callback(err, null);
                                                                                                }
                                                                                                else {
                                                                                                    var cm_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                                                                    var metadata = {
                                                                                                        cm_id: cm_id,
                                                                                                        cm_vendor: obj.cm_vendor,
                                                                                                        cm_content_type: obj.cm_content_type,
                                                                                                        cm_r_group_id: obj.cm_r_group_id,
                                                                                                        cm_title: obj.Content_display_title,
                                                                                                        cm_short_desc: obj.Short_description,
                                                                                                        cm_release_year: null,
                                                                                                        cm_starts_from: new Date(obj.Go_Live_On),
                                                                                                        cm_expires_on: new Date(obj.Expired_On),
                                                                                                        cm_property_id: obj.cm_property_id,
                                                                                                        cm_display_title: obj.Content_display_title,
                                                                                                        cm_celebrity: obj.cm_celebrity,
                                                                                                        cm_genre: obj.cm_genre,
                                                                                                        cm_sub_genre: obj.cm_sub_genre,
                                                                                                        cm_protographer: obj.cm_photographer,
                                                                                                        cm_mood: obj.cm_mood,
                                                                                                        cm_language: obj.cm_language,
                                                                                                        cm_platform_support: obj.cm_platform_support,
                                                                                                        cm_nudity: obj.cm_nudity,
                                                                                                        cm_parental_advisory: null,
                                                                                                        cm_location: obj.cm_location,
                                                                                                        cm_festival_occasion: obj.cm_festival_occasion,
                                                                                                        cm_religion: obj.cm_religion,
                                                                                                        cm_cp_content_id: obj.CP_Content_id,
                                                                                                        cm_content_duration: obj.cm_content_duration,
                                                                                                        cm_singer: obj.cm_singer,
                                                                                                        cm_music_director: obj.cm_music_director,
                                                                                                        cm_content_quality: obj.cm_content_quality,
                                                                                                        cm_key_words: obj.cm_key_words,
                                                                                                        cm_raag_tal: obj.cm_raag_tal,
                                                                                                        cm_instruments: obj.cm_instruments,
                                                                                                        cm_long_description: obj.Long_description,
                                                                                                        cm_mode: obj.cm_mode,
                                                                                                        cm_is_app_store_purchase: obj.cm_is_app_store_purchase,
                                                                                                        cm_signature: null,
                                                                                                        cm_state: 1,
                                                                                                        cm_rank: obj.cm_rank,
                                                                                                        cm_is_active: 1,
                                                                                                        cm_comment: null,
                                                                                                        cm_live_on: new Date(obj.Expired_On),
                                                                                                        cm_created_on: new Date(),
                                                                                                        cm_created_by: 'admin',
                                                                                                        cm_modified_on: new Date(),
                                                                                                        cm_modified_by: 'admin',
                                                                                                        cm_crud_isactive: 1
                                                                                                    }
                                                                                                    var query = connection_ikon_cms.query('INSERT INTO content_metadata SET ?', metadata, function (err, result) {
                                                                                                        obj.cm_id = cm_id;
                                                                                                        obj.MetaId = cm_id;
                                                                                                        callback(err, cm_id);
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        },
                                                                                        // Thumbnail_url_100_100
                                                                                        function (value, callback) {
                                                                                            if (obj.Thumbnail_url_100_100) {
                                                                                                var file_ext = obj.Thumbnail_url_100_100.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_thumb_' + 100 + "_" + 100 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_thumb_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_thumb_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_100_100;
                                                                                               // shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
                                                                                               shell.exec('cp "' + new_path + '" "' + base_path + '"');
																							   var thumb = {
                                                                                                    cft_cm_id: obj.cm_id,
                                                                                                    cft_thumbnail_size: 100 + "*" + 100,
                                                                                                    cft_thumbnail_img_browse: save_path,
                                                                                                    cft_created_on: new Date(),
                                                                                                    cft_created_by: 'admin',
                                                                                                    cft_modified_on: new Date(),
                                                                                                    cft_modified_by: 'admin',
                                                                                                    cft_crud_isactive: 1
                                                                                                }
                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                    callback(null, null);
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Thumbnail_url_125_125
                                                                                        function (value, callback) {
                                                                                            if (obj.Thumbnail_url_125_125) {
                                                                                                var file_ext = obj.Thumbnail_url_125_125.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_thumb_' + 125 + "_" + 125 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_thumb_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_thumb_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_125_125;
                                                                                               // shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																								   shell.exec('cp "' + new_path + '" "' + base_path + '"');
                                                                                                var thumb = {
                                                                                                    cft_cm_id: obj.cm_id,
                                                                                                    cft_thumbnail_size: 125 + "*" + 125,
                                                                                                    cft_thumbnail_img_browse: save_path,
                                                                                                    cft_created_on: new Date(),
                                                                                                    cft_created_by: 'admin',
                                                                                                    cft_modified_on: new Date(),
                                                                                                    cft_modified_by: 'admin',
                                                                                                    cft_crud_isactive: 1
                                                                                                }
                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                    callback(null, null);
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                        // Thumbnail_url_150_150
                                                                                        function (value, callback) {
                                                                                            if (obj.Thumbnail_url_150_150) {
                                                                                                var file_ext = obj.Thumbnail_url_150_150.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_thumb_' + 150 + "_" + 150 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_thumb_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_thumb_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Thumbnail_url_150_150;
                                                                                                //shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																								   shell.exec('cp "' + new_path + '" "' + base_path + '"');
                                                                                                var thumb = {
                                                                                                    cft_cm_id: obj.cm_id,
                                                                                                    cft_thumbnail_size: 150 + "*" + 150,
                                                                                                    cft_thumbnail_img_browse: save_path,
                                                                                                    cft_created_on: new Date(),
                                                                                                    cft_created_by: 'admin',
                                                                                                    cft_modified_on: new Date(),
                                                                                                    cft_modified_by: 'admin',
                                                                                                    cft_crud_isactive: 1
                                                                                                }
                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                    callback(null, null);
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                       // Templates
                                                                                        function (value, callback) {
                                                                                            var query = connection_ikon_cms.query('select heightgroupid as ct_group_id,width,height  from (select ct_param as width,ct_group_id as widthgroupid from content_template where ct_param_value = "width" )width inner join (select ct_param as height,ct_group_id as heightgroupid from content_template where ct_param_value = "height" )height on(width.widthgroupid =height.heightgroupid)', function (err, Templates) {
                                                                                                callback(err, Templates);
                                                                                            });
                                                                                        },
                                                                                         // base_1280_1280_url
                                                                                        function (Templates, callback) {
                                                                                            if (obj.base_1280_1280_url) {
                                                                                                //'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_1280_url
                                                                                                var file_ext = obj.base_1280_1280_url.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_' + 1280 + "_" + 1280 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_wallpaper_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_wallpaper_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_1280_url;
                                                                                               //
																							  // shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																								   shell.exec('cp "' + new_path + '" "' + base_path + '"');
                                                                                                ThumbFiles = [];
                                                                                                var Formats = config.Base1;
                                                                                                var length = Formats.length;
                                                                                                function endloop(index, length) {
                                                                                                    index = index + 1;
                                                                                                    if (length == index) {
                                                                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM `content_files` where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [obj.cm_id], function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
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
                                                                                                                            cft_cm_id: obj.cm_id,
                                                                                                                            cft_thumbnail_size: ThumbFiles[tf].width + "*" + ThumbFiles[tf].height,
                                                                                                                            cft_thumbnail_img_browse: ThumbFiles[tf].filename,
                                                                                                                            cft_created_on: new Date(),
                                                                                                                            cft_created_by: 'admin',
                                                                                                                            cft_modified_on: new Date(),
                                                                                                                            cft_modified_by: 'admin',
                                                                                                                            cft_crud_isactive: 1
                                                                                                                        }
                                                                                                                        var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                                            if (err) {
                                                                                                                                callback(err, Templates);
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                tf = tf + 1;
                                                                                                                                if (thumblength == tf) {
                                                                                                                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                                        if (err) {
                                                                                                                                            callback(err, Templates);
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            if (cm_state == 2) {
                                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                                    if (err) {
                                                                                                                                                        callback(err, Templates);
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
                                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                                   // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                                    th = th + 1;
                                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                                    }
                                                                                                                                                                                    else {
                                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                                    }
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                            else {
                                                                                                                                                                                callback(err, Templates);
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
                                                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                            //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                            th = th + 1;
                                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                                callback(err, Templates);
                                                                                                                                                                            }
                                                                                                                                                                            else {
                                                                                                                                                                                thumnloop(th);
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                callback(err, Templates);
                                                                                                                                            }
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
                                                                                                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                        if (err) {
                                                                                                                            callback(err, Templates);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            if (cm_state == 2) {
                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                    if (err) {
                                                                                                                                        callback(err, Templates);
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
                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                    th = th + 1;
                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                callback(err, Templates);
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
                                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                          //  shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                                            th = th + 1;
                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                callback(err, Templates);
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                thumnloop(th);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        callback(err, Templates);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                });
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                callback(err, Templates);
                                                                                                                            }
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
                                                                                                        var subfile = (obj.MetaId + '_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                        var subfilepath = config.site_wallpaper_path + subfile;
                                                                                                        var save_path1 = config.site_base_path + subfilepath;
                                                                                                        if (!(width == 1280 && height == 1280)) {
                                                                                                            if (width == 100 && height == 100 && !obj.Thumbnail_url_100_100) {
                                                                                                                var thumbname = (obj.MetaId + '_thumb_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                                var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                                                ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 100, height: 100 });
                                                                                                                shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                                            }
                                                                                                            if (width == 125 && height == 125 && !obj.Thumbnail_url_125_125) {
                                                                                                                var thumbname = (obj.MetaId + '_thumb_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                                var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                                                ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 125, height: 125 });
                                                                                                                shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                                            }
                                                                                                            if (width == 150 && height == 150 && !obj.Thumbnail_url_150_150) {
                                                                                                                var thumbname = (obj.MetaId + '_thumb_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                                var thumbpath = config.site_base_path + config.site_thumb_path + thumbname;
                                                                                                                ThumbFiles.push({ filename: config.site_thumb_path + thumbname, width: 150, height: 150 });
                                                                                                                shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' ' + thumbpath);
                                                                                                            }
                                                                                                            shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' "' + save_path1 + '"');
                                                                                                        }

                                                                                                        var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
                                                                                                            }
                                                                                                            else {
                                                                                                                var file = {
                                                                                                                    cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                                                    cf_cm_id: obj.cm_id,
                                                                                                                    cf_original_processed: (width == 1280 && height == 1280) ? 1 : 0,
                                                                                                                    cf_url_base: save_path,
                                                                                                                    cf_url: subfilepath,
                                                                                                                    cf_absolute_url: save_path,
                                                                                                                    cf_template_id: match.ct_group_id
                                                                                                                };
                                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, Templates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        endloop(index, length);
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        endloop(index, length);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, Templates);
                                                                                            }
                                                                                        },
                                                                                        // base_1280_720_url
                                                                                        function (Templates, callback) {
                                                                                            if (obj.base_1280_720_url) {
                                                                                                // 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_720_url
                                                                                                var Formats = config.Base2;
                                                                                                var file_ext = obj.base_1280_720_url.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_' + 1280 + "_" + 720 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_wallpaper_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_wallpaper_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_1280_720_url;
                                                                                                //shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																								shell.exec('cp "' + new_path + '" "' + base_path + '"');
                                                                                                ThumbFiles = [];
                                                                                                var length = Formats.length;
                                                                                                function endloop(index, length) {
                                                                                                    index = index + 1;
                                                                                                    if (length == index) {
                                                                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM `content_files` where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [obj.cm_id], function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
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

                                                                                                                var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, Templates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        if (cm_state == 2) {
                                                                                                                            var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                if (err) {
                                                                                                                                    callback(err, Templates);
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
                                                                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                th = th + 1;
                                                                                                                                                                if (th == thumb_length) {
                                                                                                                                                                    callback(err, Templates);
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    thumnloop(th);
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            callback(err, Templates);
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
                                                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                       // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                        shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                        shell.exec('chmod 777 ' + newpath);
                                                                                                                                                        th = th + 1;
                                                                                                                                                        if (th == thumb_length) {
                                                                                                                                                            callback(err, Templates);
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            thumnloop(th);
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    callback(err, Templates);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            callback(err, Templates);
                                                                                                                        }
                                                                                                                    }
                                                                                                                });

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
                                                                                                        var subfile = (obj.MetaId + '_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                        var subfilepath = config.site_wallpaper_path + subfile;
                                                                                                        var save_path1 = config.site_base_path + subfilepath;
                                                                                                        if (!(width == 1280 && height == 720)) {
                                                                                                            shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' "' + save_path1 + '"');
                                                                                                        }

                                                                                                        var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
                                                                                                            }
                                                                                                            else {
                                                                                                                var file = {
                                                                                                                    cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                                                    cf_cm_id: obj.cm_id,
                                                                                                                    cf_original_processed: (width == 1280 && height == 720) ? 1 : 0,
                                                                                                                    cf_url_base: save_path,
                                                                                                                    cf_url: subfilepath,
                                                                                                                    cf_absolute_url: save_path,
                                                                                                                    cf_template_id: match.ct_group_id
                                                                                                                };
                                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, Templates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        endloop(index, length);
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        });

                                                                                                    }
                                                                                                    else {
                                                                                                        endloop(index, length);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, Templates);
                                                                                            }
                                                                                        },
                                                                                        // base_720_1280_url
                                                                                        function (Templates, callback) {
                                                                                            if (obj.base_720_1280_url) {
                                                                                                // 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_720_1280_url
                                                                                                var Formats = config.Base3;
                                                                                                var file_ext = obj.base_720_1280_url.split('.').pop();
                                                                                                var filenamedata = (obj.MetaId + '_' + 720 + "_" + 1280 + '.' + file_ext).toLowerCase();
                                                                                                var save_path = config.site_wallpaper_path + filenamedata;
                                                                                                var base_path = config.site_base_path + config.site_wallpaper_path + filenamedata;
                                                                                                var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.base_720_1280_url;
                                                                                                //shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																								shell.exec('cp "' + new_path + '" "' + base_path + '"');
                                                                                                ThumbFiles = [];
                                                                                                var length = Formats.length;
                                                                                                function endloop(index, length) {
                                                                                                    index = index + 1;
                                                                                                    if (length == index) {
                                                                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM `content_files` where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [obj.cm_id], function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
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

                                                                                                                var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, Templates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        if (cm_state == 2) {
                                                                                                                            var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                if (err) {
                                                                                                                                    callback(err, Templates);
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
                                                                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                               // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                th = th + 1;
                                                                                                                                                                if (th == thumb_length) {
                                                                                                                                                                    callback(err, Templates);
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    thumnloop(th);
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            callback(err, Templates);
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
                                                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                       // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                        shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                        shell.exec('chmod 777 ' + newpath);
                                                                                                                                                        th = th + 1;
                                                                                                                                                        if (th == thumb_length) {
                                                                                                                                                            callback(err, Templates);
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            thumnloop(th);
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    callback(err, Templates);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            callback(err, Templates);
                                                                                                                        }
                                                                                                                    }
                                                                                                                });

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
                                                                                                        var subfile = (obj.MetaId + '_' + width + "_" + height + '.' + file_ext).toLowerCase();
                                                                                                        var subfilepath = config.site_wallpaper_path + subfile;
                                                                                                        var save_path1 = config.site_base_path + subfilepath;
                                                                                                        if (!(width == 720 && height == 1280)) {
                                                                                                            shell.exec('ffmpeg -y  -i "' + new_path + '" -vf scale=' + width + ':' + height + ' "' + save_path1 + '"');
                                                                                                        }

                                                                                                        var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
                                                                                                            }
                                                                                                            else {
                                                                                                                var file = {
                                                                                                                    cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                                                    cf_cm_id: obj.cm_id,
                                                                                                                    cf_original_processed: (width == 720 && height == 1280) ? 1 : 0,
                                                                                                                    cf_url_base: save_path,
                                                                                                                    cf_url: subfilepath,
                                                                                                                    cf_absolute_url: save_path,
                                                                                                                    cf_template_id: match.ct_group_id
                                                                                                                };
                                                                                                                var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, Templates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        endloop(index, length);
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        });

                                                                                                    }
                                                                                                    else {
                                                                                                        endloop(index, length);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, Templates);
                                                                                            }
                                                                                        },
                                                                                        // Video_url
                                                                                        function (Templates, callback) {
                                                                                            if (obj.Video_url) {
                                                                                                var match = _.find(Templates, function (val) { return val.width == 640 && val.height == 320; })
                                                                                                if (match) {
                                                                                                    var file_ext = obj.Video_url.split('.').pop();
                                                                                                    var filenamedata = (obj.MetaId + '_' + 640 + "_" + 320 + '.' + file_ext).toLowerCase();
                                                                                                    var save_path = config.site_video_path + filenamedata;
                                                                                                    var base_path = config.site_base_path + config.site_video_path + filenamedata;
                                                                                                    var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Video_url;
                                                                                                   // shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																									shell.exec('cp "' + new_path + '" "' + base_path + '"');
																									
                                                                                                    var ThumbFiles = [];
                                                                                                    function endloop() {
                                                                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM `content_files` where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [obj.cm_id], function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, Templates);
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
                                                                                                                    UploadThumbData(0)
                                                                                                                    function UploadThumbData(tf) {
                                                                                                                        var thumb = {
                                                                                                                            cft_cm_id: obj.cm_id,
                                                                                                                            cft_thumbnail_size: ThumbFiles[tf].width + "*" + ThumbFiles[tf].height,
                                                                                                                            cft_thumbnail_img_browse: ThumbFiles[tf].filename,
                                                                                                                            cft_created_on: new Date(),
                                                                                                                            cft_created_by: 'admin',
                                                                                                                            cft_modified_on: new Date(),
                                                                                                                            cft_modified_by: 'admin',
                                                                                                                            cft_crud_isactive: 1
                                                                                                                        }
                                                                                                                        var query = connection_ikon_cms.query('INSERT INTO content_files_thumbnail SET ?', thumb, function (err, result) {
                                                                                                                            if (err) {
                                                                                                                                callback(err, Templates);
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                tf = tf + 1;
                                                                                                                                if (thumblength == tf) {
                                                                                                                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                                        if (err) {
                                                                                                                                            callback(err, Templates);
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            if (cm_state == 2) {
                                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                                    if (err) {
                                                                                                                                                        callback(err, Templates);
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
                                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                                    //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
																																												  th = th + 1;
                                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                                    }
                                                                                                                                                                                    else {
                                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                                    }
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                            else {
                                                                                                                                                                                callback(err, Templates);
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
                                                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                           // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                            th = th + 1;
                                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                                callback(err, Templates);
                                                                                                                                                                            }
                                                                                                                                                                            else {
                                                                                                                                                                                thumnloop(th);
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                });
                                                                                                                                            }
                                                                                                                                            else {
                                                                                                                                                callback(err, Templates);
                                                                                                                                            }
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
                                                                                                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, result) {
                                                                                                                        if (err) {
                                                                                                                            callback(err, Templates);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            if (cm_state == 2) {
                                                                                                                                var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                    if (err) {
                                                                                                                                        callback(err, Templates);
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
                                                                                                                                                    var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                                   // shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                    shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                    shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                    th = th + 1;
                                                                                                                                                                    if (th == thumb_length) {
                                                                                                                                                                        callback(err, Templates);
                                                                                                                                                                    }
                                                                                                                                                                    else {
                                                                                                                                                                        thumnloop(th);
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                callback(err, Templates);
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
                                                                                                                                            var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                            //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                            shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                            shell.exec('chmod 777 ' + newpath);
                                                                                                                                                            th = th + 1;
                                                                                                                                                            if (th == thumb_length) {
                                                                                                                                                                callback(err, Templates);
                                                                                                                                                            }
                                                                                                                                                            else {
                                                                                                                                                                thumnloop(th);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                    else {
                                                                                                                                                        callback(err, Templates);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                });
                                                                                                                            }
                                                                                                                            else {
                                                                                                                                callback(err, Templates);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            }
                                                                                                        });
                                                                                                    }

                                                                                                    if (!obj.Thumbnail_url_100_100) {
                                                                                                        var subfile1 = (obj.MetaId + '_thumb_' + 100 + "_" + 100 + '.' + 'jpg').toLowerCase();
                                                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile1, width: 100, height: 100 });
                                                                                                        var thumbpath1 = config.site_base_path + config.site_thumb_path + subfile1;
                                                                                                        shell.exec('ffmpeg -y -i "' + new_path + '" -ss 00:00:11.435 -s 100x100 -vframes 1 ' + thumbpath1);
                                                                                                    }
                                                                                                    if (!obj.Thumbnail_url_125_125) {
                                                                                                        var subfile2 = (obj.MetaId + '_thumb_' + 125 + "_" + 125 + '.' + 'jpg').toLowerCase();
                                                                                                        var thumbpath2 = config.site_base_path + config.site_thumb_path + subfile2;
                                                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile2, width: 125, height: 125 });
                                                                                                        shell.exec('ffmpeg -y -i "' + new_path + '" -ss 00:00:11.435 -s 125x125 -vframes 1 ' + thumbpath2);
                                                                                                    }
                                                                                                    if (!obj.Thumbnail_url_150_150) {
                                                                                                        var subfile3 = (obj.MetaId + '_thumb_' + 150 + "_" + 150 + '.' + 'jpg').toLowerCase();
                                                                                                        var thumbpath3 = config.site_base_path + config.site_thumb_path + subfile3;
                                                                                                        ThumbFiles.push({ filename: config.site_thumb_path + subfile3, width: 150, height: 150 });
                                                                                                        shell.exec('ffmpeg -y -i "' + new_path + '" -ss 00:00:11.435 -s 150x150 -vframes 1 ' + thumbpath3);
                                                                                                    }

                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                        if (err) {
                                                                                                            callback(err, null);
                                                                                                        }
                                                                                                        else {
                                                                                                            var file = {
                                                                                                                cf_id: result[0].id == null ? 1 : result[0].id + 1,
                                                                                                                cf_cm_id: obj.cm_id,
                                                                                                                cf_original_processed: 1,
                                                                                                                cf_url_base: save_path,
                                                                                                                cf_url: save_path,
                                                                                                                cf_absolute_url: save_path,
                                                                                                                cf_template_id: match.ct_group_id
                                                                                                            };
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                                if (err) {
                                                                                                                    callback(err, null);
                                                                                                                }
                                                                                                                else {
                                                                                                                    endloop();
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    callback(null, null);
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        },
                                                                                            //Other Template
                                                                                        function (value, callback) {
                                                                                            var query = connection_ikon_cms.query('select * from (select * from content_template where ct_param_value in ("bitrate","common"))other', function (err, OtherTemplates) {
                                                                                                callback(err, OtherTemplates);
                                                                                            });
                                                                                        },
                                                                                            // Audio_url
                                                                                        function (OtherTemplates, callback) {
                                                                                            if (obj.Audio_url) {
                                                                                                var match = _.find(OtherTemplates, function (val) { return val.ct_param == 128 })
                                                                                                if (match) {
                                                                                                    var file_ext = obj.Audio_url.split('.').pop();
                                                                                                    var filenamedata = (obj.MetaId + '_' + 128 + '.' + file_ext).toLowerCase();
                                                                                                    var save_path = config.site_audio_path + filenamedata;
                                                                                                    var base_path = config.site_base_path + config.site_audio_path + filenamedata;
                                                                                                    var new_path = 'public/Vendors/' + Vendors[a].vd_name + '/Files/' + obj.Audio_url;
                                                                                                   // shell.exec('ffmpeg -y  -i "' + new_path + '" -c copy "' + base_path + '"');
																									shell.exec('cp "' + new_path + '" "' + base_path + '"');
																								
                                                                                                    function endloop() {
                                                                                                        var query = connection_ikon_cms.query('select * from (SELECT * FROM `content_files` where cf_cm_id =?)cf inner join(select cm_id,cm_state from content_metadata)cm on(cm.cm_id =cf.cf_cm_id)', [obj.cm_id], function (err, result) {
                                                                                                            if (err) {
                                                                                                                callback(err, OtherTemplates);
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
                                                                                                                var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_state=? ,cm_modified_on = ? , cm_modified_by = ? WHERE cm_id=?', [cm_state, new Date(), 'admin', obj.cm_id], function (err, Templates) {
                                                                                                                    if (err) {
                                                                                                                        callback(err, OtherTemplates);
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        if (cm_state == 2) {
                                                                                                                            var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.cm_id], function (err, files) {
                                                                                                                                if (err) {
                                                                                                                                    callback(err, OtherTemplates);
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
                                                                                                                                                var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                             //   shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                                shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                                shell.exec('chmod 777 ' + newpath);
                                                                                                                                                                th = th + 1;
                                                                                                                                                                if (th == thumb_length) {
                                                                                                                                                                    callback(err, OtherTemplates);
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    thumnloop(th);
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            callback(err, OtherTemplates);
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
                                                                                                                                        var query = connection_ikon_cms.query('select * from content_files_thumbnail where cft_cm_id = ?', [obj.cm_id], function (err, Thumbs) {
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
                                                                                                                                                        //shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                                                                                                                                        shell.exec('cp "' + oldpath + '" "' + newpath + '"');
                                                                                                                                                        shell.exec('chmod 777 ' + newpath);
                                                                                                                                                        th = th + 1;
                                                                                                                                                        if (th == thumb_length) {
                                                                                                                                                            callback(err, OtherTemplates);
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            thumnloop(th);
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    callback(err, OtherTemplates);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            callback(err, OtherTemplates);
                                                                                                                        }
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        });

                                                                                                    }

                                                                                                    var query = connection_ikon_cms.query('SELECT MAX(cf_id) as id FROM content_files', function (err, result) {
                                                                                                        if (err) {
                                                                                                            callback(err, OtherTemplates);
                                                                                                        }
                                                                                                        else {
                                                                                                            var file = {
                                                                                                                cf_id: result[0].id == null ? 1 : parseInt(result[0].id + 1),
                                                                                                                cf_cm_id: obj.cm_id,
                                                                                                                cf_original_processed: 1,
                                                                                                                cf_url_base: save_path,
                                                                                                                cf_url: save_path,
                                                                                                                cf_absolute_url: save_path,
                                                                                                                cf_template_id: match.ct_group_id
                                                                                                            };
                                                                                                            var query = connection_ikon_cms.query('INSERT INTO content_files SET ?', file, function (err, result) {
                                                                                                                if (err) {
                                                                                                                    callback(err, OtherTemplates);
                                                                                                                }
                                                                                                                else {
                                                                                                                    endloop();
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });

                                                                                                }
                                                                                                else {
                                                                                                    callback(null, null);
                                                                                                }

                                                                                            }
                                                                                            else {
                                                                                                callback(null, null);
                                                                                            }
                                                                                        }
                                                                                    ], function (err, value) {
                                                                                        if (err) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: JSON.stringify(err)
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            connection_ikon_cms.release();
                                                                                        }
                                                                                        else {
                                                                                            if (TotalError.length > 0) {
                                                                                                index = index + 1;
                                                                                                if (records == index) {
                                                                                                    var str = "Total : " + records + "  Success : " + (records - TotalError.length) + "   Error : " + TotalError.length + "\r\n \r\n";
                                                                                                    for (var i in TotalError) {
                                                                                                        str += " " + TotalError[i] + "\r\n";
                                                                                                    }
                                                                                                    var str1 = filename + ' \r\n \r\n' + str;

                                                                                                    fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt',
                                                                                                    str1, function (err) {
                                                                                                        if (err) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'bulkupload',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err)
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            connection_ikon_cms.release();
                                                                                                        }
                                                                                                        else {
                                                                                                            f_index = f_index + 1;
                                                                                                            if (fileslength == f_index) {
                                                                                                                a = a + 1;
                                                                                                                if (a == vendor_length) {
                                                                                                                    var error = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action: 'bulkupload',
                                                                                                                        responseCode: 500,
                                                                                                                        message: str1
                                                                                                                    }
                                                                                                                    wlogger.error(error); // for error
                                                                                                                    connection_ikon_cms.release();
                                                                                                                }
                                                                                                                else {
                                                                                                                    CheckVendorFiles(a);
                                                                                                                }
                                                                                                            }
                                                                                                            else {
                                                                                                                ExcelreadFile(f_index);
                                                                                                            }
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    CheckMetadata(index);
                                                                                                }
                                                                                            }
                                                                                            else {
                                                                                                index = index + 1;
                                                                                                if (records == index) {
                                                                                                    var str = "Total : " + records + "  Success : " + (records - TotalError.length) + "   Error : " + TotalError.length + "\r\n \r\n";
                                                                                                    var str1 = filename + ' \r\n \r\n' + str;
                                                                                                    fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_success_' + new Date().getTime() + '.txt',
                                                                                                    str1, function (err) {
                                                                                                        if (err) {
                                                                                                            var error = {
                                                                                                                userName: req.session.UserName,
                                                                                                                action: 'bulkupload',
                                                                                                                responseCode: 500,
                                                                                                                message: JSON.stringify(err)
                                                                                                            }
                                                                                                            wlogger.error(error); // for error
                                                                                                            connection_ikon_cms.release();
                                                                                                        }
                                                                                                        else {
                                                                                                            f_index = f_index + 1;
                                                                                                            if (fileslength == f_index) {
                                                                                                                a = a + 1;
                                                                                                                if (a == vendor_length) {
                                                                                                                    var error = {
                                                                                                                        userName: req.session.UserName,
                                                                                                                        action: 'bulkupload',
                                                                                                                        responseCode: 500,
                                                                                                                        message: str1
                                                                                                                    }
                                                                                                                    wlogger.error(error); // for error
                                                                                                                    connection_ikon_cms.release();
                                                                                                                }
                                                                                                                else {
                                                                                                                    CheckVendorFiles(a);
                                                                                                                }
                                                                                                            }
                                                                                                            else {
                                                                                                                ExcelreadFile(f_index);
                                                                                                            }
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    CheckMetadata(index);
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt',
                                                                            filename + ' \r\n \r\n Errors: \r\n \r\n  Vendor name is not exist',
                                                                            function (err) {
                                                                                if (err) {
                                                                                    var error = {
                                                                                        userName: req.session.UserName,
                                                                                        action: 'bulkupload',
                                                                                        responseCode: 500,
                                                                                        message: JSON.stringify(err)
                                                                                    }
                                                                                    wlogger.error(error); // for error
                                                                                    connection_ikon_cms.release();
                                                                                }
                                                                                else {
                                                                                    f_index = f_index + 1;
                                                                                    if (fileslength == f_index) {
                                                                                        a = a + 1;
                                                                                        if (a == vendor_length) {
                                                                                            var error = {
                                                                                                userName: req.session.UserName,
                                                                                                action: 'bulkupload',
                                                                                                responseCode: 500,
                                                                                                message: filename + ' \r\n \r\n Errors: \r\n \r\n  Vendor name is not exist'
                                                                                            }
                                                                                            wlogger.error(error); // for error
                                                                                            connection_ikon_cms.release();
                                                                                        }
                                                                                        else {
                                                                                            CheckVendorFiles(a);
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        ExcelreadFile(f_index);
                                                                                    }
                                                                                }
                                                                            });
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                // write file error no data avaliavle in file  files[f]
                                                                fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', filename + ' \r\n \r\n Errors: \r\n \r\n No data avaliable.', function (err) {
                                                                    if (err) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'bulkupload',
                                                                            responseCode: 500,
                                                                            message: JSON.stringify(err)
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                    }
                                                                    else {
                                                                        f_index = f_index + 1;
                                                                        if (fileslength == f_index) {
                                                                            a = a + 1;
                                                                            if (a == vendor_length) {
                                                                                var error = {
                                                                                    userName: req.session.UserName,
                                                                                    action: 'bulkupload',
                                                                                    responseCode: 500,
                                                                                    message: filename + ' \r\n \r\n Errors: \r\n \r\n No data avaliable.'
                                                                                }
                                                                                wlogger.error(error); // for error
                                                                                connection_ikon_cms.release();
                                                                            }
                                                                            else {
                                                                                CheckVendorFiles(a);
                                                                            }
                                                                        }
                                                                        else {
                                                                            ExcelreadFile(f_index);
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        // write file error no Sheet avaliavle in file  files[f]
                                                        fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', filename + ' \r\n \r\n Errors: \r\n \r\n No sheet avaliable.', function (err) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action: 'bulkupload',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err)
                                                                }
                                                                wlogger.error(error); // for error
                                                                connection_ikon_cms.release();
                                                            }
                                                            else {
                                                                f_index = f_index + 1;
                                                                if (fileslength == f_index) {
                                                                    a = a + 1;
                                                                    if (a == vendor_length) {
                                                                        var error = {
                                                                            userName: req.session.UserName,
                                                                            action: 'bulkupload',
                                                                            responseCode: 500,
                                                                            message: filename + ' \r\n \r\n Errors: \r\n \r\n No sheet avaliable.'
                                                                        }
                                                                        wlogger.error(error); // for error
                                                                        connection_ikon_cms.release();
                                                                    }
                                                                    else {
                                                                        CheckVendorFiles(a);
                                                                    }
                                                                }
                                                                else {
                                                                    ExcelreadFile(f_index);
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                                else {
                                                    fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', filename + ' \r\n \r\n Errors: \r\n \r\n file already open.', function (err) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'bulkupload',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err)
                                                            }
                                                            wlogger.error(error); // for error
                                                            connection_ikon_cms.release();
                                                        }
                                                        else {
                                                            f_index = f_index + 1;
                                                            if (fileslength == f_index) {
                                                                a = a + 1;
                                                                if (a == vendor_length) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action: 'bulkupload',
                                                                        responseCode: 500,
                                                                        message: filename + ' \r\n \r\n Errors: \r\n \r\n file already open.'
                                                                    }
                                                                    wlogger.error(error); // for error
                                                                    connection_ikon_cms.release();
                                                                }
                                                                else {
                                                                    CheckVendorFiles(a);
                                                                }
                                                            }
                                                            else {
                                                                ExcelreadFile(f_index);
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                        else {
                                            // no file avaliable for vendor
                                            fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', 'No xlsx file Avaliable.', function (err) {
                                                console.log(err)
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action: 'bulkupload',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err)
                                                    }
                                                    wlogger.error(error); // for error
                                                    connection_ikon_cms.release();
                                                }
                                                else {
                                                    a = a + 1;
                                                    if (a == vendor_length) {
                                                        var error = {
                                                            userName: req.session.UserName,
                                                            action: 'bulkupload',
                                                            responseCode: 500,
                                                            message: "No xlsx file Avaliable."
                                                        }
                                                        wlogger.error(error); // for error
                                                        connection_ikon_cms.release();
                                                    }
                                                    else {
                                                        CheckVendorFiles(a);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    // vendor Expired
                                    fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', Vendors[a].vd_name + " Vendor Expired.", function (err) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'bulkupload',
                                                responseCode: 500,
                                                message: JSON.stringify(err)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                        } else {
                                            a = a + 1;
                                            if (a == vendor_length) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action: 'bulkupload',
                                                    responseCode: 500,
                                                    message: Vendors[a].vd_name + " Vendor Expired."
                                                }
                                                wlogger.error(error); // for error
                                                connection_ikon_cms.release();
                                            }
                                            else {
                                                CheckVendorFiles(a);
                                            }
                                        }
                                    });
                                }
                            }
                            else {
                                //  vendor blocked
                                fs.writeFile(__dirname + '/../public/Vendors/' + Vendors[a].vd_name + '/' + Vendors[a].vd_name + '_error_' + new Date().getTime() + '.txt', Vendors[a].vd_name + " Vendor Blocked.", function (err) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action: 'bulkupload',
                                            responseCode: 500,
                                            message: JSON.stringify(err)
                                        }
                                        wlogger.error(error); // for error
                                        connection_ikon_cms.release();
                                    } else {
                                        a = a + 1;
                                        if (a == vendor_length) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'bulkupload',
                                                responseCode: 500,
                                                message: Vendors[a].vd_name + " Vendor Blocked."
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                        }
                                        else {
                                            CheckVendorFiles(a);
                                        }
                                    }
                                });
                            }
                        }
                    }
                    else {
                        var error = {
                            userName: req.session.UserName,
                            action: 'bulkupload',
                            responseCode: 500,
                            message: "Vendors not found"
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                    }
                }
            });
        });
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action: 'bulkupload',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
