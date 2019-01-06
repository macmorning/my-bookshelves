import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
// import compose from 'recompose/compose';
import Scanner from '../Scanner';
import PropTypes from 'prop-types';
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
import AddIcon from '@material-ui/icons/Add';
import green from '@material-ui/core/colors/green';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import MUIDataTable from "mui-datatables";

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
    bottom: theme.spacing.unit * 8,
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
      isbn: ""
    };

    this.table_columns = ["uid", "series", "volume", "title", "author", "published", "publisher"];
    this.table_options = {
      onRowClick: (rowData, rowMeta) => { 
        console.log(this.state.books);
        console.log(rowMeta.dataIndex);
        console.log(this.state.books[rowMeta.dataIndex]);
        this.setState({
          drawerOpen: true,
          currentBook: this.state.books[rowMeta.dataIndex]
        });
      },
      rowsPerPage: 50,
      rowsPerPageOptions: [20,50,100],
      selectableRows: false,
      fixedHeader: true,
      filterType: "multiselect"
    }

    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.loadBooks();
      }
    });
  }

  toggleDrawer = (open, book) => () => {
     this.setState({
      drawerOpen: open,
      currentBook: (book ? book : {})
    });
    console.log(book);
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

  getBooksData() {
    const booksData = [];
    let table_columns = this.table_columns;
    this.state.books.forEach(function(book) {
      let line = [];
      table_columns.forEach(function(attribute) {
          line.push(book[attribute] !== undefined ? book[attribute] : "");
      });
      booksData.push(line);
    })
    return booksData;
  }

  componentWillUnmount() {
    this.props.firebase.books().off();
  }


  onDetected = event => {
    let code = event.codeResult.code;
    if (this.state.isbn !== code) {
      this.setState( { isbn: code });
    }
  }
  onBookSubmit = event => {
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
  onBookAdd = event => {
    console.log("adding " + this.state.isbn);
    this.setState({
      scanning: false
    });
    this.props.firebase.doAddBook(this.state.user,this.state.isbn)
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
  onISBNChange = event => {
    let targetValue = event.target.value;
    // Make a copy of the object stored in state before replacing it
    this.setState({ isbn: targetValue});
  }
  onSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ showSuccess: false });
  };
  render() {
    const { loading, currentBook } = this.state; 
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
                  <Input id="title" value={currentBook.title} name="title" autoComplete="title" onChange={this.onBookChange} autoFocus/>
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
                  <Input id="published" placeholder="" type="date" value={currentBook.published} name="published" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="publisher">Publisher</InputLabel>
                  <Input id="publisher" value={currentBook.publisher} name="publisher" autoComplete="publisher" onChange={this.onBookChange}/>
                </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="imageURL">Image URL</InputLabel>
                  <Input id="imageURL" value={currentBook.imageURL} name="imageURL" onChange={this.onBookChange}/>
                </FormControl>
                <DialogActions>
                  <Button type="submit" color="primary">
                      Save
                  </Button>
                  <Button onClick={this.toggleDrawer(false)} color="secondary">
                      Close
                  </Button>
                </DialogActions>
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
        <MUIDataTable
          data={ this.getBooksData() }
          columns={this.table_columns}
          options={this.table_options}
        />
        <Drawer classes={{paper: classes.paper}} anchor="bottom" open={this.state.drawerOpen} onClose={this.toggleDrawer(false)}>
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
              message={<span id="message-id">Changes saved</span>}
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
            <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="isbn">ISBN</InputLabel>
                  <Input id="isbn" value={this.state.isbn} name="isbn" onChange={this.onISBNChange} autoFocus/>
            </FormControl>
          </DialogContent>
          <DialogActions>
          <Button onClick={this.onBookAdd} color="primary">
              Add
            </Button>
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