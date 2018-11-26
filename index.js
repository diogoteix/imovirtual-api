var server_port = process.env.PORT || 8081;
var server_ip_address = process.env.IP || '127.0.0.1';

var express = require('express');
var schedule = require('node-schedule');

var imovirtualScraper =  require('./imovirtual-scrapper');

var app = express();

// every 5 seconds
var j = schedule.scheduleJob({hour: 15, minute: 30}, function(){
    imovirtualScraper.getData();
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
    var startDate = new Date(parseInt(req.query.startDate) * 1000);
    var endDate = new Date(parseInt(req.query.endDate) * 1000);

    res.status(200).send(imovirtualScraper.getSavedData(startDate, endDate));
});

app.listen(server_port, function() {
    console.log('Server is running on server_ip_address ' + server_ip_address + ' and server_port:' + server_port);
});