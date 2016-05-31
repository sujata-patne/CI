/**
 * Created by sujata.patne on 13-07-2015.
 */
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var atob = require("atob");
var CountryManager = require('../models/country.model');
var wlogger = require("../config/logger");
var reload = require('require-reload')(require);
var config = require('../config')();
var btoa = require("btoa");
var _ = require("underscore");
var fs = require("fs");
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
function GetContentType(state) {
    var contenttype = '';
    var contenttype1 = '';
    switch (state) {
        case 'addwallpaper':
            contenttype = '"Imagery"';
            contenttype1 = 'Imagery';
            break;
        case 'editwallpaper':
            contenttype = '"Imagery"';
            contenttype1 = 'Imagery';
            break;
        case 'addvideo':
            contenttype = '"Video"';
            contenttype1 = 'Video';
            break;
        case 'editvideo':
            contenttype = '"Video"';
            contenttype1 = 'Video';
            break;
        case 'addaudio':
            contenttype = '"Audio"';
            contenttype1 = 'Audio';
            break;
        case 'editaudio':
            contenttype = '"Audio"';
            contenttype1 = 'Audio';
            break;
        case 'addgame':
            contenttype = '"AppsGames"';
            contenttype1 = 'AppsGames';
            break;
        case 'editgame':
            contenttype = '"AppsGames"';
            contenttype1 = 'AppsGames';
            break;
        case 'addtext':
            contenttype = '"Text"';
            contenttype1 = 'Text';
            break;
        case 'edittext':
            contenttype = '"Text"';
            contenttype1 = 'Text';
            break;
    }
    return { contenttype: contenttype, contenttype1: contenttype1 };
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
 * @classdesc get metadata detials.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.getmetadata = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var contenttype = GetContentType(req.body.state).contenttype;
                    var status = req.body.state.indexOf("add") > -1 ? "add" : "edit";
                    var currentdate = getDate();
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    async.parallel({
                        ContentMetadata: function (callback) {
                            if (status == "edit") {
                                if (req.session.UserRole == "Content Manager") {
                                    var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata WHERE cm_id =? and cm_state  in (1,2,3,4) and cm_property_id is not null)meta inner join(select * from icn_vendor_detail where vd_is_active=1 and vd_end_on >=  "' + currentdate + '" )vd on(vd.vd_id =meta.cm_vendor) inner join (select cm_id as propid from content_metadata where cm_is_active =1 and cm_property_id is null and cm_expires_on >= "' + currentdate + '" )prop on(prop.propid = meta.cm_property_id) left outer join (select cd_id as p_id,cd_name as p_name,cm_id as p_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Photographer"))photo on(photo.p_id = meta.cm_protographer) left outer join (select cd_id as l_id,cd_name as l_name,cm_id as l_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Location"))location on(location.l_id = meta.cm_location) inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = meta.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name = ' + contenttype + ')parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)' + vendorquery, [req.body.Id], function (err, ContentMetadata) {
                                        callback(err, ContentMetadata);
                                    });
                                }
                                else {
                                    var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata WHERE cm_id =? and  cm_property_id is not null)meta inner join(select * from icn_vendor_detail )vd on(vd.vd_id =meta.cm_vendor) inner join (select cm_id as propid from content_metadata where  cm_property_id is null )prop on(prop.propid = meta.cm_property_id) left outer join (select cd_id as p_id,cd_name as p_name,cm_id as p_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Photographer"))photo on(photo.p_id = meta.cm_protographer) left outer join (select cd_id as l_id,cd_name as l_name,cm_id as l_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Location"))location on(location.l_id = meta.cm_location) inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = meta.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name = ' + contenttype + ')parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)' + vendorquery, [req.body.Id], function (err, ContentMetadata) {
                                        callback(err, ContentMetadata);
                                    });
                                }
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Languages: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta ' +
                                    'inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) ' +
                                    'inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                    'inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Languages) {
                                    callback(err, Languages);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        BGSongType: function (callback) {
                            var query = connection_ikon_cms.query('select * from catalogue_detail as cd ' +
                                'inner join(select * from catalogue_master where cm_name IN ("BG Song Type") ) cm on (cd.cd_cm_id = cm.cm_id )', function (err, ContentType) {
                                callback(err, ContentType);
                            });
                        },
                        SubGenres: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta ' +
                                    'inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_sub_genre) ' +
                                    'inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                    'inner join(select * from catalogue_master where cm_name in ("Sub Genres"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, SubGenres) {
                                    callback(err, SubGenres);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Platforms: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_platform_support) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Platform Supports"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Platforms) {
                                    callback(err, Platforms);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Keywords: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_key_words) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Search Keywords"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Keywords) {
                                    callback(err, Keywords);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Celebrity: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_celebrity) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Celebrity"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Celebrity) {
                                    callback(err, Celebrity);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Singers: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_singer) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Singers"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Singers) {
                                    callback(err, Singers);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        ReSingers: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_re_singer) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Singers"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, ReSingers) {
                                    callback(err, ReSingers);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        LyricsLanguages: function (callback) {
                            if (status == "edit") {
                                var query = 'select * from (SELECT * FROM content_metadata where cm_id =? )meta ' +
                                    'inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_lyrics_languages) ' +
                                    'inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) ' +
                                    'inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)';
                                //console.log('metadata')
                                //console.log(query)
                                var query = connection_ikon_cms.query(query, [req.body.Id], function (err, LyricsLanguages) {
                                    callback(err, LyricsLanguages);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        Directors: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_music_director) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Music Directors"))cm on(cm.cm_id =cd.cd_cm_id)', [req.body.Id], function (err, Directors) {
                                    callback(err, Directors);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        MetadataRights: function (callback) {
                            if (status == "edit") {
                                var query = connection_ikon_cms.query('select * from (select * from(select cm_r_group_id,cm_vendor,cm_property_id from content_metadata where cm_id= ?)cn_mt inner join (select * from multiselect_metadata_detail )mmd on (cn_mt.cm_r_group_id=mmd.cmd_group_id)inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id)) cm', [req.body.Id], function (err, MetadataRights) {
                                    callback(err, MetadataRights);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        IconCountry: function (callback) { //country and groups
                            CountryManager.getIconCountry(connection_ikon_cms, function (err, IconCountry) {
                                callback(err, IconCountry);
                            });
                        },
                        IconGroupCountry: function (callback) { //only groups
                            CountryManager.getCountryGroups(connection_ikon_cms, function( err, CountryGroups ) {
                                callback( err, CountryGroups );
                            });
                        },
                        CountryRights: function (callback) {
                            //var query = connection_ikon_cms.query('select distinct cd_id,cd_name from (select CASE  WHEN groupid is null THEN icn_cnt_name ELSE country_name  END AS country_name, CASE  WHEN groupid is null THEN icn_cnt ELSE countryid  END AS country_id,groupid from (SELECT cd_id as icn_cnt,cd_name as icn_cnt_name ,cd_cm_id as icn_cd_cm_id FROM catalogue_detail)cd inner join(select cm_id as icn_cm_id,cm_name as icn_cm_name from catalogue_master where cm_name in("icon_geo_location") )cm on(cm.icn_cm_id = cd.icn_cd_cm_id) left outer join (select cm_id as groupid,cm_name as groupname from catalogue_master )master on(master.groupname = cd.icn_cnt_name) left outer join (select cd_id as countryid,cd_name as country_name,cd_cm_id as m_groupid from catalogue_detail)mastercnt on(master.groupid =mastercnt.m_groupid))country inner join (select cd_id ,cd_name ,cd_cm_id,cm_id,cm_name  from catalogue_detail,catalogue_master where cm_id =cd_cm_id and cm_name in("global_country_list"))g_cd on(g_cd.cd_name =country.country_name)', function (err, CountryRights) {
                            CountryManager.getCountryRights(connection_ikon_cms, function( err, CountryRights ) {
                                callback( err, CountryRights );
                            });
                        },
                        CatalogueMaster: function (callback) {
                            var query = connection_ikon_cms.query('select * from (select * from catalogue_master where cm_name IN ("Languages","Celebrity","Search Keywords","Singers","Music Directors","Location","Photographer") ) cm', function (err, CatalogueMaster) {
                                callback(err, CatalogueMaster);
                            });
                        },
                        MasterList: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd ' +
                                'inner join(select * from catalogue_master where ' +
                                'cm_name IN ("Lyricist","Song Type","Channel Distribution","Genres","Sub Genres","Mood","Languages","Celebrity","Festival","Religion","Raag Taal","Instruments","Nudity","Self Ranking","Search Keywords","Mode","InAppPurchase","Singers","Music Directors","Video Quality","Platform Supports") ) cm on (cd.cd_cm_id = cm.cm_id )', function (err, MasterList) {
                                callback(err, MasterList);
                            });
                        },
                        Vendors: function (callback) {
                            var query = 'select distinct vd_id,vd_name,vd_is_active,vd_starts_on,vd_end_on from ' +
                                '( select * from (select * from icn_vendor_detail where vd_is_active <> 0 order by vd_name)vd ' + vendorquery + ' ' +
                                'inner join (select * from vendor_profile)vp  on (vp.vp_vendor_id=vd.vd_id)' +
                                'inner join (select * from multiselect_metadata_detail )mmd on (vp.vp_r_group_id=mmd.cmd_group_id) ' +
                                'inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id )' +
                                'inner join  (SELECT * FROM catalogue_detail where cd_name in(' + contenttype + '))cd on (r.r_allowed_content_type =cd.cd_id)' +
                                'inner join(select * from catalogue_master where cm_name in("Content Type") )cm on(cm.cm_id = cd.cd_cm_id) ) cm';
                             connection_ikon_cms.query(query , function (err, Vendors) {
                                callback(err, Vendors);
                            });
                        },
                        VendorRights: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from (select * from icn_vendor_detail)vd ' + vendorquery + ' inner join (select * from vendor_profile)vp  on (vp.vp_vendor_id=vd.vd_id)inner join (select * from multiselect_metadata_detail )mmd on (vp.vp_r_group_id=mmd.cmd_group_id) inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id )inner join  (SELECT * FROM catalogue_detail where cd_name in(' + contenttype + '))cd on (r.r_allowed_content_type =cd.cd_id)inner join(select * from catalogue_master where cm_name in("Content Type") )cm on(cm.cm_id = cd.cd_cm_id) ) cm', function (err, Vendors) {
                                callback(err, Vendors);
                            });
                        },
                        PropertyRights: function (callback) {

                            var query = connection_ikon_cms.query('select * from content_metadata as meta ' +
                                'inner join(select * from icn_vendor_detail)vd on(meta.cm_vendor =vd.vd_id) ' + vendorquery +
                                ' inner join (select * from multiselect_metadata_detail )mmd on (meta.cm_r_group_id=mmd.cmd_group_id) ' +
                                'inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id )' +
                                'inner join  (SELECT * FROM catalogue_detail where cd_name in(' + contenttype + '))cd on (r.r_allowed_content_type =cd.cd_id)' +
                                // 'inner join(select cm_id as masterid from catalogue_master where cm_name in("Content Type") )cm on(cm.masterid = cd.cd_cm_id) ' +
                                'where meta.cm_property_id is null', function (err, Propertys) {
                                callback(err, Propertys);
                            });
                        },
                        Propertys: function (callback) {
                            var query = connection_ikon_cms.query('select distinct cm_id,cm_title,cm_vendor,cm_starts_from,cm_expires_on,cm_is_active,cm_release_date ' +
                                'from ( select * from (select * from content_metadata where cm_property_id is null and cm_is_active <> 0 order by cm_title)meta ' +
                                'inner join(select * from icn_vendor_detail)vd on(meta.cm_vendor =vd.vd_id) ' + vendorquery + ' ' +
                                'inner join (select * from multiselect_metadata_detail )mmd on (meta.cm_r_group_id=mmd.cmd_group_id) ' +
                                'inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id )' +
                                'inner join  (SELECT * FROM catalogue_detail where cd_name in(' + contenttype + '))cd on (r.r_allowed_content_type =cd.cd_id)' +
                                'inner join(select cm_id as masterid from catalogue_master where cm_name in("Content Type") )cm on(cm.masterid = cd.cd_cm_id) ) cm ', function (err, Propertys) {
                                callback(err, Propertys);
                            });
                        },
                        MetadataTypes: function (callback) {
                            var query = connection_ikon_cms.query('select distinct cd_id,cd_name,parentid,parentname from (SELECT * FROM icn_manage_content_type)cnt inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name in(' + contenttype + '))parent  on(parent.parentid  = cnt.mct_parent_cnt_type_id) inner join (select cd_id, cd_name  from catalogue_detail)cd on(cd.cd_id  = cnt.mct_cnt_type_id)', function (err, MetadataTypes) {
                                callback(err, MetadataTypes);
                            });
                        },
                        filteredMasterList:function (callback) {

                            var query = connection_ikon_cms.query('select cd.*, cm.* from catalogue_detail as cd '+
                                'inner join catalogue_master as cm on (cd.cd_cm_id = cm.cm_id ) '+
                                'join multiselect_metadata_detail as mmd on (cd.cd_content_type_id = mmd.cmd_group_id ) '+
                                'inner join catalogue_detail as cd1 on(cd1.cd_id = mmd.cmd_entity_detail) '+
                                'where cm_name IN ("Genres","Celebrity","Sub Genres","Mood","Festival","Religion","Raag Taal","Instruments","Languages") and cd1.cd_name in(' + contenttype + ')',function (err, filteredMasterList) {
                                callback(err, filteredMasterList);
                            });
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        }
                    }, function (err, results) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action : 'getmetadata',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var info = {
                                userName: req.session.UserName,
                                action : 'getmetadata',
                                responseCode: 200,
                                message: "Metadata retrieved successfully."
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
                    action : 'getmetadata',
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
                action : 'getmetadata',
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
            action : 'getmetadata',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc add and update metadata details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.addeditmetadata = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var contenttype = (GetContentType(req.body.state)).contenttype;
                    var contenttype1 = (GetContentType(req.body.state)).contenttype1;
                    var obj = req.body;

                    var query = connection_ikon_cms.query('Select * From content_metadata where cm_title = ? and cm_content_type = ?', [obj.cm_title, obj.cm_content_type], function (err, result) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action : 'addeditmetadata',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for error
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var flag = true;
                            if (result.length > 0) {
                                if (!(result[0].cm_id == obj.cm_id)) {
                                    flag = false;
                                }
                            }
                            if (flag) {
                                if (obj.cm_cp_content_id && obj.cm_cp_content_id != "") {
                                    var query = connection_ikon_cms.query('Select * From content_metadata where cm_cp_content_id = ?', [obj.cm_cp_content_id], function (err, result) {
                                        if (err) {
                                            var error = {
                                                userName: req.session.UserName,
                                                action : 'addeditmetadata',
                                                responseCode: 500,
                                                message: JSON.stringify(err.message)
                                            }
                                            wlogger.error(error); // for error
                                            connection_ikon_cms.release();
                                            res.status(500).json(err.message);
                                        }
                                        else {
                                            var flag = true;
                                            if (result.length > 0) {
                                                if (!(result[0].cm_id == obj.cm_id)) {
                                                    flag = false;
                                                }
                                            }
                                            if (flag) {
                                                InsertUpdateMeta();
                                            }
                                            else {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'addeditmetadata',
                                                    responseCode: 500,
                                                    message: "CP Content ID must be Unique."
                                                }
                                                wlogger.error(error); // for error
                                                connection_ikon_cms.release();
                                                res.send({ success: false, message: "CP Content ID must be Unique." });
                                            }
                                        }
                                    });
                                }
                                else {
                                    InsertUpdateMeta();
                                }
                            }
                            else {
                                var error = {
                                    userName: req.session.UserName,
                                    action : 'addeditmetadata',
                                    responseCode: 500,
                                    message: "Content Display Title must be Unique."
                                }
                                wlogger.error(error); // for error
                                connection_ikon_cms.release();
                                res.send({ success: false, message: "Content Display Title must be Unique." });
                            }
                        }
                    });

                    function InsertUpdateMeta() {
                        async.waterfall([
                                //delete celebrity
                                function (callback) {
                                    if (obj.deletecelebrities.length > 0 && obj.cm_celebrity) {
                                        var del_celb_length = obj.deletecelebrities.length;
                                        deletecelebrity(0);
                                        function deletecelebrity(dc) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletecelebrities[dc].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dc = dc + 1;
                                                    if (dc == del_celb_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Celebrity deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_celebrity);
                                                    }
                                                    else {
                                                        deletecelebrity(dc);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_celebrity);
                                    }
                                },
                                //celebrity
                                function (val, callback) {
                                    if (obj.celebrities.length > 0) {
                                        var celb_length = obj.celebrities.length;
                                        addcelebrity(0);
                                        function addcelebrity(c) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
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
                                                        cmd_entity_detail: obj.celebrities[c],
                                                        cmd_crud_isactive: 1
                                                    }
                                                    var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                        c = c + 1;
                                                        if (c == celb_length) {
                                                            var info = {
                                                                userName: req.session.UserName,
                                                                action : 'addeditmetadata',
                                                                responseCode: 200,
                                                                message: "Celebrity added successfully."
                                                            }
                                                            wlogger.info(info); // for information
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
                                        if (obj.selectedCeleb) {
                                            if (!obj.selectedCeleb.length > 0) {
                                                obj.cm_celebrity = null;
                                            }
                                        } else {
                                            obj.cm_celebrity = null;
                                        }
                                        callback(null, obj.cm_celebrity);
                                    }
                                },
                                //delete keywords
                                function (val, callback) {
                                    if (obj.deletekeywords.length > 0 && obj.cm_key_words) {
                                        var key_length = obj.deletekeywords.length;
                                        var query = connection_ikon_cms.query('DELETE FROM multiselect_metadata_detail WHERE cmd_group_id = ?', [obj.cm_key_words], function (err, result) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                deletekeyword(0);
                                                function deletekeyword(k) {
                                                    var query = connection_ikon_cms.query('DELETE FROM catalogue_detail WHERE cd_id = ?', [obj.deletekeywords[k]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        }
                                                        else {
                                                            k = k + 1;
                                                            if (k == key_length) {
                                                                var info = {
                                                                    userName: req.session.UserName,
                                                                    action : 'addeditmetadata',
                                                                    responseCode: 200,
                                                                    message: "Keyword deleted successfully."
                                                                }
                                                                wlogger.info(info); // for information
                                                                callback(err, obj.cm_key_words);
                                                            }
                                                            else {
                                                                deletekeyword(k);
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        callback(null, obj.cm_key_words);
                                    }
                                },
                                //keywords
                                function (val, callback) {
                                    if (obj.keywords.length > 0) {
                                        var key_length = obj.keywords.length;
                                        addkeyword(0);
                                        function addkeyword(k) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var New_cd_Id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                    var data = {
                                                        cd_id: New_cd_Id,
                                                        cd_cm_id: obj.keyword_master,
                                                        cd_name: obj.keywords[k],
                                                        cd_display_name: obj.keywords[k],
                                                        cd_crud_isactive: 1
                                                    };
                                                    var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                        var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                            if (err) {
                                                                var error = {
                                                                    userName: req.session.UserName,
                                                                    action : 'addeditmetadata',
                                                                    responseCode: 500,
                                                                    message: JSON.stringify(err.message)
                                                                }
                                                                wlogger.error(error); // for error
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
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action : 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Keywords added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
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
                                        obj.cm_key_words = null;
                                        callback(null, obj.cm_key_words);
                                    }
                                },
                                //delete re singer
                                function (val, callback) {
                                    if (obj.deleteresinger.length > 0 && obj.cm_re_singer) {
                                        var del_re_singer_length = obj.deleteresinger.length;
                                        deleteresinger(0);
                                        function deleteresinger(drs) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deleteresinger[drs].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    drs = drs + 1;
                                                    if (drs == del_re_singer_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Re-singer deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_re_singer);
                                                    }
                                                    else {
                                                        deleteresinger(drs);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_re_singer);
                                    }
                                },
                                //re singers
                                function (val, callback) {
                                    if (obj.resingers.length > 0) {
                                        var re_singer_length = obj.resingers.length;
                                        addresinger(0);
                                        function addresinger(rs) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_re_singer ? obj.cm_re_singer : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id, obj.cm_content_type, obj.resingers[rs]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if (result.length == 0) {
                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_re_singer = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.resingers[rs],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    rs = rs + 1;
                                                                    if (rs == re_singer_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Re-singer added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_re_singer);
                                                                    }
                                                                    else {
                                                                        addresinger(rs);
                                                                    }
                                                                });
                                                            } else {
                                                                rs = rs + 1;
                                                                if (rs == re_singer_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Re-singer added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_re_singer);
                                                                }
                                                                else {
                                                                    addresinger(rs);
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedresinger) {
                                            if (!obj.selectedresinger.length > 0) {
                                                obj.cm_re_singer = null;
                                            }
                                        }
                                        else {
                                            obj.cm_re_singer = null;
                                        }
                                        callback(null, obj.cm_re_singer);
                                    }
                                },
                                //delete singer
                                function (val, callback) {
                                    if (obj.deletesinger.length > 0 && obj.cm_singer) {
                                        var del_singer_length = obj.deletesinger.length;
                                        deletesinger(0);
                                        function deletesinger(ds) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletesinger[ds].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    ds = ds + 1;
                                                    if (ds == del_singer_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Singer deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_singer);
                                                    }
                                                    else {
                                                        deletesinger(ds);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_singer);
                                    }
                                },
                                //singers
                                function (val, callback) {
                                    if (obj.singers.length > 0) {
                                        var singer_length = obj.singers.length;
                                        addsinger(0);
                                        function addsinger(s) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_singer ? obj.cm_singer : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id, obj.cm_content_type, obj.singers[s]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if (result.length == 0) {
                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_singer = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.singers[s],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    s = s + 1;
                                                                    if (s == singer_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Singer added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_singer);
                                                                    }
                                                                    else {
                                                                        addsinger(s);
                                                                    }
                                                                });
                                                            } else {
                                                                s = s + 1;
                                                                if (s == singer_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Singer added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_singer);
                                                                }
                                                                else {
                                                                    addsinger(s);
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedsinger) {
                                            if (!obj.selectedsinger.length > 0) {
                                                obj.cm_singer = null;
                                            }
                                        }
                                        else {
                                            obj.cm_singer = null;
                                        }
                                        callback(null, obj.cm_singer);
                                    }
                                },
                                //delete director
                                function (val, callback) {
                                    if (obj.deletemusicdirectors.length > 0 && obj.cm_music_director) {
                                        var del_director_length = obj.deletemusicdirectors.length;
                                        deletedirector(0);
                                        function deletedirector(dd) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletemusicdirectors[dd].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dd = dd + 1;
                                                    if (dd == del_director_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Director deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_music_director);
                                                    }
                                                    else {
                                                        deletedirector(dd);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_music_director);
                                    }
                                },
                                //director
                                function (val, callback) {
                                    if (obj.musicdirectors.length > 0) {
                                        var musicdirectors_length = obj.musicdirectors.length;
                                        addmusicdirectors(0);
                                        function addmusicdirectors(m) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_music_director ? obj.cm_music_director : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id, obj.cm_content_type, obj.musicdirectors[m]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if (result.length == 0) {

                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_music_director = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.musicdirectors[m],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    m = m + 1;
                                                                    if (m == musicdirectors_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Director added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_music_director);
                                                                    }
                                                                    else {
                                                                        addmusicdirectors(m);
                                                                    }
                                                                });
                                                            }else{
                                                                m = m + 1;
                                                                if (m == musicdirectors_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Director added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_music_director);
                                                                }
                                                                else {
                                                                    addmusicdirectors(m);
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selecteddirector) {
                                            if (!obj.selecteddirector.length > 0) {
                                                obj.cm_music_director = null;
                                            }
                                        }
                                        else {
                                            obj.cm_music_director = null;
                                        }
                                        callback(err, obj.cm_music_director);
                                    }
                                },
                                //photographer
                                function (val, callback) {
                                    if (obj.photographer && obj.photographer != "") {
                                        if (obj.cm_protographer) {
                                            var query = connection_ikon_cms.query('update catalogue_detail set cd_name = ?, cd_display_name = ? where cd_id = ? ', [obj.photographer, obj.photographer, obj.cm_protographer], function (err, result) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'addeditmetadata',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for error
                                                callback(err, null);
                                            });
                                        }
                                        else {
                                            var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var New_cd_Id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                    var data = {
                                                        cd_id: New_cd_Id,
                                                        cd_cm_id: obj.photographer_master,
                                                        cd_name: obj.photographer,
                                                        cd_display_name: obj.photographer,
                                                        cd_crud_isactive: 1
                                                    };
                                                    var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                        obj.cm_protographer = New_cd_Id;
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Photographer added successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, New_cd_Id);
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        obj.cm_protographer = null;
                                        callback(null, obj.cm_protographer);
                                    }
                                },
                                //location
                                function (val, callback) {
                                    if (obj.location && obj.location != "") {
                                        if (obj.cm_location) {
                                            var query = connection_ikon_cms.query('update catalogue_detail set cd_name = ?,cd_display_name = ? where cd_id = ? ', [obj.location, obj.location, obj.cm_location], function (err, result) {
                                                var info = {
                                                    userName: req.session.UserName,
                                                    action : 'addeditmetadata',
                                                    responseCode: 200,
                                                    message: "Location updated successfully."
                                                }
                                                wlogger.info(info); // for information
                                                callback(err, null);
                                            });
                                        }
                                        else {
                                            var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id FROM catalogue_detail', function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var New_cd_Id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                    var data = {
                                                        cd_id: New_cd_Id,
                                                        cd_cm_id: obj.location_master,
                                                        cd_name: obj.location,
                                                        cd_display_name: obj.location,
                                                        cd_crud_isactive: 1
                                                    };
                                                    var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', data, function (err, result) {
                                                        obj.cm_location = New_cd_Id;
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Location added successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, New_cd_Id);
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        obj.cm_location = null;
                                        callback(null, obj.cm_location);
                                    }
                                },
                                //delete platform
                                function (val, callback) {
                                    if (obj.deleteplatform.length > 0 && obj.cm_celebrity) {
                                        var del_plat_length = obj.deleteplatform.length;
                                        deleteplatform(0);
                                        function deleteplatform(dp) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletelanguage[dp].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dp = dp + 1;
                                                    if (dp == del_plat_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Platform deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_platform_support);
                                                    }
                                                    else {
                                                        deleteplatform(dp);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_platform_support);
                                    }
                                },
                                //platform
                                function (val, callback) {
                                    if (obj.platform.length > 0) {
                                        var plat_length = obj.platform.length;
                                        addplatform(0);
                                        function addplatform(p) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_platform_support ? obj.cm_platform_support : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id, obj.cm_content_type, obj.platform[p]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if (result.length == 0) {
                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_platform_support = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.platform[p],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    p = p + 1;
                                                                    if (p == plat_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Platform added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_platform_support);
                                                                    }
                                                                    else {
                                                                        addplatform(p);
                                                                    }
                                                                });
                                                            } else {
                                                                p = p + 1;
                                                                if (p == plat_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Platform added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_platform_support);
                                                                }
                                                                else {
                                                                    addplatform(p);
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedplatform) {
                                            if (!obj.selectedplatform.length > 0) {
                                                obj.cm_platform_support = null;
                                            }
                                        }
                                        else {
                                            obj.cm_platform_support = null;
                                        }
                                        callback(null, obj.cm_platform_support);
                                    }
                                },
                                //delete language
                                function (val, callback) {
                                    if (obj.deletelanguage.length > 0 && obj.cm_language) {
                                        var del_lang_length = obj.deletelanguage.length;
                                        deletelanguage(0);
                                        function deletelanguage(dl) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletelanguage[dl].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dl = dl + 1;
                                                    if (dl == del_lang_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Language deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_language);
                                                    }
                                                    else {
                                                        deletelanguage(dl);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_language);
                                    }
                                },
                                //language
                                function (val, callback) {
                                    if (obj.language.length > 0) {
                                        var lang_length = obj.language.length;
                                        addlanguage(0);
                                        function addlanguage(l) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_language ? obj.cm_language : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id,obj.cm_content_type,obj.language[l]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if (result.length == 0) {
                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_language = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.language[l],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    l = l + 1;
                                                                    if (l == lang_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action : 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Language added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_language);
                                                                    }
                                                                    else {
                                                                        addlanguage(l);
                                                                    }
                                                                });
                                                            }else{
                                                                l = l + 1;
                                                                if (l == lang_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action : 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Language added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_language);
                                                                }
                                                                else {
                                                                    addlanguage(l);
                                                                }
                                                            }
                                                        }
                                                    })

                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedlanguage) {
                                            if (!obj.selectedlanguage.length > 0) {
                                                obj.cm_language = null;
                                            }
                                        }
                                        else {
                                            obj.cm_language = null;
                                        }
                                        callback(null, obj.cm_language);
                                    }
                                },
                                //delete sub-genre
                                function (val, callback) {
                                    if (obj.deletesubGenres.length > 0 && obj.cm_sub_genre) {
                                        var del_lang_length = obj.deletesubGenres.length;
                                        deleteSubGenre(0);
                                        function deleteSubGenre(dl) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletesubGenres[dl].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dl = dl + 1;
                                                    if (dl == del_lang_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Sub Genre deleted successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_sub_genre);
                                                    }
                                                    else {
                                                        deleteSubGenre(dl);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_sub_genre);
                                    }
                                },
                                //sub-genre
                                function (val, callback) {
                                    if (obj.selectedsubGenres.length > 0) {
                                        var cm_sub_genre_length = obj.selectedsubGenres.length;
                                        addSubGenre(0);
                                        function addSubGenre(l) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_sub_genre ? obj.cm_sub_genre : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var query = connection_ikon_cms.query('SELECT * FROM multiselect_metadata_detail where cmd_group_id = ? and cmd_entity_type = ?  and cmd_entity_detail = ?', [cmd_group_id,obj.cm_content_type,obj.selectedsubGenres[l]], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action: 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        } else {
                                                            if(result.length == 0) {
                                                                var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                                obj.cm_sub_genre = cmd_group_id;
                                                                var Multiselect_Data = {
                                                                    cmd_id: cmd_id,
                                                                    cmd_group_id: cmd_group_id,
                                                                    cmd_entity_type: obj.cm_content_type,
                                                                    cmd_entity_detail: obj.selectedsubGenres[l],
                                                                    cmd_crud_isactive: 1
                                                                }
                                                                var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                                    l = l + 1;
                                                                    if (l == cm_sub_genre_length) {
                                                                        var info = {
                                                                            userName: req.session.UserName,
                                                                            action: 'addeditmetadata',
                                                                            responseCode: 200,
                                                                            message: "Sub Genre added successfully."
                                                                        }
                                                                        wlogger.info(info); // for information
                                                                        callback(err, obj.cm_sub_genre);
                                                                    }
                                                                    else {
                                                                        addSubGenre(l);
                                                                    }
                                                                });
                                                            }else {
                                                                l = l + 1;
                                                                if (l == cm_sub_genre_length) {
                                                                    var info = {
                                                                        userName: req.session.UserName,
                                                                        action: 'addeditmetadata',
                                                                        responseCode: 200,
                                                                        message: "Sub Genre added successfully."
                                                                    }
                                                                    wlogger.info(info); // for information
                                                                    callback(err, obj.cm_sub_genre);
                                                                }
                                                                else {
                                                                    addSubGenre(l);
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedsubGenres) {
                                            if (!obj.selectedsubGenres.length > 0) {
                                                obj.cm_sub_genre = null;
                                            }
                                        }
                                        else {
                                            obj.cm_sub_genre = null;
                                        }
                                        callback(null, obj.cm_sub_genre);
                                    }
                                },
                                //selectedlyricslanguage: $scope.SelectedLyricsLanguages,
                                //cm_lyrics_languages: $scope.lyrics_languages_group_id,
                                //lyricslanguage: GetAddMasterlist($scope.OldLyricsLanguages, $scope.SelectedLyricsLanguages),
                                //deletelyricslanguage:
                                //delete language
                                function (val, callback) {
                                    if (obj.deletelyricslanguage.length > 0 && obj.cm_lyrics_languages) {
                                        var del_lyrc_lang_length = obj.deletelyricslanguage.length;
                                        deletelyricslanguage(0);
                                        function deletelyricslanguage(dll) {
                                            var query = connection_ikon_cms.query('Delete From multiselect_metadata_detail where cmd_id = ?', [obj.deletelyricslanguage[dll].cmd_id], function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    dll = dll + 1;
                                                    if (dll == del_lyrc_lang_length) {
                                                        var info = {
                                                            userName: req.session.UserName,
                                                            action : 'addeditmetadata',
                                                            responseCode: 200,
                                                            message: "Lyrics Language delete successfully."
                                                        }
                                                        wlogger.info(info); // for information
                                                        callback(err, obj.cm_lyrics_languages);
                                                    }
                                                    else {
                                                        deletelyricslanguage(dll);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(null, obj.cm_lyrics_languages);
                                    }
                                },
                                //language
                                function (val, callback) {
                                    if (obj.lyricslanguage.length > 0) {
                                        var lycs_lang_length = obj.lyricslanguage.length;
                                        addlyricslanguage(0);
                                        function addlyricslanguage(ll) {
                                            var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id,MAX(cmd_group_id) AS GroupId FROM multiselect_metadata_detail', function (err, multiselectId) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, null);
                                                }
                                                else {
                                                    var cmd_group_id = obj.cm_lyrics_languages ? obj.cm_lyrics_languages : multiselectId[0].GroupId != null ? (parseInt(multiselectId[0].GroupId) + 1) : 1;
                                                    var cmd_id = multiselectId[0].id != null ? (parseInt(multiselectId[0].id) + 1) : 1;
                                                    obj.cm_lyrics_languages = cmd_group_id;
                                                    var Multiselect_Data = {
                                                        cmd_id: cmd_id,
                                                        cmd_group_id: cmd_group_id,
                                                        cmd_entity_type: obj.cm_content_type,
                                                        cmd_entity_detail: obj.lyricslanguage[ll],
                                                        cmd_crud_isactive: 1
                                                    }
                                                    var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', Multiselect_Data, function (err, rightresult) {
                                                        ll = ll + 1;
                                                        if (ll == lycs_lang_length) {
                                                            var info = {
                                                                userName: req.session.UserName,
                                                                action : 'addeditmetadata',
                                                                responseCode: 200,
                                                                message: "Lyrics Language added successfully."
                                                            }
                                                            wlogger.info(info); // for information
                                                            callback(err, obj.cm_lyrics_languages);
                                                        }
                                                        else {
                                                            addlyricslanguage(ll);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (obj.selectedlyricslanguage) {
                                            if (!obj.selectedlyricslanguage.length > 0) {
                                                obj.cm_lyrics_languages = null;
                                            }
                                        }
                                        else {
                                            obj.cm_lyrics_languages = null;
                                        }
                                        callback(null, obj.cm_lyrics_languages);
                                    }
                                },
                                //delete rights
                                function (val, callback) {
                                    if (obj.deleterights.length > 0 && obj.cm_r_group_id) {
                                        var del_right_length = obj.deleterights.length;
                                        deleteright(0);
                                        function deleteright(dr) {
                                            var query = connection_ikon_cms.query('DELETE FROM rights WHERE r_id = ?', [obj.deleterights[dr].r_id], function (err, result) {
                                                if (err) {
                                                    var error = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 500,
                                                        message: JSON.stringify(err.message)
                                                    }
                                                    wlogger.error(error); // for error
                                                    callback(err, obj.cm_r_group_id);
                                                }
                                                else {
                                                    var query = connection_ikon_cms.query('DELETE FROM multiselect_metadata_detail WHERE cmd_id = ?', [obj.deleterights[dr].cmd_id], function (err, result) {
                                                        if (err) {
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, obj.cm_r_group_id);
                                                        }
                                                        else {
                                                            dr = dr + 1;
                                                            if (dr == del_right_length) {
                                                                var info = {
                                                                    userName: req.session.UserName,
                                                                    action : 'addeditmetadata',
                                                                    responseCode: 200,
                                                                    message: "Rights deleted successfully."
                                                                }
                                                                wlogger.info(info); // for information
                                                                callback(err, obj.cm_r_group_id);
                                                            }
                                                            else {
                                                                deleteright(dr);
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        callback(err, obj.cm_r_group_id);
                                    }
                                },
                                //add right
                                function (val, callback) {
                                    if (obj.addrights.length > 0) {
                                        var rightslength = obj.addrights.length;
                                        var query = connection_ikon_cms.query('SELECT MAX(cmd_group_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'addeditmetadata',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for error
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
                                                            var error = {
                                                                userName: req.session.UserName,
                                                                action : 'addeditmetadata',
                                                                responseCode: 500,
                                                                message: JSON.stringify(err.message)
                                                            }
                                                            wlogger.error(error); // for error
                                                            callback(err, null);
                                                        }
                                                        else {
                                                            var r_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                            var r_group_id = result[0].groupid != null ? (parseInt(result[0].groupid) + 1) : 1;
                                                            var Rights_datas = {
                                                                r_id: r_id,
                                                                r_group_id: r_group_id,
                                                                r_entity_type: obj.cm_content_type,
                                                                r_allowed_content_type: obj.addrights[j].r_allowed_content_type,
                                                                r_country_distribution_rights: obj.addrights[j].r_country_distribution_rights,
                                                                r_channel_distribution_rights: obj.addrights[j].r_channel_distribution_rights,
                                                                r_created_on: new Date(),
                                                                r_modified_on: new Date(),
                                                                r_created_by: req.session.UserName,
                                                                r_modified_by: req.session.UserName,
                                                                r_crud_isactive: 1
                                                            };
                                                            var query = connection_ikon_cms.query('INSERT INTO rights SET ?', Rights_datas, function (err, result) {
                                                                if (err) {
                                                                    var error = {
                                                                        userName: req.session.UserName,
                                                                        action : 'addeditmetadata',
                                                                        responseCode: 500,
                                                                        message: JSON.stringify(err.message)
                                                                    }
                                                                    wlogger.error(error); // for error
                                                                    callback(err, null);
                                                                }
                                                                else {
                                                                    var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                                                        if (err) {
                                                                            var error = {
                                                                                userName: req.session.UserName,
                                                                                action : 'addeditmetadata',
                                                                                responseCode: 500,
                                                                                message: JSON.stringify(err.message)
                                                                            }
                                                                            wlogger.error(error); // for error
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
                                                                                    var info = {
                                                                                        userName: req.session.UserName,
                                                                                        action : 'addeditmetadata',
                                                                                        responseCode: 200,
                                                                                        message: "Rights added successfully."
                                                                                    }
                                                                                    wlogger.info(info); // for information
                                                                                    callback(err, obj.cm_r_group_id);
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
                                        if (!(obj.channelrights > 0 && obj.countryrights > 0)) {
                                            obj.cm_r_group_id = null;
                                        }
                                        callback(err, obj.cm_r_group_id);
                                    }
                                },
                                function (val, callback) {
                                    if (obj.cm_id) {
                                        var metadata = {
                                            cm_vendor: obj.cm_vendor,
                                            cm_content_type: obj.cm_content_type,
                                            cm_r_group_id: obj.cm_r_group_id,
                                            cm_title: obj.cm_title,
                                            cm_short_desc: obj.cm_short_desc,
                                            cm_starts_from: new Date(obj.cm_starts_from),
                                            cm_expires_on: new Date(obj.cm_expires_on),
                                            cm_property_id: obj.cm_property_id,
                                            cm_display_title: obj.cm_title,
                                            cm_celebrity: obj.cm_celebrity,
                                            cm_genre: obj.cm_genre,
                                            cm_sub_genre: obj.cm_sub_genre,
                                            cm_protographer: obj.cm_protographer,
                                            cm_mood: obj.cm_mood,

                                            cm_release_year: new Date(obj.cm_release_date).getFullYear(),
                                            cm_release_date: new Date(obj.cm_release_date),

                                            bg_sound_type: obj.bg_sound_type,
                                            bg_song_title: obj.bg_song_title,
                                            cm_language: obj.cm_language,
                                            cm_platform_support: obj.cm_platform_support,
                                            cm_nudity: obj.cm_nudity,
                                            cm_parental_advisory: obj.cm_parental_advisory,
                                            cm_location: obj.cm_location,
                                            cm_festival_occasion: obj.cm_festival_occasion,
                                            cm_religion: obj.cm_religion,
                                            cm_cp_content_id: obj.cm_cp_content_id,
                                            cm_content_duration: obj.cm_content_duration,
                                            cm_singer: obj.cm_singer,
                                            cm_re_singer: obj.cm_re_singer,
                                            cm_lyrics_languages: obj.cm_lyrics_languages,
                                            cm_lyricist: obj.cm_lyricist,
                                            cm_song_type: obj.cm_song_type,
                                            cm_music_director: obj.cm_music_director,
                                            cm_content_quality: obj.cm_content_quality,
                                            cm_key_words: obj.cm_key_words,
                                            cm_raag_tal: obj.cm_raag_tal,
                                            cm_instruments: obj.cm_instruments,
                                            cm_long_description: obj.cm_long_description,
                                            cm_mode: obj.cm_mode,
                                            cm_is_app_store_purchase: obj.cm_is_app_store_purchase,
                                            cm_signature: null,
                                            cm_rank: obj.cm_rank,
                                            cm_live_on: new Date(obj.cm_starts_from),
                                            cm_ispersonalized: obj.cm_ispersonalized,
                                            cm_modified_on: new Date(),
                                            cm_modified_by: req.session.UserName
                                        }
                                        var query = connection_ikon_cms.query('Update content_metadata set ? where cm_id = ? ', [metadata, obj.cm_id], function (err, result) {
                                            var info = {
                                                userName: req.session.UserName,
                                                action : 'addeditmetadata',
                                                responseCode: 200,
                                                message: "Metadata updated successfully."
                                            }
                                            wlogger.info(info); // for information
                                            callback(err, obj.cm_id);
                                        });
                                    }
                                    else {
                                        var query = connection_ikon_cms.query('SELECT MAX(cm_id) as id FROM content_metadata', function (err, result) {
                                            if (err) {
                                                var error = {
                                                    userName: req.session.UserName,
                                                    action : 'addeditmetadata',
                                                    responseCode: 500,
                                                    message: JSON.stringify(err.message)
                                                }
                                                wlogger.error(error); // for error
                                                callback(err, null);
                                            }
                                            else {
                                                var cm_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                var metadata = {
                                                    cm_id: cm_id,
                                                    cm_vendor: obj.cm_vendor,
                                                    cm_content_type: obj.cm_content_type,
                                                    cm_r_group_id: obj.cm_r_group_id,
                                                    cm_title: obj.cm_title,
                                                    cm_short_desc: obj.cm_short_desc,
                                                    cm_release_year: new Date(obj.cm_release_date).getFullYear(),
                                                    cm_release_date: new Date(obj.cm_release_date),
                                                    cm_starts_from: new Date(obj.cm_starts_from),
                                                    cm_expires_on: new Date(obj.cm_expires_on),
                                                    cm_property_id: obj.cm_property_id,
                                                    cm_display_title: obj.cm_title,
                                                    cm_celebrity: obj.cm_celebrity,
                                                    cm_genre: obj.cm_genre,
                                                    cm_sub_genre: obj.cm_sub_genre,
                                                    cm_protographer: obj.cm_protographer,
                                                    cm_mood: obj.cm_mood,
                                                    bg_sound_type: obj.bg_sound_type,
                                                    bg_song_title: obj.bg_song_title,
                                                    cm_language: obj.cm_language,
                                                    cm_platform_support: obj.cm_platform_support,
                                                    cm_nudity: obj.cm_nudity,
                                                    cm_parental_advisory: obj.cm_parental_advisory,
                                                    cm_location: obj.cm_location,
                                                    cm_festival_occasion: obj.cm_festival_occasion,
                                                    cm_religion: obj.cm_religion,
                                                    cm_cp_content_id: obj.cm_cp_content_id,
                                                    cm_content_duration: obj.cm_content_duration,
                                                    cm_singer: obj.cm_singer,
                                                    cm_re_singer: obj.cm_re_singer,
                                                    cm_lyrics_languages: obj.cm_lyrics_languages,
                                                    cm_lyricist: obj.cm_lyricist,
                                                    cm_song_type: obj.cm_song_type,
                                                    cm_music_director: obj.cm_music_director,
                                                    cm_content_quality: obj.cm_content_quality,
                                                    cm_key_words: obj.cm_key_words,
                                                    cm_raag_tal: obj.cm_raag_tal,
                                                    cm_instruments: obj.cm_instruments,
                                                    cm_long_description: obj.cm_long_description,
                                                    cm_mode: obj.cm_mode,
                                                    cm_is_app_store_purchase: obj.cm_is_app_store_purchase,
                                                    cm_signature: null,
                                                    cm_state: 1,
                                                    cm_rank: obj.cm_rank,
                                                    cm_is_active: 1,
                                                    cm_comment: null,
                                                    cm_ispersonalized: obj.cm_ispersonalized,
                                                    cm_live_on: new Date(obj.cm_starts_from),
                                                    cm_created_on: new Date(),
                                                    cm_created_by: req.session.UserName,
                                                    cm_modified_on: new Date(),
                                                    cm_modified_by: req.session.UserName,
                                                    cm_crud_isactive: 1
                                                }

                                                var query = connection_ikon_cms.query('INSERT INTO content_metadata SET ?', metadata, function (err, result) {
                                                    obj.cm_id = cm_id;
                                                    var info = {
                                                        userName: req.session.UserName,
                                                        action : 'addeditmetadata',
                                                        responseCode: 200,
                                                        message: "Metadata added successfully."
                                                    }
                                                    wlogger.info(info); // for information
                                                    callback(err, cm_id);
                                                });
                                            }
                                        });
                                    }
                                }
                            ]
                            , function (err, cm_id) {
                                if (err) {
                                    var error = {
                                        userName: req.session.UserName,
                                        action : 'addeditmetadata',
                                        responseCode: 500,
                                        message: JSON.stringify(err.message)
                                    }
                                    wlogger.error(error); // for error
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                } else {
                                    var info = {
                                        userName: req.session.UserName,
                                        action : 'addeditmetadata',
                                        responseCode: 200,
                                        message:  "Metadata for Content type " + contenttype1 + (req.body.state.indexOf("add") > -1 ? " added" : " updated") + " successfully"
                                    }
                                    wlogger.info(info); // for information
                                    AdminLog.adminlog(connection_ikon_cms, obj.cm_title + " " + contenttype1 + req.body.state.indexOf("add") > -1 ? " added" : " updated" + " successfully. Metadata Id is " + obj.cm_id + ".", (req.body.state.indexOf("add") > -1 ? "Add " : "Update ") + contenttype, req.session.UserName, true);
                                    res.send({ success: true, message: "Metadata for Content type " + contenttype1 + (req.body.state.indexOf("add") > -1 ? " added" : " updated") + " successfully.", obj: obj, cm_id: obj.cm_id, contenttype: contenttype1 });
                                }
                            });
                    }
                });
            }
            else {
                var error = {
                    userName: "Unknown User",
                    action : 'addeditmetadata',
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
                action : 'addeditmetadata',
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
            action : 'addeditmetadata',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}
/**
 * @class
 * @classdesc get metadata detials for updating existing details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */
exports.submitmeta = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var contenttype = req.body.contenttype;
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    var currentdate = getDate();
                    async.parallel({
                        ContentMetadata: function (callback) {
                            if (req.session.UserRole == "Content Manager") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata WHERE cm_id =? and cm_state  in (1,2,3,4) and cm_property_id is not null)meta inner join(select * from icn_vendor_detail where vd_is_active=1 and vd_end_on >=  "' + currentdate + '" )vd on(vd.vd_id =meta.cm_vendor) inner join (select cm_id as propid from content_metadata where cm_is_active =1 and cm_property_id is null and cm_expires_on >= "' + currentdate + '" )prop on(prop.propid = meta.cm_property_id) left outer join (select cd_id as p_id,cd_name as p_name,cm_id as p_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Photographer"))photo on(photo.p_id = meta.cm_protographer) left outer join (select cd_id as l_id,cd_name as l_name,cm_id as l_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Location"))location on(location.l_id = meta.cm_location) inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = meta.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name = "' + contenttype + '")parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)' + vendorquery, [req.body.Id], function (err, ContentMetadata) {
                                    callback(err, ContentMetadata);
                                });
                            }
                            else {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata WHERE cm_id =? and  cm_property_id is not null)meta inner join(select * from icn_vendor_detail )vd on(vd.vd_id =meta.cm_vendor) inner join (select cm_id as propid from content_metadata where  cm_property_id is null )prop on(prop.propid = meta.cm_property_id) left outer join (select cd_id as p_id,cd_name as p_name,cm_id as p_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Photographer"))photo on(photo.p_id = meta.cm_protographer) left outer join (select cd_id as l_id,cd_name as l_name,cm_id as l_m_id from catalogue_detail ,catalogue_master where cd_cm_id = cm_id and cm_name in ("Location"))location on(location.l_id = meta.cm_location) inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = meta.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail where cd_name = "' + contenttype + '")parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)' + vendorquery, [req.body.Id], function (err, ContentMetadata) {
                                    callback(err, ContentMetadata);
                                });
                            }
                        },
                        Languages: function (callback) {
                            if (contenttype == "Text") {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name)', [req.body.Id], function (err, Languages) {
                                    callback(err, Languages);
                                });
                            }
                            else {
                                callback(null, []);
                            }
                        },
                        MasterList: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail where cd_name = ?)cd inner join(select * from catalogue_master where cm_name IN ("Content Type") ) cm on (cd.cd_cm_id = cm.cm_id )', [contenttype], function (err, MasterList) {
                                callback(err, MasterList);
                            });
                        }
                    }, function (err, results) {
                        if (err) {
                            var error = {
                                userName: req.session.UserName,
                                action: 'submitmeta',
                                responseCode: 500,
                                message: JSON.stringify(err.message)
                            }
                            wlogger.error(error); // for err
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            var info = {
                                userName: req.session.UserName,
                                action : 'submitmeta',
                                responseCode: 200,
                                message: "Metadata Retrieved successfully."
                            }
                            wlogger.info(info); // for information
                            connection_ikon_cms.release();
                            res.send(results);
                        }
                    });
                });
            }
        }
    } catch (err) {
        var error = {
            userName: "Unknown User",
            action : 'submitmeta',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);

    }
}