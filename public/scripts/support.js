
// date convert in 00:00:00 format 
function Datewithouttime(val) {
    var d = new Date(val);
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
    return new Date(selectdate);
}

// Date convert into two digit 
function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}
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
function toSeconds(str) {
    if (str) {
        var pieces = str.split(":");
        var result = Number(pieces[0]) * 60 + Number(pieces[1]);
        return (result.toFixed(3));
    }
    return str;
}



//HighChart For File Status
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

function getDate(val) {
    var d = new Date(val);
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = Pad("0", month, 2) + '-' + Pad("0", dt, 2) + '-' + year;
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

function BindMasterList(data, colLength) {
    var result = [],
          row;
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

        if(key == 'MetadataId' || key == 'ChildId'){
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