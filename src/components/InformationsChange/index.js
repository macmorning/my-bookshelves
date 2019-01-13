import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const INITIAL_STATE = {
  name: '',
  email: ''
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
    const { name, error } = this.state;

    const isInvalid = name  === '';

    return (
      <form onSubmit={this.onSubmit}>
        <TextField name="name" label="name" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
          value={name} onChange={this.onChange}
        />
        <Button variant="contained" fullWidth color="primary" disabled={isInvalid} type="submit">
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

InformationsChangeForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};
const authCondition = authUser => !!authUser;

export default withAuthorization(authCondition)(InformationsChangeForm);