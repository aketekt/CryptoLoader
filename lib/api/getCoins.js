"use strict";

var request = require('request');
var URL;
var exchange = 'binance'
var symbolsList = [];

switch(exchange) {
    case 'bitfinex':
    request('https://api.bitfinex.com/v1/symbols', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            symbolsList.push(body);
                symbolsList.forEach(function(item) {
                    symbolsList.push(item.toUpperCase());
                    var pairsMax = symbolsList.length;
                    return symbolsList;
                });
            }
        });
        break;
        case 'binance':
        request('https://api.binance.com/api/v1/ticker/24hr', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                
                console.log(symbolsList);

                
                }
            });

        break;
        case 'poloniex':
       request('https://poloniex.com/public?command=returnTicker', function (error, response, body) {
        if (!error && response.statusCode == 200) {
        symbolsList.push(body);

        //console.log(symbolsList);
        }
    });

};






