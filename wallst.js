const { Navalia, Chrome } = require('navalia'); // https://joelgriffith.github.io/navalia/
var cheerio = require('cheerio');
const navalia = new Navalia({
	numInstances: 4,// number of cpu cores
	chromeOptions: {
		timeout: 60000
	}
});

// a function that returns a function that be used with navalia.run() to scrape morningstar
scrape_ms = (ticker) => {
	return (chrome)	=> {
		return chrome.
			goto('http://portfolios.morningstar.com/fund/holdings?t='+ticker).
			html(".r_title .gry").
			html("#equity_holding_tab").
			then((result) => {
					console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
					// console.log(result);
					var $ = cheerio.load(result[2]);
					var tbl = $('tr:has(td):not(.hr)').map(function(i, v) {				
						var $$ = cheerio.load(v);
						var $td = $$('td')
						return {
							company:$td.eq(1).text(),
							port_wt:$td.eq(3).text(),
							shares_owned:$td.eq(4).text(),
							sector:$td.eq(6).innerHTML,
							style:$td.eq(7).text(),
							first_bought:$td.eq(9).text(),
							country:$td.eq(11).text(),
							ytd_return:$td.eq(12).text(),
						}
					 }).get()

					return tbl
				});
	}
}

//these can run in "parallel"
var a1 = navalia.run(scrape_ms("XASX:ISO")).then(result => console.log(result))
var a2 = navalia.run(scrape_ms("XASX:STW")).then(result => console.log(result))


// navalia.run((chrome) => chrome.goto('http://portfolios.morningstar.com/fund/holdings?t=XASX:STW').html(".r_title .gry").then((result) => console.log(result)))
// var chrome = new Chrome({
// 	chromeOptions: {
// 		timeout: 60000
// 	}
// })
// var aa = ""
// var a = chrome.
// 	goto('http://portfolios.morningstar.com/fund/holdings?t=XASX:STW').
// 	html(".r_title .gry").
// 	html("#equity_holding_tab").
// 	then((result) => {
// 			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
// 			// console.log(result);
// 			var $ = cheerio.load(result[2]);
// 			var tbl = $('tr:has(td):not(.hr)').map(function(i, v) {				
// 				var $$ = cheerio.load(v);
// 				var $td = $$('td')
// 				return {
// 					company:$td.eq(1).text(),
// 					port_wt:$td.eq(3).text(),
// 					shares_owned:$td.eq(4).text(),
// 					sector:$td.eq(6).innerHTML,
// 					style:$td.eq(7).text(),
// 					first_bought:$td.eq(9).text(),
// 					country:$td.eq(11).text(),
// 					ytd_return:$td.eq(12).text(),
// 				}
// 			 }).get()

// 			return tbl
// 		});
// var express = require('express');
// var fs = require('fs');
// var request = require('request');
// var cheerio = require('cheerio');
// var app     = express();

// // scrapeIt("http://portfolios.morningstar.com/fund/holdings?t=XASX:STW", {
    
// // }).then(page => {
// //     console.log(page);
// // });

// app.get('/scrape', function(req, res){

//   url = "http://portfolios.morningstar.com/fund/holdings?t=XASX:STW"

//   request(url, function(error, response, html){

//         // First we'll check to make sure no errors occurred when making the request
//         console.log("wassup")
//         if(!error){
//             // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

//             var $ = cheerio.load(html);

//             // Finally, we'll define the variables we're going to capture
//             console.log($(".r_title .gry"))
//             console.log($("#equity_holding_tab"))
//         }
//     })

// })

// app.listen('8081')

// console.log('Magic happens on port 8081');

// // exports = module.exports = app;