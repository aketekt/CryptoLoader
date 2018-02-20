#!/usr/bin/env node

"use strict";

const json2csv = require('json2csv');
const fs = require('fs');
const wrapper = require("./");
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const chalk = require('chalk');
const dataFormat = require("./lib/common/dataFormat.js");

let data = []; 
var dataToSave = [];

//
// MULTI PAIR LOOP PARAMS
//

var pairList = 
[
    "BTC_BCN", 
    "BTC_BELA", 
    "BTC_BLK", 
    "BTC_BTCD", 
    "BTC_BTM", 
    "BTC_BTS", 
    "BTC_BURST", 
    "BTC_CLAM", 
    "BTC_DASH", 
    "BTC_DGB", 
    "BTC_DOGE", 
    "BTC_EMC2", 
    "BTC_FLDC", 
    "BTC_FLO", 
    "BTC_GAME", 
    "BTC_GRC", 
    "BTC_HUC", 
    "BTC_LTC", 
    "BTC_MAID", 
    "BTC_OMNI", 
    "BTC_NAV", 
    "BTC_NEOS", 
    "BTC_NMC", 
    "BTC_NXT", 
    "BTC_PINK", 
    "BTC_POT", 
    "BTC_PPC", 
    "BTC_RIC", 
    "BTC_STR", 
    "BTC_SYS", 
    "BTC_VIA", 
    "BTC_XVC", 
    "BTC_VRC", 
    "BTC_VTC", 
    "BTC_XBC", 
    "BTC_XCP", 
    "BTC_XEM", 
    "BTC_XMR", 
    "BTC_XPM", 
    "BTC_XRP", 
    "USDT_BTC", 
    "USDT_DASH", 
    "USDT_LTC", 
    "USDT_NXT", 
    "USDT_STR", 
    "USDT_XMR", 
    "USDT_XRP", 
    "XMR_BCN", 
    "XMR_BLK", 
    "XMR_BTCD", 
    "XMR_DASH", 
    "XMR_LTC", 
    "XMR_MAID", 
    "XMR_NXT", 
    "BTC_ETH", 
    "USDT_ETH", 
    "BTC_SC", 
    "BTC_BCY", 
    "BTC_EXP", 
    "BTC_FCT", 
    "BTC_RADS", 
    "BTC_AMP", 
    "BTC_DCR", 
    "BTC_LSK", 
    "ETH_LSK", 
    "BTC_LBC", 
    "BTC_STEEM", 
    "ETH_STEEM", 
    "BTC_SBD", 
    "BTC_ETC", 
    "ETH_ETC", 
    "USDT_ETC", 
    "BTC_REP", 
    "USDT_REP", 
    "ETH_REP", 
    "BTC_ARDR", 
    "BTC_ZEC", 
    "ETH_ZEC", 
    "USDT_ZEC", 
    "XMR_ZEC", 
    "BTC_STRAT", 
    "BTC_NXC", 
    "BTC_PASC", 
    "BTC_GNT", 
    "ETH_GNT", 
    "BTC_GNO", 
    "ETH_GNO", 
    "BTC_BCH", 
    "ETH_BCH", 
    "USDT_BCH", 
    "BTC_ZRX", 
    "ETH_ZRX", 
    "BTC_CVC", 
    "ETH_CVC", 
    "BTC_OMG", 
    "ETH_OMG", 
    "BTC_GAS", 
    "ETH_GAS", 
    "BTC_STORJ"
];
    
        var pairPosition = 0;
        var pairsMax = 98;
    

//
// MULTI PAIR LOOP PARAMS
//

