const cpu_cores = 4 // number of physical cpu cores not logical one because many cpus are hyperthreaded hence doubel the "usable" threads
const length_of_ASX_ticker = 8;
console.warn("best to replace with regex")

const { Navalia, Chrome } = require('navalia'); // https://joelgriffith.github.io/navalia/
const cheerio = require('cheerio');
const navalia = new Navalia({
  numInstances: cpu_cores,
  maxJobs:1,
  chromeOptions: {
    timeout: 60000,

  }
});

// a function that returns a function that be used with navalia.run() to scrape morningstar
scrape_ms = (ticker) => {
  console.log("running: " + ticker)
  return (chrome) => {
    return chrome.
    goto('http://portfolios.morningstar.com/fund/holdings?t=' + ticker).
    html(".r_title .gry").
    html("#equity_holding_tab").
    then((chrome_result) => {
      console.log("!!!!!!!!!!!!!!!!!gotsome results!!!!!!!!!!!!!!!!!!!")
      var $ = cheerio.load(chrome_result[2]);
      var tbl = $('tr:has(td):not(.hr)').map(function(i, v) {
        var $$ = cheerio.load(v);
        var $td = $$('td')

        //some of the rows are empty hence need to check if the link exists first
        let ticker_href = $td.eq(10).find("a").attr("href")
        if (ticker_href !== undefined) {
          ticker_href = ticker_href.replace("\n", "").substr(-length_of_ASX_ticker)
        } else {
          ticker_href = ""
        }

        let company = $$('th a').text()
        if (company === "") {
          company = $$('th').text()
        }

        return {
          etf_ticker: cheerio.load(chrome_result[1]).text().replace(" ", "").replace("\n", ""),
          ticker: ticker_href,
          company: company,
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
    }).catch(err => {
    	console.log("error: " + ticker + " " + err)
    });
  }
}

// create a sqlite database
const sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(':memory:'); // in memoery sqlite
var db = new sqlite3.Database('./db/wallst.sqlite3');
//these can run in "parallel"
db.run(`drop TABLE if exists etfs`, () => {
  db.run(`CREATE TABLE etfs(
		etf_ticker text,
		ticker text,
		company text,
		port_wt real,
		shares_owned integer,
		sector text,
		style text,
		first_bought text,
		country text,
		ytd_return real)`)
})

// a function to insert scraped data into sqlite
const insertIntoSQLite = result => {
  if(result === undefined) {
  	return null
  }
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
    // console.log(i + insert_code)
    db.run(insert_code)
  })

  return (result)
}

// some example code to consider breaking the sqlite into smaller database
// and then merging them into one
// this will allow for better parallel processing
// attach 'c:\test\b.db3' as toMerge;           
// BEGIN; 
// insert into AuditRecords select * from toMerge.AuditRecords; 
// COMMIT; 
// detach toMerge;


// define an async parallel queue with concurrency limited to number of cpu cores to throttle tasks
const async = require("async")
var pqueue = async.queue((t, callback) => {
  console.log(t)

  let ss = t.split(":")
  if (ss[0] === "ASX") {
    navalia.run(scrape_ms("XASX:" + ss[1])).then((res) => {
    	callback(null,insertIntoSQLite(res))
    }).catch((err) => {
    	console.log("error: " + ss + err)
    	callbakc(err)
    })
  } else if (ss[0] === "LSE") {
    navalia.run(scrape_ms(ss[1])).then((res) => {
    	callback(null,insertIntoSQLite(res))
    }).catch((err) => {
    	console.log("error: " + ss + err)
    	callbakc(err)
    })
  } else if (ss[0] === "ARCA") {
    callback(null)
  } else if (ss[0] === "") {
    callback(null)
  }  
}, cpu_cores)


//read the csv line by line and push into the async queue for processing
const csv = require('csv-parser')
const fs = require('fs')

var a = fs.createReadStream('./db/etf_list.csv').
pipe(csv()).
on('data', function(data) {
  // console.log(data.uniqueSymbol)
  pqueue.push(data.uniqueSymbol)
})//.on('end', () => {
  // console.log(tickers.length)
  // async.mapLimit(tickers, 4, (t) => console.log(t), function(err, res) {

  // })
  // tickers.forEach((t) => {
  // 	conso
  // 	pqueue.push(t)
  // 	console.log(pqueue.started)
  // })
//})