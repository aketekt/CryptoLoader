"use strict";

const request = require("request");
const url = require("url");
const REQUEST_USER_AGENT = "CryptoMan";
const ParamUtils = require("./../common/ParamUtils.js");
const chalk = require('chalk');


//add if statement for URL


function publicAPI(PUBLIC_URL, exchange) {

function sendQuery(api, command, params) {
    let query = params || {};
    let queryUrl = url.parse(PUBLIC_URL);
    queryUrl.query = query;

    // Build options for request
    let opts = {
        "url": url.format(queryUrl),
        "method": "GET",
        "headers": {
            "User-Agent": REQUEST_USER_AGENT
        }
    };
    console.log(chalk.green("GET: ")+ opts.url);
    // Return a promise for the response data
    return new Promise((resolve, reject) => {
        // Send request to Poloniex
        request(opts, (error, response, body) => {
            // If request was successful
            if (!error && response && response.statusCode == 200) {
                // Parsed response body
                let bodyParsed;

                // Try to parse response body as JSON
                try {
                    bodyParsed = JSON.parse(body);
                } catch (e) {
                    reject({msg: "Unable to parse response body: " + e, _body: body});
                    return;
                }

                // Enforce type of returned data (see issue #16)
                if (bodyParsed === null || typeof bodyParsed !== "object") {
                    reject({msg: "Response body parsed, but to null or wrong type", _bodyParsed: bodyParsed});
                    return;
                }

                // Check if Poloniex returned an error
                if (typeof bodyParsed.error !== "undefined") {
                    // Reject promise with Poloniex's error message
                    reject({msg: "Poloniex: " + bodyParsed.error});
                } else {
                    // Resolve with parsed response data
                    resolve(bodyParsed);
                }
            } else {
                // Reject promise with error info
                reject({msg: "API request failed", _requestError: error, _requestResponse: response});
            }
        });
    });
};

publicAPI.prototype.returnChartData = function(params, callback) 
{
    // Load callback into params, if necessary
    ParamUtils.loadCallback(params, callback, () => params = {});

    // Assert parameter expectations
    
       
         // Include required parameters
        switch(exchange) {
            case 'binance':
               ParamUtils.expectParams(params, {
               
                    symbol: ["string", "string"],
                    interval: ["number", "string"],
                    startTime: ["number", "string"],
                    endTime: ["number", "string"]     
                });
                 // Stringify currency pair if necessary
            
                var opts = {
                    symbol: params.symbol,
                    interval: params.interval,
                    startTime: params.startTime,
                    endTime: params.endTime
                };
            break;
            case 'poloniex':
            
                ParamUtils.expectParams(params, {
                    command: ["string", "string"],
                    symbol: ["string", "string"],
                    interval: ["number", "string"],
                    startTime: ["number", "string"],
                    endTime: ["number", "string"]     
                });

    
                    // Include required parameters
                var opts = {
                        command: params.command,
                        currencyPair: params.symbol,
                        start: params.startTime,
                        end: params.endTime,
                        period: params.interval
                };
        };
    
    
    // Send returnChartData query and get promise for its response
    let promise = sendQuery(this, "returnChartData", opts,);

    // Connect callback to promise, if necessary
    if (typeof params.callback !== "undefined") {
        promise.then(res => setImmediate(() => params.callback(null, res)));
        promise.catch(err => setImmediate(() => params.callback(err, null)));
    }

    // Return promise for response
    return promise;    
};
};
module.exports = publicAPI;