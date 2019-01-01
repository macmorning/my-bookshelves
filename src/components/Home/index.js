import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import LinearProgress from '@material-ui/core/LinearProgress';
import Fade from '@material-ui/core/Fade';
import Drawer from '@material-ui/core/Drawer';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Column, Row } from 'simple-flexbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  },
  progress: {
    margin: theme.spacing.unit * 2,
  },
  main: {
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(900 + theme.spacing.unit * 3 * 2)]: {
      width: 900,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    paddingTop: '15px',
    height: '550px',
  },
  form: {
    margin: '10px'
  }
});

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      books: [],
      user: "",
      tooltipOpen: false,
      drawerOpen: false,
      currentBook: {}
    };
    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.loadBooks();
      }
    });
  }
  toggleDrawer = (open, book) => () => {
    console.log(book);
    this.setState({
      drawerOpen: open,
      currentBook: (book ? book : {})
    });
  };

  loadBooks() {
    let compare = (a,b) => {
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

  render() {
    const { books, loading, currentBook } = this.state; 
    const { classes } = this.props;
    const sideList = (
      <main className={classes.main}>
      <Paper className={classes.root} elevation={2}>
      <Column flexGrow={1}>
        <Row horizontal='center'>
          <Typography variant="h5" component="h2">
            {currentBook.title}
          </Typography>
        </Row>
        <Row horizontal='start' vertical='start'>
          <Column flexGrow={1} horizontal='center'>
            <img src={currentBook.imageURL} style={{ height:"400px" }} alt=""/>
          </Column>
          <Column flexGrow={1} alignItems='start'>
            <Row>
              <form className={classes.form} onSubmit={this.onSubmit}>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="author">Author</InputLabel>
                  <Input id="author" value={currentBook.author} name="author" autoComplete="author" onChange={this.onChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="series">Series</InputLabel>
                  <Input id="series" value={currentBook.series} name="series" autoComplete="series" onChange={this.onChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="volume">Volume</InputLabel>
                  <Input id="volume" value={currentBook.volume} name="volume" autoComplete="volume" onChange={this.onChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="published">Published</InputLabel>
                  <Input id="published" type="date" value={currentBook.published} name="published" autoComplete="published" onChange={this.onChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="publisher">Publisher</InputLabel>
                  <Input id="publisher" value={currentBook.publisher} name="publisher" autoComplete="publisher" onChange={this.onChange}/>
                </FormControl>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  Update
                </Button>
              </form>
            </Row>
            <Row vertical='start'>
              <IconButton color="secondary" component="a" target="_new" href={currentBook.detailsURL} className={classes.icon} alt="more informations">
                <InfoIcon/>
              </IconButton>
            </Row>
          </Column>
        </Row>
      </Column>
      </Paper>  
      </main>
    );
    
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
        <GridList cellHeight={180} cols={6} spacing={1} className={classes.gridList}>
          {books.map(book => (
              <GridListTile key={book.uid}>
              <img src={book.imageURL} alt={book.title} />
              <GridListTileBar
                title={book.title}
                subtitle={<span>{book.author}</span>}
                actionIcon={
                  <div>
                    <IconButton onClick={this.toggleDrawer(true, book)} className={classes.icon}>
                      <InfoIcon/>
                    </IconButton>
                  </div>
                }
              />
            </GridListTile>
          ))}
        </GridList>
        <Drawer style={{ backgroundColor: 'transparent' }} classes={{paper: classes.paper}} anchor="bottom" open={this.state.drawerOpen} onClose={this.toggleDrawer(false)}>
            {sideList}
        </Drawer>
      </div>
  );
  }
}


HomePage.propTypes = {
  classes: PropTypes.object.isRequired,
};
const condition = authUser => !!authUser;

export default withStyles(styles)(withFirebase(withAuthorization(condition)(HomePage)));