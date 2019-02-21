const functions = require('firebase-functions'),
       admin = require('firebase-admin'),
      rp =require('request-promise'),
      htmlparser = require("htmlparser2"),
      select = require('soupselect').select;
// parseString = require('xml2js').parseString,
     
admin.initializeApp();

const lookupConfig = {
  // set using firebase functions:config:set libthing.key=...
  libthing_api_key: functions.config().libthing.key || false,
  libthing_baseurl: "https://www.librarything.com/services/rest/1.1/?method=librarything.ck.getwork&isbn=@@isbn@@&apikey=@@apikey@@",
  leslibraires_baseurl: "https://www.leslibraires.fr/recherche/?q=@@isbn@@"
};
const fieldNames = {
    "Collection": "series",
    "Séries" : "series",
    "EAN13": "uid",
    "Éditeur": "publisher",
    "Date de publication": "published"
}
const getText = (node) => {
    if(node.type === "text") {
        return node.data;
    }
    if (node.children.length > 0) {
        let text = "";
        node.children.forEach((item) => {
            if (item.type === "text") {
                text += item.data;
            } else if (item.type === "tag" && item.name === "a") {
                text += item.children[0].data;
            }
        });
        return text;
    }
}

exports.fetchBookInformations = functions.database.ref('/bd/{user}/{ref}/needLookup').onWrite((snapshot, context) => { 
    // Grab the current value of what was written to the Realtime Database.
    let isbn = context.params.ref;
    if (!snapshot.after.exists() || snapshot.after.val() !== 1) {
        return null;
    }
    console.info("lookup for > " + isbn);
    //let url = lookupConfig.libthing_baseurl.replace("@@apikey@@",lookupConfig.libthing_api_key).replace("@@isbn@@",isbn);
    let url = lookupConfig.leslibraires_baseurl.replace("@@isbn@@",isbn);

    return rp({ url: url, followRedirect: true, simple: false }).then(function(resp) {
        let informations = {};
        let handler = new htmlparser.DomHandler((error, dom) => {
            if (error)
                console.error(error);
            else {
                let sel = select(dom, '.dl-horizontal dt');
                sel.forEach((elem) => {
                        if (elem.children === undefined || elem.next === undefined || elem.next.children === undefined) return;
                        let currentFieldName = elem.children[0].data;
                        if (fieldNames[currentFieldName]) {
                            let text = false;
                            try {
                                text = getText(elem.next);
                            } catch (e) {
                                text = false;
                            }
                            // cas particulier de "Collection" ou "Série" qui inclut le numéro du volume entre parenthèses
                            if (text && (currentFieldName === "Collection" || currentFieldName === "Séries") && elem.next.children[1] !== undefined) {
                                const regex = /(\d{1,4})/gm;
                                let m = regex.exec(elem.next.children[1].data);
                                informations["volume"] = parseInt(m[0]);
                                text = text.replace(/\n.*/gm,"");
                            }
                            if (text) {
                                informations[fieldNames[currentFieldName]] = text;
                            }
                        }
                });
                sel = select(dom,".main-infos h1 span");
                if(sel[0] !== undefined) {
                    informations["title"] = getText(sel[0]);
                } 

                sel = select(dom,".main-infos h2");
                if(sel[0] !== undefined) {
                    informations["author"] = getText(sel[0]);
                } 

                informations["detailsURL"] = url;
                sel = select(dom,"div.image a div img");
                if(sel[0] !== undefined && sel[0].attribs !== undefined && sel[0].attribs["src"]) {
                    informations["imageURL"] = sel[0].attribs["src"];
                }
            }
        });
        let parser = new htmlparser.Parser(handler);
        parser.parseComplete(resp);
        if(informations !== {} ) {
            console.info(informations);
            var dataRef = snapshot.after.ref.parent;
            return dataRef.update({
                title: (informations.title !== undefined ? informations.title : "untitled?"),
                author: (informations.author !== undefined ? informations.author : ""),
                imageURL: (informations.imageURL !== undefined ? informations.imageURL : ""),
                detailsURL: (informations.detailsURL !== undefined ? informations.detailsURL : ""),
                published: (informations.published !== undefined ? informations.published : ""),
                publisher: (informations.publisher !== undefined ? informations.publisher : ""),
                series: (informations.series !== undefined ? informations.series : ""),
                volume: (informations.volume !== undefined ? informations.volume : ""),
                needLookup: 0
            });
        } else {
            console.info("lookup err > not found!");
            return dataRef.update({
                title: "not found!",
                needLookup: 0
            });
        }

            /*parseString(resp, function(err, result){
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
            });*/
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