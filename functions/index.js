const functions = require('firebase-functions'),
      https = require('https'),
      parseString = require('xml2js').parseString,
      admin = require('firebase-admin');
      // request =require('request-promise');

const lookupConfig = {
  // set using firebase functions:config:set libthing.key=...
  libthing_api_key: functions.config().libthing.key || false,
  libthing_baseurl: "https://www.librarything.com/services/rest/1.1/?method=librarything.ck.getwork&isbn=@@isbn@@&apikey=@@apikey@@"
};

exports.fetchBookInformations = functions.database.ref('/bd/{user}/{ref}/needLookup').onWrite((snapshot, context) => { 
    // Grab the current value of what was written to the Realtime Database.
    let isbn = context.params.ref;
    if (!snapshot.after.exists() || snapshot.after.val() !== 1) {
        return null;
    }

    let url = lookupConfig.libthing_baseurl.replace("@@apikey@@",lookupConfig.libthing_api_key).replace("@@isbn@@",isbn);


    https.get(url, res => {
        res.setEncoding("utf8");
        let response = "";
        res.on("data", data => {
            response += data;
        });
        res.on("end", () => {
           response = parseString(response, function(err, result) {
                var dataRef = snapshot.after.ref.parent;

                if (result.response.ltml !== undefined && result.response.ltml[0] !== undefined && result.response.ltml[0].item[0] !== undefined) {
                    let book = result.response.ltml[0].item[0];
                    return dataRef.update({
                        title: (book.title.length > 0 ? book.title[0]:"?"),
                        author: (book.author.length > 0 ? book.author[0]["_"]:""),
                        imageURL: "",
                        detailsURL: (book.url.length > 0 ? book.url[0]:""),
                        published: "",
                        publisher: "",
                        needLookup: 0
                    });
                } else {
                    console.log(" ... not found!");
                    return dataRef.update({
                        title: "not found!",
                        needLookup: 0
                    });
                }
           });
        });
    });
  }
);
