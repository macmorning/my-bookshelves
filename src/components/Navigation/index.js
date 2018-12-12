import React from 'react';
import { Link } from 'react-router-dom';

import SignOutButton from '../SignOut';
import * as ROUTES from '../../constants/routes';
import { AuthUserContext } from '../Session';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import HomeIcon from '@material-ui/icons/Home';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';

const styles = {
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  list: {
    width: 250,
  }
};

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
  state = {
    left: false
  };
  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });
  };
  render() {
    const { classes } = this.props;

    const sideList = (
      <div className={classes.list}>
        <List>
            <ListItem key="Landing" component={Link} to={ROUTES.LANDING}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Landing">Landing</ListItemText>
            </ListItem>
            <ListItem key="Home" component={Link} to={ROUTES.HOME}>
              <ListItemIcon><LibraryBooksIcon /></ListItemIcon>
              <ListItemText primary="Home">Home</ListItemText>
            </ListItem>
            <ListItem key="Account" component={Link} to={ROUTES.ACCOUNT}>
              <ListItemIcon><AccountBoxIcon /></ListItemIcon>
              <ListItemText primary="Account">Account</ListItemText>
            </ListItem>
        </List>
      </div>
    );
    
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton className={classes.menuButton} onClick={this.toggleDrawer('left', true)} color="inherit" aria-label="Menu">
              <MenuIcon/>
            </IconButton>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              BD Tek
            </Typography>
            <SignOutButton />
          </Toolbar>
        </AppBar>
        <Drawer open={this.state.left} onClose={this.toggleDrawer('left', false)}>
            <div
              tabIndex={0}
              role="button"
              onClick={this.toggleDrawer('left', false)}
              onKeyDown={this.toggleDrawer('left', false)}
            >
              {sideList}
            </div>
        </Drawer>
      </div>
    );
  }
}

function NavigationNonAuth(props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <AppBar position="static">
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
