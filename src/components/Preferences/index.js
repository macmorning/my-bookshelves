import React, { Component } from 'react';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const PREFS = [
  { name: "displayBackground", default: true},
];

class PreferencesForm extends Component {
  constructor(props) {
    super(props);
    let INITIAL_STATE = {};
    PREFS.forEach(function(item) {
      INITIAL_STATE[item.name] = (localStorage.getItem(item.name) !== null ? (localStorage.getItem(item.name)==="true") : item.default);
    });
    this.state = { ...INITIAL_STATE};
  }

  onChange = name => event => {
    this.setState({ [name]: event.target.checked });
    localStorage.setItem(name, event.target.checked);
  };

  render() {
    return (
      <main>
      <FormGroup row>
        <FormControlLabel
          control={
              <Switch
                name="displayBackground"
                checked={this.state.displayBackground}
                onChange={this.onChange("displayBackground")}
              />
          }
          label="Display background image on desktop"
        />
        </FormGroup>
      </main>
    );
  }
}


export default PreferencesForm;