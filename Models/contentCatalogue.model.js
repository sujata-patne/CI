/**
 * Created by sujata.patne on 21-03-2016.
 */

exports.getOperatorCountry = function(dbConnection,display_name,callback){
    dbConnection.query('SELECT * FROM operator_country where display_name = ? ',[display_name], function (err, result) {
        callback(err,result);
    });
}


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

exports.getMaxVOId = function(dbConnection,callback){
    dbConnection.query('SELECT max(id) as id FROM vcode_operator ', function (err, result) {
        if(result.length > 0 && result[0].id != null){
            callback(err,result[0].id);
        }else{
            callback(err,0);
        }
    });
}

exports.insertVcode = function( dbConnection, vcodeData, callback ) {
    dbConnection.query('INSERT INTO vcode_operator SET ?', vcodeData,
        function (err, result) {
            callback( err, result )
        }
    );
}

exports.updateVcode = function( dbConnection, vcodeData, callback ) {
    dbConnection.query('UPDATE vcode_operator SET ? ' +
        'WHERE content_file_cf_id = ? AND operator_country_id = ? ', [ vcodeData,vcodeData.content_file_cf_id, vcodeData.operator_country_id],
        function (err, result) {
            callback( err, result );
        }
    );
}