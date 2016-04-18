/**
 * Created by sujata.patne on 17-02-2016.
 */
exports.existMetadataFile = function(dbConnection,cmId,metaId,callback){
    //console.log('SELECT MAX(cf_name_alias) AS maxChildId FROM content_files where cf_cm_id = '+cmId+' AND cf_template_id = '+metaId );

    dbConnection.query('SELECT MAX(cf_name_alias) AS maxChildId FROM content_files where cf_cm_id = ? AND cf_template_id = ? ',[cmId,metaId], function (err, result) {
        if(result && result[0].maxChildId != null){

            callback(err,result[0].maxChildId);
        }else{
            callback(err,false);
        }
    });
}
