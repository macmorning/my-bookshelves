import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.auth = app.auth();
    this.db = app.database();
    this.currDate = new Date();
    let currDate = new Date();
    let currMonth = currDate.getUTCMonth() + 1;
    currMonth = currMonth.toString();
    let currDay = currDate.getUTCDate();
    currDay = currDay.toString();
    this.currDateFormatted = currDate.getUTCFullYear() + '-' + currMonth.padStart(2, '0') + '-' + currDay.padStart(2, '0');
    this.maxBooks = 500;
  }
  // *** Auth API ***

    doCreateUserWithEmailAndPassword = (email, password) => 
        this.auth.createUserWithEmailAndPassword(email, password);

    doSignInWithEmailAndPassword = (email, password) =>
        this.auth.signInWithEmailAndPassword(email, password);

    doSignOut = () => this.auth.signOut();

    doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

    doPasswordUpdate = password =>
      this.auth.currentUser.updatePassword(password);

    doUpdateEmail = (email) => this.auth.currentUser.updateEmail(email);

 

  // *** User API ***
    user = uid => this.db.ref(`users/${uid}`);
    users = () => this.db.ref('users');

    doUpdateInformations = (name) => {
      this.auth.currentUser.updateProfile({ displayName: name });
      return this.db.ref(`users/${this.auth.currentUser.uid}`).update({ displayName: name });
    }

  // *** Book API ***
    books = uid => this.db.ref(`bd/${uid}`).limitToFirst(this.maxBooks);
    book = (uid, bookid) => this.db.ref(`bd/${uid}/${bookid}`);
    doUpdateBook = (uid, bookid, book) => {
      book.computedOrderField = (book.series ? book.series + (book.volume ? "_" + book.volume.padStart(4, '0') : "") : "") + "_" + book.title;
      return this.db.ref(`bd/${uid}/${bookid}`).update(book);
    };
    doAddBook = (uid, bookid) => {
      return this.db.ref(`bd/${uid}/${bookid}`).set({ author:"", uid:bookid, detailsURL:"", imageURL:"", edition:"", title:"", volume: "", series: "", publisher: "", needLookup: 1, dateAdded: this.currDateFormatted});
    };
    doRemoveBook = (uid, bookid) => (this.db.ref(`bd/${uid}/${bookid}`).remove());
}

export default Firebase;