/**
 * @class
 * @classdesc get parent content type list.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getAllContentTypes = function( dbConnection, callback ) {
	dbConnection.query( "SELECT "+
							"cd.cd_id, "+
							"cd.cd_name, "+
							"cm.cm_name "+
						 "FROM "+
							"catalogue_detail cd "+
						 "JOIN "+
						    "catalogue_master cm on ( cd.cd_cm_id = cm.cm_id ) "+
						 "WHERE "+
						    "cm.cm_name IN ('Content Type')", 
		function( err, contentTypes ) {
			callback( err, contentTypes );
		}
	);
}
/**
 * @class
 * @classdesc get all templates list for imagery.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getAllTemplates = function( dbConnection, callback ) {
	dbConnection.query( "SELECT "+
						  "ct.ct_group_id, "+
						  "ct1.ct_param  as width, "+
						  "ct.ct_param as height  "+
						"FROM "+
						  "content_template as ct "+
						"JOIN "+
						  "content_template as ct1 ON (ct1.ct_group_id = ct.ct_group_id AND ct.ct_param_value = 'height' AND ct1.ct_param_value = 'width')", 
		function( err, contentTemplates ) {
			callback( err, contentTemplates );
		}
	);
}
/**
 * @class
 * @classdesc get all templates list for supporting and preview files.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getOtherTemplates = function( dbConnection, callback ) {
	dbConnection.query( "SELECT " +
							" * " +
						"FROM "+
							"content_template "+
						 "WHERE " +
						 	"ct_param_value IN ('bitrate','otherimage','otheraudio','othervideo','app','utf 16') ",
		function( err, otherTemplates ) {
			callback( err, otherTemplates );
		}
	);
}
/**
 * @class
 * @classdesc get handeset devide group details.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getAllHandsetDeviceGroups = function( dbConnection, callback ) {
	dbConnection.query( "SELECT "+
							"gp.chgr_group_id, "+
							"gd.chg_handset_id, "+
							"gp.chgr_group_name, "+
							"gp.chgr_group_desc "+
						"FROM "+
							"content_handset_group_reference gp "+
						"JOIN "+
							"content_handset_group gd on(gp.chgr_group_id = gd.chg_chgr_group_id) ", 
		function( err, handsetDeviceGroups ) {
			callback( err, handsetDeviceGroups );
		}
	);
}