var express = require('express');
var schedule = require('node-schedule');

var imovirtualScraper =  require('./imovirtual-scrapper');

var app = express();

var PORT = 3000;

// every 5 seconds
// var j = schedule.scheduleJob('*/5 * * * * *', function(){
//     imovirtualScraper.getData();
// });

app.get('/', function(req, res) {
    var startDate = new Date(parseInt(req.query.startDate) * 1000);
    var endDate = new Date(parseInt(req.query.endDate) * 1000);

    res.status(200).send(imovirtualScraper.getSavedData(startDate, endDate));
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});