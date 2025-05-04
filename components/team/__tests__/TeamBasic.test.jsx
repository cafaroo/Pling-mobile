const React = require('react');
const { Text, View } = require('react-native');
const { render } = require('@testing-library/react-native');

// En enkel komponent för att testa testmiljön
const TeamBasic = ({ name }) => 
  React.createElement(
    View, 
    { testID: 'team-basic' },
    React.createElement(Text, null, name)
  );

describe('TeamBasic', () => {
  it('renderar korrekt', () => {
    const { getByTestId, getByText } = render(React.createElement(TeamBasic, { name: 'Testteam' }));
    
    expect(getByTestId('team-basic')).toBeTruthy();
    expect(getByText('Testteam')).toBeTruthy();
  });
}); 