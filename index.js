var server_port = process.env.PORT || 8081;
var server_ip_address = process.env.IP || '127.0.0.1';

var express = require('express');
var schedule = require('node-schedule');

var imovirtualScraper =  require('./imovirtual-scrapper');
var idealista = require('./idealista');

var app = express();

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
//   connectionString: "postgres://postgres:password@localhost:5432/mylocaldb",
  ssl: true,
});

client.connect();

// every 5 seconds
var j = schedule.scheduleJob({hour: 16, minute: 00}, function(){
    updateCurrentDay();
});

var i = schedule.scheduleJob({minute: 59}, function(){
    console.log("I'm alive!");
});

function updateCurrentDay() {
    var startDate = new Date(1543148511 * 1000);
    var endDate = new Date(Date.now());

    var data = imovirtualScraper.getSavedData(startDate, endDate, client, getDataIfNeeded);

    
}

function getDataIfNeeded(data) {
    var currentDate = new Date(Date.now());
    var endDate = (new Date(new Date(Date.now())));
    if (data.length == 0 || (new Date(data[data.length - 1].date).getTime() < currentDate && endDate.getHours() >= 15)) {
        imovirtualScraper.getData(client);
        idealista.getToken(client);
    }
} 

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
    var startDate = new Date(parseInt(req.query.startDate) * 1000);
    var endDate = new Date(parseInt(req.query.endDate) * 1000);

    imovirtualScraper.getSavedData(startDate, endDate, client, (result) => {
        res.status(200).send(result);
    });

});

app.listen(server_port, function() {
    console.log('Server is running on server_ip_address ' + server_ip_address + ' and server_port:' + server_port);

    checkIfTableExistsAndCreate();

    // idealista.getToken();

    // idealista.getData();
});

// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   client.end();
// });

function checkIfTableExistsAndCreate() {

    // client.query("DROP TABLE values;", (err, res) => {
    //     if (err) throw err;
    //     // client.end();

    //     console.log("Table Deleted!");
    // })

    client.query("SELECT EXISTS ( SELECT 1 FROM information_schema.tables WHERE table_name = 'values' );", (err, res) => {
        if (err) throw err;
        // client.end();

        if(!res.rows[0].exists) {
            client.query("CREATE TABLE values (median float, max float, min float, date varchar(100), source varchar(10));", (err, res) => {
                if (err) throw err;
                // client.end();
        
                console.log("Table Created!");

                updateCurrentDay();
            })
        } else {
            updateCurrentDay();
        }
    });
}