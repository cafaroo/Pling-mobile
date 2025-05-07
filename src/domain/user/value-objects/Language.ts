import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, err, ok } from '@/shared/core/Result';

export type LanguageCode = 'sv' | 'en' | 'no' | 'dk' | 'fi' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pl' | 'ru';

/**
 * Gränssnitt för språkdetaljer
 */
interface LanguageDetails {
  displayName: string;
  nativeName: string;
  isRightToLeft: boolean;
  defaultDateFormat: string;
  defaultTimeFormat: string;
  defaultCurrency: string;
  flagEmoji: string;
  locale: string;
  isSupported: boolean;
}

/**
 * Value-object som representerar ett språk i systemet
 */
export class Language extends ValueObject<string> {
  private static readonly SUPPORTED_LANGUAGES: LanguageCode[] = [
    'sv', 'en', 'no', 'dk', 'fi', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'ru'
  ];
  
  private static readonly LANGUAGE_DETAILS: Record<LanguageCode, LanguageDetails> = {
    sv: {
      displayName: 'Svenska',
      nativeName: 'Svenska',
      isRightToLeft: false,
      defaultDateFormat: 'YYYY-MM-DD',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'SEK',
      flagEmoji: '🇸🇪',
      locale: 'sv-SE',
      isSupported: true
    },
    en: {
      displayName: 'English',
      nativeName: 'English',
      isRightToLeft: false,
      defaultDateFormat: 'MM/DD/YYYY',
      defaultTimeFormat: 'h:mm A',
      defaultCurrency: 'USD',
      flagEmoji: '🇬🇧',
      locale: 'en-US',
      isSupported: true
    },
    no: {
      displayName: 'Norsk',
      nativeName: 'Norsk',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'NOK',
      flagEmoji: '🇳🇴',
      locale: 'nb-NO',
      isSupported: true
    },
    dk: {
      displayName: 'Dansk',
      nativeName: 'Dansk',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'DKK',
      flagEmoji: '🇩🇰',
      locale: 'da-DK',
      isSupported: true
    },
    fi: {
      displayName: 'Finska',
      nativeName: 'Suomi',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇫🇮',
      locale: 'fi-FI',
      isSupported: true
    },
    de: {
      displayName: 'Tyska',
      nativeName: 'Deutsch',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇩🇪',
      locale: 'de-DE',
      isSupported: true
    },
    fr: {
      displayName: 'Franska',
      nativeName: 'Français',
      isRightToLeft: false,
      defaultDateFormat: 'DD/MM/YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇫🇷',
      locale: 'fr-FR',
      isSupported: true
    },
    es: {
      displayName: 'Spanska',
      nativeName: 'Español',
      isRightToLeft: false,
      defaultDateFormat: 'DD/MM/YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇪🇸',
      locale: 'es-ES',
      isSupported: true
    },
    it: {
      displayName: 'Italienska',
      nativeName: 'Italiano',
      isRightToLeft: false,
      defaultDateFormat: 'DD/MM/YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇮🇹',
      locale: 'it-IT',
      isSupported: false
    },
    nl: {
      displayName: 'Holländska',
      nativeName: 'Nederlands',
      isRightToLeft: false,
      defaultDateFormat: 'DD-MM-YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'EUR',
      flagEmoji: '🇳🇱',
      locale: 'nl-NL',
      isSupported: false
    },
    pl: {
      displayName: 'Polska',
      nativeName: 'Polski',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'PLN',
      flagEmoji: '🇵🇱',
      locale: 'pl-PL',
      isSupported: false
    },
    ru: {
      displayName: 'Ryska',
      nativeName: 'Русский',
      isRightToLeft: false,
      defaultDateFormat: 'DD.MM.YYYY',
      defaultTimeFormat: 'HH:mm',
      defaultCurrency: 'RUB',
      flagEmoji: '🇷🇺',
      locale: 'ru-RU',
      isSupported: false
    }
  };

  private constructor(code: string) {
    super(code.toLowerCase());
  }

