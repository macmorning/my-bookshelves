const PORT = process.env.PORT || 8080;
const ADDRESS = process.env.IP;
const SERVERDIR = "";

const http = require('http'),
    url = require('url'),
    fs = require('fs'),
    https = require("https"),
    admin = require("firebase-admin"),
    amazon = require('amazon-product-api'),
    parseString = require('xml2js').parseString;
require('dotenv').config();

const logConfig = {
    http: (process.env.LOG_HTTP == "true" ? true : false),
    httpdebug: (process.env.LOG_HTTPDEBUG == "true" ? true : false),
    lookup: (process.env.LOG_LOOKUP  == "true" ? true : false),
    fireb:  (process.env.LOG_FIREBASE  == "true" ? true : false),
    amazon: (process.env.LOG_AMAZON  == "true" ? true : false)
};
const lookupConfig = {
    libthing_api_key: process.env.LIBTHING_API_KEY || false,
    libthing_lastcall_timestamp: "0",
    libthing_baseurl: "https://www.librarything.com/services/rest/1.1/?method=librarything.ck.getwork&isbn=@@isbn@@&apikey=@@apikey@@"
};
const firebaseConfig = {
    database_url: process.env.DATABASE_URL,
    serviceAccount: require("./firebase.json"),
    database_ref: {}
}
const amazonConfig = {
    AWSAccessKeyId: process.env.AWSAccessKeyId,
    AWSSecretKey: process.env.AWSSecretKey,
    AssociateTag: process.env.AssociateTag,
    AWSClient: {}
}

initFirebase();
initAmazonClient();

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

function initFirebase() {
    log("fireb", "connecting to Firebase instance " + firebaseConfig.database_url);
    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig.serviceAccount),
        databaseURL: firebaseConfig.database_url
    });
    firebaseConfig.database_ref = admin.database();
    var bdRef = firebaseConfig.database_ref.ref("bd");
    bdRef.on('child_added', function(userSnapshot) {
        var userKey = userSnapshot.key;
        log("fireb", " ... User ref - " + userKey);
        var thisUserRef = firebaseConfig.database_ref.ref(`bd/${userKey}`);
        thisUserRef.on("child_changed", function (snapshot) {
            var data = snapshot.val();
            log("fireb", " ... Child changed " + snapshot.key + " - needLookup : " + data.needLookup);
            if (data.needLookup) {
                lookup(snapshot);
            }
        });
        thisUserRef.on("child_added", function (snapshot) {
            var data = snapshot.val();
            log("fireb", " ... Child added " + snapshot.key + " - needLookup : " + data.needLookup);
            if (data.needLookup) {
                lookup(snapshot);
            }
        });
    });
    return true;
}

function initAmazonClient() {
    log("amazon", "Amazon client initializing with key - " + amazonConfig.AWSAccessKeyId);
    amazonConfig.AWSClient = amazon.createClient({
      awsId: amazonConfig.AWSAccessKeyId,
      awsSecret: amazonConfig.AWSSecretKey,
      awsTag: amazonConfig.AssociateTag
    });
    log("amazon", " ... Amazon client initialized");
    return true;
}

function lookup(snapshot) {
    // http://www.librarything.com/services/rest/documentation/1.1/
    console.log(snapshot.key);
    let isbn = snapshot.key;
    log("lookup", "Looking for > " + isbn);
    /*if (lookupConfig.libthing_lastcall_timestamp > (Date.now() - 60000)) {
        log("lookup", "... it's to soon to call the service again, delaying");
        setTimeout(lookup(snapshot), 30000);
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
           response = parseString(response, function(err, result) {
                var dataRef = snapshot.ref;
                let book = result.response.ltml[0].item[0];
                dataRef.update({
                    title: book.title,
                    author: book.author[0]["_"],
                    imageURL: "",
                    detailsURL: book.url,
                    published: "",
                    publisher: "",
                    needLookup: 0
              });
           });
        });
    });*/
    var dataRef = snapshot.ref;
    log("lookup", " ... Trying on amazon.fr");
    amazonConfig.AWSClient.itemLookup({
        idType: 'EAN',
        searchIndex: 'All',
        itemId: snapshot.key,
        domain: 'webservices.amazon.fr',
        responseGroup: 'ItemAttributes,Images'
    }).then(function(results) {
        log("lookup", " ... Found details on amazon.fr for " + snapshot.key + " : " + results[0].ItemAttributes[0].Title[0]);
        dataRef.update({
            title: results[0].ItemAttributes[0].Title[0],
            author: (results[0].ItemAttributes[0].Author ? results[0].ItemAttributes[0].Author:""),
            imageURL: results[0].LargeImage[0].URL,
            detailsURL: results[0].DetailPageURL[0],
            published: results[0].ItemAttributes[0].PublicationDate[0],
            publisher: results[0].ItemAttributes[0].Publisher[0],
            needLookup: 0
            //computedOrderField: dataRef.child('series').val() + "_" + ("0000" + dataRef.child('volume').val()).substr(-4,4) + "_" + results[0].ItemAttributes[0].Title[0]
        });
    }).catch(function(err) {
        log("lookup", " ... Error : " + JSON.stringify(err));
    });
    /*.catch(function(err) {
        log("lookup", " ... Error : " + JSON.stringify(err));
        log("lookup", " ... Trying on amazon.com");
        amazonConfig.AWSClient.itemLookup({
            idType: 'EAN',
            searchIndex: 'All',
            itemId: snapshot.key,
            domain: 'webservices.amazon.com',
            responseGroup: 'ItemAttributes,Images'
        }).then(function(results) {
            log("lookup", " ... Found details on amazon.com for " + snapshot.key + " : " + results[0].ItemAttributes[0].Title[0]); 
            dataRef.update({
                title: results[0].ItemAttributes[0].Title[0],
                author: results[0].ItemAttributes[0].Author,
                imageURL: results[0].LargeImage[0].URL,
                detailsURL: results[0].DetailPageURL[0],
                published: results[0].ItemAttributes[0].PublicationDate[0],
                publisher: results[0].ItemAttributes[0].Publisher[0],
                needLookup: 0
            });
        }).catch(function(err) {
            console.log(currTime() + " [LOOKUP] ... Error : " + JSON.stringify(err));
            console.log(currTime() + " [LOOKUP] ... Trying on amazon.com with ISBN");
            amazonConfig.AWSClient.itemLookup({
                idType: 'ISBN',
                searchIndex: 'Books',
                itemId: snapshot.key,
                domain: 'webservices.amazon.com',
                responseGroup: 'ItemAttributes,Images'
            }).then(function(results) {
                log("lookup", " ... Found details on amazon.com with ISBN for " + snapshot.key + " : " + results[0].ItemAttributes[0].Title[0]);
                dataRef.update({
                    title: results[0].ItemAttributes[0].Title[0],
                    author: results[0].ItemAttributes[0].Author,
                    imageURL: results[0].LargeImage[0].URL,
                    detailsURL: results[0].DetailPageURL[0],
                    published: results[0].ItemAttributes[0].PublicationDate[0],
                    publisher: results[0].ItemAttributes[0].Publisher[0],
                    needLookup: 0
                });
            }).catch(function(err) {
                log("lookup", " ... Error : " + JSON.stringify(err));
                dataRef.update({
                    title: snapshot.key,
                    author: "non trouve !",
                    needLookup: 0
                });
            });
        });
    });*/
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

    // file serving
    // thanks http://blog.phyber.com/2012/03/30/supporting-cache-controls-in-node-js/ for the cache control tips
   
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
}).listen(PORT,ADDRESS);
console.log(currTime() + '[START]: Server running on port ' + PORT);   
