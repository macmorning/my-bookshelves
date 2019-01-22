import React, { Component } from 'react';
import { withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Scanner from '../Scanner';
import BookEditorForm, {BookMultiEditorForm} from '../BookEditor';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import InfoIcon from '@material-ui/icons/Info';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
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
    this.booksObj = {};
    this.selectedBooks = [];
    this.largeScreen = (isWidthUp('md', this.props.width) ? true : false);
    this.state = {
      loading: true,
      books: [],
      user: "",
      drawerOpen: false,
      drawerMultiOpen: false,
      currentBook: {},
      showSuccess: false,
      showError: false,
      addDlgOpen: false,
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
          customBodyRender: (uid) => <a href="javascript:void(0);" bookid={uid}>{uid}</a>
        }
      }, {
        name:"dateAdded",
        options: {
          display: displayExtraColumns,
          filter: false,
        }
      }, {
        name: "series",
        options: { 
          display: true,
        }
      }, {
        name: "volume",
        options: { 
          display: true,
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
          display: displayExtraColumns,
        }
      }, {
        name: "detailsURL",
        options: {
          filter: false,
          display: displayExtraColumns,
          customBodyRender: (url) => {
              if (url!==undefined && url!=="") { 
               return ( <a href={url}  rel="noopener noreferrer" target="_blank"><InfoIcon color="primary"/></a>); 
              } else {
                return ("");
              }
            }
        }
      }, {
        name: "computedOrderField",
        options: {
          filter: false,
          display: false,
          sortDirection: 'asc'
        }
      }
    ];

    this.table_options = {
      onCellClick: (obj) => { if(obj.props && obj.props.bookid) { this.setState({ 
            currentBook: {
              ...this.booksObject[obj.props.bookid],
              uid: obj.props.bookid
            },
            drawerOpen: true
          });
        } 
      },
      textLabels: {
        body: {
          noMatch: "No book found!",
        },
      },
      rowsPerPage: (displayExtraColumns ? 50 : 20),
      rowsPerPageOptions: [20,50,100],
      selectableRows: true,
      fixedHeader: true,
      filterType: "multiselect",
      print: false,
      responsive: "stacked",
      download: displayExtraOptions,
      filter: displayExtraOptions,
      customToolbarSelect: (selectedRows) => {
          this.selectedBooks = selectedRows.data.map(rowMeta => this.state.books[rowMeta.dataIndex]);
          return (<Button onClick={this.onModifySelected}>Modify</Button>);
      }
    }

    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.loadBooks();
      }
    });
  }

  setEditorRef(node) {
    this.childNode = node;
  }
  callEditorUpdate(book) {
    this.childNode.updatebook(this.state.currentBook);
  }
  componentWillUnmount() {
    this.props.firebase.books().off();
  }

  toggleDrawer = (open) => {
    this.setState({
      drawerOpen: (open===true ? true : false)
    });
  }
  toggleMultiDrawer = (open) => {
    this.setState({
      drawerMultiOpen: (open===true ? true : false)
    });
  }

  onModifySelected = (event) => {
    this.setState({
      drawerOpen: false,
      drawerMultiOpen: true
    });
  }

  startScan = () => {
    this.setState({
      scanning: true
    });
  }
  stopScan = () => {
    this.setState({
      addDlgOpen: false,
      scanning: false
    });
  }
  addDlgOpen = () => {
    this.setState({
      addDlgOpen: true,
      scanning: false
    });
  }
  loadBooks() {
    this.setState({ loading: true });

    this.props.firebase.books(this.state.user).orderByChild("computedOrderField").on('value', snapshot => {
      this.booksObject = snapshot.val();
      let booksList = [];
      if(this.booksObject) {
        booksList = Object.keys(this.booksObject).map(key => ({
          ...this.booksObject[key],
          uid: key
        }));
        if (this.state.isbn) {
          this.setState({
            currentBook : {
              ...this.booksObject[this.state.isbn],
              uid: this.state.isbn
              }
          });
        }
      }
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
      this.setState( {
         isbn: code,
         scanning: false
      });
    }
  }

  onBookAdd = event => {
    event.preventDefault();
    this.setState({
      addDlgOpen: false,
      scanning: false
    });
    this.props.firebase.doAddBook(this.state.user,this.state.isbn)
    .then(() => {
      this.setState({ 
        currentBook: {
          ...this.booksObject[this.state.isbn],
          uid: this.state.isbn
        },
        drawerOpen: true
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

  onSaveSuccess = () => {
    this.setState({ 
      showSuccess: true,
      drawerOpen: false,
      drawerMultiOpen: false
    });
  }
  onSaveError = (error) => {
    this.setState({ 
      showError: true,
      error: error
     });
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
         <Dialog
          open={this.state.drawerOpen}
          onClose={this.toggleDrawer}
          maxWidth="md"
          fullScreen={!this.largeScreen}
          aria-labelledby="book-dialog-title"
        >
          <DialogTitle id="book-dialog-title">{ currentBook.needLookup === 1 ? <CircularProgress/> : currentBook.title }</DialogTitle>
           <BookEditorForm uid={currentBook.uid} onSaveSuccess={this.onSaveSuccess} onSaveError={this.onSaveError} onClose={this.toggleDrawer}/>
        </Dialog>
        <Dialog
          open={this.state.drawerMultiOpen}
          onClose={this.toggleMultiDrawer}
          maxWidth="md"
          fullScreen={!this.largeScreen}
         >
          <BookMultiEditorForm bookArray={this.selectedBooks} onSaveSuccess={this.onSaveSuccess} onSaveError={this.onSaveError} onClose={this.toggleMultiDrawer}/>
        </Dialog>
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

        <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.addDlgOpen}>
          <AddIcon />
        </Fab>

        <Dialog
          open={this.state.addDlgOpen}
          onClose={this.stopScan}
          maxWidth="md"
          fullScreen={!this.largeScreen}
        >
          { this.state.scanning ? (
            <DialogContent>
              <Scanner fullWidth onDetected={this.onDetected}/>
            </DialogContent>
            ):(
            <DialogContent>
               <Button fullWidth onClick={this.startScan} color="primary">
                  <PhotoCameraIcon/>
                </Button>            
                <form id="isbnForm" onSubmit={this.onBookAdd}>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="isbn">ISBN</InputLabel>
                  <Input id="isbn" value={this.state.isbn} name="isbn" onChange={this.onISBNChange}/>
                </FormControl>
                </form>
            </DialogContent>
          )}

          <DialogActions>
            <Button type="submit" form="isbnForm" onClick={this.onBookAdd} color="secondary">
                Add
            </Button>
            <Button onClick={this.stopScan} color="primary">
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