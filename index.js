#!/usr/bin/env node

"use strict";
const json2csv = require('json2csv');
const fs = require('fs');
const wrapper = require("./");
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const chalk = require('chalk');
var FormData = require('form-data');


// CMD
program
    .arguments('<exchange>')
    .arguments('<base>')
    .arguments('<quote>')
    .arguments('<startTime>')
    .arguments('<endTime>')
    .arguments('<resolution>')
    .action(function(exchange, base, quote, startTime, endTime,resolution) 
    {
        switch(exchange){
            case 'binance':
                var startTS = new Date(startTime).getTime();
                var endTS = new Date(endTime).getTime();
                var pair =  quote + base;
                var PUBLIC_URL = "https://api.binance.com//api/v1/klines";
                var maxDatapointsPerRequest = 500;
                var resolutionInSeconds = 0;

                //const fields = ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume'];
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
                }
                var params = {symbol: pair, interval: resolution, startTime: startTS, endTime: endTS}
            break;
            case 'poloniex':
                var startTS = new Date(startTime).getTime() / 1000;
                var endTS = new Date(endTime).getTime() / 1000;
                var pair = base + '_' + quote;
                var PUBLIC_URL = 'https://poloniex.com/public';
                var requestCommand = 'returnChartData';
                var maxDatapointsPerRequest = 200000;
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
                }
                                        
        }

        // Set Params for API request
        const request = new wrapper.publicAPI(PUBLIC_URL, exchange);
        var JSONfileName = base + quote + '-' +startTS +'-'+ endTS + '.json';
        var CSVfileName = base + quote + '-' +startTS +'-'+ endTS + '.csv';
        
        //Loop and create request blocks
        var windowEnd = endTS; 
        function loop(){
            setTimeout(function(){
                if(startTS + (resolutionInSeconds * maxDatapointsPerRequest) > windowEnd)
            {
            endTS = windowEnd;
            } else 
            {
            endTS = startTS + (resolutionInSeconds * maxDatapointsPerRequest); 
            };
            params = {command: requestCommand, symbol: pair, interval: resolution, startTime: startTS, endTime: endTS}
                request.returnChartData(params,(err, response) => 
                
                {  
                    if (err) {
                        throw err.msg;
                    }
                    else console.log('response recieved'); 
                  
                    console.log(response);
                    if(startTS != windowEnd){
                        loop();
                    }
                },0);
            startTS = endTS; 
            })
        }
loop();
    });  
program.parse(process.argv);