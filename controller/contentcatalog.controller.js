/**
 * Created by sujata.patne on 13-07-2015.
 */
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var shell = require("shelljs");
var atob = require("atob");
var btoa = require("btoa");
var _ = require("underscore");
var formidable = require('formidable');
var XLSX = require('xlsx');
var config = require('../config')();
var fs = require('fs');
var wlogger = require("../config/logger");
var contentCatalogueManager = require('../models/contentCatalogue.model');
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

exports.getcontentcatalog = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate();
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    var propquery = (req.body.state == "propertycontent") ? " inner join (select * from content_metadata where cm_property_id is null and cm_id = " + req.body.Id + ")cm on (vd.vd_id = cm.cm_vendor)" : "";
                    var propquery1 = (req.body.state == "propertycontent") ? " and cm_id = " + req.body.Id : "";
                    async.parallel({
                        ContentMetadata: function (callback) {
                            var query = 'SELECT cm_ispersonalized, cm_id, cm_vendor, cm_content_type, cm_title ,cm_created_on,cm_starts_from, cm_expires_on, cm_property_id, cm_display_title, cm_celebrity, cm_genre, cm_sub_genre ,cm_mood, cm_language,  cm_religion, cm_festival_occasion, cm_raag_tal, cm_instruments,  cm_is_active, cm_thumb_url,cm_modified_on,cm_modified_by, cm_comment, cm_live_on, parentid,parentname,contentTypeName,vd_id ,vd_end_on,vd_is_active,propertyid,propertyname,propertyexpirydate,propertyactive,genre_id,genre_name,subgenre_id,subgenre_name,mood_id,mood_name,raagtaal_id,raagtaal_name,instrument_id,instrument_name,festival_id,festival_name,religion_id,religion_name,celebrity_name,language_name,';
                            query += ' CASE  WHEN cm_state = 6   THEN cm_state ';
                            // query += ' WHEN cm_state = 1    THEN cm_state ';
                            // query += ' WHEN cm_state = 2    THEN cm_state ';
                            query += ' WHEN cm_state = 5    THEN cm_state ';
                            query += ' WHEN cm_state = 7    THEN cm_state ';
                            query += ' WHEN propertyexpirydate < "' + currentdate + '" THEN 6 ';
                            query += ' WHEN propertyactive = 0   THEN 6 ';
                            query += ' WHEN vd_end_on < "' + currentdate + '"   THEN 6 ';
                            query += ' WHEN vd_is_active = 0   THEN 6 ';
                            query += ' ELSE cm_state END AS cm_state  FROM  ';
                            query += ' (select cm_ispersonalized, cm_id, cm_vendor, cm_content_type, cm_title ,cm_created_on,cm_starts_from, cm_expires_on, cm_property_id, cm_display_title, cm_celebrity, cm_genre, cm_sub_genre, cm_mood, cm_language,  cm_religion, cm_festival_occasion, cm_raag_tal, cm_instruments,  cm_is_active,  cm_comment,cm_modified_on,cm_modified_by, cm_live_on,';
                            query += ' CASE WHEN cm_state =5 THEN cm_state ';
                            query += ' WHEN cm_state =7 THEN cm_state ';
                            query += ' WHEN cm_expires_on < "' + currentdate + '" THEN 6 ';
                            query += ' ELSE cm_state END AS cm_state from content_metadata ';
                            query += ' WHERE cm_property_id is not null )cm ';
                            query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null ' + propquery1 + ')prop on(cm.cm_property_id =prop.propertyid) ';
                            query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                            query += ' inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) ' +
                                'inner join (select cd_id as contentTypeId,cd_name as contentTypeName from catalogue_detail )child on(child.contentTypeId  = cnt.mct_cnt_type_id) '+
                                'inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail )parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                            query += ' left outer join (select group_concat( cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail group by cft_cm_id )cth on(cth.cft_cm_id =cm.cm_id)'
                            query += ' left outer join (select cd_id as genre_id,cd_name as genre_name from catalogue_detail)genres on (genres.genre_id = cm.cm_genre)';
                            query += ' left outer join (select cd_id as subgenre_id,cd_name as subgenre_name from catalogue_detail)subgenres on (subgenres.subgenre_id = cm.cm_sub_genre)';
                            query += ' left outer join (select cd_id as mood_id,cd_name as mood_name from catalogue_detail)mood on (mood.mood_id = cm.cm_mood)';
                            query += ' left outer join (select cd_id as raagtaal_id,cd_name as raagtaal_name from catalogue_detail)raagtaal on (raagtaal.raagtaal_id = cm.cm_raag_tal)';
                            query += ' left outer join (select cd_id as instrument_id,cd_name as instrument_name from catalogue_detail)instrument on (instrument.instrument_id = cm.cm_instruments)';
                            query += ' left outer join (select cd_id as festival_id,cd_name as festival_name from catalogue_detail)festival on (festival.festival_id = cm.cm_festival_occasion)';
                            query += ' left outer join (select cd_id as religion_id,cd_name as religion_name from catalogue_detail)religion on (religion.religion_id = cm.cm_religion)';
                            query += ' LEFT OUTER JOIN (SELECT a.cmd_id AS celebrity_cmd_id, a.cmd_group_id AS celebrity_group,b.cd_id AS celebrity_id,group_concat(  b.cd_name) AS celebrity_name FROM multiselect_metadata_detail a, catalogue_detail b WHERE b.cd_id = a.cmd_entity_detail group by cmd_group_id)celebrity ON ( celebrity.celebrity_group = cm.cm_celebrity )';
                            query += ' LEFT OUTER JOIN (SELECT a.cmd_id AS lang_cmd_id, a.cmd_group_id AS lang_group, b.cd_id AS language_id,group_concat(  b.cd_name )AS language_name FROM multiselect_metadata_detail a, catalogue_detail b WHERE b.cd_id = a.cmd_entity_detail  group by cmd_group_id)lang ON ( lang.lang_group = cm.cm_language )  order by cm_id desc ';

                            var query1 = connection_ikon_cms.query(query, function (err, ContentMetadata) {
                                callback(err, ContentMetadata);
                            });
                        },
                        CatalogueMaster: function (callback) {
                            var query = connection_ikon_cms.query('select * from (select * from catalogue_master where cm_name IN ("Content Title","Property","Celebrity","Genres","Sub Genres","Mood","Languages","Festival","Religion","Instruments","Raag Taal") ) cm', function (err, CatalogueMaster) {
                                callback(err, CatalogueMaster);
                            });
                        },
                        ContentStatus: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd inner join(select * from catalogue_master where cm_name IN ("Content Status","Content Type") ) cm on (cd.cd_cm_id = cm.cm_id ) order by cd_id', function (err, ContentStatus) {
                                callback(err, ContentStatus);
                            });
                        },
                        CountryOperator: function (callback) {
                            var query = connection_ikon_cms.query('SELECT oc.id as cd_id, oc.display_name as cd_name FROM catalogue_detail as cd '+
                                'join catalogue_master as cm on cd.cd_cm_id = cm.cm_id '+
                                'join operator_country as oc on oc.catalogue_detail_id_operator = cd.cd_id', function (err, CountryOperator) {
                                callback(err, CountryOperator);
                            });
                        },
                        DownloadType: function (callback) {
                            var query = connection_ikon_cms.query('SELECT * FROM catalogue_detail as cd '+
                                'join catalogue_master as cm on cd.cd_cm_id = cm.cm_id and cm.cm_name in("Download Type")', function (err, DownloadType) {
                                callback(err, DownloadType);
                            });
                        },
                        ContentTypes: function (callback) {
                            var query = connection_ikon_cms.query('select distinct content.cd_id, content.cd_name, cd.cd_id as parent_id, cd.cd_name as parent_name '+
                                'from catalogue_detail cd '+
                                'inner join catalogue_master cm on(cm.cm_id = cd.cd_cm_id) '+
                                'inner join icn_manage_content_type mc on (  mc.mct_parent_cnt_type_id = cd.cd_id) '+
                                'inner join (SELECT cd_id , cd_name FROM catalogue_detail)content on(mc.mct_cnt_type_id = content.cd_id) '+
                                'where cm.cm_name in("Content Type")', function (err, ContentTypes) {
                                callback(err, ContentTypes);
                            });
                        },
                        Vendors: function (callback) {
                            var query = connection_ikon_cms.query('select * from (select * from icn_vendor_detail order by vd_name) vd ' + vendorquery + propquery, function (err, Vendors) {
                                callback(err, Vendors);
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
                                action : 'getcontentcatalog',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var info = {
                                userName: req.session.UserName,
                                action : 'getcontentcatalog',
                                responseCode: 200,
                                message: "Retrieved content catalog details successfully."
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
                    userName: 'Unknown User',
                    action : 'getcontentcatalog',
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
                action : 'getcontentcatalog',
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
            action : 'getcontentcatalog',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.updatestate = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var obj = req.body;
                    if (obj.meta.length > 0) {
                        var meta_length = obj.meta.length;
                        loop(0);
                        function loop(m) {
                            var query = connection_ikon_cms.query('Update content_metadata set cm_state =?,cm_comment= ?,cm_modified_on=?,cm_modified_by =?  where cm_id = ?', [obj.meta[m].state, obj.meta[m].comment, new Date(), req.session.UserName, obj.meta[m].id], function (err, multiselectId) {
                                if (err) {
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                }
                                else {
                                    m = m + 1;
                                    if (m == meta_length) {
                                        var info = {
                                            userName: req.session.UserName,
                                            action : 'updatestate',
                                            responseCode: 200,
                                            message: req.body.message
                                        }
                                        //   wlogger.info(info); // for information
                                        connection_ikon_cms.release();
                                        res.send({ success: true, message: req.body.message });
                                    }
                                    else {
                                        loop(m);
                                    }
                                }
                            });
                        }
                    }
                    else {
                        var info = {
                            userName: req.session.UserName,
                            action : 'updatestate',
                            responseCode: 200,
                            message: req.body.message
                        }
                        //  wlogger.info(info); // for information
                        connection_ikon_cms.release();
                        res.send({ success: true, message: req.body.message });
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
        var error = {
            userName: "Unknown User",
            action : 'updatestate',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.getcontentlisting = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate();
                    var ModCMquery = " left join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    async.waterfall([
                            function (callback) {
                                //console.log('req.body.isProperty')
                                //console.log(req.body.isProperty)
                                if(req.body.isProperty){
                                    var query = 'SELECT *, cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata as cm ';
                                     //query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                                     query += ' inner join(SELECT vd_id , vd_name as vendorname ,vd_end_on, vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                                     query += ' left join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) left join (select cd_id as parentid,cd_name as parentname from catalogue_detail)parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                                     query += ' WHERE cm.cm_property_id is null and cm.cm_id = ?';

                                }else {
                                    var query = 'SELECT *  FROM  ';
                                    query += ' (select * from content_metadata ';
                                    query += ' WHERE cm_property_id is not null and cm_id = ? )cm ';
                                    query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                                    query += ' inner join(SELECT vd_id, vd_name as vendorname ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                                    query += ' inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail)parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                                }
                               // console.log(query)
                                connection_ikon_cms.query(query, [req.body.Id], function (err, ContentMetadata) {
                                    callback(err, ContentMetadata);
                                });
                            }
                        ]
                        , function (err, ContentMetadata) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'getcontentlisting',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                if (ContentMetadata.length > 0) {
                                    //parentname
                                    async.parallel({
                                        ContentMetadata: function (callback) {
                                            callback(null, ContentMetadata);
                                        },
                                        OtherTemplates: function (callback) {
                                            var query = connection_ikon_cms.query('select * from (select * from content_template where ct_param_value in ("bitrate","otherimage","othervideo","otheraudio","app","utf 16", "Preview","Supporting","Main"))other', function (err, OtherTemplates) {
                                                callback(err, OtherTemplates);
                                            });
                                        },
                                        WallpaperFiles: function (callback) {
                                            //if (ContentMetadata[0].parentname == "Wallpaper") {
                                            if (ContentMetadata[0].parentname == "Imagery") {
                                                var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as width from content_template where ct_param_value ="width" )ct_width on(ct_width.ct_group_id =cm_files.cf_template_id) left outer join(select  ct_group_id, ct_param  as height from content_template where ct_param_value ="height" )ct_height on(ct_height.ct_group_id =cm_files.cf_template_id)', [req.body.Id], function (err, ContentFiles) {
                                                    callback(err, ContentFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        VideoFiles: function (callback) {
                                            if (ContentMetadata[0].parentname == "Video") {
                                                var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as width from content_template where ct_param_value ="width" )ct_width on(ct_width.ct_group_id =cm_files.cf_template_id) left outer join(select  ct_group_id, ct_param  as height from content_template where ct_param_value ="height" )ct_height on(ct_height.ct_group_id =cm_files.cf_template_id) left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                    callback(err, TextFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        AudioFiles1: function (callback) {
                                            if (ContentMetadata[0].parentname == "Audio") {
                                                var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta ' +
                                                    'inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) ' +
                                                    'inner join(select  ct_group_id, ct_param  as bitrate from content_template ' +
                                                    'where ct_param_value ="bitrate" )ct_bitrate on(ct_bitrate.ct_group_id =cm_files.cf_template_id)  ' +
                                                    'left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id ' +
                                                    'from content_files_thumbnail where cft_cm_id = ? ' +
                                                    'group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                    callback(err, TextFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        AudioFiles: function (callback) {
                                            if (ContentMetadata[0].parentname == "Audio") {
                                                var query = 'select meta.cm_id, cm_files.*, ct_bitrate_high.high_url, ct_bitrate_high.high_bitrate, ct_bitrate_medium.medium_url, ct_bitrate_medium.medium_bitrate, ct_bitrate_low.low_url, ct_bitrate_low.low_bitrate, cth.* ' +
                                                    'from content_metadata  as meta '+
                                                    'left join content_files as cm_files on(meta.cm_id = cm_files.cf_cm_id ) '+
                                                    'inner join(select  ct_group_id, ct_param  as bitrate from content_template where ct_param_value ="bitrate" )ct_bitrate on(ct_bitrate.ct_group_id =cm_files.cf_template_id) ' +
                                                    'left JOIN(select cf_name,cf_cm_id, ct_param  as high_bitrate, cf_url as high_url from content_files as high join content_template  on( cf_template_id = ct_group_id ) where ct_param_value ="bitrate" and ct_param = 128 )ct_bitrate_high on(cm_files.cf_cm_id =ct_bitrate_high.cf_cm_id and cm_files.cf_name =ct_bitrate_high.cf_name) '+
                                                    'left JOIN(select cf_name,cf_cm_id, ct_group_id, ct_param  as medium_bitrate, cf_url as medium_url from content_files  as medium join content_template  on( cf_template_id = ct_group_id ) where ct_param_value ="bitrate" and ct_param = 64 )ct_bitrate_medium on(ct_bitrate_medium.cf_cm_id =cm_files.cf_cm_id and ct_bitrate_medium.cf_name =cm_files.cf_name) '+
                                                    'left JOIN(select cf_name,cf_cm_id,ct_group_id, ct_param  as low_bitrate, cf_url as low_url  from content_files as low join content_template  on( cf_template_id = ct_group_id ) where ct_param_value ="bitrate" and ct_param = 32 )ct_bitrate_low on(ct_bitrate_low.cf_cm_id =cm_files.cf_cm_id and ct_bitrate_low.cf_name =cm_files.cf_name) '+
                                                    'left JOIN(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail) as cth on(cth.cft_cm_id = cm_files.cf_cm_id) '+
                                                    'where cm_files.cf_cm_id = ? GROUP BY cm_files.cf_name, CASE WHEN cm_files.cf_name IS NULL THEN cm_files.cf_id ELSE 0 END ' +
                                                    'ORDER BY cm_files.cf_id';
                                                //console.log(query)
                                                connection_ikon_cms.query(query, [req.body.Id], function (err, AudioFiles) {
                                                  //  console.log(AudioFiles)

                                                    callback(err, AudioFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        AppFiles: function (callback) {
                                            if (ContentMetadata[0].parentname == "AppsGames") {
                                                var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as app from content_template where ct_param_value ="app" )ct_app on(ct_app.ct_group_id =cm_files.cf_template_id)  left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                    callback(err, TextFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        SupportingImages: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 2)' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as otherimage from content_template ' +
                                                'where ct_param_value ="otherimage" )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ' +
                                                'left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail '+
                                                'group by cft_cm_id)cth on(cth.cft_cm_id = meta.cm_id) ';

                                            connection_ikon_cms.query(query, [req.body.Id], function (err, SupportingImages) {
                                                callback(err, SupportingImages);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        SupportingAudios: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 2 )' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as otheraudio from content_template ' +
                                                'where ct_param_value ="bitrate" and ct_param = 128 )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ';
                                            //console.log(query);
                                            connection_ikon_cms.query(query, [req.body.Id], function (err, OtherVideos) {

                                                callback(err, OtherVideos);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        SupportingVideos: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 2)' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as othervideo from content_template ' +
                                                'where ct_param_value ="othervideo" )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ';

                                            connection_ikon_cms.query(query, [req.body.Id], function (err, OtherVideos) {
                                                //console.log(OtherVideos);
                                                callback(err, OtherVideos);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        SupportingTexts: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {

                                            var query = 'select * from (SELECT cm_id,cm_lyrics_languages FROM content_metadata where cm_id =? and NOT ISNULL(cm_lyrics_languages) )meta ' +
                                                'left join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) ' +
                                                'left join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                                'left join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)' +
                                                'left join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) ' +
                                                'left join (SELECT * FROM content_files )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id and file_category_id = 2) ';
                                            //console.log(query);
                                            connection_ikon_cms.query(query, [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },

                                        PreviewImages: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 3)' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as otherimage from content_template ' +
                                                'where ct_param_value ="otherimage" )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ' +
                                                'left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail '+
                                                'group by cft_cm_id)cth on(cth.cft_cm_id = meta.cm_id) ';

                                            connection_ikon_cms.query(query, [req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        PreviewAudios: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 3 )' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as otheraudio from content_template ' +
                                                'where ct_param_value ="bitrate" and ct_param = 128 )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ';

                                            connection_ikon_cms.query(query, [req.body.Id], function (err, OtherVideos) {
                                                //console.log(OtherVideos);
                                                callback(err, OtherVideos);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        PreviewVideos: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {
                                            var query ='select * from (select cm_id from content_metadata where cm_id = ? )meta ' +
                                                'left join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and file_category_id = 3)' +
                                                'right join(select ct_group_id,ct_param_value, ct_param  as othervideo from content_template ' +
                                                'where ct_param_value ="othervideo" )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ';

                                            connection_ikon_cms.query(query, [req.body.Id], function (err, OtherVideos) {
                                                //console.log(OtherVideos);
                                                callback(err, OtherVideos);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        PreviewTexts: function (callback) {
                                            //if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Audio" || ContentMetadata[0].parentname == "Text") {

                                            var query = 'select * from (SELECT cm_id,cm_lyrics_languages FROM content_metadata where cm_id =? and NOT ISNULL(cm_lyrics_languages) )meta ' +
                                                'left join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) ' +
                                                'left join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                                'left join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)' +
                                                'left join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) ' +
                                                'left join (SELECT * FROM content_files )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id and file_category_id = 3) ';
                                            //console.log(query);
                                            connection_ikon_cms.query(query, [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                            /*}
                                             else {
                                             callback(null, []);
                                             }*/
                                        },
                                        TextFiles: function (callback) {
                                            if (ContentMetadata[0].parentname == "Text") {
                                                var query = connection_ikon_cms.query('select * from (SELECT cm_id,cm_language FROM content_metadata where cm_id =? and NOT ISNULL(cm_language))meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id) left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                    callback(err, TextFiles);
                                                });
                                            }
                                            else {
                                                callback(null, []);
                                            }
                                        },
                                        ThumbFiles: function (callback) {
                                            var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id = ?)meta inner join(select cft_thumbnail_img_browse, cft_thumbnail_size,cft_cm_id from content_files_thumbnail where cft_cm_id = ?)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, ThumbFiles) {
                                                callback(err, ThumbFiles);
                                            });
                                        },
                                        UserRole: function (callback) {
                                            callback(null, req.session.UserRole);
                                        },
                                        ConfigData: function (callback) {
                                            callback(null, {
                                                audio_preview_limit:config.audio_preview_limit,
                                                audio_download_limit:config.audio_download_limit,
                                                video_preview_limit:config.video_preview_limit,
                                                video_download_limit:config.video_download_limit,
                                                supporting_image_limit:config.supporting_image_limit,
                                                text_preview_limit:config.text_preview_limit,
                                                text_download_limit:config.text_download_limit,
                                                thumb_limit:config.thumb_limit,
                                                wallpaper_limit : config.wallpaper_limit,
                                                game_limit : config.game_limit,
                                                text_limit : config.text_limit,
                                                audio_limit : config.audio_limit,
                                                video_limit : config.video_limit,
                                                log_path:config.log_path})
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
                                                action : 'getcontentlisting',
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
                                                action : 'getcontentlisting',
                                                responseCode: 200,
                                                message: 'Retrieved content listing successfully.'
                                            }
                                           // console.log(results.ConfigData)
                                            wlogger.info(info); // for information
                                            connection_ikon_cms.release();
                                            res.send(results);
                                        }
                                    });
                                }
                                else {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'getcontentlisting',
                                        responseCode: 500,
                                        message: JSON.stringify(err)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                    res.send({ ContentMetadata: [] });
                                }
                            }
                        });
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'getcontentlisting',
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
            action : 'getcontentlisting',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.addUpdatePromocode = function(req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'addUpdatePromocode',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        //      wlogger.error(error); // for error
                        connection_ikon_cms.release();
                    }else {
                        async.waterfall([
                            function (callback) {
                                if (req.body.cmId != undefined && req.body.cmId) {
                                    var query = 'SELECT * FROM  content_metadata AS cm ' +
                                        'JOIN content_files as cf ON cm.cm_id = cf.cf_cm_id ' +
                                        'WHERE cf.cf_original_processed = 1 and (cm.cm_ispersonalized = 0 OR ISNULL(cm.cm_ispersonalized)) and cm.cm_id = ? ';

                                    connection_ikon_cms.query(query, [req.body.cmId], function (err, CMChildId) {
                                        callback(err, CMChildId);
                                    });
                                }
                            },
                            function (CMChildId, callback) {
                                if (CMChildId.length > 0 && req.body.operator != undefined && req.body.promocode != undefined) {
                                    var obj = {};
                                    obj.content_file_cf_id = CMChildId[0].cf_id;
                                    obj.ivr_promocode = req.body.promocode.toString();
                                    obj.operator_country_id = req.body.operator;
                                    addEditVcodeOperator(connection_ikon_cms, obj, req.session, function (err, data) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'addUpdatePromocode',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                        } else {
                                            callback(null, data);
                                        }
                                    })
                                } else {
                                    console.log('No content Data found for promocode mapping.');
                                    callback({message:'No content Data found for promocode mapping.'}, null);
                                }
                            }
                        ], function (err, result) {
                            if (err) {
                                console.log(err);
                                var error = {
                                    userName: req.session.UserName,
                                    action: 'addUpdatePromocode',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action: 'addUpdatePromocode',
                                    responseCode: 200,
                                    message: "Promocode imported for operator :" + req.body.operator
                                }
                                wlogger.info(info); // for information
                                connection_ikon_cms.release();
                                console.log("Promocode imported for operator :" + req.body.operator);
                                res.send({success: true, message: result.msg});
                            }
                        });
                    }
                })
            } else {
                var error = {
                    userName: "Unknown User",
                    action : 'addUpdatePromocode',
                    responseCode: 500,
                    message: "Invalid username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }else {
            var error = {
                userName: "Unknown User",
                action : 'addUpdatePromocode',
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
            action : 'addUpdatePromocode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.addUpdateVcode = function(req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'addUpdateVcode',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        //      wlogger.error(error); // for error
                        connection_ikon_cms.release();
                    }else {
                        async.waterfall([
                            function (callback) {
                                if (req.body.cmId != undefined && req.body.cmId) {
                                    var query = 'SELECT * FROM  content_metadata AS cm ' +
                                        'JOIN content_files as cf ON cm.cm_id = cf.cf_cm_id ' +
                                        'WHERE cf.cf_original_processed = 1 and (cm.cm_ispersonalized = 0 OR ISNULL(cm.cm_ispersonalized)) and cm.cm_id = ? ';

                                    connection_ikon_cms.query(query, [req.body.cmId], function (err, CMChildId) {
                                        callback(err, CMChildId);
                                    });
                                }
                            },
                            function (CMChildId, callback) {
                                if (CMChildId.length > 0 && req.body.operator != undefined && req.body.vcode != undefined) {
                                    var obj = {};
                                    obj.content_file_cf_id = CMChildId[0].cf_id;
                                    obj.vcode = req.body.vcode.toString();
                                    obj.operator_country_id = req.body.operator;
                                    addEditVcodeOperator(connection_ikon_cms, obj, req.session, function (err, data) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action: 'addUpdateVcode',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                        } else {
                                            callback(null, data);
                                        }
                                    })
                                } else {
                                    console.log('No content Data found for vcode mapping.');
                                    callback({message:'No content Data found for vcode mapping.'}, null);
                                }
                            }
                        ], function (err, result) {
                            if (err) {
                                console.log(err);
                                var error = {
                                    userName: req.session.UserName,
                                    action: 'addUpdateVcode',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action: 'addUpdateVcode',
                                    responseCode: 200,
                                    message: "Vcode imported for operator :" + req.body.operator
                                }
                                wlogger.info(info); // for information
                                connection_ikon_cms.release();
                                console.log("Vcode imported for operator :" + req.body.operator);
                                res.send({success: true, message: result.msg});
                            }
                        });
                    }
                })
            } else {
                var error = {
                    userName: "Unknown User",
                    action : 'addUpdateVcode',
                    responseCode: 500,
                    message: "Invalid username"
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }else {
            var error = {
                userName: "Unknown User",
                action : 'addUpdateVcode',
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
            action : 'addUpdateVcode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.importVcode = function(req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'importVcode',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                    }else {
                        var form = new formidable.IncomingForm();
                        form.parse(req, function (err, fields, files) {

                            var book = XLSX.readFile(files.file.path, {cellStyles: true});
                            var sheet_name_list = book.SheetNames[0];
                            var Sheet1 = book.Sheets[sheet_name_list];
                            var vcodeData = XLSX.utils.sheet_to_row_object_array(Sheet1);
                            var existingOperators = vcodeData.reduce(function (keys, element) {
                                for (key in element) {
                                    keys.push(key);
                                }
                                return _.uniq(keys, false);
                            }, []);
                            var operatorData = JSON.parse(fields.operators);
                            var invalidOperators = _.difference(_.without(existingOperators, 'MetadataId', 'ChildId', 'Username'), Object.keys(operatorData));
                            var operators = _.intersection(_.without(existingOperators, 'MetadataId', 'ChildId', 'Username'), Object.keys(operatorData));
                            // Wrapper function
                            function getOperator(operator) {
                                var j = 0;

                                return function (callback) {
                                    //console.log(operator + " : " + j)
                                    if (j < vcodeData.length) {
                                        if (vcodeData[j] != undefined && vcodeData[j]['ChildId']) {
                                            if(vcodeData[j].hasOwnProperty(operator)) {
                                                if(vcodeData[j][operator].length <= 50  ){
                                                    var obj = {};
                                                    obj.content_file_cf_id = vcodeData[j]['ChildId']; //complete
                                                    obj.vcode = vcodeData[j][operator].toString();
                                                    obj.operator_country_id = operatorData[operator];
                                                    addEditVcodeOperator(connection_ikon_cms, obj, req.session, function (err, vcode) {
                                                    if (err) {
                                                        var error = {
                                                            userName: req.session.UserName,
                                                            action: 'importVcode',
                                                            responseCode: 500,
                                                            message: JSON.stringify(err.message)
                                                        }
                                                        wlogger.error(error); // for error
                                                        // console.log(err);
                                                        connection_ikon_cms.release();
                                                    } else {
                                                        //console.log('inside callback 1')
                                                        j++;
                                                        //process.nextTick(callback)
                                                        setImmediate(callback)
                                                        // setTimeout(callback(),0);
                                                        console.log("Vcode imported for operator :" + operator);
                                                    }
                                                })
                                                } else {
                                                    //console.log("Content File Id "+vcodeData[j]['ChildId'] +" for operator "+operator+" exceeds vcode value's max length limit of 50 characters.");
                                                    var info = {
                                                        userName: req.session.UserName,
                                                        action: 'importVcode',
                                                        responseCode: 200,
                                                        message: "Content File Id "+vcodeData[j]['ChildId'] +" for operator "+operator+" exceeds vcode value's max length limit of 50 characters."
                                                    }
                                                    wlogger.info(info); // for information
                                                    j++;
                                                    //process.nextTick(callback)
                                                    setImmediate(callback)
                                                }
                                            }  else {
                                                //console.log('inside callback 2')
                                                j++;
                                                //process.nextTick(callback)
                                                setImmediate(callback)
                                            }
                                        }
                                        else
                                        {
                                            //console.log('inside callback 3')
                                            j++;
                                            //process.nextTick(callback)
                                            setImmediate(callback)
                                        }
                                    }
                                };
                            }
                            var taskList = [];
                            for (var key in operators) {
                                taskList.push(getOperator(operators[key]));
                            }
                            function saveData(cnt) {
                                async.series(taskList, function (err, results) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action: 'importVcode',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        connection_ikon_cms.release();
                                    } else {
                                        cnt = cnt + 1;
                                        if (cnt < vcodeData.length) {
                                            saveData(cnt);

                                        } else {
                                            var info = {
                                                userName: req.session.UserName,
                                                action: 'importVcode',
                                                responseCode: 200,
                                                message: 'Vcode imported successfully for operators ' + operators
                                            }
                                             wlogger.info(info); // for information
                                            connection_ikon_cms.release();
                                            res.send({
                                                success: true,
                                                message: 'Vcode imported successfully for operators ' + operators,
                                                validOperators: operators,
                                                inValidOperators: invalidOperators
                                            });
                                        }
                                    }
                                });
                            }
                            saveData(0);
                        })
                    }
                })
            } else {
                var error = {
                    userName: "Unknown User",
                    action : 'importVcode',
                    responseCode: 500,
                    message: 'Not Valid Username'
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'importVcode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.importPromocode = function(req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if(err){
                        var error = {
                            userName: req.session.UserName,
                            action : 'importVcode',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                    }else {
                        var form = new formidable.IncomingForm();
                        form.parse(req, function (err, fields, files) {
                            var book = XLSX.readFile(files.file.path, {cellStyles: true});
                            var sheet_name_list = book.SheetNames[0];
                            var Sheet1 = book.Sheets[sheet_name_list];
                            var vcodeData = XLSX.utils.sheet_to_row_object_array(Sheet1);
                            var existingOperators = vcodeData.reduce(function (keys, element) {
                                for (key in element) {
                                    keys.push(key);
                                }
                                return _.uniq(keys, false);
                            }, []);
                            var operatorData = JSON.parse(fields.operators);
                            var invalidOperators = _.difference(_.without(existingOperators, 'MetadataId', 'ChildId', 'Username'), Object.keys(operatorData));
                            var operators = _.intersection(_.without(existingOperators, 'MetadataId', 'ChildId', 'Username'), Object.keys(operatorData));
                            // Wrapper function
                            function getOperator(operator) {
                                var j = 0;
                                return function (callback) {
                                //    console.log(operator + " : " + j)
                                    if (j < vcodeData.length) {
                                        if (vcodeData[j] != undefined && vcodeData[j]['ChildId']) {
                                            if(vcodeData[j].hasOwnProperty(operator)) {
                                                if(vcodeData[j][operator].length <= 50  ){
                                                var obj = {};
                                                obj.content_file_cf_id = vcodeData[j]['ChildId']; //complete
                                                obj.ivr_promocode = vcodeData[j][operator].toString();
                                                obj.operator_country_id = operatorData[operator];
                                                    addEditVcodeOperator(connection_ikon_cms, obj, req.session, function (err, vcode) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'importVcode',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            // console.log(err);
                                                            connection_ikon_cms.release();
                                                        } else {
                                                            //console.log('inside callback 1')
                                                            j++;
                                                            //process.nextTick(callback)
                                                            setImmediate(callback)
                                                            // setTimeout(callback(),0);
                                                            console.log("Promocode imported for operator :" + operator);
                                                        }
                                                    })
                                                } else {
                                                    console.log("Content File Id "+vcodeData[j]['ChildId'] +" for operator "+operator+" exceeds promocode value's max length limit of 50 characters.");
                                                    var info = {
                                                        userName: req.session.UserName,
                                                        action: 'importVcode',
                                                        responseCode: 200,
                                                        message: "Content File Id "+vcodeData[j]['ChildId'] +" for operator "+operator+" exceeds promocode value's max length limit of 50 characters."
                                                    }
                                                    wlogger.info(info); // for information
                                                    j++;
                                                    //process.nextTick(callback)
                                                    setImmediate(callback)
                                                }
                                            } else {
                                                //console.log('inside callback 2')
                                                j++;
                                                //process.nextTick(callback)
                                                setImmediate(callback)
                                            }
                                        }
                                        else
                                        {
                                            //console.log('inside callback 3')
                                            j++;
                                            //process.nextTick(callback)
                                            setImmediate(callback)
                                        }
                                    }
                                };

                            }

                            var taskList = [];
                            for (var key in operators) {
                                taskList.push(getOperator(operators[key]));
                            }
                            function saveData(cnt) {
                                async.series(taskList, function (err, results) {
                                    if (err) {
                                        var error = {
                                            userName: req.session.UserName,
                                            action: 'importVcode',
                                            responseCode: 500,
                                            message: JSON.stringify(err.message)
                                        }
                                        wlogger.error(error); // for error
                                        connection_ikon_cms.release();
                                    } else {
                                        cnt = cnt + 1;
                                        if (cnt < vcodeData.length) {
                                            saveData(cnt);

                                        } else {
                                            var info = {
                                                userName: req.session.UserName,
                                                action: 'importVcode',
                                                responseCode: 200,
                                                message: 'Promocode imported successfully for operators ' + operators
                                            }
                                             wlogger.info(info); // for information
                                            connection_ikon_cms.release();
                                            res.send({
                                                success: true,
                                                message: 'Promocode imported successfully for operators ' + operators,
                                                validOperators: operators,
                                                inValidOperators: invalidOperators
                                            });
                                        }
                                    }
                                });
                            }

                            saveData(0);

                        })
                    }
                })
            } else {
                var error = {
                    userName: "Unknown User",
                    action : 'importVcode',
                    responseCode: 500,
                    message: 'Not Valid Username'
                }
                wlogger.error(error); // for error
                res.redirect('/accountlogin');
            }
        }else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'importVcode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

function addEditVcodeOperator(connection_ikon_cms, obj, session, callback){
    //console.log(obj)
    if(obj.hasOwnProperty('vcode')){
        var Code = 'Vcode';
    }else{
        var Code = 'Promocode';
    }
    contentCatalogueManager.isVcodeExist(connection_ikon_cms, obj, function (err, exist) {
        if (err) {
            var error = {
                userName: session.UserName,
                action : 'addEditVcodeOperator',
                responseCode: 500,
                message: JSON.stringify(err.message)
            }
            wlogger.error(error); // for error
            connection_ikon_cms.release();
        } else {
            if (exist) {
                obj.modified_on = new Date();
                obj.modified_by = session.UserName;
                contentCatalogueManager.updateVcode(connection_ikon_cms, obj, function (err, result) {
                    //console.log('updated')
                    var info = {
                        userName: session.UserName,
                        action : 'addEditVcodeOperator',
                        responseCode: 200,
                        message: Code+' updated Successfully.'
                    }
                     wlogger.info(info); // for information
                    callback(err,{"data":result, "msg": Code+" updated Successfully"});
                })
            } else {
                if(obj.operator_country_id && obj.content_file_cf_id){
                    contentCatalogueManager.getMaxVOId(connection_ikon_cms, function (err, maxVOId) {
                        if (err) {
                            var error = {
                                userName: session.UserName,
                                action : 'addEditVcodeOperator',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            console.log(err.message);
                        } else {
                            var id = maxVOId != 0 ? (parseInt(maxVOId) + 1) : 1;
                            obj.id = id;
                            obj.created_on = new Date();
                            obj.created_by = session.UserName;
                            obj.modified_on = new Date();
                            obj.modified_by = session.UserName;
                            contentCatalogueManager.insertVcode(connection_ikon_cms, obj, function (err, result) {
                                if (err) {
                                    var error = {
                                        userName: session.UserName,
                                        action : 'addEditVcodeOperator',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                    console.log(err.message);
                                } else {
                                   // console.log('inserted')
                                    var info = {
                                        userName: session.UserName,
                                        action : 'addEditVcodeOperator',
                                        responseCode: 200,
                                        message: Code + ' inserted Successfully.'
                                    }
                                    //  wlogger.info(info); // for information
                                    //callback(err,result);
                                    callback(err,{"data":result, "msg":Code + " inserted Successfully"});
                                }
                            });
                        }
                    })
                }else{
                    callback(err,null);
                }
            }
        }
    });
}

exports.getPersonalizedDataForVcode = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    if (err) {
                        var error = {
                            userName: req.session.UserName,
                            action : 'getPersonalizedDataForVcode',
                            responseCode: 500,
                            message: JSON.stringify(err.message)
                        }
                        wlogger.error(error); // for error
                        connection_ikon_cms.release();
                        console.log(err.message);
                    } else {
                        var operators = req.body.operators;
                        var codeType = req.body.codeType;
                        if(codeType == 'Vcode' ){
                            var select = 'vc.vcode';
                        }else{
                            var select = 'vc.ivr_promocode';
                        }
                        if (Object.keys(operators).length > 0) {
                            var str = ', ';
                        } else {
                            var str = '';
                        }
                        _.each(operators, function (val, key) {
                            var operator = key;
                            str += ' (SELECT '+select+' FROM vcode_operator as vc ' +
                                'join operator_country as oc on vc.operator_country_id = oc.id ' +
                                'join catalogue_detail as cd on oc.catalogue_detail_id_operator = cd.cd_id ' +
                                'WHERE oc.display_name = "' + key + '" and content_file_cf_id = cf.cf_id group by content_file_cf_id' +
                                ') as ' + key + ', ';
                        });

                        str = str.replace(/,\s*$/, "");
                       // console.log(str);
                        var query = 'select cmd1.cm_id as MetadataId, cf_id as ContentFileId,cf.cf_name as Username ' + str +
                            ' from content_metadata as cmd1 join content_files as cf on cf.cf_cm_id = cmd1.cm_id ' +
                            'where cf.cf_url LIKE "%.mp3" and cf.cf_name IS NOT NULL and cf.cf_original_processed = 1 and cmd1.cm_id =  ? ';
                        connection_ikon_cms.query(query, [req.body.metadata_id], function (err, result) {
                            if (err) {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'getPersonalizedDataForVcode',
                                    responseCode: 500,
                                    message: JSON.stringify(err.message)
                                }
                                wlogger.error(error); // for error
                                console.log(err)
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            } else {
                                var info = {
                                    userName: req.session.UserName,
                                    action : 'getPersonalizedDataForVcode',
                                    responseCode: 200,
                                    message: 'Retrieved Personalized Data For Vcode.'
                                }
                            //    console.log(result);

                                wlogger.info(info); // for information
                                connection_ikon_cms.release();
                                res.send(result);
                            }
                        });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'getPersonalizedDataForVcode',
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
            action : 'getPersonalizedDataForVcode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}