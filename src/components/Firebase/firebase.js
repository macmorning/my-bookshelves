import app from 'firebase/app';
import 'firebase/auth';

const config = {
  apiKey: process.env.MBS_API_KEY,
  authDomain: process.env.MBS_AUTH_DOMAIN,
  databaseURL: process.env.MBS_DATABASE_URL,
  projectId: process.env.MBS_PROJECT_ID,
  storageBucket: process.env.MBS_STORAGE_BUCKET,
  messagingSenderId: process.env.MBS_MESSAGING_SENDER_ID,
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.auth = app.auth();
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
}

export default Firebase;