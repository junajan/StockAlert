var express = require('express');
var http = require('http');

module.exports = (function() {
    var self = this;
    this.app = express();

    this.run = function(conf) {
        var server = http.createServer(self.app);

        server.listen(conf.port, function(){
            console.log("Express server listening on port " + conf.port);
        });

        return self.app;
    };

    return this;
})();