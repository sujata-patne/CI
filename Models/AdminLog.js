exports.adminlog = function (dbConnection, Message, Action, UserName, Isrelease) {
    var query = dbConnection.query('SELECT MAX(ald_id) AS id FROM icn_admin_log_detail', function (err, result) {
        if (err) {
            if (Isrelease) {
                dbConnection.release();
            }
            return { "success": false, message: err.message };
        }
        else {
            var data = {
                ald_id: result[0].id != null ? (parseInt(result[0].id) + 1) : 1,
                ald_message: Message,
                ald_action: Action,
                ald_created_on: new Date(),
                ald_created_by: UserName,
                ald_modified_on: new Date(),
                ald_modified_by: UserName,
                ald_crud_isactive :1
            };
            var query = dbConnection.query('INSERT INTO icn_admin_log_detail SET ?', data, function (err, result) {
                if (err) {
                    if (Isrelease) {
                        dbConnection.release();
                    }
                    return { "success": false, message: err.message };
                }
                else {
                    if (Isrelease) {
                        dbConnection.release();
                    }
                    return { "success": true, message: "admin log created successfully." };
                }
            });
        }
    });
}

