import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import { PasswordForgetForm } from '../PasswordForget';
import PasswordChangeForm from '../PasswordChange';
import { withAuthorization } from '../Session';

import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';

const AccountPage = () => (
  <AuthUserContext.Consumer>
    {authUser => (
      <div>
        <h1>Account:</h1>
        <PasswordForgetForm />
        <PasswordChangeForm />
        <EmailChangeForm />
        <InformationsChangeForm />
      </div>
    )}
  </AuthUserContext.Consumer>
);

const INITIAL_STATE = {
  alias: '',
  email: '',
  error: null,
};

class InformationsChangeFormBase extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = event => {
    const { alias} = this.state;

    this.props.firebase
    .doUpdateInformations(alias)
    .then(() => {
      this.setState({ ...INITIAL_STATE });
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
    const { alias, name, error } = this.state;

    const isInvalid = alias === '' || name  === '';

    return (
      <form onSubmit={this.onSubmit}>
        <input
          name="alias"
          value={alias}
          onChange={this.onChange}
          type="text"
          placeholder="Alias used in URL"
        />
        <button disabled={isInvalid} type="submit">
          Update
        </button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

class EmailChangeFormBase extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = event => {
    const { email } = this.state;

    this.props.firebase
    .doUpdateEmail(email)
    .then(() => {
      this.setState({ ...INITIAL_STATE });
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
    const { email, error } = this.state;

    const isInvalid = !(/^.+@.+\..+$/.test(email));

    return (
      <form onSubmit={this.onSubmit}>
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="email"
          placeholder="Your account email"
        />
        <button disabled={isInvalid} type="submit">
          Update
        </button>

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