const functions = require('firebase-functions'),
      parseString = require('xml2js').parseString,
      admin = require('firebase-admin'),
      rp =require('request-promise');

admin.initializeApp();

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
    console.info("lookup for > " + isbn);
    let url = lookupConfig.libthing_baseurl.replace("@@apikey@@",lookupConfig.libthing_api_key).replace("@@isbn@@",isbn);

    return rp({ url: url }).then(function(resp) {
            parseString(resp, function(err, result){
                if (err) { 
                    console.error(new Error("parseString error > " + err));
                }
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
                    console.info("lookup err > not found!");
                    return dataRef.update({
                        title: "not found!",
                        needLookup: 0
                    });
                }
            });
    }).catch(function(error) {
        console.error(new Error("request err > " + error.message));
    });
});

exports.createUserNode = functions.auth.user().onCreate((userRecord) => {
    console.info(userRecord);
    return admin.database().ref(`/users/${userRecord.uid}`).set({
        email: userRecord.email
    });
});

exports.deleteUserNode = functions.auth.user().onDelete((userRecord) => {
    console.info(userRecord);
    return admin.database().ref(`/users/${userRecord.uid}`).remove();
});