// Mocka React Native-komponenter för att undvika varningar
jest.mock('react-native/Libraries/Components/ProgressBarAndroid', () => 'ProgressBar');
jest.mock('@react-native-clipboard/clipboard', () => ({}));
jest.mock('@react-native-community/push-notification-ios', () => ({}));

// Tysta alla console.warn i testmiljön
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Rensa alla mockar efter varje test
afterEach(() => {
  jest.clearAllMocks();
}); 