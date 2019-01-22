import React, { Component } from 'react';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const INITIAL_STATE = {
  displayBackground: false
};

class PreferencesForm extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }

  onChange = name => event => {
    this.setState({ [name]: event.target.checked });
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
                value={true}
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