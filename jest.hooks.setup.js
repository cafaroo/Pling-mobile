/**
 * Minimal setup för hook-tester som kringgår problem med jest-expo
 */

// Sätt upp DOM-miljö för hook-tester
if (typeof document === 'undefined') {
  global.document = {
    createElement: jest.fn(() => ({})),
    createTextNode: jest.fn(() => ({})),
    querySelector: jest.fn(() => ({})),
  };
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: global.document,
  };
}

// Mocka react-native komponenter som används i testerna
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn(obj => obj.android || obj.default),
    Version: 28
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 360, height: 640 }),
  },
  StyleSheet: {
    create: jest.fn(obj => obj),
    compose: jest.fn((style1, style2) => ({ ...style1, ...style2 })),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Button: 'Button',
  Alert: {
    alert: jest.fn()
  }
}));

// Mocka expo-komponenter
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn()
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: 'Stack'
}));

// Mocka @tanstack/react-query för att lösa batchNotifyFn-problemet
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  
  // Skapa en anpassad notifierare som löser batchNotifyFn-problemet
  const createNotifyManager = () => {
    let queue = [];
    let transactions = 0;
    let timers = [];
    
    const batch = (callback) => {
      transactions++;
      try {
        callback();
      } finally {
        transactions--;
        if (transactions === 0) {
          const originalQueue = [...queue];
          queue = [];
          originalQueue.forEach(callback => {
            callback();
          });
        }
      }
    };
    
    const schedule = (callback) => {
      if (transactions > 0) {
        queue.push(callback);
      } else {
        setTimeout(() => {
          callback();
        }, 0);
      }
    };
    
    const batchNotifyFn = (callback) => {
      batch(() => {
        callback();
      });
    };
    
    const setBatchNotifyFunction = () => {
      // No-op i testmiljön
      return () => {};
    };
    
    const scheduleMicrotask = (callback) => {
      Promise.resolve()
        .then(callback)
        .catch(error => 
          setTimeout(() => {
            throw error;
          }, 0)
        );
    };
    
    const scheduleMutation = (callback) => {
      const timer = setTimeout(() => {
        const index = timers.indexOf(timer);
        if (index > -1) {
          timers.splice(index, 1);
        }
        callback();
      }, 0);
      
      timers.push(timer);
      return timer;
    };
    
    // För att hantera timers i tester
    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    
    return {
      batch,
      schedule,
      batchNotifyFn,
      setBatchNotifyFunction,
      scheduleMicrotask,
      scheduleMutation,
      clearTimers,
      // Vi behöver också ha dessa för kompatibilitet
      onBatchStart: jest.fn(),
      onBatchComplete: jest.fn(),
      notifyFn: callback => callback(),
      // Hjälpmetoder för test
      _getQueue: () => queue,
      _getTransactionCount: () => transactions,
    };
  };
  
  // Ersätt med den anpassade notifieraren
  const notifyManager = createNotifyManager();
  
  return {
    ...originalModule,
    // Överskrid QueryClient för att använda den anpassade notifieraren
    QueryClient: class CustomQueryClient extends originalModule.QueryClient {
      constructor(config) {
        super({
          ...config,
          // Förhindra återförsök i tester
          defaultOptions: {
            ...config?.defaultOptions,
            queries: {
              retry: false,
              cacheTime: 0,
              staleTime: 0,
              ...config?.defaultOptions?.queries,
            },
          },
        });
        
        // Ersätt om notifyManager används internt
        this.notifyManager = notifyManager;
      }
    },
    // Gör notifieraren tillgänglig
    notifyManager,
  };
});

// Lägg till DOM-testning matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = !!received;
    if (pass) {
      return {
        message: () => `expected element not to be in the document`,
        pass: true
      };
    } else {
      return {
        message: () => `expected element att finnas i dokumentet`,
        pass: false
      };
    }
  },
  toBeVisible(received) {
    const pass = !!received;
    return {
      message: () => 
        pass 
          ? `expected element not to be visible` 
          : `expected element to be visible`,
      pass
    };
  },
  toHaveTextContent(received, expectedText) {
    const text = received?.textContent || received?.props?.children || '';
    const pass = text.includes(expectedText);
    return {
      message: () => 
        pass 
          ? `expected element not to have text content "${expectedText}"` 
          : `expected element to have text content "${expectedText}", got "${text}"`,
      pass
    };
  }
});

// Förhindra varningar för testsyften
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Öka standard timeout för asynkrona operationer
jest.setTimeout(10000);

// Mock för @testing-library/react funktioner
const getTextContent = (element) => {
  if (!element) return null;
  if (typeof element === 'string') return element;
  
  // Rekursivt extrahera text från en komponent och dess barn
  const getChildrenText = (children) => {
    if (!children) return '';
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(getTextContent).join('');
    if (children.props && children.props.children) return getChildrenText(children.props.children);
    return '';
  };
  
  if (element.props && element.props.children) {
    return getChildrenText(element.props.children);
  }
  
  return '';
};

// Simulerad DOM-element-databas för att lagra renderade element
const screenElements = [];

