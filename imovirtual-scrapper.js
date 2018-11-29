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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        'Cookie': 'cto_lwid=48e6dbde-2245-4f48-958b-c5137e3e0fc0; _ga=GA1.2.1284116433.1542989941; optimizelyEndUserId=oeu1542989941251r0.21145502525722604; _gcl_au=1.1.343281382.1542989947; lastLoc=41.14766,-8.6079; PHPSESSID=m9ot2r8afbm4q11364nddgb9q0; mobile_default=desktop; ldTd=true; _gid=GA1.2.488091533.1543314660; b10cb2fb5b84d01d21bc3a070be99534=96d8c5c7659f1fad988689e82e35a319; ak_bmsc=586FD40180C4941F934AB7337A852C690210650F9A10000080B1FE5BCD82AA54~plmxnFn80r09mH5hCvUijQ7tjWN/hutFseTbcQMuzbflKR3dMk4tD4euYuPi2zWCLaJw5U+nmX0EsAamB10cvE8zbXw1Y6dQs3McRLePGIIZwzobJRliGEX96WJHMvlxXKm/g4G3b35dFEZXRRaGxX01lTZmBXnjUaos6t3z+WNFPAAg6evRz7RB+i/3wy1JlkU1iV74gBOvx2IRtsgqG7snEzYDilWIIUpuBzr4i2jk8=; onap=167415e0848x626ca30-4-1675ae5628cxb3ab076-1-1543420042; _gat_clientNinja=1; mp_fbcae190c2396b3f725856d427c197d0_mixpanel=%7B%22distinct_id%22%3A%20%22167415e0acc365-017175700e1fac-35677607-1aeaa0-167415e0acd3f7%22%2C%22%24device_id%22%3A%20%22167415e0acc365-017175700e1fac-35677607-1aeaa0-167415e0acd3f7%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.pt%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.pt%22%7D; cto_idcpy=38c330f0-61cb-4407-814f-aa2f4ef83839; _ceg.s=piwt4z; _ceg.u=piwt4z'
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