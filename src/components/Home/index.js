import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Scanner from '../Scanner';
import BookEditorForm from '../BookEditor';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import Drawer from '@material-ui/core/Drawer';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import green from '@material-ui/core/colors/green';

import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
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
    height: '475px',
  },
  form: {
    margin: '10px',
    width: '100%'
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
      confirm: false,
      currentBook: {},
      showSuccess: false,
      scanning: false,
      isbn: ""
    };

    let displayExtraColumns = (isWidthUp('sm', this.props.width) ? true : false);
    let displayExtraOptions = (isWidthUp('md', this.props.width) ? true : false);
    this.table_columns = [
    {
        name: "uid",
        options: { 
          filter: false,
          customBodyRender: (value,tableMeta) => <Button data-index={tableMeta.rowIndex} onClick={this.onCellClick}>{value}</Button>
        }
      }, {
        name:"createDate",
        options: {
          display: displayExtraColumns,
          filter: false,
        }
      }, {
        name: "series",
        options: { 
        }
      }, {
        name: "volume",
        options: { 
          filter: false,
        }
      }, {
        name: "title",
        options: { 
          filter: false,
        }
      }, 
      {
        name: "author",
        options: { 
          display: displayExtraColumns 
        }
      }, {
        name: "published",
        options: { 
          display: displayExtraColumns,
          filter: false,
        }
      }, {
        name: "publisher",
        options: {
          display: displayExtraColumns 
        }
      }
    ];

    this.table_options = {
      rowsPerPage: (displayExtraColumns ? 50 : 20),
      rowsPerPageOptions: [20,50,100],
      selectableRows: true,
      fixedHeader: true,
      filterType: "multiselect",
      print: false,
      download: displayExtraOptions,
      filter: displayExtraOptions,
      customToolbarSelect: function(selectedRows) { return (<Button data={selectedRows.data}>Modify</Button>);}
    }

    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.loadBooks();
      }
    });
  }

  componentWillUnmount() {
    this.props.firebase.books().off();
  }

  onCellClick = (event) => { 
      let index = event.target.getAttribute("data-index");
      this.setState({
        drawerOpen: true,
        currentBook: this.state.books[index]
      });
  }

  toggleDrawer = (open) => () => {
    this.setState({
      drawerOpen: (open ? open : false)
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

  // handle book removal
  onBookRemove = () => {
    this.setState({
      confirm: true
    })
  }
  closeConfirm = () => {
    this.setState({
      confirm: false
    })
  }
  onBookRemoveConfirmed = () => {
    this.closeConfirm();
    this.props.firebase.doRemoveBook(this.state.user,this.state.currentBook.uid)
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
          if (typeof attribute === 'object') {
            line.push(book[attribute.name] !== undefined ? book[attribute.name] : "");
          } else {
            line.push(book[attribute] !== undefined ? book[attribute] : "");
          }
      });
      booksData.push(line);
    })
    return booksData;
  }

  onDetected = event => {
    let code = event.codeResult.code;
    if (this.state.isbn !== code) {
      this.setState( { isbn: code });
    }
  }
  onBookSubmit = (book) => {
    this.setState({
      drawerOpen: false
    });
    this.props.firebase.doUpdateBook(this.state.user,book.uid,book).then(() => {
      this.setState({ showSuccess: true });
    }).catch(error => {
      this.setState({ error });
    });
  }
  onBookAdd = event => {
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

  onISBNChange = event => {
    let targetValue = event.target.value;
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

    return (
      <div>

          { !loading ? (
                <MUIDataTable
                  data={ this.getBooksData() }
                  columns={this.table_columns}
                  options={this.table_options}
                />
          ):(
            <LinearProgress />
          )}
        <Drawer classes={{paper: classes.paper}} anchor="bottom" open={this.state.drawerOpen} onClose={this.toggleDrawer(false)}>
          <BookEditorForm currentBook={currentBook} onBookSubmit={this.onBookSubmit} onBookRemove={this.onBookRemove} onClose={this.toggleDrawer(false)}/>
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
          open={this.state.confirm}
          onClose={this.closeConfirm}
          maxWidth='sm'
          fullWidth
          aria-labelledby="confirm-book-remove-dialog-title"
          aria-describedby="confirm-book-remove-dialog-description"
        >
          <DialogTitle id="confirm-book-remove-dialog-title">{this.state.currentBook.title}</DialogTitle>
          <DialogContentText style={{ margin: '10px' }} id="confirm-book-remove-dialog-description">
              Are you sure you want to remove this book from your shelves?
          </DialogContentText>
          <DialogActions>
            <Button onClick={this.removeBookConfirmed} color="secondary">
              Yes
            </Button>
            <Button onClick={this.closeConfirm} color="primary" autoFocus>
              Nooo!
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={this.state.scanning}
          onClose={this.stopScan}
          aria-labelledby="scan-dialog-title"
          maxWidth="md"
        >
          <DialogTitle id="scan-dialog-title">Scan a new book barcode</DialogTitle>
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