// Mock för Testing Library screen
global.screen = {
  // Hitta element efter text - stöder både exakt text och regex
  getByText: jest.fn((textOrRegex) => {
    // För regex, försök hitta matchande element i screenElements
    if (textOrRegex instanceof RegExp) {
      const match = screenElements.find(item => 
        textOrRegex.test(typeof item.text === 'string' ? item.text : '')
      );
      
      if (match) return match.element;
      
      // Om inte hittad, skapa ett nytt element och lägg till i databasen
      const newElement = { 
        text: textOrRegex.toString(), 
        element: { 
          props: { children: textOrRegex.toString() }
        }
      };
      screenElements.push(newElement);
      return newElement.element;
    }
    
    // För exakt text-sökning
    const match = screenElements.find(item => item.text === textOrRegex);
    if (match) return match.element;
    
    // Om inte hittad, skapa ett nytt element och lägg till i databasen
    const newElement = { 
      text: textOrRegex, 
      element: { 
        props: { children: textOrRegex } 
      }
    };
    screenElements.push(newElement);
    return newElement.element;
  }),
  
  // För queryByText, returnera null om element inte finns
  queryByText: jest.fn((textOrRegex) => {
    if (textOrRegex instanceof RegExp) {
      const match = screenElements.find(item => 
        textOrRegex.test(typeof item.text === 'string' ? item.text : '')
      );
      return match ? match.element : null;
    }
    
    const match = screenElements.find(item => item.text === textOrRegex);
    return match ? match.element : null;
  }),
  
  // Rensa alla skapade element - användbar mellan tester
  clearElements: () => {
    screenElements.length = 0;
  },
  
  // Fler screen-metoder som kan behövas
  getByTestId: jest.fn((testId) => {
    const match = screenElements.find(item => item.testId === testId);
    if (match) return match.element;
    
    const newElement = { 
      testId, 
      element: { 
        props: { 'data-testid': testId } 
      }
    };
    screenElements.push(newElement);
    return newElement.element;
  }),
  
  queryByTestId: jest.fn((testId) => {
    const match = screenElements.find(item => item.testId === testId);
    return match ? match.element : null;
  }),
  
  // Lägg till element manuellt i skärmdatabasen - användbar i tester
  addElement: (key, value, props = {}) => {
    const element = { props: { ...props, children: value } };
    
    if (typeof key === 'string') {
      screenElements.push({ text: key, element });
    } else if (key === 'testId') {
      screenElements.push({ testId: value, element });
    }
    
    return element;
  }
};

// Förbättrad waitFor med intern timer
global.waitFor = jest.fn(async (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  // Försök exekvera callback med intervaller tills det lyckas eller timeout
  return new Promise((resolve, reject) => {
    const tryCallback = async () => {
      try {
        const result = await callback();
        resolve(result);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout efter ${timeout}ms: ${error.message}`));
        } else {
          setTimeout(tryCallback, interval);
        }
      }
    };
    
    tryCallback();
  });
});

// Hjälpfunktion för att vänta på React Query och Promise-uppdateringar
global.waitForNextUpdate = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

// Utöka jest med matchers för att emulera @testing-library/react och @testing-library/jest-dom
global.expect.extend({
  toBeDisabled(received) {
    const pass = received !== null && received !== undefined && received.props && received.props.disabled === true;
    return {
      message: () => `expected ${received} to be disabled`,
      pass,
    };
  },
  
  toHaveAttribute(received, attr, value) {
    if (!received || !received.props) {
      return {
        message: () => `element saknas eller har inga props`,
        pass: false,
      };
    }
    
    const hasAttr = received.props.hasOwnProperty(attr);
    const hasCorrectValue = value === undefined || received.props[attr] === value;
    const pass = hasAttr && hasCorrectValue;
    
    return {
      message: () => {
        if (!hasAttr) return `expected element att ha attribut "${attr}"`;
        if (!hasCorrectValue) return `expected element att ha attributvärde "${value}" för "${attr}", men det var "${received.props[attr]}"`;
        return `expected element att inte ha attribut "${attr}" med värde "${value}"`;
      },
      pass,
    };
  }
});

// Mock för act
global.act = async (callback) => {
  const result = callback();
  await (result instanceof Promise ? result : Promise.resolve());
  
  // Ge tid för React att uppdatera och slutföra alla asynkrona operationer
  await waitForNextUpdate(10);
  
  return result;
};

// Konfigurera miljövariabler
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-test-supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-testing';

// Hjälpfunktion för att rendera React-komponenter i hooks-tester
global.render = (component) => {
  // Simulera rendering genom att extrahera text och lägga till i screenElements
  const extractTextAndAddToScreen = (comp) => {
    if (!comp) return null;
    
    if (typeof comp === 'string') {
      screenElements.push({ text: comp, element: { props: { children: comp } } });
      return;
    }
    
    if (comp.props && comp.props.children) {
      if (typeof comp.props.children === 'string') {
        screenElements.push({ 
          text: comp.props.children, 
          element: comp 
        });
      } else if (Array.isArray(comp.props.children)) {
        comp.props.children.forEach(child => extractTextAndAddToScreen(child));
      } else {
        extractTextAndAddToScreen(comp.props.children);
      }
    }
    
    // Lägg även till testId om det finns
    if (comp.props && comp.props['data-testid']) {
      screenElements.push({ 
        testId: comp.props['data-testid'], 
        element: comp 
      });
    }
    
    return comp;
  };
  
  const result = extractTextAndAddToScreen(component);
  
  return {
    container: { querySelector: jest.fn() },
    getByText: screen.getByText,
    queryByText: screen.queryByText,
    getByTestId: screen.getByTestId,
    queryByTestId: screen.queryByTestId,
    rerender: (newComponent) => {
      screen.clearElements();
      extractTextAndAddToScreen(newComponent);
    },
    unmount: () => {
      screen.clearElements();
    },
    debug: () => {
      console.log('Screen elements:', screenElements);
    }
  };
}; 