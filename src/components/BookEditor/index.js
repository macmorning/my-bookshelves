import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { withFirebase } from '../Firebase';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { Column, Row } from 'simple-flexbox';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';

const styles = theme => ({
  main: {
    margin: theme.spacing.unit * 2,
  },
  form: {
    margin: '10px',
    width: '95%'
  },
  cover: {
    height:"400px",
    border:"1px black solid"
  }
});


class BookMultiEditorFormBase extends Component {
  constructor(props) {
    super(props);
    this.bookArray = props.bookArray;
    this.state = {
      currentValues: {
        author: "",
        series: "",
        publisher: ""
      }
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
      } else {
        // No user is signed in.
      }
    });
  }

  onFormSubmit(event) {
    event.preventDefault();
    this.bookArray.forEach((book) => {
      book = { ...book,
        author: this.state.currentValues.author || book.author,
        series: this.state.currentValues.series || book.series,
        publisher: this.state.currentValues.publisher || book.publisher
      }
      this.props.firebase.doUpdateBook(this.state.user,book.uid,book).then(() => {
        this.props.onSaveSuccess();
      }).catch(error => {
        this.props.onSaveError({ error });
      });
    });
  }
  onValueChange = event => {
    let targetName = event.target.id;
    let targetValue = event.target.value;
    // Make a copy of the object stored in state before replacing it
    this.setState(prevState => ({
      currentValues: {
          ...prevState.currentValues,
          [targetName]: targetValue
      }
    }));
  };
  render() {
      const { classes } = this.props;
      const { currentValues } = this.state;
      return (
        <main className={classes.main}>
          <form className={classes.form} onSubmit={this.onFormSubmit}>
                <TextField id="author"
                  label="Author" placeholder="" value={currentValues.author} onChange={this.onValueChange} fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}/>
                <TextField id="series"
                  label="Series" placeholder="" value={currentValues.series} onChange={this.onValueChange} fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}/>
                <TextField id="publisher"
                  label="Publisher" placeholder="" value={currentValues.publisher} onChange={this.onValueChange} fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}/>
               <DialogActions>
                  <Button type="submit" color="primary">
                      Save
                  </Button>
                  <Button onClick={this.props.onClose} color="primary">
                      Close
                  </Button>
                </DialogActions>
          </form>
      </main>
      );
  }
}



const BookMultiEditorForm = compose(
  withFirebase,
  withStyles(styles)
)(BookMultiEditorFormBase);

BookMultiEditorForm.propTypes = {
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveError: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  bookArray: PropTypes.array.isRequired
};

export {BookMultiEditorForm};



class BookEditorForm extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      currentBook: {},
      confirm: false
    };
    this.onBookSubmit = this.onBookSubmit.bind(this);
    let auth = this.props.firebase.auth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.uid });
        this.props.firebase.book(this.state.user,this.props.uid).on('value', (snapshot) => {
          let book = snapshot.val();
          this.setState(prevState => ({
            currentBook: {
                ...book,
                uid: this.props.uid
            }
          }));
        });
      } else {
        // No user is signed in.
      }
    });    
 }
  onBookSubmit(event) {
    event.preventDefault();
    this.props.firebase.doUpdateBook(this.state.user,this.state.currentBook.uid,this.state.currentBook).then(() => {
      this.props.onSaveSuccess();
    }).catch(error => {
      this.props.onSaveError({ error });
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
      this.props.onSaveSuccess();
    })
    .catch(error => {
      this.props.onSaveError({ error });
    });
  }

  onBookChange = event => {
    let targetName = event.target.id;
    let targetValue = event.target.value;
    // Make a copy of the object stored in state before replacing it
    this.setState(prevState => ({
      currentBook: {
          ...prevState.currentBook,
          [targetName]: targetValue
      }
    }));
  };
  render() {
    const { classes } = this.props;
    const { currentBook } = this.state;
    let cover = "";
    if (currentBook.imageURL) {
        cover = <img  src={currentBook.imageURL} className={classes.cover} alt=""/>;
    } 
    return (
      <main className={classes.main}>
      <Dialog
        open={this.state.confirm}
        onClose={this.closeConfirm}
        maxWidth='sm'
        fullWidth
        aria-labelledby="confirm-book-remove-dialog-title"
        aria-describedby="confirm-book-remove-dialog-description"
      >
        <DialogTitle id="confirm-book-remove-dialog-title">{this.state.currentBook.title ? currentBook.title : "Untitled book"}</DialogTitle>
        <DialogContentText style={{ margin: '10px' }} id="confirm-book-remove-dialog-description">
            Are you sure you want to remove this book from your shelves?
        </DialogContentText>
        <DialogActions>
          <Button onClick={this.onBookRemoveConfirmed} color="secondary">
            Yes
          </Button>
          <Button onClick={this.closeConfirm} color="primary" autoFocus>
            Nooo!
          </Button>
        </DialogActions>
      </Dialog>

      <Column flexGrow={1}>
        <Row horizontal='start' vertical='start'>
          <MediaQuery query="(min-width: 1000px)">
            <Column className={classes.imgCol} flexGrow={1} horizontal='center'>
              {cover}
            </Column>
          </MediaQuery>
          <Column flexGrow={1} alignItems='start'>
            <Row style={{ maxHeight:"350px", overflow:"auto" }}>
            <form id="bookEditor" className={classes.form} onSubmit={this.onBookSubmit}>
                <TextField id="title"
                  label="Title" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.title} onChange={this.onBookChange} autoFocus />
                <TextField id="author"
                  label="Author" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.author} onChange={this.onBookChange} />
                <TextField id="series"
                  label="Series" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.series} onChange={this.onBookChange} />
                <TextField id="volume"
                  label="Volume" type="number" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.volume} onChange={this.onBookChange} />
                <TextField id="published"
                  label="Published" type="date" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.published} onChange={this.onBookChange} />
                <TextField id="publisher"
                  label="Publisher" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.publisher} onChange={this.onBookChange} />
                <TextField id="imageURL"
                  label="image URL" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.imageURL} onChange={this.onBookChange} />
                <TextField id="detailsURL"
                  label="Details URL" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.detailsURL} onChange={this.onBookChange} />
              </form>
            </Row>
            <Row>
                <DialogActions>
                  <Button type="submit" form="bookEditor" color="primary">
                      Save
                  </Button>
                  <Button onClick={this.props.onClose} color="primary">
                      Close
                  </Button>
                  <Button onClick={this.onBookRemove} color="secondary">
                      Delete
                  </Button>
                </DialogActions>
            </Row>
          </Column>
        </Row>
      </Column>
      </main>
    );
  }
}


BookEditorForm.propTypes = {
  showCover: PropTypes.bool,
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveError: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
};

export default (withStyles(styles)(withFirebase(BookEditorForm)));
