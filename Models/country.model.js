/**
 * Created by sujata.patne on 29-12-2015.
 */
/**
 * @class
 * @classdesc get country rights details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getCountryRights = function( dbConnection, callback ) {
    var query = dbConnection.query('select distinct cd_id,cd_name from (select CASE  WHEN groupid is null THEN icn_cnt_name ELSE country_name  END AS country_name, ' +
        'CASE  WHEN groupid is null THEN icn_cnt ELSE countryid  END AS country_id,groupid from (SELECT cd_id as icn_cnt,cd_name as icn_cnt_name ,cd_cm_id as icn_cd_cm_id FROM catalogue_detail)cd ' +
        'inner join(select cm_id as icn_cm_id,cm_name as icn_cm_name from catalogue_master where cm_name in("icon_geo_location") )cm on(cm.icn_cm_id = cd.icn_cd_cm_id) left outer join (select cm_id as groupid,cm_name as groupname from catalogue_master )master on(master.groupname = cd.icn_cnt_name) ' +
        'left outer join (select cd_id as countryid,cd_name as country_name,cd_cm_id as m_groupid from catalogue_detail)mastercnt on(master.groupid =mastercnt.m_groupid))country '+
        'left join (select icc_country_name as cd_name, icc_country_id as cd_id from icn_country_currency) AS g_cd  on(g_cd.cd_name =country.country_name)', function (err, CountryRights) {
        callback(err, CountryRights);
    });
}
/**
 * @class
 * @classdesc get country group details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getCountryGroups = function( dbConnection, callback ) {
    dbConnection.query('select cm_group.cm_id,cm_group.cm_name, g_cd.cd_id as cd_id, cd_group.cd_name as cd_name ' +
        'from catalogue_detail as cd ' +
        'inner join catalogue_master as cm on(cm.cm_id = cd.cd_cm_id) ' +
        'inner join catalogue_master as cm_group on(cm_group.cm_name = cd.cd_name) ' +
        'inner join catalogue_detail as cd_group on(cd_group.cd_cm_id = cm_group.cm_id)' +
        'left join (select icc_country_name as country_name, icc_country_id as cd_id from icn_country_currency) AS g_cd on(g_cd.country_name =cd_group.cd_name) ' +
        'where cm.cm_name in("country_group") ', function (err, IconGroupCountry) {
        callback(err, IconGroupCountry);
    });
}
/**
 * @class
 * @classdesc get list of all iCON country list.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getIconCountry = function( dbConnection, callback ) {
    dbConnection.query('select case when groupname is null then icc_country_name ELSE cd.cd_name END AS cd_name, '+
            'case when groupname is null then icc_country_id ELSE cd.cd_id END AS cd_id, '+
            'case when groupname is null  then  null ELSE "group"  END AS group_status '+
            'from catalogue_master as cm '+
            'right join catalogue_detail as cd ON cm.cm_id = cd.cd_cm_id '+
            'left join icn_country_currency AS g_cd on(g_cd.icc_country_name =cd.cd_name) '+
            'left join (select cm_name as groupname from catalogue_master)cm_group on(cm_group.groupname =  cd.cd_name) '+
            'WHERE cm.cm_name in("icon_geo_location")',
        function (err, IconCountry) {
            callback(err, IconCountry );
        }
    );
}