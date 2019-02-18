import React from 'react';
import { Link } from 'react-router-dom';
import qs from 'query-string';
import * as ROUTES from '../../constants/routes';
import { AuthUserContext } from '../Session';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Cover01 from '../../assets/01.png';
import Cover02 from '../../assets/02.png';
import Cover03 from '../../assets/03.png';
import Cover04 from '../../assets/04.png';
import Cover05 from '../../assets/05.png';
import Cover06 from '../../assets/06.png';
import Cover07 from '../../assets/07.png';
import Cover08 from '../../assets/08.png';
import Cover09 from '../../assets/09.png';
import Cover10 from '../../assets/10.png';

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
  let params = qs.parse(window.location.search);
  let displayBackground = (localStorage.getItem("displayBackground") !== null ? (localStorage.getItem("displayBackground")==="true") : true);
  let largeScreen = (isWidthUp('md', props.width) ? true : false);
  let rootDiv = document.getElementById("root");
  let topDiv = document.getElementById("top");
  if (largeScreen && displayBackground) {
        let coversArray = [
          "url(" + Cover01 + ")",
          "url(" + Cover02 + ")",
          "url(" + Cover03 + ")",
          "url(" + Cover04 + ")",
          "url(" + Cover05 + ")",
          "url(" + Cover06 + ")",
          "url(" + Cover07 + ")",
          "url(" + Cover08 + ")",
          "url(" + Cover09 + ")",
          "url(" + Cover10 + ")",
        ]
        let randCover = Math.floor(Math.random() * coversArray.length);
        rootDiv.style.backgroundImage = coversArray[randCover];
        topDiv.style.opacity = 0.75;
  } else {
    rootDiv.style.backgroundImage = "";
    topDiv.style.opacity = 1;
  }

  return (
  <AuthUserContext.Consumer>
    {authUser =>
      authUser ? <NavigationAuth {...props} authUser={authUser.uid} user={params.user}/> : <NavigationNonAuth {...props}/>
    }
  </AuthUserContext.Consumer>
  );
}

class NavigationAuth extends React.Component {
  constructor(props) {
    super(props);
    this.users = {
      user: {
        displayName : ""
      },
      authUser: {
        displayName : ""
      }
    };
    this.state = {
      userName: ""
    }
  }
  updateUsers = (userInfo) => {
    this.users = userInfo;
    this.setState({
      userName : (this.users.user.uid !== this.users.authUser.uid ? "(" + this.users.user.displayName + ")" : "")
    });
  }
  render() {
    document.addEventListener("userAuth", (e) => { 
      this.updateUsers(e.detail);
    });
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography id="title" variant="h6" color="inherit">
              BD Tek {this.state.userName}
            </Typography>
            
            <div className={classes.grow} />

            <IconButton color="inherit" component={Link} key="Home" to={ROUTES.HOME}>
              <LibraryBooksIcon/>
            </IconButton>            
            <IconButton color="inherit" component={Link} key="Account" to={ROUTES.ACCOUNT}>
              <AccountBoxIcon/>
            </IconButton>
            <IconButton color="inherit" component={Link} key="Search content" to={ROUTES.SEARCH}>
              <SearchIcon/>
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
      <AppBar position="static">
        <Toolbar variant="dense">
            <Typography variant="h6" color="inherit" className={classes.grow}>
              BD Tek
            </Typography>
            <IconButton color="inherit" component={Link} key="Sign In" to={ROUTES.SIGN_IN}>
              <AccountBoxIcon/>
            </IconButton>
            <IconButton color="inherit" component={Link} key="Search content" to={ROUTES.SEARCH}>
              <SearchIcon/>
            </IconButton>

        </Toolbar>
      </AppBar>
    </div>
  )
}

Navigation.propTypes = {
  classes: PropTypes.object.isRequired,
};
export default withWidth()(withStyles(styles)(Navigation));
