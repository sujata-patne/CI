/**
 * @name Datewithouttime
 * @param val
 * @returns {Date}
 * @constructor
 * @desc date convert in 00:00:00 format
 */
function Datewithouttime(val) {
    var d = new Date(val);
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
    return new Date(selectdate);
}
/**
 * @name Pad
 * @param padString
 * @param value
 * @param length
 * @returns {*}
 * @constructor
 * @desc Date convert into two digit
 */
function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}
/**
 *
 * @param second
 * @returns {String}
 */
function toMinites(second) {
    if (second) {
        var sec_num = parseInt(second, 10); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        var time = minutes + ':' + seconds;
        // var time = hours + ':' + minutes + ':' + seconds;
        return time;
    }
    return second;
}
/**
 *
 * @param str
 * @returns {Number}
 */
function toSeconds(str) {
    if (str) {
        var pieces = str.split(":");
        var result = Number(pieces[0]) * 60 + Number(pieces[1]);
        return (result.toFixed(3));
    }
    return str;
}
/**
 *
 * @param data
 * @constructor
 * @desc HighChart For File Status
 */
function HighchartBind(data) {
    // Build the chart
    $('#high-charts').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: ''
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: true
            }
        },
        credits: {
            enabled: false
        },
        series: [data]
    });
}
/**
 *
 * @param val
 * @returns {String}
 */
function setDate(val) {
    var d = new Date(val);
    var date = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate;
    if (month == 1) {
        selectdate = date + '-Jan-' + year;
    } else if (month == 2) {
        selectdate = date + '-Feb-' + year;
    } else if (month == 3) {
        selectdate = date + '-Mar-' + year;
    } else if (month == 4) {
        selectdate = date + '-Apr-' + year;
    } else if (month == 5) {
        selectdate = date + '-May-' + year;
    } else if (month == 6) {
        selectdate = date + '-Jun-' + year;
    } else if (month == 7) {
        selectdate = date + '-Jul-' + year;
    } else if (month == 8) {
        selectdate = date + '-Aug-' + year;
    } else if (month == 9) {
        selectdate = date + '-Sep-' + year;
    } else if (month == 10) {
        selectdate = date + '-Oct-' + year;
    } else if (month == 11) {
        selectdate = date + '-Nov-' + year;
    } else if (month == 12) {
        selectdate = date + '-Dec-' + year;
    }
    return selectdate;
}
/**
 *
 * @param val
 * @returns {string}
 */
function getDate(val) {
    var d = new Date(val);
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = Pad("0", month, 2) + '-' + Pad("0", dt, 2) + '-' + year;
    return selectdate;
}
/**
 *
 * @param val
 * @returns {string}
 */
function getTime(val) {
    var d = new Date(val);
    var minite = d.getMinutes();
    var hour = d.getHours();
    var second = d.getSeconds();
    var selectdate = Pad("0", hour, 2) + ':' + Pad("0", minite, 2) + ':' + Pad("0", second, 2);
    return selectdate;
}
/**
 *
 * @param data
 * @param colLength
 * @returns {Array}
 * @constructor
 */
function BindMasterList(data, colLength) {
    var result = [], row;
    if (typeof (colLength) === 'undefined') colLength = 3;
    for (var i = 0, j = data.length; i < j; i++) {
        if (i % colLength === 0) {
            if (row) {
                result.push(row);
            }
            row = [];
        }
        row.push(data[i]);
    }
    if (row) {
        result.push(row);
    }
    return result;
};
/**
 *
 * @param data
 * @returns {{cols: Array, rows: Array}}
 * @constructor
 */
function ExportExcel(data) {
    var exportdata = { cols: [], rows: [] };
    var keys = Object.keys(data[0]);
    exportdata.cols.push({
        caption: 'Sr No.',
        captionStyleIndex: 1,
        type: 'number',
        width: 5
    });
    _.each(keys, function (key) {
        //exportdata.cols.push({ caption: key, type: 'number', width: 30 });

        if(key == 'MetadataId' || key == 'ChildId' || key == 'ContentId'){
            exportdata.cols.push({ caption: key, type: 'number', width: 30 });
        }else{
            exportdata.cols.push({ caption: key, type: 'string', width: 30 });
        }
    })
    var cnt = 1;
    _.each(data, function (val) {
        var array = [];
        array.push(cnt);
        _.each(keys, function (key) {
            array.push(val[key]);
        })
        exportdata.rows.push(array);
        cnt++;
    });
    return exportdata;
}
/**
 *
 * @param data
 * @returns {Array}
 * @constructor
 */
function ExportExcelNew(data) {
    var exportdata = [];
    var keys = Object.keys(data[0]);
    var cols = []; //
    _.each(keys, function (key) {
        cols.push(key);
    })
    exportdata.push(cols);

    var cnt = 1;
    _.each(data, function (val) {
        var rows = [];
    //    rows.push(cnt);
        _.each(keys, function (key) {
            rows.push(val[key]);
        })
        exportdata.push(rows);
        cnt++;
    });
  //  console.log(exportdata)
    return exportdata;
}
/**
 *
 * @param data
 * @returns {{cols: Array, rows: Array}}
 * @constructor
 */
function ExportExcelVcodePromocode(data) {
    var exportdata = { cols: [], rows: [] };
    var keys = Object.keys(data[0]);
    /*exportdata.cols.push({
        caption: 'Sr No.',
        captionStyleIndex: 1,
        type: 'number',
        width: 5
    });*/
    _.each(keys, function (key) {
        //exportdata.cols.push({ caption: key, type: 'number', width: 30 });

        if(key == 'MetadataId' || key == 'ChildId' || key == 'ContentId'){
            exportdata.cols.push({ caption: key, type: 'number', width: 30 });
        }else{
            exportdata.cols.push({ caption: key, type: 'string', width: 30 });
        }
    })
    var cnt = 1;
    _.each(data, function (val) {
        var array = [];
        //array.push(cnt);
        _.each(keys, function (key) {
            array.push(val[key]);
        })
        exportdata.rows.push(array);
        cnt++;
    });
    return exportdata;
}
/**
 * @desc Get file Extension
 * @param filename
 * @returns {String}
 */
function getExtension(filename) {
    var parts = filename.split('.');
    return parts[parts.length - 1];
}

/**
 * @desc Validate Image File
 * @param filename
 * @returns {Boolean}
 */
function isImage(filename) {
    var ext = getExtension(filename);
    switch (ext.toLowerCase()) {
        case 'jpg':
        case 'gif':
        case 'bmp':
        case 'png':
            //etc
            return true;
    }
    return false;
}
/**
 * @desc Validate Video file
 * @param filename
 * @returns {Boolean}
 */
function isVideo(filename) {
    var ext = getExtension(filename);
    switch (ext.toLowerCase()) {
        case 'm4v':
        case 'avi':
        case 'mpg':
        case 'mp4':
            // etc
            return true;
    }
    return false;
}

/**
 * @desc Validate Text file
 * @param filename
 * @returns {boolean}
 */
function isText(filename) {
    var ext = getExtension(filename);
    //if (getExtension(val.name).toLowerCase() == "txt" || getExtension(val.name).toLowerCase() == "json" || getExtension(val.name).toLowerCase() == "xml") {
    switch (ext.toLowerCase()) {
        case 'txt':
        case 'json':
        case 'xml':
            return true;
    }
    return false;
}