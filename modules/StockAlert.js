var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var Indicators = require('./Indicators');
var scheduler = require("./Scheduler");
var hist = require("./HistYahoo");
var log = require('log4js').getLogger('StockAlert'); 

/**
 * Constants
 */
var PRICE_TYPE = 'adjClose';

var StockAlert = function(app) {
	this.mailer = app.mailer;

	var self = this;
	var scheduleMorningHour = 3;
	
	var stocks = null;
	var indicators = null;
	var indicatorsMax = null;
	var config = null;

	var timeTriggers = [
		"9:30",
		"15:00"
	];

	this.setConfig = function(indicators, config) {
		var indicatorsMax = [];

		self.stocks = Object.keys(config);
		self.indicators = indicators;
		self.config = config;

		Object.keys(indicators).forEach(function(ind) {
			 indicatorsMax.push(Math.max.apply(null, indicators[ind]));
		});

		self.indicatorsMax = Math.max.apply(null, indicatorsMax);

		log.info('Will process these stock conditions\n', config);
		log.info('Will load these indicators', indicators);
		log.info('Will load', self.indicatorsMax, 'data for every stock');
	};

	this.init = function() {
		log.info("Starting StockAlert");
	};

	this.formatDate = function(date) {
		return date.format('YYYY-MM-DD');
	};

	this.addWeekendsOffset = function(count) {
		return Math.ceil(count / 5 * 7) + 10;
	};

	this.joinHistoricAndCurrentData = function(hist, curr) {
		curr.forEach(function(item) {

			var row = {
				date: moment().format(),
				symbol: item[0]
			};

			row.open = row.high = row.low = row.close = row.adjClose = item[1];
			hist[item[0]].push(row);
		});

		return hist;
	};

	this.getStockHistory = function(done) {
		var to = moment().subtract(1, 'days');
		var from = moment().subtract(self.addWeekendsOffset(self.indicatorsMax), 'days');

		var conf = {
			from: self.formatDate(from),
			to: self.formatDate(to),
			symbols: self.stocks
		};

		stock = self.stocks.join(',');

		async.parallel({
			hist: hist.historical.bind(hist, conf),
			current: hist.actual.bind(hist, stock)
		}, function(err, res) {
			if(err) return done(err);
			done(null, self.joinHistoricAndCurrentData(res.hist, res.current));
		});	
	};

	this.processIndicators= function(data, done) {
		var indicators = {};
		var inds = Object.keys(self.indicators);

		self.stocks.forEach(function(stock) {
			var stockData = data[stock];

			indicators[stock] = {
				symbol: stock,
				PRICE: stockData[stockData.length -1][PRICE_TYPE]
			};

			inds.forEach(function(ind) {
				
				self.indicators[ind].forEach(function(len) {
					var res = Indicators[ind.toLowerCase()](len, stockData, PRICE_TYPE);
					indicators[stock][ind+'('+len+')'] = res;
					
					log.info('Processing %s: %s(%d) = %d', stock, ind, len, res);
				});
			});
		});

		done(null, {data, indicators});
	};

	this.processConditions = function(info, done) {
		var output = {
			valid: [],
			invalid: []
		};

		self.stocks.forEach(function(stock) {
			var conditions = Object.keys(self.config[stock]);

			conditions.forEach(function(condKey) {
				var condExec = self.config[stock][condKey];
				var cond = self.config[stock][condKey];

				_.each(info.indicators[stock], function(value, key) {
        			condExec = condExec.replace(new RegExp(key.replace('(', '\\(').replace(')', '\\)'), 'g'), value);
    			});

				// now the evil comes
				var result = eval(condExec);
				output[result ? 'valid' : 'invalid'].push({stock, condKey, cond, condExec, result});
			});
		});

		info.res = output;
		log.info('Processed output', output);
		done(null, info)
	};

	this.printCondOutputToEmail = function(obj) {
		var str = ' > <b>'+obj.stock+':'+obj.condKey+'</b>';
		str += "<br />\n";
		str += ' > Condition: '+obj.cond;
		str += "<br />\n";
		str += ' > Translated: '+obj.condExec;
		str += "<br />\n";
		// str += ' == Is '+(obj.result ? 'valid' : 'invalid')+' == ';
		return str;
	};

	this.sendNotification = function(info, done) {
		var msg = '';
		var sep = '<br />\n'
		info.notify = false;

		if(info.res.valid.length) {

			msg += '<b>Valid conditions:</b>'
			msg += "<br />\n";
			msg += info.res.valid.map(self.printCondOutputToEmail).join(sep);

			if(info.res.invalid.length) {
				msg += "<br />\n";
				msg += "<br />\n";
				msg += '<b>Invalid conditions:</b>'
				msg += "<br />\n";
				msg += info.res.invalid.map(self.printCondOutputToEmail).join(sep);
			}
		}

		if(msg) {
			info.notify = self.mailer.sendNotify(msg);
		}
		done(null, info);
	};

	this.processAlertCheck = function() {
		log.info('Processing check for tickers');
		
		async.waterfall([
			self.getStockHistory,
			self.processIndicators,
			self.processConditions,
			self.sendNotification
		], function(err, res) {
			if(err) return log.error(err);

			console.log('Result notify: ', res.notify);
		});
	};

	this.scheduleToday = function() {
		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return log.info("Today is weekday - strategy will continue on monday");
		
		timeTriggers.forEach(function(time) {
			var triggerTime = moment(time, "HH:mm");

			if(moment().isBefore(triggerTime)) {
				scheduler.today(triggerTime.format('HH:mm'), self.processAlertCheck);
			}
		});
	};

	this.start = function() {

		scheduler.everyWorkweekHour(3, self.scheduleToday);

		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return log.info("Today is weekend - strategy will continue on monday");
		if(moment().hour() < scheduleMorningHour)
			return log.info("Strategy will be scheduled at", scheduleMorningHour);

		self.scheduleToday();
	};

	this.init();
	return this;
};

module.exports = function(app) {
	return new StockAlert(app);
};