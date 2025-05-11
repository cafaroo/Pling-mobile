'use strict';

// Mock för @testing-library/react-native
const React = require('react');

// Grundläggande render-funktion som returnerar användbara metoder för test
const render = (component, options = {}) => {
  const container = {
    children: [React.cloneElement(component, {})],
  };

  return {
    container,
    // Hitta element baserat på olika selektorer
    getByText: jest.fn((text) => ({ type: 'Text', props: { children: text } })),
    getByTestId: jest.fn((testId) => ({ type: 'Element', props: { testID: testId } })),
    getByPlaceholderText: jest.fn((placeholder) => ({ type: 'TextInput', props: { placeholder } })),
    getAllByText: jest.fn((text) => [{ type: 'Text', props: { children: text } }]),
    getAllByTestId: jest.fn((testId) => [{ type: 'Element', props: { testID: testId } }]),
    queryByText: jest.fn((text) => ({ type: 'Text', props: { children: text } })),
    queryByTestId: jest.fn((testId) => ({ type: 'Element', props: { testID: testId } })),
    queryAllByText: jest.fn((text) => [{ type: 'Text', props: { children: text } }]),
    findByText: jest.fn((text) => Promise.resolve({ type: 'Text', props: { children: text } })),
    findByTestId: jest.fn((testId) => Promise.resolve({ type: 'Element', props: { testID: testId } })),
    findAllByText: jest.fn((text) => Promise.resolve([{ type: 'Text', props: { children: text } }])),
    rerender: jest.fn((newComponent) => {
      container.children = [React.cloneElement(newComponent, {})];
    }),
    unmount: jest.fn(),
    debug: jest.fn(),
    toJSON: jest.fn(() => container),
  };
};

// Mock av fireEvent för att simulera användarinteraktioner
const fireEvent = {
  press: jest.fn(),
  changeText: jest.fn(),
  scroll: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  // Hjälpfunktion för att skapa generiska händelser
  _custom: jest.fn(),
};

// Mock av waitFor för att vänta på asynkrona operationer
const waitFor = jest.fn((callback) => Promise.resolve(callback()));

// Mock av act för att uppdatera komponenter
const act = jest.fn((callback) => {
  const result = callback();
  return result?.then ? result : Promise.resolve(result);
});

// Mock av renderHook för testning av React hooks
const renderHook = jest.fn((callback, options = {}) => {
  let current;
  
  const result = { current: undefined };
  
  const renderValue = () => {
    result.current = callback();
  };
  
  renderValue();
  
  return {
    result,
    rerender: jest.fn(() => {
      renderValue();
      return result;
    }),
    unmount: jest.fn(),
  };
});

// Exportera alla komponenter och APIs
module.exports = {
  render,
  fireEvent,
  waitFor,
  act,
  renderHook,
  cleanup: jest.fn(),
  within: jest.fn((element) => ({
    getByText: jest.fn(),
    getByTestId: jest.fn(),
    queryByText: jest.fn(),
  })),
}; 