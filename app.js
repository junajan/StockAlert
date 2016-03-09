require('colors');
var server = require('./modules/Server');
var conf = require("./config/public")(server.app);
var app = server.run(conf);
app.set("config", conf);

app.mailer = require('./modules/Mailer')(app);

var indicators = {
	SMA: ['10', '20'],
	RSIWILDERS: ['10']
};

var tickers = {
	"UPRO": {
		'test': "1 < 2",
		'test2': "1 < 2",
		'buyLow': "SMA(10) < PRICE && SMA(20) > SMA(10) && RSIWILDERS(10) < 10"
	},
	// "SSO": {
	// 	'sellHigh': 'RSI(10) > 90'
	// }
}

var StockAlert = require("./modules/StockAlert")(app);
StockAlert.setConfig(indicators, tickers);
StockAlert.start();

StockAlert.processAlertCheck();
