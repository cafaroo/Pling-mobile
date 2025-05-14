// Mock för expo-linear-gradient
const React = require('react');

// Skapa LinearGradient-komponenten
const LinearGradient = ({ 
  colors, 
  start, 
  end, 
  locations, 
  style, 
  children, 
  ...props 
}) => {
  return React.createElement(
    'view',
    {
      ...props,
      testID: props.testID || 'linear-gradient',
      style: {
        ...style,
        // Lägg till en bakgrundsfärg baserad på den första färgen om tillgänglig
        backgroundColor: colors && colors.length > 0 ? colors[0] : 'transparent',
      },
      'data-component': 'LinearGradient',
      'data-gradient-colors': JSON.stringify(colors || []),
      'data-gradient-start': JSON.stringify(start || { x: 0, y: 0 }),
      'data-gradient-end': JSON.stringify(end || { x: 1, y: 1 }),
      'data-gradient-locations': JSON.stringify(locations || []),
    },
    children
  );
};

// Exportera komponenten
module.exports = { LinearGradient }; 