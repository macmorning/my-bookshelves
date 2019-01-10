const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.testFunction = functions.database.ref('/bd/{user}/{ref}')
    .onWrite((snapshot, context) => { 
      // Grab the current value of what was written to the Realtime Database.
      console.log('onWrite triggered');
      console.log(JSON.stringify(context));
      console.log(JSON.stringify(snapshot));
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      // return snapshot.ref.parent.child('uppercase').set(uppercase);
    });
