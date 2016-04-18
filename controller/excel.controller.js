
var AdminLog = require('../models/AdminLog');
var XLSX = require('xlsx');
var fs = require('fs');
var wlogger = require("../config/logger");

var nodeExcel = require('excel-export');
var http = require('http');
var config = require('../config')();

exports.exportVcode = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var ws_name = "SheetJS";
                var data = req.body.data;
                /* set up workbook objects -- some of these will not be required in the future */
                var wb = {}
                wb.Sheets = {};
                wb.Props = {};
                wb.SSF = {};
                wb.SheetNames = [];
                var save_path = config.site_audio_path + req.body.FileName;
                var new_path =  config.site_base_path + save_path;
                /* create worksheet: */
                var ws = {}
                /* the range object is used to keep track of the range of the sheet */
                var range = {s: {c:0, r:0}, e: {c:0, r:0 }};
                /* Iterate through each element in the structure */
                for(var R = 0; R != data.length; ++R) {
                    if(range.e.r < R) range.e.r = R;
                    for(var C = 0; C != data[R].length; ++C) {
                        if(range.e.c < C) range.e.c = C;
                        /* create cell object: .v is the actual data */
                        var cell = { v: data[R][C] };
                        if(cell.v == null) continue;
                        /* create the correct cell reference */
                        var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
                        /* determine the cell type */
                        if(typeof cell.v === 'number') cell.t = 'n';
                        else if(typeof cell.v === 'boolean') cell.t = 'b';
                        else cell.t = 's';
                        /* add to structure */
                        ws[cell_ref] = cell;
                    }
                }
                ws['!ref'] = XLSX.utils.encode_range(range);
                /* add worksheet to workbook */
                wb.SheetNames.push(ws_name);
                wb.Sheets[ws_name] = ws;
                /* write file */
                var result = XLSX.writeFile(wb, new_path);
                var workbook = XLSX.readFile(new_path, {type: 'binary'});
                var stat = fs.statSync(new_path);
                var fileToSend = fs.readFileSync(new_path);
                var info = {
                    userName: req.session.UserName,
                    action : 'exportVcode',
                    responseCode: 200,
                    message: "Vcode Exported successfully."
                }
                wlogger.info(info); // for information

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8');
                res.setHeader("Content-Disposition", req.body.FileName);
                res.end(fileToSend);
            }
            else {
                var error = {
                    userName: 'Unknown User',
                    action : 'exportVcode',
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
                action : 'exportVcode',
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
            action : 'exportVcode',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.exportexcel = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var result = nodeExcel.execute(req.body.data);
                var info = {
                    userName: req.session.UserName,
                    action : 'exportexcel',
                    responseCode: 200,
                    message: "Excel Exported successfully."
                }
                wlogger.info(info); // for error
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + req.body.FileName + ".xlsx");
                res.end(result, 'binary');
            }
            else {
                var error = {
                    userName: 'Unknown User',
                    action : 'exportexcel',
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
                action : 'exportexcel',
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
            action : 'exportexcel',
            responseCode: 500,
            message: JSON.stringify(err.message)
        }
        wlogger.error(error); // for error
        res.status(500).json(err.message);
    }
}

exports.pdf = function (req, res) {
    var url = "public/help/help.pdf";
    res.download(url);
};
 

