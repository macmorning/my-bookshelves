import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from '../Firebase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const INITIAL_STATE = {
  passwordOne: '',
  passwordTwo: '',
  error: null,
};

class PasswordChangeForm extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = event => {
    const { passwordOne } = this.state;

    this.props.firebase
      .doPasswordUpdate(passwordOne)
      .then(() => {
        this.props.onSuccess();
      })
      .catch(error => {
        this.props.onError(error.message);
      });

    event.preventDefault();
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { passwordOne, passwordTwo, error } = this.state;

    const isInvalid =
      passwordOne !== passwordTwo || passwordOne === '';

    return (
      <form onSubmit={this.onSubmit}>
        <TextField name="passwordOne" label="New Password" type="password" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
          value={passwordOne} onChange={this.onChange}
        />
        <TextField name="passwordTwo" label="Confirm New Password" type="password" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
          value={passwordTwo} onChange={this.onChange}
        />
        <Button variant="contained" fullWidth color="primary" disabled={isInvalid} type="submit">
          Update
        </Button>
        {error && <p>{error.message}</p>}
      </form>
    );
  }
}
PasswordChangeForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};
export default withFirebase(PasswordChangeForm);