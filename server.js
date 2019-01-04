const PORT = process.env.PORT || 8080;
const ADDRESS = process.env.IP;
const SERVERDIR = "";

const http = require('http'),
    url = require('url'),
    fs = require('fs'),
    https = require("https"),
    parseString = require('xml2js').parseString;
require('dotenv').config();

const logConfig = {
    http: (process.env.LOG_HTTP == "true" ? true : false),
    httpdebug: (process.env.LOG_HTTPDEBUG == "true" ? true : false),
    lookup: (process.env.LOG_LOOKUP  == "true" ? true : false)
};
const lookupConfig = {
    libthing_api_key: process.env.LIBTHING_API_KEY || false,
    libthing_lastcall_timestamp: "0",
    libthing_baseurl: "https://www.librarything.com/services/rest/1.1/?method=librarything.ck.getwork&isbn=@@isbn@@&apikey=@@apikey@@"
};

function escapeHtml(unsafe) {
    if(unsafe && isNaN(unsafe)) {// escapes Html characters
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    } else if (!isNaN(unsafe)) {
        return unsafe;
    }
    return false;
}


function currTime() {
    // write current time in HH:mm format
    let currentDate = new Date();
    let hours = currentDate.getHours();
    if (hours < 10) { hours = "0" + hours; }
    let minutes = currentDate.getMinutes();
    if (minutes < 10) { minutes = "0" + minutes; }
    return(hours + ":" + minutes);
}
function log(category, text) {
    if (logConfig[category]) {
        if(typeof text !== 'object') {
            console.log(currTime() + ' [' + category + ']: ' + text);
        } else {
            console.log(currTime() + ' [' + category + ']: ' + JSON.stringify(text));
        }
    }
}


function resBadRequest(res,err,data) {
    res.writeHead(400, { 'Content-type': 'text/txt'});
    res.end('Bad request');
    log("http", "Bad request > " + err);
    log("httpdebug", data);
    return true;
}
function resNotFound(res,err,data) {
    res.writeHead(404, { 'Content-type': 'text/txt'});
    res.end('Not found');
    log("http", "Not found > " + err);
    log("httpdebug", data);
    return true;
}
function resInternalError(res,err,data) {
    res.writeHead(500, { 'Content-type': 'text/txt'});
    res.end('Internal server error');
    log("http", "Internal server error > " + err);
    log("httpdebug", data);
    return true;
}
function resUnauthorized(res,err,data) {
    res.writeHead(401, { 'Content-type': 'text/txt'});
    res.end('Unauthorized');
    log("http", "Unauthorized > " + err);
    log("httpdebug", data);
    return true;
}

function lookup(isbn) {
    // http://www.librarything.com/services/rest/documentation/1.1/
    log("lookup", "Looking for > " + isbn);
    if (lookupConfig.libthing_lastcall_timestamp > (Date.now() - 60000)) {
        log("lookup", "... it's to soon to call the service again, not looking up");
        return false;
    }
    lookupConfig.libthing_lastcall_timestamp = Date.now();
    let url = lookupConfig.libthing_baseurl.replace("@@apikey@@",lookupConfig.libthing_api_key).replace("@@isbn@@",isbn);
    log("lookup", "... url: " + url);
    https.get(url, res => {
        res.setEncoding("utf8");
        let response = "";
        res.on("data", data => {
            response += data;
        });
        res.on("end", () => {
           response = parseString(response);
           console.log(response);
        });
    });
}


//////////////////////////////////////////////////////////////////////////////////////////
//
//                              Create http server
//
//////////////////////////////////////////////////////////////////////////////////////////

http.createServer(function (req, res) {
   
//
// ROUTING
//
    let url_parts = url.parse(req.url);

    // REST services
    if(url_parts.pathname.substr(0, 5) === '/rest') {
        // expected :    /rest/<action>/<ean>
        let request = url_parts.pathname.split("/");
        let action = escapeHtml(request[2]);
        let ean = escapeHtml(request[3]);
        log('http', 'Service called : ' + action + ', ean : ' + ean);
        if(action === "lookup" && ean) {
            let book = lookup(ean);
            if(book) {
                res.statusCode = 200;
                res.end("book found");
                return true;
            } else {
                return resInternalError(res,"error");
            }
        }
        return resBadRequest(res,"bad request");
    }
   
    // file serving
    // thanks http://blog.phyber.com/2012/03/30/supporting-cache-controls-in-node-js/ for the cache control tips
   
    else {
        log('http', 'client file request');
        let file='';
        if(url_parts.pathname === '/' || url_parts.pathname === '/build' || url_parts.pathname === '/build/') {
            file = 'index.html';
        }  else if(url_parts.pathname.substr(0, 8) === '/favicon') {
            // serving the favicon
            file = 'favicon.ico';
        }  else {
            if(url_parts.pathname.substr(0,6) === "/build") {   // remove the potential "/build" reference
                file = escapeHtml(url_parts.pathname.substr(7)); 
            } else {
                file = escapeHtml(url_parts.pathname); 
            }
        }
        log('http', '... serving build/' + file);
        fs.readFile(SERVERDIR+'build/'+file, function(err, data) {
            if(err) {
                log('http', '... ' + err);
                if(err.code === "ENOENT") {      // file is simply missing
                    resNotFound(res,'file not found',err);
                } else {                        // other error; could be EACCES or anything
                    resInternalError(res,'internal server error',err);
                }
            }
            else {
                fs.stat(SERVERDIR+'build/'+file, function (err, stat) {
                    if (err) {
                        resInternalError(res,'internal server error',err);
                    }
                    else {
                        let etag = stat.size + '-' + Date.parse(stat.mtime);
                        res.setHeader('Last-Modified', stat.mtime);
                        log('httpdebug', '... etag : ' + etag);
                        log('httpdebug', '... req.if-none-match : ' + req.headers['if-none-match']);
                        log('httpdebug', req.headers);

                        if (req.headers['if-none-match'] === etag) {
                            res.statusCode = 304;
                            res.end();
                        }
                        else {
                            res.setHeader('Content-Length', data.length);
                            res.setHeader('Cache-Control', 'public, max-age=600');
                            res.setHeader('ETag', etag);
                            res.statusCode = 200;
                            res.end(data);
                        }
                    }
                });
            }
        });
    }
}).listen(PORT,ADDRESS);
console.log(currTime() + '[START]: Server running on port ' + PORT);   
