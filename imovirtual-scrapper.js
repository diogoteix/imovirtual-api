const cheerio = require('cheerio');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const puppeteer = require('puppeteer');

const phantom = require('phantom');

var Horseman = require('node-horseman')
var horseman = new Horseman()
var fs = require('fs')

var request = require('request');


var $;

const options = {
    uri: `https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&search%5Border%5D=created_at_first%3Adesc&nrAdsPerPage=100`,
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

    request({
        uri: `https://www.parsehub.com/api/v2/projects/tVdT9_R52ANa`,
        method: 'GET',
        gzip: true,
        qs: {
          api_key: "tTDbiWe13-na",
          format: "json"
        }
    }, function(err, resp, body) {
        var result = JSON.parse(body);

        if(!result.last_run || new Date(result.last_run.start_time).setHours(23,59,59) < new Date(Date.now)) {
            request({
                uri: 'https://www.parsehub.com/api/v2/projects/tVdT9_R52ANa/run',
                method: 'POST',
                form: {
                  api_key: "tTDbiWe13-na",
                  send_email: "0"
                }
            }, function(err, resp, body) {
                setTimeout(() => {
                    request({
                        uri: `https://www.parsehub.com/api/v2/runs/${JSON.parse(body).run_token}/data`,
                        method: 'GET',
                        qs: {
                          api_key: "tTDbiWe13-na",
                          format: "json"
                        },
                        gzip: true
                    }, function(err, resp, body) {
                        var result = JSON.parse(body);

                        result.precos.forEach(element => {
                            data.push({ price: element.value.replace(/\s/g, "").slice(0, -1) });
                        });
                    
                        console.log("Scrap Done, " + data.length + " apartments found!");
                    
                        if(data.length == 0) {
                            console.log(result);
                        }
                    
                        saveData(data, client);
                    });
                }, 30000)
            });
        } else {
            request({
                uri: `https://www.parsehub.com/api/v2/runs/${result.last_run.run_token}/data`,
                method: 'GET',
                qs: {
                  api_key: "tTDbiWe13-na",
                  format: "json"                  
                },
                gzip: true
            }, function(err, resp, body) {
                var result = JSON.parse(body);

                result.precos.forEach(element => {
                    data.push({ price: element.value.replace(/\s/g, "").slice(0, -1) });
                });
            
                console.log("Scrap Done, " + data.length + " apartments found!");
            
                if(data.length == 0) {
                    console.log(result);
                }
            
                saveData(data, client);
            });
        }
    });

    

    

    // var result = {
    //     "precos": [
    //      {
    //       "value": "135 000 €"
    //      },
    //      {
    //       "value": "135 000 €"
    //      },
    //      {
    //       "value": "152 500 €"
    //      },
    //      {
    //       "value": "249 325 €"
    //      },
    //      {
    //       "value": "147 000 €"
    //      },
    //      {
    //       "value": "245 000 €"
    //      },
    //      {
    //       "value": "228 000 €"
    //      },
    //      {
    //       "value": "285 000 €"
    //      },
    //      {
    //       "value": "210 000 €"
    //      },
    //      {
    //       "value": "250 000 €"
    //      },
    //      {
    //       "value": "230 000 €"
    //      },
    //      {
    //       "value": "265 000 €"
    //      },
    //      {
    //       "value": "245 000 €"
    //      },
    //      {
    //       "value": "240 000 €"
    //      },
    //      {
    //       "value": "177 500 €"
    //      },
    //      {
    //       "value": "178 000 €"
    //      },
    //      {
    //       "value": "249 325 €"
    //      },
    //      {
    //       "value": "205 000 €"
    //      },
    //      {
    //       "value": "225 000 €"
    //      },
    //      {
    //       "value": "250 000 €"
    //      },
    //      {
    //       "value": "235 000 €"
    //      },
    //      {
    //       "value": "310 000 €"
    //      },
    //      {
    //       "value": "221 000 €"
    //      },
    //      {
    //       "value": "162 000 €"
    //      },
    //      {
    //       "value": "154 500 €"
    //      },
    //      {
    //       "value": "138 000 €"
    //      },
    //      {
    //       "value": "227 500 €"
    //      },
    //      {
    //       "value": "147 400 €"
    //      },
    //      {
    //       "value": "285 000 €"
    //      },
    //      {
    //       "value": "280 000 €"
    //      },
    //      {
    //       "value": "210 000 €"
    //      },
    //      {
    //       "value": "140 900 €"
    //      },
    //      {
    //       "value": "101 500 €"
    //      },
    //      {
    //       "value": "220 000 €"
    //      },
    //      {
    //       "value": "230 000 €"
    //      },
    //      {
    //       "value": "87 000 €"
    //      },
    //      {
    //       "value": "98 000 €"
    //      },
    //      {
    //       "value": "270 000 €"
    //      },
    //      {
    //       "value": "240 000 €"
    //      },
    //      {
    //       "value": "136 500 €"
    //      },
    //      {
    //       "value": "136 500 €"
    //      },
    //      {
    //       "value": "147 000 €"
    //      },
    //      {
    //       "value": "138 000 €"
    //      },
    //      {
    //       "value": "147 000 €"
    //      },
    //      {
    //       "value": "162 000 €"
    //      },
    //      {
    //       "value": "150 500 €"
    //      },
    //      {
    //       "value": "147 400 €"
    //      },
    //      {
    //       "value": "200 000 €"
    //      },
    //      {
    //       "value": "250 000 €"
    //      },
    //      {
    //       "value": "140 900 €"
    //      },
    //      {
    //       "value": "130 000 €"
    //      },
    //      {
    //       "value": "252 000 €"
    //      },
    //      {
    //       "value": "138 000 €"
    //      },
    //      {
    //       "value": "152 500 €"
    //      },
    //      {
    //       "value": "221 000 €"
    //      },
    //      {
    //       "value": "228 000 €"
    //      },
    //      {
    //       "value": "250 000 €"
    //      },
    //      {
    //       "value": "95 000 €"
    //      },
    //      {
    //       "value": "154 500 €"
    //      },
    //      {
    //       "value": "160 000 €"
    //      },
    //      {
    //       "value": "225 000 €"
    //      },
    //      {
    //       "value": "230 000 €"
    //      },
    //      {
    //       "value": "152 500 €"
    //      },
    //      {
    //       "value": "210 000 €"
    //      },
    //      {
    //       "value": "195 000 €"
    //      },
    //      {
    //       "value": "288 619 €"
    //      },
    //      {
    //       "value": "386 146 €"
    //      },
    //      {
    //       "value": "303 079 €"
    //      },
    //      {
    //       "value": "405 494 €"
    //      },
    //      {
    //       "value": "379 887 €"
    //      },
    //      {
    //       "value": "398 591 €"
    //      },
    //      {
    //       "value": "419 108 €"
    //      }
    //     ]
    //    };

    // result.precos.forEach(element => {
    //     data.push(element.replace(/\s/g, "").slice(0, -1));
    // });

    // console.log("Scrap Done, " + data.length + " apartments found!");

    // if(data.length == 0) {
    //     console.log(result);
    // }

    // saveData(data, client);



    // (async function() {
    //     const instance = await phantom.create();
    //     const page = await instance.createPage();
    //     page.viewportSize = { width: 1280, height: 800 };
    //     page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36";
    //     await page.on("onResourceRequested", function(requestData) {
    //         // console.info('Requesting', requestData.url)
    //     });
    
    //     const status = await page.open(options.uri);
    //     console.log(status);
    
    //     const content = await page.property('content');
    //     // console.log(content);

    //     $ = cheerio.load(content); 
    
    //     await instance.exit();

    //     $('.offer-item').each(function(index, element) {
    //         data.push(getOfferObject(element));
    //     });

    //     console.log("Scrap Done, " + data.length + " apartments found!");

    //     if(data.length == 0) {
    //         console.log(content);
    //     }
    
    //     saveData(data, client);
    // }());

    // (async () => {
    //     const browser = await puppeteer.launch({headless: false});
    //     const page = await browser.newPage();
    //     // Prepare for the tests (not yet implemented).
    //     await preparePageForTests(page);
    //     await page.goto('https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&nrAdsPerPage=100');
    //     let bodyHTML = await page.evaluate(() => document.body.innerHTML);

    //     $ = cheerio.load(bodyHTML);

    //     $('.offer-item').each(function(index, element) {
    //         data.push(getOfferObject(element));
    //     });

    //     await browser.close();

    //     console.log("Scrap Done, " + data.length + " apartments found!");

    //     if(data.length == 0) {
    //         console.log(bodyHTML);
    //     }

    //     saveData(data, client);

    //   })();

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