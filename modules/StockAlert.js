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

		var res = { 
			UPRO: 
		   [ { date: 'Mon Feb 01 2016 00:00:00 GMT+0800 (SGT)',
		       open: 51.84,
		       high: 53.59,
		       low: 51.360001,
		       close: 52.830002,
		       volume: 3217700,
		       adjClose: 52.830002,
		       symbol: 'UPRO' },
		     { date: 'Tue Feb 02 2016 00:00:00 GMT+0800 (SGT)',
		       open: 51.34,
		       high: 51.439999,
		       low: 49.470001,
		       close: 50,
		       volume: 4990900,
		       adjClose: 50,
		       symbol: 'UPRO' },
		     { date: 'Wed Feb 03 2016 00:00:00 GMT+0800 (SGT)',
		       open: 50.970001,
		       high: 51.220001,
		       low: 47.549999,
		       close: 50.84,
		       volume: 6980200,
		       adjClose: 50.84,
		       symbol: 'UPRO' },
		     { date: 'Thu Feb 04 2016 00:00:00 GMT+0800 (SGT)',
		       open: 50.389999,
		       high: 51.98,
		       low: 49.799999,
		       close: 51.060001,
		       volume: 4967400,
		       adjClose: 51.060001,
		       symbol: 'UPRO' },
		     { date: 'Fri Feb 05 2016 00:00:00 GMT+0800 (SGT)',
		       open: 50.549999,
		       high: 50.669998,
		       low: 47.580002,
		       close: 48.139999,
		       volume: 5268100,
		       adjClose: 48.139999,
		       symbol: 'UPRO' },
		     { date: 'Mon Feb 08 2016 00:00:00 GMT+0800 (SGT)',
		       open: 46.439999,
		       high: 46.75,
		       low: 44.220001,
		       close: 46.16,
		       volume: 6280700,
		       adjClose: 46.16,
		       symbol: 'UPRO' },
		     { date: 'Tue Feb 09 2016 00:00:00 GMT+0800 (SGT)',
		       open: 44.639999,
		       high: 47.32,
		       low: 44.560001,
		       close: 46.150002,
		       volume: 5680500,
		       adjClose: 46.150002,
		       symbol: 'UPRO' },
		     { date: 'Wed Feb 10 2016 00:00:00 GMT+0800 (SGT)',
		       open: 46.990002,
		       high: 48.380001,
		       low: 45.970001,
		       close: 46.099998,
		       volume: 4727100,
		       adjClose: 46.099998,
		       symbol: 'UPRO' },
		     { date: 'Thu Feb 11 2016 00:00:00 GMT+0800 (SGT)',
		       open: 43.889999,
		       high: 45.200001,
		       low: 42.98,
		       close: 44.43,
		       volume: 7707200,
		       adjClose: 44.43,
		       symbol: 'UPRO' },
		     { date: 'Fri Feb 12 2016 00:00:00 GMT+0800 (SGT)',
		       open: 45.790001,
		       high: 47.040001,
		       low: 45.09,
		       close: 47.029999,
		       volume: 3883800,
		       adjClose: 47.029999,
		       symbol: 'UPRO' },
		     { date: 'Tue Feb 16 2016 00:00:00 GMT+0800 (SGT)',
		       open: 48.700001,
		       high: 49.419998,
		       low: 47.799999,
		       close: 49.360001,
		       volume: 3833300,
		       adjClose: 49.360001,
		       symbol: 'UPRO' },
		     { date: 'Wed Feb 17 2016 00:00:00 GMT+0800 (SGT)',
		       open: 50.48,
		       high: 52.18,
		       low: 50.369999,
		       close: 51.810001,
		       volume: 4554900,
		       adjClose: 51.810001,
		       symbol: 'UPRO' },
		     { date: 'Thu Feb 18 2016 00:00:00 GMT+0800 (SGT)',
		       open: 52.080002,
		       high: 52.150002,
		       low: 50.889999,
		       close: 51.169998,
		       volume: 3318300,
		       adjClose: 51.169998,
		       symbol: 'UPRO' },
		     { date: 'Fri Feb 19 2016 00:00:00 GMT+0800 (SGT)',
		       open: 50.48,
		       high: 51.25,
		       low: 49.880001,
		       close: 51.16,
		       volume: 3093700,
		       adjClose: 51.16,
		       symbol: 'UPRO' },
		     { date: 'Mon Feb 22 2016 00:00:00 GMT+0800 (SGT)',
		       open: 52.599998,
		       high: 53.470001,
		       low: 52.57,
		       close: 53.310001,
		       volume: 4063900,
		       adjClose: 53.310001,
		       symbol: 'UPRO' },
		     { date: 'Tue Feb 23 2016 00:00:00 GMT+0800 (SGT)',
		       open: 52.720001,
		       high: 52.959999,
		       low: 51.209999,
		       close: 51.369999,
		       volume: 3762800,
		       adjClose: 51.369999,
		       symbol: 'UPRO' },
		     { date: 'Wed Feb 24 2016 00:00:00 GMT+0800 (SGT)',
		       open: 49.91,
		       high: 52.259998,
		       low: 48.900002,
		       close: 52.049999,
		       volume: 5784500,
		       adjClose: 52.049999,
		       symbol: 'UPRO' },
		     { date: 'Thu Feb 25 2016 00:00:00 GMT+0800 (SGT)',
		       open: 52.439999,
		       high: 53.900002,
		       low: 51.709999,
		       close: 53.880001,
		       volume: 4300400,
		       adjClose: 53.880001,
		       symbol: 'UPRO' },
		     { date: 'Fri Feb 26 2016 00:00:00 GMT+0800 (SGT)',
		       open: 54.77,
		       high: 54.84,
		       low: 53.380001,
		       close: 53.560001,
		       volume: 4660900,
		       adjClose: 53.560001,
		       symbol: 'UPRO' },
		     { date: 'Mon Feb 29 2016 00:00:00 GMT+0800 (SGT)',
		       open: 53.639999,
		       high: 54.459999,
		       low: 52.099998,
		       close: 52.099998,
		       volume: 3464800,
		       adjClose: 52.099998,
		       symbol: 'UPRO' },
		     { date: 'Tue Mar 01 2016 00:00:00 GMT+0800 (SGT)',
		       open: 53.450001,
		       high: 56,
		       low: 53,
		       close: 55.970001,
		       volume: 5067100,
		       adjClose: 55.970001,
		       symbol: 'UPRO' },
		     { date: 'Wed Mar 02 2016 00:00:00 GMT+0800 (SGT)',
		       open: 55.66,
		       high: 56.759998,
		       low: 55.220001,
		       close: 56.740002,
		       volume: 3488200,
		       adjClose: 56.740002,
		       symbol: 'UPRO' },
		     { date: 'Thu Mar 03 2016 00:00:00 GMT+0800 (SGT)',
		       open: 56.5,
		       high: 57.380001,
		       low: 55.950001,
		       close: 57.32,
		       volume: 3366600,
		       adjClose: 57.32,
		       symbol: 'UPRO' },
		     { date: 'Fri Mar 04 2016 00:00:00 GMT+0800 (SGT)',
		       open: 57.599998,
		       high: 58.709999,
		       low: 56.740002,
		       close: 57.93,
		       volume: 3772200,
		       adjClose: 57.93,
		       symbol: 'UPRO' },
		     { date: 'Mon Mar 07 2016 00:00:00 GMT+0800 (SGT)',
		       open: 57.029999,
		       high: 58.48,
		       low: 56.900002,
		       close: 58.049999,
		       volume: 4293700,
		       adjClose: 58.049999,
		       symbol: 'UPRO' },
		     { date: 'Tue Mar 08 2016 00:00:00 GMT+0800 (SGT)',
		       open: 56.959999,
		       high: 57.48,
		       low: 56,
		       close: 56.119999,
		       volume: 3613500,
		       adjClose: 56.119999,
		       symbol: 'UPRO' },
		     { date: '2016-03-09T13:53:24+08:00',
		       symbol: 'UPRO',
		       adjClose: '56.12',
		       close: '56.12',
		       low: '56.12',
		       high: '56.12',
		       open: '56.12' } ] };
		
		done(null, res);
		// var to = moment().subtract(1, 'days');
		// var from = moment().subtract(self.addWeekendsOffset(self.indicatorsMax), 'days');

		// var conf = {
		// 	from: self.formatDate(from),
		// 	to: self.formatDate(to),
		// 	symbols: self.stocks
		// };

		// stock = self.stocks.join(',');

		// async.parallel({
		// 	hist: hist.historical.bind(hist, conf),
		// 	current: hist.actual.bind(hist, stock)
		// }, function(err, res) {
		// 	if(err) return done(err);
		// 	done(null, self.joinHistoricAndCurrentData(res.hist, res.current));
		// });	
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