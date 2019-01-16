import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Column, Row } from 'simple-flexbox';
import DialogActions from '@material-ui/core/DialogActions';


const styles = theme => ({
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
  }
});

class BookEditorFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { currentBook: props.currentBook };
    this._onBookSubmit = this._onBookSubmit.bind(this);
 }

  _onBookSubmit(event) {
    event.preventDefault();
    this.props.onBookSubmit(this.state.currentBook);
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

    return (
      <main className={classes.main}>
      <Paper className={classes.root} elevation={2}>
      <Column flexGrow={1}>
        <Row horizontal='center'>
          <a target="_new" href={currentBook.detailsURL}>
            <Typography variant="h5" component="h2">    
              {currentBook.title}
            </Typography>
          </a>
        </Row>  
        <Row horizontal='start' vertical='start'>
          <MediaQuery query="(min-device-width: 1000px)">
            <Column className={classes.imgCol} flexGrow={1} horizontal='center'>
              <img src={currentBook.imageURL} style={{ height:"400px" }} alt=""/>
            </Column>
          </MediaQuery>
          <Column flexGrow={1} alignItems='start'>
          <form className={classes.form} onSubmit={this._onBookSubmit}>
            <Row style={{ maxHeight:"350px", overflow:"auto" }}>
            <Column flexGrow={1}>
            <Row>
                <TextField id="title"
                  label="Title" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.title} onChange={this.onBookChange} autoFocus />
            </Row>
            <Row>
                <TextField id="author"
                  label="Author" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.author} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="series"
                  label="Series" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.series} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="volume"
                  label="Volume" type="number" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.volume} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="published"
                  label="Published" type="date" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.published} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="publisher"
                  label="Publisher" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.publisher} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="imageURL"
                  label="image URL" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.imageURL} onChange={this.onBookChange} />
            </Row>
            <Row>
                <TextField id="detailsURL"
                  label="Details URL" placeholder="" fullWidth margin="normal" variant="outlined" InputLabelProps={{ shrink: true,}}
                  value={currentBook.detailsURL} onChange={this.onBookChange} />
            </Row>
            </Column>
            </Row>
            <Row>
                <DialogActions>
                  <Button type="submit" color="primary">
                      Save
                  </Button>
                  <Button onClick={this.props.onClose} color="primary">
                      Close
                  </Button>
                  <Button onClick={this.props.onBookRemove} color="secondary">
                      Delete
                  </Button>
                </DialogActions>
            </Row>
            </form>
          </Column>
        </Row>
      </Column>
      </Paper>
      </main>
    );
  }
}

const BookEditorForm = compose(
  withStyles(styles)
)(BookEditorFormBase);

BookEditorForm.propTypes = {
  onBookSubmit: PropTypes.func.isRequired,
  onBookRemove: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  currentBook: PropTypes.object.isRequired
};

export default BookEditorForm;