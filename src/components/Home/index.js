import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
// import compose from 'recompose/compose';
import Scanner from '../Scanner';
import PropTypes from 'prop-types';
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
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import MediaQuery from 'react-responsive';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Fab from '@material-ui/core/Fab';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import AddIcon from '@material-ui/icons/Add';
import green from '@material-ui/core/colors/green';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

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
  },
  message: {
    display: 'flex',
    alignItems: 'center'
  },
  success: {
    backgroundColor: green[600],
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
  },
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
      currentBook: {},
      showSuccess: false,
      scanning: false,
      results: []
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
  }

  startScan = () => {
    this.setState({
      scanning: true
    });
  }
  stopScan = () => {
    this.setState({
      scanning: false
    });
  }

  getGridListCols = () => {
    if (isWidthUp('xl', this.props.width)) {
      return 6;
    }
    if (isWidthUp('md', this.props.width)) {
      return 4;
    }
    if (isWidthUp('sm', this.props.width)) {
      return 2;
    }
    return 1;
  }

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


  onDetected = event => {
    let code = event.codeResult.code;
    if (this.state.results.indexOf(code) === -1) {
      this.setState(prevState => ({
        results: [...prevState.results,code]
      }));
    }
  }
  onBookSubmit = event => {
    console.log(this.state.currentBook);
    event.preventDefault();
    this.props.firebase.doUpdateBook(this.state.user,this.state.currentBook.uid,this.state.currentBook)
    .then(() => {
      this.setState({ 
        showSuccess: true,
        drawerOpen: false
       });
    })
    .catch(error => {
      this.setState({ error });
    });
  }
  onBookChange = event => {
    let targetName = event.target.name;
    let targetValue = event.target.value;
    // Make a copy of the object stored in state before replacing it
    this.setState(prevState => ({
      currentBook: {
          ...prevState.currentBook,
          [targetName]: targetValue
      }
    }));
  };

  onSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ showSuccess: false });
  };
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
          <MediaQuery query="(min-device-width: 1000px)">
            <Column className={classes.imgCol} flexGrow={1} horizontal='center'>
              <img src={currentBook.imageURL} style={{ height:"400px" }} alt=""/>
            </Column>
          </MediaQuery>
          <Column flexGrow={1} alignItems='start'>
            <Row>
              <form className={classes.form} onSubmit={this.onBookSubmit}>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="title">Title</InputLabel>
                  <Input id="title" value={currentBook.title} name="title" autoComplete="title" onChange={this.onBookChange} autofocus/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="author">Author</InputLabel>
                  <Input id="author" value={currentBook.author} name="author" autoComplete="author" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="series">Series</InputLabel>
                  <Input id="series" value={currentBook.series} name="series" autoComplete="series" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="volume">Volume</InputLabel>
                  <Input id="volume" type="number" value={currentBook.volume} name="volume" autoComplete="volume" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="published">Published</InputLabel>
                  <Input id="published" type="date" value={currentBook.published} name="published" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="publisher">Publisher</InputLabel>
                  <Input id="publisher" value={currentBook.publisher} name="publisher" autoComplete="publisher" onChange={this.onConBookChangehange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="imageURL">Image URL</InputLabel>
                  <Input id="imageURL" value={currentBook.imageURL} name="imageURL" onChange={this.onBookChange}/>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  className={classes.margin}
                  onClick={this.toggleDrawer(false)}
                >
                  Close
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
        <GridList cellHeight={180} cols={this.getGridListCols()} spacing={1} className={classes.gridList}>
          {books.map(book => (
              <GridListTile key={book.uid} onClick={this.toggleDrawer(true, book)}>
              <img src={book.imageURL} alt={book.title} />
              <GridListTileBar
              title={book.title}
              subtitle={<span><span color="secondary">{book.series}</span><span>{book.volume>0 ? " - " + book.volume : ""}</span></span>}
              />
            </GridListTile>
          ))}
        </GridList>
        <Drawer style={{ backgroundColor: 'transparent' }} classes={{paper: classes.paper}} anchor="bottom" open={this.state.drawerOpen} onClose={this.toggleDrawer(false)}>
            {sideList}
        </Drawer>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.showSuccess}
          autoHideDuration={3000}
          onClose={this.onSnackClose}
          ContentProps={{
            'aria-describedby': 'message-id',
          }} >
          <SnackbarContent
              className={classes.success}
              aria-describedby="client-snackbar"
              message={<span id="message-id"><CheckCircleIcon/>Changes saved</span>}
              />
        </Snackbar>
        <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.startScan}>
          <AddIcon />
        </Fab>

        <Dialog
          open={this.state.scanning}
          onClose={this.stopScan}
          aria-labelledby="draggable-dialog-title"
          maxWidth="md"
        >
          <DialogTitle id="draggable-dialog-title">Scan a new book barcode</DialogTitle>
          <DialogContent>
            <Scanner onDetected={this.onDetected}/>
            <ul className="results">
                    {this.state.results.map((result) => (<li key={result}>{result}</li>))}
            </ul>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.stopScan} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
  }
}


HomePage.propTypes = {
  classes: PropTypes.object.isRequired,
};
const condition = authUser => !!authUser;

export default withWidth()(withStyles(styles)(withFirebase(withAuthorization(condition)(HomePage))));
/*export default compose(
  withFirebase(),
  withStyles(styles),
  withAuthorization(condition),
  withWidth(),
)(HomePage);*/