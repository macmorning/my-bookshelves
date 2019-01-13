import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const INITIAL_STATE = {
  email: null,
};

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
      this.props.onSuccess();
    })
    .catch(error => {
      this.props.onError(error.message);
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
        <TextField name="email" label="Your Account Email" type="email" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
          value={email} onChange={this.onChange}
        />
        <TextField name="emailTwo" label="Confirm New Email" type="email" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
          value={emailTwo} onChange={this.onChange}
        />
        <Button variant="contained" fullWidth color="primary" disabled={isInvalid} type="submit">
          Update
        </Button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

const EmailChangeForm = compose(
  withRouter,
  withFirebase,
)(EmailChangeFormBase);

EmailChangeForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};
const authCondition = authUser => !!authUser;

export default withAuthorization(authCondition)(EmailChangeForm);