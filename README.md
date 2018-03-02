Simple crypto data downloader  

*Requirements*  
Node  v8.5.0  
NPM 5.3.0  
  
*INSTALL*  

`npm install -g`  
  
`which cryptoloader`  
......../usr/local/bin/cryptoloader 
   
`readlink ....../usr/local/bin/cryptoloader`  
..  
  
`npm link`  

*Usage*
cryptoloader <exchange> <symbol> <startTime> <endTime> <resolution>  

`$ cryptoloader binance BTC-ETH 01/03/2018 01/04/2018 minute` 

*Get data for all coins
`$ cryptoloader binance ALL 01/03/2018 01/04/2018 minute` 

cryptoloader <exchange> <symbol> <startTime> <endTime> <resolution>

*Input Formats*  

startTime/endTime: mm/dd/yyyy  
Resolution:  
`minute`     
`hour`  
`day`  
`<A value the current exchange API accepts>` (Passes value directly into request params)  


Downloads to current working directory.





