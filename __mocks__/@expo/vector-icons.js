// Mock för @expo/vector-icons
const React = require('react');

// Hjälpfunktion för att skapa ikonkomponenter
const createIconComponent = (name) => {
  const IconComponent = ({ name: iconName, size = 24, color = 'black', style, ...props }) => {
    return React.createElement('view', {
      ...props,
      style: {
        width: size,
        height: size,
        ...(style || {}),
      },
      testID: props.testID || `icon-${name}-${iconName}`,
      'data-icon-family': name,
      'data-icon-name': iconName,
      'data-icon-color': color,
      'data-icon-size': size,
    });
  };

  IconComponent.displayName = name;
  return IconComponent;
};

// Skapa de mest använda ikonfamiljerna
const MaterialCommunityIcons = createIconComponent('MaterialCommunityIcons');
const MaterialIcons = createIconComponent('MaterialIcons');
const Ionicons = createIconComponent('Ionicons');
const FontAwesome = createIconComponent('FontAwesome');
const FontAwesome5 = createIconComponent('FontAwesome5');
const Feather = createIconComponent('Feather');
const AntDesign = createIconComponent('AntDesign');
const Entypo = createIconComponent('Entypo');
const EvilIcons = createIconComponent('EvilIcons');
const Fontisto = createIconComponent('Fontisto');
const Foundation = createIconComponent('Foundation');
const Octicons = createIconComponent('Octicons');
const SimpleLineIcons = createIconComponent('SimpleLineIcons');
const Zocial = createIconComponent('Zocial');

// Skapa factory-funktioner
const createIconSetFromIcoMoon = jest.fn(() => createIconComponent('IcoMoon'));
const createIconSetFromFontello = jest.fn(() => createIconComponent('Fontello'));
const createMultiStyleIconSet = jest.fn(() => createIconComponent('MultiStyle'));

// Hjälpfunktion för att ladda fonter (mock)
const loadFont = jest.fn().mockResolvedValue(true);

module.exports = {
  // Ikonfamiljer
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  FontAwesome,
  FontAwesome5,
  Feather,
  AntDesign,
  Entypo,
  EvilIcons,
  Fontisto,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
  
  // Factory-funktioner
  createIconSetFromIcoMoon,
  createIconSetFromFontello,
  createMultiStyleIconSet,
  
  // Hjälpfunktioner
  loadFont,
  
  // Direktexport för moduler som använder direkt import
  Entypo: Entypo,
  EvilIcons: EvilIcons,
  Feather: Feather,
  FontAwesome: FontAwesome,
  FontAwesome5: FontAwesome5,
  Fontisto: Fontisto,
  Foundation: Foundation,
  Ionicons: Ionicons,
  MaterialIcons: MaterialIcons,
  MaterialCommunityIcons: MaterialCommunityIcons,
  Octicons: Octicons,
  SimpleLineIcons: SimpleLineIcons,
  Zocial: Zocial,
  AntDesign: AntDesign,
}; 