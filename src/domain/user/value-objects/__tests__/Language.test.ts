import { Language, LanguageCode } from '../Language';

describe('Language', () => {
  describe('create', () => {
    it('ska skapa en giltig Language för stödda språk', () => {
      const validLanguages = ['sv', 'en', 'no', 'dk', 'fi', 'de', 'fr', 'es'];
      
      validLanguages.forEach(lang => {
        const result = Language.create(lang);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().code).toBe(lang);
        }
      });
    });

    it('ska returnera ett fel för ogiltigt språk', () => {
      const result = Language.create('jp');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError().message).toContain('Språket "jp" stöds inte');
      }
    });
    
    it('ska hantera null och undefined värden', () => {
      // @ts-ignore Testar null-värde
      const nullResult = Language.create(null);
      expect(nullResult.isErr()).toBe(true);
      
      // @ts-ignore Testar undefined-värde
      const undefinedResult = Language.create(undefined);
      expect(undefinedResult.isErr()).toBe(true);
    });
    
    it('ska normalisera språkkoden till lowercase', () => {
      const result = Language.create('EN');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().code).toBe('en');
      }
    });
  });

  describe('displayName och andra egenskaper', () => {
    it('ska returnera korrekt visningsnamn för varje språk', () => {
      const languageNames = [
        { code: 'sv', name: 'Svenska' },
        { code: 'en', name: 'English' },
        { code: 'no', name: 'Norsk' },
        { code: 'dk', name: 'Dansk' },
        { code: 'fi', name: 'Finska' },
        { code: 'de', name: 'Tyska' },
        { code: 'fr', name: 'Franska' },
        { code: 'es', name: 'Spanska' }
      ];

      languageNames.forEach(({ code, name }) => {
        const result = Language.create(code);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().displayName).toBe(name);
        }
      });
    });
    
    it('ska returnera korrekt nativeName för varje språk', () => {
      const language = Language.create('de').getValue();
      expect(language.nativeName).toBe('Deutsch');
      
      const french = Language.create('fr').getValue();
      expect(french.nativeName).toBe('Français');
    });
    
    it('ska returnera korrekt defaultDateFormat för varje språk', () => {
      const swedish = Language.create('sv').getValue();
      expect(swedish.defaultDateFormat).toBe('YYYY-MM-DD');
      
      const english = Language.create('en').getValue();
      expect(english.defaultDateFormat).toBe('MM/DD/YYYY');
      
      const german = Language.create('de').getValue();
      expect(german.defaultDateFormat).toBe('DD.MM.YYYY');
    });
    
    it('ska returnera korrekt defaultCurrency för varje språk', () => {
      const swedish = Language.create('sv').getValue();
      expect(swedish.defaultCurrency).toBe('SEK');
      
      const finnish = Language.create('fi').getValue();
      expect(finnish.defaultCurrency).toBe('EUR');
    });
  });
  
  describe('static metoder', () => {
    it('ska returnera korrekt standardspråk', () => {
      const defaultLanguage = Language.getDefaultLanguage();
      expect(defaultLanguage.code).toBe('sv');
      expect(defaultLanguage.displayName).toBe('Svenska');
    });
    
    it('ska returnera alla stödda språk', () => {
      const supportedLanguages = Language.getAllSupportedLanguages();
      expect(supportedLanguages).toEqual(['sv', 'en', 'no', 'dk', 'fi', 'de', 'fr', 'es']);
      expect(supportedLanguages.length).toBe(8);
    });
  });

  describe('equals', () => {
    it('ska korrekt jämföra två språkobjekt', () => {
      const sv1 = Language.create('sv');
      const sv2 = Language.create('sv');
      const en = Language.create('en');

      expect(sv1.isOk() && sv2.isOk() && en.isOk()).toBe(true);
      if (sv1.isOk() && sv2.isOk() && en.isOk()) {
        expect(sv1.getValue().equals(sv2.getValue())).toBe(true);
        expect(sv1.getValue().equals(en.getValue())).toBe(false);
      }
    });
  });
  
  describe('hjälpmetoder', () => {
    it('ska identifiera nordiska språk korrekt', () => {
      const swedish = Language.create('sv').getValue();
      expect(swedish.isNordic()).toBe(true);
      
      const finnish = Language.create('fi').getValue();
      expect(finnish.isNordic()).toBe(true);
      
      const german = Language.create('de').getValue();
      expect(german.isNordic()).toBe(false);
    });
    
    it('ska konvertera språk till string korrekt', () => {
      const language = Language.create('en').getValue();
      expect(language.toString()).toBe('en');
      expect(String(language)).toBe('en');
    });
  });
}); 