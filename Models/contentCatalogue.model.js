/**
 * Created by sujata.patne on 21-03-2016.
 */
/**
 * @class
 * @classdesc get operator and country for given display name.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getOperatorCountry = function(dbConnection,display_name,callback){
    dbConnection.query('SELECT * FROM operator_country where display_name = ? ',[display_name], function (err, result) {
        callback(err,result);
    });
}

/**
 * @class
 * @classdesc check vcode exist for given country and childid.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.isVcodeExist = function(dbConnection, data, callback){
    dbConnection.query('SELECT * FROM vcode_operator WHERE content_file_cf_id = ? AND operator_country_id = ? ', [data.content_file_cf_id,data.operator_country_id],
        function (err, result) {
            if(err){
                console.log(err)
            }else{
                if(result.length > 0){
                    callback(err,result[0].id);
                }else{
                    callback(err,false);
                }
            }
        });
}
/**
 * @class
 * @classdesc get max id of vode/promocode table.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.getMaxVOId = function(dbConnection,callback){
    dbConnection.query('SELECT max(id) as id FROM vcode_operator ', function (err, result) {
        if(result.length > 0 && result[0].id != null){
            callback(err,result[0].id);
        }else{
            callback(err,0);
        }
    });
}
/**
 * @class
 * @classdesc insert vcode.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.insertVcode = function( dbConnection, vcodeData, callback ) {
    dbConnection.query('INSERT INTO vcode_operator SET ?', vcodeData,
        function (err, result) {
            callback( err, result )
        }
    );
}
/**
 * @class
 * @classdesc update vcode.
 * @param {object} req - http requset object.
 * @param {object} res - http response object.
 */

exports.updateVcode = function( dbConnection, vcodeData, callback ) {
    dbConnection.query('UPDATE vcode_operator SET ? ' +
        'WHERE content_file_cf_id = ? AND operator_country_id = ? ', [ vcodeData,vcodeData.content_file_cf_id, vcodeData.operator_country_id],
        function (err, result) {
            callback( err, result );
        }
    );
}