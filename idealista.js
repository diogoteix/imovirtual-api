const https = require('https');

const request = require('request');

var accessToken = '';

function getToken(client) {
    const options = {
        host: 'api.idealista.com',
        path: '/oauth/token?grant_type=client_credentials',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from("yo8b1mgyptmqpojgo8l1y6aqp13e5lv1:GHhOND1aOor7").toString("base64"),
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
    };

    https.get(options, (resp) => {

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        accessToken = JSON.parse(chunk).access_token;
        getData(client);
    });

    // // The whole response has been received. Print out the result.
    // resp.on('end', () => {
    //     console.log(JSON.parse(data).explanation);
    // });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

function getSum(total, offer) {
    return total + Math.round(offer.price);
}

function getData(client) {

    var options = { 
        method: 'POST',
        url: 'https://api.idealista.com/3.5/pt/search',
        qs: 
        { 
            operation: 'sale',
            propertyType: 'homes',
            locationId: '0-EU-PT-13-17-027',
            order: 'publicationDate',
            sort: 'desc',
            apikey: '%22yo8b1mgyptmqpojgo8l1y6aqp13e5lv1%22',
            t: '1',
            language: 'pt',
            locale: 'pt' ,
            bedrooms: '2'
        },
        headers: 
        { 
            Authorization: 'Bearer ' + accessToken 
        } 
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        var data = JSON.parse(body).elementList;

        var totalPrice = data.reduce(getSum, 0);
        var median = totalPrice / data.length;
        var max = Math.max.apply(Math, data.map(function(o) { return o.price; }));
        var min = Math.min.apply(Math, data.map(function(o) { return o.price; }));

        client.query("INSERT INTO values (median, max, min, date, source) VALUES ('" + median + "', '" + max + "', '" + min + "', '" + new Date(Date.now()) + "', 'idealista');", (err, res) => {
            if (err) throw err;
        });
    });
}

module.exports = {
    getToken,
    getData
}