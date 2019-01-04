import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import PasswordChangeForm from '../PasswordChange';
import { withAuthorization } from '../Session';

import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import SignOutButton from '../SignOut';

const AccountPage = () => (
  <AuthUserContext.Consumer>
    {authUser => (
      <div>
        <h1>Account:</h1>
        <PasswordChangeForm />
        <EmailChangeForm user={authUser}/>
        <InformationsChangeForm />
        <SignOutButton />
      </div>
    )}
  </AuthUserContext.Consumer>
);

const INITIAL_STATE = {
  name: '',
  email: '',
  error: null,
};

class InformationsChangeFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };

    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ email: user.email, name: user.displayName });
      } else {
        // No user is signed in.
      }
    });
  }

  onSubmit = event => {
    const { name } = this.state;

    this.props.firebase
    .doUpdateInformations(name)
    .then(() => {
      console.log({ ...INITIAL_STATE });
      this.setState({ name: this.props.firebase.auth.currentUser.displayName });
    })
    .catch(error => {
      this.setState({ error });
    });

    event.preventDefault();
  }

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { name, error } = this.state;

    const isInvalid = name  === '';

    return (
      <form onSubmit={this.onSubmit}>
        <TextField
          name="name"
          value={name}
          onChange={this.onChange}
          type="text"
          label="Alias"
        />
        <Button variant="contained" color="primary" disabled={isInvalid} type="submit">
          Update
        </Button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

class EmailChangeFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ email: user.email });
      } else {
        // No user is signed in.
      }
    });
 }

  onSubmit = event => {
    const { email } = this.state;

    this.props.firebase
    .doUpdateEmail(email)
    .then(() => {
      this.setState({ email: this.props.firebase.auth.currentUser.email });
    })
    .catch(error => {
      this.setState({ error });
    });

    event.preventDefault();
  }

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { email, emailTwo, error } = this.state;

    const isInvalid = !(/^.+@.+\..+$/.test(email)) || email !== emailTwo;

    return (
      <form onSubmit={this.onSubmit}>
        <TextField
          name="email"
          value={email}
          onChange={this.onChange}
          type="email"
          label="Your Account Email"
        />
        <TextField
          name="emailTwo"
          value={emailTwo}
          onChange={this.onChange}
          type="email"
          label="Confirm New Email"
        />        
        <Button variant="contained" color="primary" disabled={isInvalid} type="submit">
          Update
        </Button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

const InformationsChangeForm = compose(
  withRouter,
  withFirebase,
)(InformationsChangeFormBase);

const EmailChangeForm = compose(
  withRouter,
  withFirebase,
)(EmailChangeFormBase);

const authCondition = authUser => !!authUser;

export default withAuthorization(authCondition)(AccountPage);