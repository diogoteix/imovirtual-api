const cheerio = require('cheerio');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const puppeteer = require('puppeteer');


var $;

const options = {
    uri: `http://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&nrAdsPerPage=100`,
    transform: function (body) {
      $ = cheerio.load(body); 
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7,it;q=0.6,es;q=0.5'
    }
  };

const preparePageForTests = async (page) => {
    // Pass the User-Agent Test.
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.navigator.chrome = {
            runtime: {},
            // etc.
        };
    });

    // Pass the Permissions Test.
    await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
    });

    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
        // This just needs to have `length > 0` for the current test,
        // but we could mock the plugins too if necessary.
        get: () => [1, 2, 3, 4, 5],
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });
}

function getData(client) {
    var data = [];

    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // Prepare for the tests (not yet implemented).
        await preparePageForTests(page);
        await page.goto('https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&nrAdsPerPage=100');
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);

        $ = cheerio.load(bodyHTML);

        $('.offer-item').each(function(index, element) {
            data.push(getOfferObject(element));
        });

        await browser.close();

        console.log("Scrap Done, " + data.length + " apartments found!");

        if(data.length == 0) {
            console.log(bodyHTML);
        }

        saveData(data, client);

      })();

    // rp(options)
    //     .then(() => {
    //         $('.offer-item').each(function(index, element) {
    //             data.push(getOfferObject(element));
    //         });

    //         console.log("Scrap Done, " + data.length + " apartments found!");

    //         saveData(data, client);
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //         getData(client);
    //     });
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