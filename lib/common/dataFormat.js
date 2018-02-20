"use strict";

// Parameter utilities
const dataFormat = {};
 
 
 dataFormat.formatTime = function (date) {
        var hours = "0" + date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
        var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return formattedTime;
    };

dataFormat.formatDate = function(date){
        var dateString =  ('0' + (date.getMonth()+1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2) + '/' + date.getFullYear(); 
        return dateString;
    };

module.exports = dataFormat;

 
 
 
 