import React from 'react';
import { Link } from 'react-router-dom';

import * as ROUTES from '../../constants/routes';
import { AuthUserContext } from '../Session';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';


const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  list: {
    width: 250,
  },
});

function Navigation(props) {
  return (
  <AuthUserContext.Consumer>
    {authUser =>
      authUser ? <NavigationAuth {...props} /> : <NavigationNonAuth {...props}/>
    }
  </AuthUserContext.Consumer>
  );
}

class NavigationAuth extends React.Component {

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <AppBar>
          <Toolbar>
            <Typography variant="h6" color="inherit">
              BD Tek
            </Typography>
            
            <div className={classes.grow} />

            <IconButton color="inherit" component={Link} key="Home" to={ROUTES.HOME}>
              <LibraryBooksIcon/>
            </IconButton>            
            <IconButton color="inherit" component={Link} key="Account" to={ROUTES.ACCOUNT}>
              <AccountBoxIcon/>
            </IconButton>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

function NavigationNonAuth(props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <AppBar position="fixed">
        <Toolbar>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              BD Tek
            </Typography>
            <Button variant="contained" href={ROUTES.SIGN_IN} color="primary">
              Sign In
            </Button>
        </Toolbar>
      </AppBar>
    </div>
  )
}

Navigation.propTypes = {
  classes: PropTypes.object.isRequired,
};
export default withStyles(styles)(Navigation);
