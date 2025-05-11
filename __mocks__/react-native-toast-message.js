const Toast = {
  show: jest.fn(),
  hide: jest.fn(),
};

module.exports = {
  __esModule: true,
  default: Toast,
  Toast: Toast,
  toast: {
    show: jest.fn(),
    hide: jest.fn(),
  }
}; 