// CMD
program
    .arguments('<exchange>')
    .arguments('<base>')
    .arguments('<quote>')
    .arguments('<startTime>')
    .arguments('<endTime>')
    .arguments('<resolution>')
    .action(function(exchange, base, quote, startTime, endTime, resolution) 
    {
        switch(exchange)
        {
            case 'binance':
                var startTS = new Date(startTime).getTime();
                var endTS = new Date(endTime).getTime();
                var pair =  quote + base;
                var PUBLIC_URL = "https://api.binance.com/api/v1/klines";
                var maxDatapointsPerRequest = 500;
                var resolutionInSeconds = 0;

                switch(resolution) 
                {
                    case 'minute':  
                        resolution = "1m";
                        resolutionInSeconds = 60000;
                        break;
                    case 'hour': 
                        resolution = "1h";
                        resolutionInSeconds = 3600000;
                        break;
                    case 'day': 
                        resolution = "1d";
                        resolutionInSeconds = 86400000;
                };
            break;
            case 'poloniex':
                var startTS = new Date(startTime).getTime() / 1000;
                var endTS = new Date(endTime).getTime() / 1000;
                var pair = base + '_' + quote;
                var PUBLIC_URL = 'https://poloniex.com/public';
                var requestCommand = 'returnChartData';
                var maxDatapointsPerRequest = 10000;
                var resolutionInSeconds = 0;
                    
                switch(resolution) 
                {
                    case 'minute':  
                        resolution = 300;
                        resolutionInSeconds = resolution;
                        console.log(chalk.yellow("Warning: API limit, Minimum is 5m resolution, Downloading 5m..."));
                    break;
                    case 'hour': 
                        resolution = 1800;
                        resolutionInSeconds = resolution;
                        console.log(chalk.yellow("Warning: API limit, Resolution cannot be 1h, Downloading 30m..."));
                    break;
                    case 'day': 
                        resolution = 86400;
                        resolutionInSeconds = resolution;
                };                                         
            };
        
        // Set Params for request loop & create file names
        const request = new wrapper.publicAPI(PUBLIC_URL, exchange);
        var CSVfileName = "error" + '.csv';
       
   
        //Loop and create request blocks
        var windowEnd = endTS;
        var windowStart = startTS;

        (function loop(callback){
            setTimeout(function()
            {
                //Prevent loop requesting data after windowEnd
                if(startTS + (resolutionInSeconds * maxDatapointsPerRequest) > windowEnd)
                {
                    endTS = windowEnd;
                } else endTS = startTS + (resolutionInSeconds * maxDatapointsPerRequest); 
             
                var pair = pairList[pairPosition];
                var params = {
                                command: requestCommand, 
                                symbol: pair, 
                                interval: resolution, 
                                startTime: startTS, 
                                endTime: endTS
                            };
                          
                //console.log(chalk.redBright('REQUEST FAILED: Retrying ' + cntr + ' of ' + retryTimes + 'times...' ));
                          
                request.returnChartData(params,(err, response) =>             
                {   
                    if (err) {
                        throw err.msg;
                    }   else console.log(chalk.cyan('     RESPONSE: ')+'200');

                    //Log some human readable dates for each request. 
                    if(exchange != 'poloniex') {
                        console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date(startTS) + ' - ' + new Date(endTS));          
                    }   else console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date((startTS *1000)) + ' - ' + new Date((endTS * 1000))); 
                   
                    
                    response.forEach(function(item) {
                        data.push(item)  
                    });
                    if (err) {
                        throw err.msg;
                    }   else console.log(chalk.cyan('     DATA: ') + 'Recieved');
                                   
                    startTS = endTS;
                    if(startTS == windowEnd)
                    {
                        startTS = windowStart;
                        var pairName = pair;
                        CSVfileName = pairName + '-' +startTime +'-'+ endTime + '.csv';
                        parseData();
                        pairPosition++;
                        dataToSave = data;
                        data = [];
                    } 

                    if (pairPosition <= pairsMax) loop();
                    
                });          
            },1000);
        })();
      
    //Parse the data and edit it
    function parseData()
    {
        switch(exchange) 
        {
            case 'binance':
                console.log(chalk.cyan('     DATA: ')+ 'Parsing data...');
               
                    //Format dates, times and add symbol  
                    data.forEach(function(element) 
                    {
                        let openTime = new Date(element[0]);
                        let closeTime = new Date(element[6]);
                        element[0] = dataFormat.formatTime(openTime);      
                        element[6] = dataFormat.formatTime(closeTime);
                        element[11] = dataFormat.formatDate(openTime); 
                        element.symbol = base+quote;        
                    });               
               
                    // Update dataPoint keys
                    var dataList = data.map(function(dataPoint)
                    { 
                        return { 
                            openTime: dataPoint[0], 
                            open: dataPoint[1],
                            high: dataPoint[2],
                            low: dataPoint[3],
                            close: dataPoint[4],
                            volume: dataPoint[5], 
                            closeTime: dataPoint[6],
                            quoteAssetVolume: dataPoint[7],
                            trades: dataPoint[8],
                            takerBaseAssetVolume: dataPoint[9],
                            takerQuoteAssetVolume: dataPoint[10],
                            date: dataPoint[11],
                            symbol: dataPoint.symbol        
                        };              
                    });                
            break;
            case 'poloniex':
                console.log(chalk.cyan('     DATA: ')+ 'Parsing data...');
                data.forEach(function(element) 
                {   
                    let dateToMilSecs = element.date * 1000;
                    let openTime = new Date(dateToMilSecs);
                    element.time = dataFormat.formatDate(openTime) + " " + dataFormat.formatTime(openTime);
                    element.symbol = pair;
                });
                dataList = data;        
            };

            //Write file
            let fields = ['symbol', /*'date',*/ 'time','open', 'high', 'low', 'close', 'volume']
            var result = json2csv({ data: dataList, fields: fields });
           
            fs.writeFile(CSVfileName, result, function(err) 
            {
                if (err) {
                    console.log(err);
                } else console.log(chalk.greenBright("     FILE SAVED AS: ") + CSVfileName);
            });  
        
        };
    });
      
program.parse(process.argv);