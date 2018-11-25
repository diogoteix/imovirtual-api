var express = require('express');
var schedule = require('node-schedule');

var imovirtualScraper =  require('./imovirtual-scrapper');

var app = express();

var PORT = 3000;

// every 5 seconds
var j = schedule.scheduleJob('*/5 * * * * *', function(){
    imovirtualScraper.getData();
});

app.get('/', function(req, res) {
    // res.status(200).send('Hello world');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});