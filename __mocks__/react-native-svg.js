// Mock för react-native-svg
// Detta hjälper till att lösa problem med lucide-react-native
const React = require('react');

// Skapa en enkel komponentfabrik för att generera SVG-komponenter
const createComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', { 
      ...props,
      testID: props.testID || `svg-${name}`,
      name: name
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// SVG API
const Svg = createComponent('Svg');
Svg.displayName = 'Svg';

// SvgUri mock
const SvgUri = createComponent('SvgUri');
SvgUri.displayName = 'SvgUri';

// SvgXml mock
const SvgXml = createComponent('SvgXml');
SvgXml.displayName = 'SvgXml';

// SvgCss mock
const SvgCss = createComponent('SvgCss');
SvgCss.displayName = 'SvgCss';

// SvgFromUri mock
const SvgFromUri = createComponent('SvgFromUri');
SvgFromUri.displayName = 'SvgFromUri';

// SvgFromXml mock
const SvgFromXml = createComponent('SvgFromXml');
SvgFromXml.displayName = 'SvgFromXml';

// SVG-element
const Circle = createComponent('Circle');
const Ellipse = createComponent('Ellipse');
const G = createComponent('G');
const LinearGradient = createComponent('LinearGradient');
const RadialGradient = createComponent('RadialGradient');
const Line = createComponent('Line');
const Path = createComponent('Path');
const Polygon = createComponent('Polygon');
const Polyline = createComponent('Polyline');
const Rect = createComponent('Rect');
const Symbol = createComponent('Symbol');
const Text = createComponent('Text');
const Use = createComponent('Use');
const Defs = createComponent('Defs');
const Stop = createComponent('Stop');
const Mask = createComponent('Mask');
const Pattern = createComponent('Pattern');
const ClipPath = createComponent('ClipPath');
const TSpan = createComponent('TSpan');
const Image = createComponent('Image');
const ForeignObject = createComponent('ForeignObject');

// Mock för SvgTouchableMixin
const Mixin = {
  propTypes: {},
  extractResponder: () => ({ prop: null, expr: null }),
};

// Shape har speciella egenskaper som vissa komponenter behöver
const Shape = {
  fill: '#000',
  fillOpacity: 1,
  stroke: 'none',
  strokeWidth: 1,
  strokeOpacity: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeDasharray: 'none',
  strokeDashoffset: 0,
};

module.exports = {
  Svg,
  Circle,
  Ellipse,
  G,
  Text,
  TSpan,
  TextPath: createComponent('TextPath'),
  Path,
  Polygon,
  Polyline,
  Line,
  Rect,
  Use,
  Image,
  Symbol,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Pattern,
  Mask,
  ForeignObject,
  SvgXml,
  SvgUri,
  SvgCss,
  SvgFromUri,
  SvgFromXml,
  Mixin,
  Shape,
  // Ytterligare exporterade saker från biblioteket
  createSVGElement: jest.fn(),
  setSvgView: jest.fn(),
  SvgCssUri: createComponent('SvgCssUri'),
  inlineStyles: jest.fn(),
  default: Svg,
}; 
// Detta hjälper till att lösa problem med lucide-react-native
const React = require('react');

// Skapa en enkel komponentfabrik för att generera SVG-komponenter
const createComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', { 
      ...props,
      testID: props.testID || `svg-${name}`,
      name: name
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// SVG API
const Svg = createComponent('Svg');
Svg.displayName = 'Svg';

// SvgUri mock
const SvgUri = createComponent('SvgUri');
SvgUri.displayName = 'SvgUri';

// SvgXml mock
const SvgXml = createComponent('SvgXml');
SvgXml.displayName = 'SvgXml';

// SvgCss mock
const SvgCss = createComponent('SvgCss');
SvgCss.displayName = 'SvgCss';

// SvgFromUri mock
const SvgFromUri = createComponent('SvgFromUri');
SvgFromUri.displayName = 'SvgFromUri';

// SvgFromXml mock
const SvgFromXml = createComponent('SvgFromXml');
SvgFromXml.displayName = 'SvgFromXml';

// SVG-element
const Circle = createComponent('Circle');
const Ellipse = createComponent('Ellipse');
const G = createComponent('G');
const LinearGradient = createComponent('LinearGradient');
const RadialGradient = createComponent('RadialGradient');
const Line = createComponent('Line');
const Path = createComponent('Path');
const Polygon = createComponent('Polygon');
const Polyline = createComponent('Polyline');
const Rect = createComponent('Rect');
const Symbol = createComponent('Symbol');
const Text = createComponent('Text');
const Use = createComponent('Use');
const Defs = createComponent('Defs');
const Stop = createComponent('Stop');
const Mask = createComponent('Mask');
const Pattern = createComponent('Pattern');
const ClipPath = createComponent('ClipPath');
const TSpan = createComponent('TSpan');
const Image = createComponent('Image');
const ForeignObject = createComponent('ForeignObject');

// Mock för SvgTouchableMixin
const Mixin = {
  propTypes: {},
  extractResponder: () => ({ prop: null, expr: null }),
};

// Shape har speciella egenskaper som vissa komponenter behöver
const Shape = {
  fill: '#000',
  fillOpacity: 1,
  stroke: 'none',
  strokeWidth: 1,
  strokeOpacity: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeDasharray: 'none',
  strokeDashoffset: 0,
};

module.exports = {
  Svg,
  Circle,
  Ellipse,
  G,
  Text,
  TSpan,
  TextPath: createComponent('TextPath'),
  Path,
  Polygon,
  Polyline,
  Line,
  Rect,
  Use,
  Image,
  Symbol,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Pattern,
  Mask,
  ForeignObject,
  SvgXml,
  SvgUri,
  SvgCss,
  SvgFromUri,
  SvgFromXml,
  Mixin,
  Shape,
  // Ytterligare exporterade saker från biblioteket
  createSVGElement: jest.fn(),
  setSvgView: jest.fn(),
  SvgCssUri: createComponent('SvgCssUri'),
  inlineStyles: jest.fn(),
  default: Svg,
}; 