const React = require('react');

// Skapar en enkel komponentfabrik för att generera react-native-paper komponenter
const createComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', { 
      ...props,
      testID: props.testID || `paper-${name}`,
      name: name
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// Card-komponenter
const Card = createComponent('Card');
Card.Title = createComponent('Card.Title');
Card.Content = createComponent('Card.Content');
Card.Cover = createComponent('Card.Cover');
Card.Actions = createComponent('Card.Actions');

// List-komponenter
const List = createComponent('List');
List.Item = createComponent('List.Item');
List.Icon = createComponent('List.Icon');
List.Section = createComponent('List.Section');
List.Accordion = createComponent('List.Accordion');
List.AccordionGroup = createComponent('List.AccordionGroup');
List.Subheader = createComponent('List.Subheader');

// Text och typografi
const Text = createComponent('Text');
const Title = createComponent('Title');
const Headline = createComponent('Headline');
const Subheading = createComponent('Subheading');
const Paragraph = createComponent('Paragraph');
const Caption = createComponent('Caption');

// Interaktiva komponenter
const Button = ({ onPress, ...props }) => {
  return React.createElement('button', { 
    ...props,
    testID: props.testID || 'paper-button',
    onClick: onPress
  }, props.children);
};
Button.displayName = 'Button';

const IconButton = ({ onPress, ...props }) => {
  return React.createElement('button', { 
    ...props,
    testID: props.testID || 'paper-icon-button',
    onClick: onPress
  }, props.children);
};
IconButton.displayName = 'IconButton';

// Formulärkomponenter
const TextInput = ({ value, onChangeText, ...props }) => {
  return React.createElement('input', { 
    ...props,
    testID: props.testID || 'paper-text-input',
    value: value,
    onChange: (e) => onChangeText && onChangeText(e.target.value)
  });
};
TextInput.displayName = 'TextInput';

// Statuskomponenter
const ActivityIndicator = createComponent('ActivityIndicator');
const ProgressBar = createComponent('ProgressBar');

// Dialog och modals
const Dialog = createComponent('Dialog');
Dialog.Title = createComponent('Dialog.Title');
Dialog.Content = createComponent('Dialog.Content');
Dialog.Actions = createComponent('Dialog.Actions');
Dialog.ScrollArea = createComponent('Dialog.ScrollArea');

const Modal = createComponent('Modal');
const Portal = ({ children }) => children;
Portal.displayName = 'Portal';

// Surface och kapsling
const Surface = createComponent('Surface');
const Appbar = createComponent('Appbar');
Appbar.Header = createComponent('Appbar.Header');
Appbar.Content = createComponent('Appbar.Content');
Appbar.Action = createComponent('Appbar.Action');
Appbar.BackAction = createComponent('Appbar.BackAction');

// Navigation
const BottomNavigation = createComponent('BottomNavigation');
const Drawer = createComponent('Drawer');
Drawer.Item = createComponent('Drawer.Item');
Drawer.Section = createComponent('Drawer.Section');

// Feedback
const Snackbar = createComponent('Snackbar');
const Banner = createComponent('Banner');
const HelperText = createComponent('HelperText');

// Tema och styling
const useTheme = () => ({
  colors: {
    primary: '#6200ee',
    background: '#f6f6f6',
    surface: '#ffffff',
    accent: '#03dac4',
    error: '#b00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: 'rgba(0, 0, 0, 0.26)',
    placeholder: 'rgba(0, 0, 0, 0.54)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
  },
  fonts: {
    regular: { fontFamily: 'System' },
    medium: { fontFamily: 'System-Medium' },
    light: { fontFamily: 'System-Light' },
    thin: { fontFamily: 'System-Thin' },
  },
  dark: false,
});

// Provider
const Provider = ({ children, theme }) => {
  return React.createElement('view', { 
    testID: 'paper-provider',
    'data-theme': theme || 'default'
  }, children);
};
Provider.displayName = 'PaperProvider';

// Exportera allt
module.exports = {
  Card,
  List,
  Text,
  Title,
  Headline,
  Subheading,
  Paragraph,
  Caption,
  Button,
  IconButton,
  TextInput,
  ActivityIndicator,
  ProgressBar,
  Dialog,
  Modal,
  Portal,
  Surface,
  Appbar,
  BottomNavigation,
  Drawer,
  Snackbar,
  Banner,
  HelperText,
  useTheme,
  Provider,
  // Specialkomponenter
  Switch: createComponent('Switch'),
  Checkbox: createComponent('Checkbox'),
  RadioButton: createComponent('RadioButton'),
  Divider: createComponent('Divider'),
  Chip: createComponent('Chip'),
  Badge: createComponent('Badge'),
  Menu: createComponent('Menu'),
  Searchbar: createComponent('Searchbar'),
  FAB: createComponent('FAB'),
  ToggleButton: createComponent('ToggleButton'),
  SegmentedButtons: createComponent('SegmentedButtons'),
  // Defaultexport
  default: {
    Card,
    List,
    Text,
    Title,
    Headline,
    Subheading,
    Paragraph,
    Caption,
    Button,
    IconButton,
    TextInput,
    ActivityIndicator,
    ProgressBar,
    Dialog,
    Modal,
    Portal,
    Surface,
    Appbar,
    BottomNavigation,
    Drawer,
    Snackbar,
    Banner,
    HelperText,
    useTheme,
    Provider,
  }
}; 