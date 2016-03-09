var _ = require('lodash');
var express = require('express');

var _config = {
	port: 3010,
	scheduleHour: 5,
	dateOffset: 30,
};

module.exports = function(app) {
	var self = this;

	// merge local and public config
	_config = _.merge(_config, require("./config"));

	// set to app so other modules can use it	
	app.set('conf', _config);
	return _config;
};