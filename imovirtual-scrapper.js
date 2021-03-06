const cheerio = require("cheerio");

var request = require("request");

var $;

const options = {
  uri: `https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&search%5Border%5D=created_at_first%3Adesc&nrAdsPerPage=100`,
  transform: function(body) {
    $ = cheerio.load(body);
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64)" +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7,it;q=0.6,es;q=0.5"
  }
};

function getData(client) {
  var data = [];

  console.log("Get project");
  request(
    {
      uri: `https://www.parsehub.com/api/v2/projects/tVdT9_R52ANa`,
      method: "GET",
      gzip: true,
      qs: {
        api_key: "tTDbiWe13-na",
        format: "json"
      }
    },
    function(err, resp, body) {
      var result = JSON.parse(body);
      console.log("Project: ", result);

      if (
        !result.last_run ||
        new Date(result.last_run.start_time).setHours(23, 59, 59) <
          new Date(Date.now())
      ) {
        console.log("New run!");
        request(
          {
            uri: "https://www.parsehub.com/api/v2/projects/tVdT9_R52ANa/run",
            method: "POST",
            form: {
              api_key: "tTDbiWe13-na",
              send_email: "0"
            }
          },
          function(err, resp, body) {
            console.log("Run requested!");
            setTimeout(() => {
              console.log("Get run result");
              request(
                {
                  uri: `https://www.parsehub.com/api/v2/runs/${
                    JSON.parse(body).run_token
                  }/data`,
                  method: "GET",
                  qs: {
                    api_key: "tTDbiWe13-na",
                    format: "json"
                  },
                  gzip: true
                },
                function(err, resp, body) {
                  var result = JSON.parse(body);
                  console.log("Run result: ", result);

                  result.selection1.forEach(element => {
                    data.push({
                      price: element.name.replace(/\s/g, "").replace("€/m²", "")
                    });
                  });

                  console.log(
                    "Scrap Done, " + data.length + " apartments found!"
                  );

                  if (data.length == 0) {
                    console.log(result);
                  }

                  saveData(data, client);
                }
              );
            }, 60000);
          }
        );
      } else {
        console.log("Get last run");
        request(
          {
            uri: `https://www.parsehub.com/api/v2/runs/${result.last_run.run_token}/data`,
            method: "GET",
            qs: {
              api_key: "tTDbiWe13-na",
              format: "json"
            },
            gzip: true
          },
          function(err, resp, body) {
            var result = JSON.parse(body);
            console.log("Last run result: ", result);

            result.selection1.forEach(element => {
              data.push({
                price: element.name.replace(/\s/g, "").replace("€/m²", "")
              });
            });

            console.log("Scrap Done, " + data.length + " apartments found!");

            if (data.length == 0) {
              console.log(result);
            }

            saveData(data, client);
          }
        );
      }
    }
  );
}

function getOfferObject(element) {
  var title = $(element)
    .find(".offer-item-title")
    .text();
  var price = $(element)
    .find(".offer-item-price")
    .text()
    .replace(/\s/g, "")
    .slice(0, -1);
  var pricePerM = $(element)
    .find(".offer-item-price-per-m")
    .text()
    .replace(/\s/g, "")
    .slice(0, -4);

  return {
    title,
    price,
    pricePerM
  };
}

function getSum(total, offer) {
  const price = Math.round(offer.price);

  if (price) {
    return total + price;
  } else {
    return total;
  }
}

function saveData(data, client) {
  var totalPrice = data.reduce(getSum, 0);
  var median = totalPrice / data.length;
  var prices = data.map(a => a.price);
  var max = prices.reduce(function(priceA, priceB) {
    if (!priceA) {
      return priceB;
    } else if (!priceB) {
      return priceA;
    } else {
      return Math.max(priceA, priceB);
    }
  });
  var min = prices.reduce(function(priceA, priceB) {
    if (!priceA) {
      return priceB;
    } else if (!priceB) {
      return priceA;
    } else {
      return Math.min(priceA, priceB);
    }
  });

  // for(var value in data) {
  client.query(
    "INSERT INTO values (median, max, min, date, source) VALUES ('" +
      median +
      "', '" +
      max +
      "', '" +
      min +
      "', '" +
      new Date(Date.now()) +
      "', 'imovirtual');",
    (err, res) => {
      if (err) throw err;
    }
  );

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
      });
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
};
