import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import { withAuthorization } from '../Session';

import PasswordChangeForm from '../PasswordChange';
import EmailChangeForm from '../EmailChange';
import InformationsChangeForm from '../InformationsChange';
import SignOutButton from '../SignOut';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';

class AccountPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSuccess: false,
      showError: false,
      error: ""
    };
  }

  onError = (error) => {
    this.setState( { error: error, showError: true});
  }
  onSuccess = () => {
    this.setState( {showSuccess: true});
  }
  onSnackClose = () => {
    this.setState( {showSuccess: false, showError: false});
  }

  render() {
    return (<AuthUserContext.Consumer>
      {authUser => (
        <div>
          <SignOutButton />
          <PasswordChangeForm onSuccess={this.onSuccess} onError={this.onError}/>
          <EmailChangeForm user={authUser} onSuccess={this.onSuccess} onError={this.onError}/>
          <InformationsChangeForm onSuccess={this.onSuccess} onError={this.onError}/>

          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={this.state.showSuccess}
            autoHideDuration={2000}
            onClose={this.onSnackClose}
            ContentProps={{
              'aria-describedby': 'success-message-id',
            }} >
          <SnackbarContent
                message={<span id="success-message-id">Changes saved</span>}
                style = {{ backgroundColor: green[600] }}
                />
          </Snackbar>

          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={this.state.showError}
            autoHideDuration={5000}
            onClose={this.onSnackClose}
            ContentProps={{
              'aria-describedby': 'error-message-id',
            }} >
          <SnackbarContent
                message={<span id="error-message-id">{this.state.error}</span>}
                style = {{ backgroundColor: red[600] }}
                />
          </Snackbar>
        </div>
      )}
    </AuthUserContext.Consumer>);
  }
}

const authCondition = authUser => !!authUser;

export default withAuthorization(authCondition)(AccountPage);