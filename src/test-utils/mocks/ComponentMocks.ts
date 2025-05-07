/**
 * Standardiserade mockfunktioner för React-komponenter
 * 
 * Använd dessa mockfunktioner för att konsekvent mocka komponenter i tester.
 * 
 * Exempel:
 * ```
 * import { createMockComponent } from '@/test-utils/mocks/ComponentMocks';
 * 
 * jest.mock('react-native-paper', () => ({
 *   Button: createMockComponent('Button'),
 *   TextInput: createMockComponent('TextInput')
 * }));
 * ```
 */

/**
 * Skapar en mockad komponent som returnerar ett objekt som representerar komponenten
 * istället för att försöka returnera JSX-element.
 */
export const createMockComponent = (
  name: string,
  defaultProps = {}
) => {
  return jest.fn().mockImplementation((props = {}) => ({
    type: `mock-${name.toLowerCase()}`,
    props: {
      ...defaultProps,
      ...props,
      testID: props.testID || `mock-${name.toLowerCase()}`
    }
  }));
};

/**
 * Skapar en mockad komponent med barn
 */
export const createMockComponentWithChildren = (
  name: string,
  defaultProps = {}
) => {
  return jest.fn().mockImplementation(({ children, ...props }) => ({
    type: `mock-${name.toLowerCase()}`,
    props: {
      ...defaultProps,
      ...props,
      testID: props.testID || `mock-${name.toLowerCase()}`,
      children: Array.isArray(children) ? children : [children]
    }
  }));
};

/**
 * Skapar en mockad komponent med text
 */
export const createMockTextComponent = (
  name: string,
  defaultProps = {}
) => {
  return jest.fn().mockImplementation(({ children, ...props }) => ({
    type: `mock-${name.toLowerCase()}`,
    props: {
      ...defaultProps,
      ...props,
      testID: props.testID || `mock-${name.toLowerCase()}`,
      children: typeof children === 'string' ? children : JSON.stringify(children)
    }
  }));
};

/**
 * Skapar en mockad hook som returnerar defaultValues
 */
export const createMockHook = (defaultValues: any) => {
  return jest.fn().mockReturnValue(defaultValues);
};

/**
 * Skapa en grundläggande mock för react-native-paper
 */
export const createReactNativePaperMock = () => {
  return {
    Button: createMockComponentWithChildren('Button', { mode: 'contained' }),
    TextInput: createMockComponent('TextInput'),
    Icon: createMockComponent('Icon'),
    Card: createMockComponentWithChildren('Card'),
    Title: createMockTextComponent('Title'),
    Paragraph: createMockTextComponent('Paragraph'),
    IconButton: createMockComponent('IconButton'),
    Divider: createMockComponent('Divider'),
    Avatar: {
      Image: createMockComponent('AvatarImage'),
      Icon: createMockComponent('AvatarIcon'),
      Text: createMockComponent('AvatarText')
    },
    useTheme: jest.fn().mockReturnValue({
      colors: {
        primary: '#000000',
        accent: '#ffffff',
        background: '#ffffff',
        text: '#000000',
        surface: '#ffffff',
        placeholder: '#888888',
        error: '#ff0000'
      }
    }),
    Provider: createMockComponentWithChildren('PaperProvider')
  };
};

/**
 * Skapa en grundläggande mock för @expo/vector-icons
 */
export const createExpoVectorIconsMock = () => {
  const createIconComponent = (name: string) => {
    return jest.fn().mockImplementation(props => ({
      type: `mock-${name.toLowerCase()}-icon`,
      props: {
        ...props,
        'data-name': props.name,
        'data-size': props.size || 24,
        'data-color': props.color || 'black'
      }
    }));
  };
  
  return {
    MaterialIcons: createIconComponent('MaterialIcons'),
    Ionicons: createIconComponent('Ionicons'),
    MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
    FontAwesome: createIconComponent('FontAwesome'),
    Feather: createIconComponent('Feather'),
    AntDesign: createIconComponent('AntDesign'),
    Entypo: createIconComponent('Entypo')
  };
}; 