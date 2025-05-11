import React from 'react';
import { render } from '@testing-library/react-native';
import TeamForm from '../TeamForm';

describe('TeamForm', () => {
  it('kan renderas utan att krascha', () => {
    const mockOnSubmit = jest.fn();
    const { debug } = render(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );
    
    // Om testet kör hela vägen hit utan att kasta ett undantag, 
    // betyder det att komponenten renderades korrekt
    expect(true).toBe(true);
  });
}); 