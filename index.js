var server_port = process.env.PORT || 8081;
var server_ip_address = process.env.IP || '127.0.0.1';

var express = require('express');
var schedule = require('node-schedule');

var imovirtualScraper =  require('./imovirtual-scrapper');

var app = express();

// every 5 seconds
var j = schedule.scheduleJob({hour: 16, minute: 00}, function(){
    imovirtualScraper.getData();
});

var i = schedule.scheduleJob({minute: 59}, function(){
    console.log("I'm alive!");
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

    var startDate = new Date(1543148511 * 1000);
    var endDate = new Date(Date.now());

    var data = imovirtualScraper.getSavedData(startDate, endDate);

    var currentDate = endDate.setHours(0,0,0,0);
    if (new Date(data[data.length - 1].date).getTime() < currentDate) {
        imovirtualScraper.getData();
    }
});