  /**
   * Skapar ett nytt språkobjekt
   */
  public static create(code: string): Result<Language, Error> {
    if (!code) {
      return err(new Error('Språkkod kan inte vara null eller undefined'));
    }
    
    // Konvertera till lowercase för att normalisera
    const normalizedCode = code.toLowerCase();
    
    if (!this.SUPPORTED_LANGUAGES.includes(normalizedCode as LanguageCode)) {
      return err(new Error(`Språket "${code}" stöds inte av systemet`));
    }
    
    return ok(new Language(normalizedCode));
  }
  
  /**
   * Returnerar standardspråket (svenska)
   */
  public static getDefaultLanguage(): Language {
    return this.create('sv').getValue();
  }
  
  /**
   * Returnerar alla tillgängliga språk
   */
  public static getAllLanguages(): Language[] {
    return this.SUPPORTED_LANGUAGES.map(
      code => this.create(code).getValue()
    );
  }
  
  /**
   * Returnerar alla fullt stödda språk (som har översättningar)
   */
  public static getSupportedLanguages(): Language[] {
    return this.SUPPORTED_LANGUAGES
      .filter(code => this.LANGUAGE_DETAILS[code].isSupported)
      .map(code => this.create(code).getValue());
  }
  
  /**
   * Returnerar en lista av alla stödda språkkoder
   */
  public static getAllSupportedLanguages(): LanguageCode[] {
    return this.SUPPORTED_LANGUAGES.filter(
      code => this.LANGUAGE_DETAILS[code].isSupported
    );
  }
  
  /**
   * Returnerar språkkoden
   */
  public get code(): LanguageCode {
    return this.props as LanguageCode;
  }
  
  /**
   * Returnerar språkdetaljer
   */
  public get details(): LanguageDetails {
    return Language.LANGUAGE_DETAILS[this.code];
  }
  
  /**
   * Returnerar språkets visningsnamn
   */
  public get displayName(): string {
    return this.details.displayName;
  }
  
  /**
   * Returnerar språkets namn på det språket
   */
  public get nativeName(): string {
    return this.details.nativeName;
  }
  
  /**
   * Returnerar språkets flagg-emoji
   */
  public get flagEmoji(): string {
    return this.details.flagEmoji;
  }
  
  /**
   * Returnerar språkets locale (t.ex. sv-SE)
   */
  public get locale(): string {
    return this.details.locale;
  }
  
  /**
   * Returnerar om språket är fullt stött med översättningar
   */
  public get isSupported(): boolean {
    return this.details.isSupported;
  }
  
  /**
   * Returnerar standardvaluta för språket
   */
  public get defaultCurrency(): string {
    return this.details.defaultCurrency;
  }
  
  /**
   * Returnerar standarddatumformat för språket
   */
  public get defaultDateFormat(): string {
    return this.details.defaultDateFormat;
  }
  
  /**
   * Returnerar standardtidformat för språket
   */
  public get defaultTimeFormat(): string {
    return this.details.defaultTimeFormat;
  }
  
  /**
   * Formaterar ett datum enligt språkets konventioner
   */
  public formatDate(date: Date): string {
    // Enkel implementation, i verkligheten skulle vi använda ett datumbibliotek
    return new Intl.DateTimeFormat(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
  
  /**
   * Formaterar en tid enligt språkets konventioner
   */
  public formatTime(date: Date): string {
    // Enkel implementation, i verkligheten skulle vi använda ett datumbibliotek
    return new Intl.DateTimeFormat(this.locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  /**
   * Formaterar ett belopp enligt språkets valuta
   */
  public formatCurrency(amount: number): string {
    // Enkel implementation, i verkligheten skulle vi använda ett valutabibliotek
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.defaultCurrency
    }).format(amount);
  }
  
  /**
   * Kontrollerar om det är ett nordiskt språk
   */
  public isNordic(): boolean {
    return ['sv', 'no', 'dk', 'fi'].includes(this.code);
  }
  
  /**
   * Kontrollerar om det är ett europeiskt språk
   */
  public isEuropean(): boolean {
    return ['sv', 'no', 'dk', 'fi', 'de', 'fr', 'es', 'it', 'nl', 'pl'].includes(this.code);
  }
  
  /**
   * Jämför om detta språk är lika med ett annat
   */
  public equals(other: Language): boolean {
    return this.code === other.code;
  }
  
  /**
   * Returnerar en strängrepresentation av språket
   */
  public toString(): string {
    return this.code;
  }
} 