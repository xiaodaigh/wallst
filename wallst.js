const { Navalia, Chrome } = require('navalia'); // https://joelgriffith.github.io/navalia/
const cheerio = require('cheerio');
const navalia = new Navalia({
  numInstances: 4, // number of cpu cores
  chromeOptions: {
    timeout: 60000
  }
});

// a function that returns a function that be used with navalia.run() to scrape morningstar
scrape_ms = (ticker) => {
  return (chrome) => {
    return chrome.
    goto('http://portfolios.morningstar.com/fund/holdings?t=' + ticker).
    html(".r_title .gry").
    html("#equity_holding_tab").
    then((chrome_result) => {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
      var $ = cheerio.load(chrome_result[2]);
      var tbl = $('tr:has(td):not(.hr)').map(function(i, v) {
        var $$ = cheerio.load(v);
        var $td = $$('td')

        //some of the rows are empty hence need to check if the link exists first
        let ticker_href = $td.eq(10).find("a").attr("href")
        if (ticker_href !== undefined) {
          ticker_href = ticker_href.replace("\n", "").substr(-8)
        } else {
        	ticker_href = ""
        }
        return {
          etf_ticker: cheerio.load(chrome_result[1]).text().replace(" ", "").replace("\n", ""),
          ticker: ticker_href,
          company: $$('th a').text(),
          port_wt: parseFloat($td.eq(3).text()),
          shares_owned: parseInt($td.eq(4).text().replace(",", "")),
          sector: $td.eq(6).find("span").attr("title"),
          style: $td.eq(7).find("span").attr("class"),
          first_bought: $td.eq(9).text(),
          country: $td.eq(11).text(),
          ytd_return: parseFloat($td.eq(12).text()),
        }
      }).get()
      let l = tbl.length
      return tbl.slice(1, l)
    });
  }
}

// sqlite
const sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(':memory:'); // in memoery sqlite
var db = new sqlite3.Database('./db/wallst.sqlite3');
//these can run in "parallel"
// db.run(`drop TABLE if exists etfs`);
// db

// db.run(`CREATE TABLE etfs(
// etf_ticker text,
// ticker text,
// company text,
// port_wt real,
// shares_owned integer,
// sector text,
// style text,
// first_bought text,
// country text,
// ytd_return real)`);


var a2 = navalia.run(scrape_ms("XASX:STW")).then(result => {  
  result.forEach((res, i) => {
    // create the insertion code
    let insert_code = Object.keys(res).reduce((acc, cv) => {
      if (res[cv] === undefined) {
      	return acc + `"", `
      } else if (typeof res[cv] === "string") {
        return acc + `"${res[cv]}", `
      } else {
      	if (isNaN(res[cv])) {
      		return acc + `"", `
      	}
        return acc + `${res[cv]}, `
      }
    }, "INSERT INTO etfs VALUES (")

    insert_code = insert_code.substr(0, insert_code.length - 2) + ")"
    console.log(i + insert_code)
    db.run(insert_code)
  })

  return (result)
})



db.run(`select * from etfs`)
db.run(`INSERT INTO etfs VALUES (
"${etf_ticker}",
"${ticker }",
"${company }",
"${port_wt }",
"${shares_owned }",
"${sector }",
"${style }",
"${first_bought }",
"${country }",
"${ytd_return}"`)


a2.then((a2) => console.log(a2.slice(1, 3)))

var a1 = navalia.run(scrape_ms("XASX:ISO")).then(result => {
  // console.log(result)
  console.log("done")
  return (result)
})



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