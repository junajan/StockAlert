/**
 * This code written in node.js will every day in workweek check on given indexes their SMA(N) with closePrice
 * and if difference will cross threshold it will send email / sms
 *
 * For instalation:
 *  - get node.js & npm
 *  - npm install
 *  - npm start
 *
 * Or run it forever with:
 *  - forever start app.js
 */

var schedule = require('node-schedule');
var yahooFinance = require('yahoo-finance');
var nodemailer = require('nodemailer');
var async = require('async');
var colors = require('colors');

// var toEmail = '721123456@sms.cz.o2.com'; // FOR O2 users it is possible to send SMS via emails
var toEmail = 'some@email.tld';
var fromEmail = 's@t.c';
var emailTitle = "";
var treshold = 4;
var decPrecision = 2;
var today;

var fetch = {
	"SPY": [100],
	"DIA": [100],
	"VTI": [100],
};
/**
 * 2.12.2014 - output will be:
 * SPY:100=3.76;VTI:100=3.34
 * SMA(SPY, 100) is 3.76% below closePrice 
 */

// ========================================
// ======= COMMON FUNCTIONS ===============
// ========================================

/**
 * Get date in requested format - eg. 2014-12-24
 */
function getDateFormat(date) {
	return date.getFullYear()+'-'+('0'+ (parseInt(date.getMonth())+1)).slice(-2)+'-'+ ('0'+date.getDate()).slice(-2);
}

/**
 * Serialize result to readable format in SMS
 * SPY:100=4;SPY:200=6;DIA:100=4;DIA:200=6;VTI:100=3;VTI:200=5
 */
function serializeResult(res, maxDiff) {
	var out = [];

	res.forEach(function(arr) {
		arr.forEach(function(resItem) {
			var diff = getPercentChange(resItem.lastClose, resItem.sma);
			
			// add to result only reuslts which will cross treshold
			if(diff < maxDiff)
				out.push(resItem.ticker+":"+resItem.len+"="+diff);
		});
	});
	return out.join(";");
}

/**
 * Send email with given config from global variables
 */
function sendEmail(res) {
	console.timeLog("Sending email..".yellow, res);

	var transporter = nodemailer.createTransport();
	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: emailTitle,
		text: res
	});
}

/**
 * Logging function with prepended time
 */
console.timeLog = function() {
	var t = function() {

		d = new Date();

		hour = ("0" + d.getHours()).slice(-2);
		min = ("0" + d.getMinutes()).slice(-2);
		sec = ("0" + d.getSeconds()).slice(-2);
		milli = (d.getMilliseconds() + "000").substring(0, 3);

		return "[" + hour + ":" + min + ":" + sec + "." + milli + "] ";
	};

	arguments[0] = t().green+arguments[0];
	console.log.apply(this, arguments);
};

/**
 * Download history from YAHOO finance API
 */
function downloadHistory(index, today, minDate, done) {

	var fromDate = getDateFormat(minDate);
	var toDate = getDateFormat(today);

	console.timeLog("Downloading history for "+ index+ " from -> "+ fromDate +" to -> "+ toDate);

	yahooFinance.historical({
		symbol: index,
		from: fromDate,
		to: toDate,
		period: 'd'
	}, function (err, quotes) {
		if(err)
			return done(err, 0);
		
		console.timeLog("Downloaded "+ quotes.length + " entries for index ", index);
		done(null, quotes);
	});
}

// ========================================
// ========= MATH FORMULAS ================
// ========================================

/**
 * Get percentual change new from old value
 */
function getPercentChange(n, o) {
	return parseFloat((n - o) / o * 100).toFixed(decPrecision);
}

/**
 * Count SMA from given history & and requested len
 */
function getSma(arr, l) {
	var sum = 0;
	var len = arr.length;

	if(l < 1 || len < l)
		return false;

	for(var i = len - 1; i >= len-l; i--)
		sum += arr[i].close;

	return sum / l;
}


// ========================================
// ========== MAIN PROCESS ================
// ========================================

/**
 * This will process one index and return object result info (sma, ticker, lastClose, ..)
 */
function processIndex(index, done) {
	var p = fetch[index];

	// get 200 work days => 200/5 * 7 = 280 days (with saturday, sunday)
	var max = Math.max.apply(Math,p);
	max += 30;	// add more to cover feasts
	max = 7 * Math.ceil( max / 5 );

	// get min date - X days back
	var minDate = new Date();
	minDate.setDate(today.getDate() - max);

	// download history from yahoo stocks API
	downloadHistory(index, today, minDate, function(err, history) {
		var res = [];
		if(err)
			return done(err, 0);
		
		// for all configurations count SMA and return result 
		for(var c in p) {
			res.push({
				sma: getSma(history, p[c]),
				ticker: index,
				len: p[c],
				lastClose: history[history.length - 1].close
			});
		}

		done(null, res);
	});
}

// Serialize all results and send to email
function processResult(err, res) {
	var resSerialized;

	console.timeLog("Fetched data..".yellow);
	if(err)
		return console.timeLog("Error: ".red, err, res);

	resSerialized = serializeResult(res, treshold);
	resSerialized && sendEmail(resSerialized);

	console.timeEnd("Process ends");
}

/**
 * Process task 
 * - for each index download history
 * - count requested SMA
 * - and send in usable format to email
 */
function processScheduled() {
	// getting history data from today
	today = new Date();
	
	console.timeLog("Processing: ".yellow, fetch);
	console.time("Process ends"); // measure time
	async.map(Object.keys(fetch), processIndex, processResult);
}

// schedule processing like in cron 
processScheduled();
var j = schedule.scheduleJob('59 21 * * 1-5', processScheduled);
