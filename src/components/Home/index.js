import React, { Component } from 'react';
import qs from 'query-string';
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
import EditIcon from '@material-ui/icons/Edit';
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
  fabModify: {
    position: 'fixed',
    bottom: theme.spacing.unit * 8,
    right: theme.spacing.unit * 2,
    zIndex: 200
  }
});


class HomePage extends Component {
  constructor(props) {
    super(props);
    this.booksObj = {};
    this.selectedBooks = [];
    this.booksData = [];
    this.params = qs.parse(this.props.location.search);
    this.largeScreen = (isWidthUp('md', this.props.width) ? true : false);
    this.state = {
      loading: true,
      series: [],
      publishers: [],
      user: "",
      drawerOpen: false,
      drawerMultiOpen: false,
      currentBook: { uid: "" },
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
          customBodyRender: (uid) => <Button bookid={uid}>{uid}</Button>
        }
      }, {
        name: "title",
        options: { 
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
        name:"dateAdded",
        options: {
          display: false,
          filter: false,
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
              series: this.booksObject[obj.props.bookid]["series"] || "",
              uid: obj.props.bookid
            },
            drawerOpen: true
          });
        } 
      },
      onRowClick: (rowData, rowMeta) => { 
        // console.log(rowMeta.dataIndex);
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
          this.selectedBooks = selectedRows.data.map(rowMeta => this.booksObject[this.booksData[rowMeta.dataIndex][0]]);
          return (<div><Fab color="secondary" aria-label="Modify" className={props.classes.fabModify} onClick={this.onModifySelected}>
              <EditIcon />
                </Fab></div>)
      }
    }

    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        let userId = user.uid;
        if (this.params.user) {
          userId = this.params.user;
        }
        this.props.firebase.user(userId).once("value", function(snapshot){
            let userInfo = snapshot.val();
            document.dispatchEvent(new CustomEvent("userAuth", {
              detail: {
                authUser: {
                  uid: user.uid,
                  displayName: user.displayName
                },
                user: {
                  uid: userId,
                  displayName: userInfo.displayName
                }
              }
            }));
        });
        this.setState({ 
          user: userId,
          authUser: user.uid
        });

        this.loadBooks();
      }
    });
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


  rebuildBooksDataFromObject = () => {
    this.booksData = [];
    Object.keys(this.booksObject).forEach((key) => {
      // rattrage de données au cas où le livre aurait été créé sans l'attribut uid
      if (this.booksObject[key]["uid"] === undefined) {
        this.booksObject[key]["uid"] = key;
      }
      let line = [];
      this.table_columns.forEach((attribute) => {
          if (typeof attribute === 'object') {
            line.push(this.booksObject[key][attribute.name] !== undefined ? this.booksObject[key][attribute.name] : "");
          } else {
            line.push(this.booksObject[key][attribute] !== undefined ? this.booksObject[key][attribute] : "");
          }
      });
      line[0] = key; // in case uid is not saved in object
      this.booksData.push(line);
    });
  }

  addBookDataFromObject = (id, book) => {
    let line = [];
    this.table_columns.forEach((attribute) => {
      if (typeof attribute === 'object') {
        line.push(book[attribute.name] !== undefined ? book[attribute.name] : "");
      } else {
        line.push(book[attribute] !== undefined ? book[attribute] : "");
      }
    });
    line[0] = id;
    this.booksData.push(line);
  }

  deleteBookDataFromObject = (id) => {
    this.booksData = this.booksData.filter((value) => {
      return value[0] !== id;
    });
  }

  rebuildBookDataFromObject = (id, book) => {
    let dataIndex = this.booksData.findIndex(x => x[0] === id);
    let line = [];
    this.table_columns.forEach((attribute) => {
      if (typeof attribute === 'object') {
        line.push(book[attribute.name] !== undefined ? book[attribute.name] : "");
      } else {
        line.push(book[attribute] !== undefined ? book[attribute] : "");
      }
    });
    line[0] = id;
    this.booksData[dataIndex] = line;
  }

  loadBooks() {
    this.setState({ loading: true });

    this.props.firebase.books(this.state.user).on("child_added", (snapshot) => {
      if(this.state.loading) return;
      var newBook = snapshot.val();
      this.booksObject[snapshot.key] = newBook;
      this.addBookDataFromObject(snapshot.key, newBook);
      if (this.state.isbn) {
        this.setState({
          currentBook : {
            ...this.booksObject[this.state.isbn],
            uid: this.state.isbn
            }
        });
      }
    });

    this.props.firebase.books(this.state.user).on("child_changed", (snapshot) => {
      var changedBook = snapshot.val();
      this.booksObject[snapshot.key] = changedBook;
      this.rebuildBookDataFromObject(snapshot.key, changedBook);
      if (this.state.isbn) {
        this.setState({
          currentBook : {
            ...this.booksObject[this.state.isbn],
            uid: this.state.isbn
            }
        });
      }
    });  

    this.props.firebase.books(this.state.user).on("child_removed", (snapshot) => {
      delete this.booksObject[snapshot.key];
      this.deleteBookDataFromObject(snapshot.key);
    });  

    this.props.firebase.books(this.state.user).orderByChild("computedOrderField").once('value').then((snapshot) => {
      this.booksObject = snapshot.val();
      let series = [];
      let publishers = [];
      if(this.booksObject) {
        series = [...new Set(Object.keys(this.booksObject).map(key => this.booksObject[key].series))];
        series = series.filter(el => el);
        series.sort();
        publishers = [...new Set(Object.keys(this.booksObject).map(key => this.booksObject[key].publisher))];
        publishers = publishers.filter(el => el);
        publishers.sort();
        this.rebuildBooksDataFromObject();
      }
      this.setState({
        loading: false,
        series: series,
        publishers: publishers
      });
    });

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
    console.log(error);
    this.setState({ 
      showError: true,
      error: error.error.message
     });
  }
  getBooksData = () => {
    // clone the array so that datatable is refreshed
    return this.booksData.slice(0);
  }

  onSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ 
      showSuccess: false,
      showError: false 
    });
  };
  render() {
    const { loading, currentBook, series, publishers } = this.state; 
    const { classes } = this.props;
    return (
      <div>

          { !loading ? (
                <MUIDataTable
                  data={this.getBooksData()}
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
           <BookEditorForm user={this.state.user} currentBook={currentBook} publishersArray={publishers} seriesArray={series} onSaveSuccess={this.onSaveSuccess} onSaveError={this.onSaveError} onClose={this.toggleDrawer}/>
        </Dialog>
        <Dialog
          open={this.state.drawerMultiOpen}
          onClose={this.toggleMultiDrawer}
          maxWidth="md"
          fullScreen={!this.largeScreen}
         >
          <BookMultiEditorForm user={this.state.user} booksArray={this.selectedBooks} publishersArray={publishers} seriesArray={series} onSaveSuccess={this.onSaveSuccess} onSaveError={this.onSaveError} onClose={this.toggleMultiDrawer}/>
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
        
        { this.state.user === this.state.authUser ? (
        <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.addDlgOpen}>
          <AddIcon />
        </Fab>):( <span/>)
        }

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
                  <Input id="isbn" value={this.state.isbn} name="isbn" onChange={this.onISBNChange} autocomplete="off"/>
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