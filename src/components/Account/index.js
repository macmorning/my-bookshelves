import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import { withAuthorization } from '../Session';
import withStyles from '@material-ui/core/styles/withStyles';
import { compose } from 'recompose';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import PreferencesForm from '../Preferences';
import PasswordChangeForm from '../PasswordChange';
import EmailChangeForm from '../EmailChange';
import InformationsChangeForm from '../InformationsChange';
import SignOutButton from '../SignOut';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import { Divider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';


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
    marginTop: theme.spacing.unit * 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'left',
    padding: `${theme.spacing.unit*3}px ${theme.spacing.unit*3}px ${theme.spacing.unit*3}px`,
    marginLeft: `${theme.spacing.unit*3}px`,
    marginRight: `${theme.spacing.unit*3}px`,
  },
  divider: {
    margin: `${theme.spacing.unit*2}px 0 ${theme.spacing.unit*2}px 0`,
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
      <Grid container spacing={24}>
        <Grid item sm={12} md={6}>
          <Paper className={classes.paper}>
            <Typography variant="h5" component="h3">
              Display preferences
            </Typography>
            <Typography component="p">
              Your preferences are stored locally.
            </Typography>
            <PreferencesForm/>
          </Paper>
        </Grid>
        <Grid item sm={12} md={6}>
        <Paper className={classes.paper}>
          <Typography variant="h5" component="h3">
            Sign out
          </Typography>
          <Typography component="p">
            Use this button to sign out. You will be redirected to the sign in page.
          </Typography>
          <Divider className={classes.divider}/>
          <SignOutButton /><br/>
        </Paper>
        </Grid>
        <Grid item sm={12} md={6}>
        <Paper className={classes.paper}>
          <Typography variant="h5" component="h3">
                Change your display name
          </Typography>
          <Typography component="p">
                Change the name that is displayed to other users.
          </Typography>
          <Divider className={classes.divider}/>
          <InformationsChangeForm onSuccess={this.onSuccess} onError={this.onError}/>
        </Paper>
        </Grid>
        <Grid item sm={12} md={6}>
        <Paper className={classes.paper}>
            <Typography variant="h5" component="h3">
                Change your password
            </Typography>
            <Typography component="p">
                You can only change your password if you are using an email and password to sign in.
            </Typography>
            <Divider className={classes.divider}/>
            <PasswordChangeForm onSuccess={this.onSuccess} onError={this.onError}/>
          </Paper>
        </Grid>
        <Grid item sm={12} md={6}>
        <Paper className={classes.paper}>
          <Typography variant="h5" component="h3">
              Change your email address
          </Typography>
          <Typography component="p">
              Change the email address you registered with. Your library will not be affected.
          </Typography>
          <Divider className={classes.divider}/>
          <EmailChangeForm user={authUser} onSuccess={this.onSuccess} onError={this.onError}/>
        </Paper>
        </Grid>
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
        </Grid>
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