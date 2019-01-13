import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import { withAuthorization } from '../Session';
import withStyles from '@material-ui/core/styles/withStyles';
import { compose } from 'recompose';
import Paper from '@material-ui/core/Paper';

import PasswordChangeForm from '../PasswordChange';
import EmailChangeForm from '../EmailChange';
import InformationsChangeForm from '../InformationsChange';
import SignOutButton from '../SignOut';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';


const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  main: {
    width: 'auto',
    display: 'block', // Fix IE 11 issue.
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.unit}px ${theme.spacing.unit}px ${theme.spacing.unit}px`,
  }
});

class AccountPageBase extends Component {
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
    const { classes } = this.props;
    return (<AuthUserContext.Consumer>
      {authUser => (
        <main className={classes.main}>
        <Paper className={classes.paper}>
          <SignOutButton /><br/>
        </Paper>
        <Paper className={classes.paper}>
          <PasswordChangeForm onSuccess={this.onSuccess} onError={this.onError}/>
          </Paper>
        <Paper className={classes.paper}>
          <EmailChangeForm user={authUser} onSuccess={this.onSuccess} onError={this.onError}/>
        </Paper>
        <Paper className={classes.paper}>
          <InformationsChangeForm onSuccess={this.onSuccess} onError={this.onError}/>
        </Paper>
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
        </main>
      )}
    </AuthUserContext.Consumer>);
  }
}

const authCondition = authUser => !!authUser;

const AccountPage = compose(
  withAuthorization(authCondition),
  withStyles(styles)
)(AccountPageBase);

export default (AccountPage);