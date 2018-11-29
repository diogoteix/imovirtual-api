const cheerio = require('cheerio');
const rp = require('request-promise');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

var $;

const options = {
    uri: `https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&nrAdsPerPage=100`,
    transform: function (body) {
      $ = cheerio.load(body);
    },
    headers: {
        'User-Agent': 'javascript',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7,it;q=0.6,es;q=0.5'
    }
  };

function getData(client) {
    var data = [];

    rp(options)
        .then(() => {
            $('.offer-item').each(function(index, element) {
                data.push(getOfferObject(element));
            });

            console.log("Scrap Done, " + data.length + " apartments found!");

            saveData(data, client);
        })
        .catch((err) => {
            console.log(err);
        });
}

function getOfferObject(element) {
    var title = $(element).find('.offer-item-title').text();
    var price = $(element).find('.offer-item-price').text().replace(/\s/g, "").slice(0, -1);
    var pricePerM = $(element).find('.offer-item-price-per-m').text().replace(/\s/g, "").slice(0, -4);

    return {
        title,
        price,
        pricePerM
    }
}

function getSum(total, offer) {
    return total + Math.round(offer.price);
}

function saveData(data, client) {

    var totalPrice = data.reduce(getSum, 0);
    var median = totalPrice / data.length;
    var max = Math.max.apply(Math, data.map(function(o) { return o.price; }));
    var min = Math.min.apply(Math, data.map(function(o) { return o.price; }));

    // for(var value in data) {
        client.query("INSERT INTO values (median, max, min, date, source) VALUES ('" + median + "', '" + max + "', '" + min + "', '" + new Date(Date.now()) + "', 'imovirtual');", (err, res) => {
            if (err) throw err;
        });
    

    // client.end();

    




    // const collection = db
    //     .defaults({ values: [] })
    //     .get('values')

    

    // const newValue = collection
    //     .push({median, min, max, date: new Date(Date.now())})
    //     .write();
}

function getSavedData(startDate, endDate, client, callback) {
    var data = [];

    client.query("SELECT * FROM values;", (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
            data.push({
                median: row.median,
                max: row.max,
                min: row.min,
                source: row.source,
                date: row.date
            })
        }
        // client.end();

        callback(data);
    });


    // return db.get('values')
    //         .filter(function (v) {
    //             return new Date(v.date) >= startDate && new Date(v.date) <= endDate
    //         })
    //         .value();
}

module.exports = {
    getData,
    getSavedData
}