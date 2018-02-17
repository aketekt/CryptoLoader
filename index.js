#!/usr/bin/env node

"use strict";

const wrapper = require("./");
const json2csv = require('json2csv');
const fs = require('fs');
const jsonfile = require('jsonfile');
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const chalk = require('chalk');
var result;






// BINANCE CMD
program
    .command('binance <base> <quote> <startTime> <endTime> <resolution>')
    .action(function(base, quote, startTime, endTime,resolution) 
    {
        //Create public API wrapperSet + CSV data fields
        const request = new wrapper.binance();
        const fields = ['0', '1', '2', '3', '4', '5', '6','7','8','9','10', '11'];
        
        //format inputs
        var startTS = new Date(startTime).getTime() ;
        console.log(startTS);
        var endTS = new Date(endTime).getTime() ;
        console.log(endTS);
        var pair =  quote + base;
        var fileName = base + quote + '-' +startTS +'-'+ endTS+'.csv';
        
        var ResolutionInSeconds = 0;
        var dataFile = [];

       
        switch(resolution) 
        {
            case 'minute':  
            resolution = "1m";
            ResolutionInSeconds = 60000;
            break;
            case 'hour': 
            resolution = "1h";
            ResolutionInSeconds = 3600000;
            break;
            case 'day': 
            resolution = "1d";
            ResolutionInSeconds = 86400000;
            break;
        }


        // Set Params for API request
        var params = {symbol: pair, interval: resolution, startTime: startTS, endTime: endTS}


        //variables for loop
        var maxDatapointsPerRequest = 500;
        var results;
        var windowEnd = endTS;
     

        function loop(){
            setTimeout(function(){
                if(startTS + (ResolutionInSeconds * maxDatapointsPerRequest) > windowEnd)
            {
            endTS = windowEnd;
            } else 
            {
            endTS = startTS + (ResolutionInSeconds * maxDatapointsPerRequest); 
            };
            params = {symbol: pair, interval: resolution, startTime: startTS, endTime: endTS};
                request.returnChartData(params,(err, response) => 
                {            
                    response.forEach(function(item) {
                        dataFile.push(item)
                    });
                    var result = json2csv({ data: dataFile, fields: fields });
                    fs.writeFile(fileName, result, function(err) 
                    {
                        if (err) throw err;
                        console.log(chalk.green('file saved as: ')+ fileName);
            });    
                    if(startTS != windowEnd){
                        loop();
                    }
                    
                },1000);
            startTS = endTS; 
            })
        }
        loop();
        
        
            
           
        

         
            
        
        //result = json2csv({ data: result, fields: fields });
       
              
        
    });  
           

// POLONIEX CMD
program
    .command('poloniex <base> <quote> <startTime> <endTime> <resolution>')
    .action(function(base, quote, startTime, endTime,resolution) 
    {
        const request = new wrapper.poloniex();
        const fields = ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume'];
        
        // Format inputs
        var startTS = new Date(startTime).getTime() / 1000;
        var endTS = new Date(endTime).getTime() / 1000; //repeated code
        var fileName = base + quote + '_' + startTS + '_' + endTS + '.csv';
        var pair = base + '_' + quote;

        switch(resolution) 
        {
            case 'minute':  
            resolution = 300;
            console.log(chalk.yellow("Warning: API limit, Minimum is 5m resolution, Downloading 5m..."));
            break;
            case 'hour': 
            resolution = 1800;
            console.log(chalk.yellow("Warning: API limit, Resolution cannot be 1h, Downloading 30m..."));
            break;
            case '2hour': 
            resolution = 7200;
            break;
            case 'day': 
            resolution = 86400;
            break;
        }

        var params = {currencyPair: pair, start: startTS, end: endTS, period: resolution};

        // Loop here -->

        // Send API request and write response to CSV
        request.returnChartData(params,(err, response) => {
            if (err) 
            {
                throw err.msg;
            } 
            else console.log('Response: 200');
            response.fill('symbol',pair);

            try 
            {
                var result = json2csv({ data: response, fields: fields });
            } 
            catch (err) 
            {
                // Errors are thrown for bad options, or if the data is empty and no fields are provided.
                // Be sure to provide fields if it is possible that your data array will be empty.
                console.error(err);
            }

            fs.writeFile(fileName, result, function(err) 
            {
                if (err) throw err;
                console.log(chalk.green('file saved as: ')+ fileName);
            });            
        });  
    });
program.parse(process.argv);