var moment = require("moment");
var nodemailer = require('nodemailer');

var Mailer = function(app) {
	var self = this;
	var config = app.get('config');
	var emailConf = config.email;

	function getFullDate(d) {
		return d.format("YYYY-MM-DD HH:mm:ss");
	}

	this.sendNotify = function(log) {
		if(!emailConf.notify)
			return false;
		
		var title = "StockAlert daily log";
		var msg = '<b>StockAlert - daily log for '+getFullDate(moment())+"</b>";

		msg += '<br /><br />';
		msg += log;

		console.log('Sending daily log by email');
		return self.send(title, msg, null, true);
	};

	this.send = function(title, text, email, isHtml) {
		email = email || emailConf.email;
		if(!emailConf.enabled)
			return false;

		transport = nodemailer.createTransport();
		var mailConfig = {  //email options
			from: emailConf.from, // sender address.  Must be the same as authenticated user if using Gmail.
			to: email, // receiver
			subject: title,
			text: text,
		};

		if(isHtml) mailConfig.html = text;
		else mailConfig.text = text;

		transport.sendMail(mailConfig, function(err, res){  //callback
			if(err){
			   console.error(err);
			}
		});

		return true;
	};

	this.sendStartMessage = function() {
		var title = "StockAlert was stared";
		var msg = 'StockAlert bot was started at '+getFullDate(moment());

		console.log('Sending welcome email');
		self.send(title, msg);
	};

	this.sendStartMessage();
	return this;
};


module.exports = function(app) {
	return new Mailer(app);
};

