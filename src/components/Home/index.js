import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import LinearProgress from '@material-ui/core/LinearProgress';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  },
  progress: {
    margin: theme.spacing.unit * 2,
  },
  bookInfos: {
    fontSize: 16
  }
});

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      books: [],
      user: ""
    };
    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.loadBooks();
      }
    });
  }
  loadBooks() {
    function compare(a,b) {
      if (a.computedOrderField < b.computedOrderField)
        return -1;
      if (a.computedOrderField > b.computedOrderField)
        return 1;
      return 0;
    }
    this.setState({ loading: true });
    this.props.firebase.books(this.state.user).orderByChild("computedOrderField").on('value', snapshot => {
      const booksObject = snapshot.val();

      const booksList = Object.keys(booksObject).map(key => ({
        ...booksObject[key],
        uid: key
      }));
      booksList.sort(compare);
      this.setState({
        books: booksList,
        loading: false,
      });
    });
  }

  componentWillUnmount() {
    this.props.firebase.books().off();
  }

  getTooltip(book) {
    return (
      <div className="bookInfos">
        title: {book.title}<br/>
        author: {book.author}<br/>
        series: {book.series}<br/>
        volume: {book.volume}<br/>
        published: {book.published}<br/>
        publisher: {book.publisher}<br/>
        <a href={book.detailsURL} target="_new">more informations</a>
      </div>
    );
  }

  render() {
    const { books, loading } = this.state; 
    const { classes } = this.props;
    return (
      <div>
          <Fade
            in={loading}
            style={{
              transitionDelay: loading ? '600ms' : '0ms',
            }}
            unmountOnExit
          >
            <LinearProgress />
          </Fade>
          <GridList cellHeight={210} cols={6} className={classes.gridList}>
              <GridListTile spacing={5} key="Subheader" cols={1} style={{ height: 'auto' }}>
                <ListSubheader component="div"></ListSubheader>
              </GridListTile>
            {books.map(book => (
                <GridListTile key={book.uid}>
                <img src={book.imageURL} alt={book.title} />
                <GridListTileBar
                  title={book.title}
                  subtitle={<span>by: {book.author}</span>}
                  actionIcon={
                    <Tooltip title={this.getTooltip(book)} interactive>
                      <IconButton className={classes.icon}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  }
                />
              </GridListTile>
            ))}
          </GridList>
        </div>
    );
  }
}


HomePage.propTypes = {
  classes: PropTypes.object.isRequired,
};
const condition = authUser => !!authUser;

export default withStyles(styles)(withFirebase(withAuthorization(condition)(HomePage)));