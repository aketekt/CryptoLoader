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

//data
let data = []; 
var dataToSave = [];

var pairList =  
[          
    "BCCBTC",
    "ETHBTC", 
    "NEOBTC",
    "LTCBTC",
    "IOTABTC",
    "DGDBTC",
    "DGDETH",
    "XRPBTC",
    "XLMBTC",
    "ETCBTC",
    "EOSBTC",
    "ADABTC",
    "TRXBTC",
    "VENBTC",
    "ICXBTC",
    "VIBEBTC",
    "NANOBTC",
    "WTCBTC",
    "BNBBTC",
    "BNBUSDT",
    "BNTBTC",
    "ZRXBTC",
    "XVGBTC",
    "LINKBTC",
    "EOSETH",
    "IOTAETH",
    "XRPETH",
    "ETCETH",
    "WABIETH",
    "NEOETH",
    "BTCUSDT",
    "ETHUSDT",
    "NEOUSDT",
    "BCCUSDT",
    "LTCUSDT"
];


var pairPosition = 0;
var pairsMax = 105;
var pairNow;

// CMD
program
    .arguments('<exchange>')
    .arguments('<instrument>')
    .arguments('<startTime>')
    .arguments('<endTime>')
    .arguments('<resolution>')
    .action(function(exchange, instrument, startTime, endTime, resolution) 
    {

        //Loop vars
        var startTS = new Date(startTime).getTime();
        var endTS = new Date(endTime).getTime();
        var resolutionInSeconds = 0;
        // ALL loop vars
      

        switch(exchange)
        {
            case 'bitfinex':
                var x = instrument.split("-");
                var pair = x[1] + x[0];
                var maxDatapointsPerRequest = 119;
                var PUBLIC_URL;
                var waitTime = 6000;

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
                    resolution = "1D";
                    resolutionInSeconds = 86400000;
            };
        break;
            case 'binance':
                var x = instrument.split("-");
                var pair = x[1] + x[0];
                var PUBLIC_URL = "https://api.binance.com/api/v1/klines";
                var maxDatapointsPerRequest = 500;
                var resolutionInSeconds = 0;
                var waitTime = 500;

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
                var pair =  instrument.replace('-', '_');
                var PUBLIC_URL = 'https://poloniex.com/public';
                var requestCommand = 'returnChartData';
                var maxDatapointsPerRequest = 10000;
                var resolutionInSeconds = 0;
                var waitTime = 1000;
                    
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
        

        var CSVfileName = CSVfileName = pair + '-' +startTime +'-'+ endTime + '.csv';
        
         //Loop and create request blocks
         var windowEnd = endTS;
         var windowStart = startTS;
 
         (function loop(){
             setTimeout(function()
             {
                if (exchange == 'bitfinex') PUBLIC_URL = "https://api.bitfinex.com/v2/candles/trade:"+ resolution +":"+"t"+ pair +"/hist";
                const request = new wrapper.publicAPI(PUBLIC_URL, exchange);

                //Prevent loop requesting data after windowEnd
                if(startTS + (resolutionInSeconds * maxDatapointsPerRequest) > windowEnd)
                {
                    endTS = windowEnd;
                } else endTS = startTS + (resolutionInSeconds * maxDatapointsPerRequest); 
                
                if(instrument == 'ALL') pair = pairList[pairPosition];

                var params ={
                                 command: requestCommand, 
                                 symbol: pair, 
                                 interval: resolution, 
                                 startTime: startTS, 
                                 endTime: endTS
                            };
       
                 //console.log(chalk.redBright('REQUEST FAILED: Retrying ' + cntr + ' of ' + retryTimes + 'times...' ));
                 
                request.returnChartData(params,(err, response) =>             
                {       
                    //Log some human readable dates for each request. 
                    if(exchange != 'poloniex') {
                        console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date(startTS) + ' - ' + new Date(endTS));          
                    }   else console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date((startTS *1000)) + ' - ' + new Date((endTS * 1000)));
                    
                    if (err) {
                        throw err.msg;
                    }   else console.log(chalk.cyan('     RESPONSE: ')+'200'); 
                     
                    response.forEach(function(item) {
                        data.push(item)  
                    });
                    if (err) {
                        throw err.msg;
                    }   else console.log(chalk.cyan('     DATA: ') + 'Recieved');
                                    
                    startTS = endTS;
                    if(instrument == 'ALL') {
                        if (pairPosition <= pairsMax) loop();
                        if(startTS == windowEnd)
                        {
                            startTS = windowStart;
                            pairNow = pair;
                            CSVfileName = pairNow + '-' +startTime +'-'+ endTime + '.csv';
                            pairPosition++;
                            dataToSave = data;
                            parseData();
                            data = [];
                        }
                        
                    } else 
                    {
                        if(startTS != windowEnd) loop(); else 
                        {    
                            pairNow = pair;
                            dataToSave = data;
                            parseData();
                        }
                       
                    }
                 });          
             },waitTime);
         })();
      
    //Parse the data and edit it
    function parseData()
    {
        switch(exchange) 
        {
            case 'bitfinex':
                console.log(chalk.cyan('     DATA: ')+ 'Parsing data...');
                    //Format dates, times and add symbol  
                    dataToSave.forEach(function(element) 
                    {
                        element[6] = element[0];
                        let openTime = new Date(element[0]);
                        element[0] = dataFormat.formatDate(openTime) + ' ' + dataFormat.formatTime(openTime);      
                        element.symbol = pairNow;    
                    });               
               
                    // Update dataPoint keys
                    var dataList = dataToSave.map(function(dataPoint)
                    { 
                        return { 
                            time: dataPoint[0], 
                            open: dataPoint[1],
                            close: dataPoint[2],
                            high: dataPoint[3],
                            low: dataPoint[4],
                            volume: dataPoint[5],
                            TS: dataPoint[6],
                            symbol: dataPoint.symbol        
  
                        };              
                    });                
            break;
            case 'binance':
                console.log(chalk.cyan('     DATA: ')+ 'Parsing data...');
        
                    //Format dates, times and add symbol  
                    dataToSave.forEach(function(element) 
                    {
                        let openTime = new Date(element[0]);
                        let closeTime = new Date(element[6]);
                        element[0] = dataFormat.formatDate(openTime) + ' ' + dataFormat.formatTime(openTime);      
                        element[6] = dataFormat.formatTime(closeTime);
                        //element[11] = dataFormat.formatDate(openTime); 
                        element.symbol = pairNow; 
                    });               
               
                    // Update dataPoint keys
                    var dataList = dataToSave.map(function(dataPoint)
                    { 
                        return { 
                            time: dataPoint[0], 
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
                dataToSave.forEach(function(element) 
                {   
                    let dateToMilSecs = element.date * 1000;
                    let openTime = new Date(dateToMilSecs);
                    element.time = dataFormat.formatDate(openTime) + " " + dataFormat.formatTime(openTime);
                    element.symbol = pairNow;
                });
                dataList = dataToSave;        
        };

        //Write file
        let fields = ['symbol', /*"TS",'date',*/ 'time','open', 'high', 'low', 'close', 'volume']
        var result = json2csv({ data: dataList, fields: fields });
        
        fs.writeFile(CSVfileName, result, function(err) 
        {
            if (err) {
                console.log(err);
            } else console.log(chalk.greenBright("     FILE SAVED AS: ") + CSVfileName);
        });  
        dataToSave = [];
    };
});
      
program.parse(process.argv);