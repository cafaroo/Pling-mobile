export default {
  State: {},
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  ScrollView: 'ScrollView',
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  gestureHandlerRootHOC: jest.fn(),
  attachGestureHandler: jest.fn(),
  createGestureHandler: jest.fn(),
  dropGestureHandler: jest.fn(),
  updateGestureHandler: jest.fn(),
  Direction: {
    RIGHT: 1,
    LEFT: 2,
    UP: 4,
    DOWN: 8,
  },
}; 