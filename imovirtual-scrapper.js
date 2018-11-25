const cheerio = require('cheerio');
const rp = require('request-promise');

var $;

const options = {
    uri: `https://www.imovirtual.com/comprar/apartamento/vila-nova-de-gaia/?search%5Bfilter_enum_rooms_num%5D%5B0%5D=2&search%5Bfilter_enum_condition%5D%5B0%5D=novo&search%5Bfilter_enum_condition%5D%5B1%5D=em_construcao&search%5Bdescription%5D=1&search%5Bsubregion_id%5D=195&nrAdsPerPage=100`,
    transform: function (body) {
      $ = cheerio.load(body);
    }
  };

function getData() {
    var data = [];

    rp(options)
        .then(() => {
            var container = $('.section-listing__row-content');

            $('.offer-item').each(function(index, element) {
                data.push(getOfferObject(element));
            });

            console.log("Scrap Done, " + data.length + " apartments found!");

            return data;
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

module.exports = {
    getData
}