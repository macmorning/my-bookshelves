import { createMuiTheme } from '@material-ui/core/styles';
import { red, blueGrey } from '@material-ui/core/colors';


function getTheme(theme) {
  return createMuiTheme({
    palette: {
      primary: blueGrey,
      secondary: red,
      error: red,
      type: theme.paletteType,
      background: {
        default: theme.paletteType === 'light' ? '#000' : '#fff',
      },
      contrastThreshold: 3,
      tonalOffset: 0.2,
    },
    props: {
      MuiButtonBase: {
        disableRipple: true,
      },
    },
  });
}

const theme = getTheme({
  paletteType: 'light',
});


export default theme;