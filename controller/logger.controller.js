var fs = require('fs');
// Write the message into log file //

exports.writeLog = function (p1) {
	fs.appendFile('logs/log_input_'+new Date().getDate()+'.txt', '\n\r' + p1,  function(err) {
	   if (err) {
			console.log(err);
		   	return console.error(err);
	   }
	});
    return true;
};