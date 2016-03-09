require('colors');
var server = require('./modules/Server');
var conf = require("./config/public")(server.app);
var app = server.run(conf);
app.set("config", conf);

app.mailer = require('./modules/Mailer')(app);

var indicators = {
	SMA: [5, 10, 20, 100],
	RSIWILDERS: [2]
};

var tickers = {
	"UPRO": {
		'buy100': "SMA(100) > PRICE && RSIWILDERS(2) < 10",
		'buyLow': "SMA(5) > PRICE && RSIWILDERS(2) < 10",
		'sellHigh': "RSIWILDERS(2) > 80"
	},
	"LABD": {
		'buy100': "SMA(100) > PRICE && RSIWILDERS(2) < 15",
	},
};

var StockAlert = require("./modules/StockAlert")(app);
StockAlert.setConfig(indicators, tickers);
StockAlert.start();

StockAlert.processAlertCheck();
