import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Navigation from '../Navigation';
import SignUpPage from '../SignUp';
import SignInPage from '../SignIn';
import PasswordForgetPage from '../PasswordForget';
import HomePage from '../Home';
import AccountPage from '../Account';
// import AdminPage from '../Admin';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import theme from '../../constants/theme';
import * as ROUTES from '../../constants/routes';
import { withAuthentication } from '../Session';


const App = () => (
    <Router>
    <MuiThemeProvider theme={theme}>
      <div id="top">
        <Navigation />
        <div style={{ display: "block", height:"63px"}}>&nbsp;</div>
        <Route exact path={ROUTES.HOME} component={HomePage} />
        <Route path={ROUTES.SIGN_UP} component={SignUpPage} />
        <Route path={ROUTES.SIGN_IN} component={SignInPage} />
        <Route path={ROUTES.PASSWORD_FORGET} component={PasswordForgetPage} />
        <Route path={ROUTES.ACCOUNT} component={AccountPage} />
      </div>
  </MuiThemeProvider>
  </Router>
  );
// <Route path={ROUTES.ADMIN} component={AdminPage} />

export default withAuthentication(App);
