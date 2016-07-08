/**
 * Created by Sujata.Halwai on 01-07-2016.
 */
var crypto = require('crypto');

var self = module.exports = {
    /**
     * @desc Padding String
     * @param padString
     * @param value
     * @param length
     */
    Pad : function(padString, value, length) {
        var str = value.toString();
        while (str.length < length)
            str = padString + str;
        return str;
    },
    /**
     * @desc Get Date in dd-mm-YYYY format
     * @param val
     */
    getDate: function () {
        var d = new Date();
        var dt = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var selectdate = year + '-' + self.Pad("0", month, 2) + '-' + self.Pad("0", dt, 2);
        return selectdate;
    },
    /**
     * @desc Get Time in h:i:s format
     * @param val
     */
    getTime: function () {
        var d = new Date();
        var minite = d.getMinutes();
        var hour = d.getHours();
        var second = d.getSeconds();
        var selectdate = self.Pad("0", hour, 2) + ':' + self.Pad("0", minite, 2) + ':' + self.Pad("0", second, 2);
        return selectdate;
    },
    /**
     * @desc Set given date as Format dd-mon-yyyy
     */
    setDate: function (val) {
        if (val) {
            var d = new Date(val);
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            //var selectdate = self.Pad("0", dt, 2) + '-' + self.Pad("0", month, 2) + '-' + year;
        }else{
            var d = new Date();
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            //var selectdate = self.Pad("0", dt, 2)+ '-' + self.Pad("0", month, 2) + '-' + year  ;
        }
        var date = self.Pad("0", dt, 2);
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
    },
    /**
     * @desc  Set Given Date Formatted as dd-mm-yyyy
     * @param val
     * @returns {string}
     */
    setMDate: function (val) {
        if (val) {
            var d = new Date(val);
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            var selectdate = self.Pad("0", dt, 2) + '-' + self.Pad("0", month, 2) + '-' + year;
            return selectdate;
        }else{
            var d = new Date();
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            var selectdate = self.Pad("0", dt, 2)+ '-' + self.Pad("0", month, 2) + '-' + year  ;
            return selectdate;
        }
    },
    /**
     * @desc  Set Given Date Formatted as h:i:s
     * @param val
     * @returns {string}
     */
    setTime: function (val) {
        if (val) {
            var d = new Date(val);
            var minite = d.getMinutes();
            var hour = d.getHours();
            var second = d.getSeconds();
            var selectdate = self.Pad("0", hour, 2) + ':' + self.Pad("0", minite, 2) + ':' + self.Pad("0", second, 2);
            return selectdate;
        }else{
            var d = new Date();
            var minite = d.getMinutes();
            var hour = d.getHours();
            var second = d.getSeconds();
            var selectdate = self.Pad("0", hour, 2) + ':' + self.Pad("0", minite, 2) + ':' + self.Pad("0", second, 2);
            return selectdate;
        }
    },

    /**
     * @desc Get Formatted Login Date eg. dd-mm-yyyy
     * @param text
     * @returns {String}
     */
    getLoginDate: function (val) {
        if (val) {
            var d = new Date(val);
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            var selectdate = self.Pad("0", dt, 2) + '/' + self.Pad("0", month, 2) + '/' + year.toString().substring(2);
            return selectdate;
        }
        else {
            var d = new Date();
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            //var selectdate = year + '-' + self.Pad("0", month, 2) + '-' + self.Pad("0", dt, 2);
            var selectdate = self.Pad("0", dt, 2) + '/' + self.Pad("0", month, 2) + '/' + year.toString().substring(2);
            return selectdate;
        }
    },
    /**
     * @desc  Set Formatted Mysql Date
     * @returns {string}
     */
    setDBDate: function (val) {
        if (val) {
            var d = new Date(val);
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            var selectdate = year + '-' + self.Pad("0", month, 2)  + '-' + self.Pad("0", dt, 2) ;
            return selectdate;
        } else {
            var d = new Date();
            var dt = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
           // var selectdate = self.Pad("0", dt, 2)+ '-' + self.Pad("0", month, 2) + '-' + year  ;
            var selectdate = year + '-' + self.Pad("0", month, 2)  + '-' + self.Pad("0", dt, 2) ;
            return selectdate;
        }
    },
    /**
     * @desc Format Date as datetime
     */
    formatter: function () {
        var d = new Date();
        //var date = self.setDate(d);
        var date = self.setMDate(d);
        var time = self.setTime(d);
        var logMessage = date +" "+ time ;
        return logMessage;
    },
    /**
     * @desc Encrypt String from UTF8 To Hex
     * @param text
     * @returns {String}
     */
    encrypt: function (text){
        var cipher = crypto.createCipher(algorithm, password)
        var crypted = cipher.update(text,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    },

    /**
     * @desc Decrypt String from hex To UTF8
     * @param text
     * @returns {String}
     */
    decrypt: function (text){
        var decipher = crypto.createDecipher(algorithm,password)
        var dec = decipher.update(text,'hex','utf8')
        dec += decipher.final('utf8');
        return dec;
    },

    /**
     * Get Content Type
     * @param state
     * @returns {{contenttype: string, contenttype1: string}}
     * @constructor
     */
    GetContentType: function (state) {
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
    },
    /**
     *@desc  Get Timestamp from Mysql Time format
     * @param str
     * @returns {String}
     */
    toSeconds: function (str) {
        if (str) {
            var pieces = str.split(":");
            var result = Number(pieces[0]) * 60 + Number(pieces[1]);
            return (result.toFixed(3));
        }
        return str;
    }
}