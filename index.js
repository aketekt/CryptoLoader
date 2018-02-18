#!/usr/bin/env node

"use strict";
const json2csv = require('json2csv');
const fs = require('fs');
const wrapper = require("./");
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const chalk = require('chalk');

let data = [];

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
        switch(exchange){
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
                    };                                         
            };
        
        // Set Params for API request
        const request = new wrapper.publicAPI(PUBLIC_URL, exchange);
        var JSONfileName = base + quote + '-' +startTS +'-'+ endTS + '.json';
        var CSVfileName = base + quote + '-' +startTS +'-'+ endTS + '.csv';
        
        //Loop and create request blocks
        var windowEnd = endTS;

        function loop(){
            setTimeout(function()
            {
                
                if(startTS + (resolutionInSeconds * maxDatapointsPerRequest) > windowEnd)
                {
                    endTS = windowEnd;
                } else 
                    {
                        endTS = startTS + (resolutionInSeconds * maxDatapointsPerRequest); 
                    };

                var params = {
                                command: requestCommand, 
                                symbol: pair, 
                                interval: resolution, 
                                startTime: startTS, 
                                endTime: endTS
                            }
                
                request.returnChartData(params,(err, response) =>             
                {   
                    //Log some human readable dates for each request. 
                    if(exchange != 'poloniex')
                    {
                        console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date(startTS) + ' - ' + new Date(endTS));          
                    }   else console.log(chalk.cyan('     REQUEST BLOCK: ')+ new Date((startTS *1000)) + ' - ' + new Date((endTS * 1000))); 
                       
                    if (err) {
                        throw err.msg;
                    } else console.log(chalk.cyan('     RESPONSE: ')+'200');
                    
                    response.forEach(function(item) {
                        data.push(item)
                       
                    });
                    if (err) {
                        throw err.msg;
                    } else console.log(chalk.cyan('     DATA: ') + 'Recieved');
                    
                    startTS = endTS; 

                    if(startTS != windowEnd){
                        loop();
                    } else parseData()
                },0);           
            })
        }

    loop();

    //Parse the data and edit it
    function parseData() 
    {
        switch(exchange) 
        {
            case 'binance':
            console.log(chalk.cyan('     DATA: ')+ 'Parsing data...');
            try 
            {
                //Format dates, times and add symbol  
                data.forEach(function(element) 
                {
                    var date = new Date(element[0]);
                    var hours = "0" + date.getHours();
                    var minutes = "0" + date.getMinutes();
                    var seconds = "0" + date.getSeconds();
                    var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                    element[0] = formattedTime;       
                    var dateString = ('0' + date.getDate()).slice(-2) +" " + ('0' + (date.getMonth()+1)).slice(-2) + " "+ date.getFullYear();
                    element[11] = dateString;
                    var date = new Date(element[6]);
                    var hours = "0" + date.getHours();
                    var minutes = "0" + date.getMinutes();
                    var seconds = "0" + date.getSeconds();
                    var formattedTime = hours.slice(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                    element[6] = formattedTime;
                    element.symbol = base+quote;        
                });               
            } catch (error) 
            {
                console.log(error);
            }
            
            try 
            {
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
                        date: dataPoint[11]        
                    };              
                });              
            } catch (error) 
            {
                console.log(error);
            }
                
                        
            break;
            case 'poloniex':
            data.forEach(function(element) 
            {   
                var dateToMilSecs = element.date * 1000;
                var date = new Date(dateToMilSecs);
                var hours = "0" + date.getHours();
                var minutes = "0" + date.getMinutes();
                var seconds = "0" + date.getSeconds();
                var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                element.openTime = formattedTime;       
                var dateString = ('0' + date.getDate()).slice(-2) +" " + ('0' + (date.getMonth()+1)).slice(-2) + " "+ date.getFullYear();
                element.date = dateString;
                element.symbol = base+quote;
            });
            dataList = data;
            
        };

        
        let fields = ['symbol', 'date', 'openTime','open', 'high', 'low', 'close', 'volume']
        var result = json2csv({ data: dataList, fields: fields });
        
        fs.writeFile(CSVfileName, result, function(err) 
        {
            if (err)
            {
                console.log(err);
            } else 
                {
                    console.log(chalk.greenBright("     FILE SAVED AS: ") + CSVfileName);
                }
        });  
    };
});  
program.parse(process.argv);