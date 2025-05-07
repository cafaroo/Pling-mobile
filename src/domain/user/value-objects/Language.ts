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
      displayName: 'Norska',
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
      displayName: 'Danska',
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
    super(code);
  }

  /**
   * Skapar ett nytt språkobjekt
   */
  public static create(code: string): Result<Language, Error> {
    if (!this.SUPPORTED_LANGUAGES.includes(code as LanguageCode)) {
      return err(new Error(`Språket "${code}" stöds inte av systemet`));
    }
    
    return ok(new Language(code));
  }
  
  /**
   * Returnerar standardspråket (svenska)
   */
  public static getDefault(): Language {
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
   * Returnerar lokaliserat visningsnamn
   */
  public get displayName(): string {
    return this.details.displayName;
  }
  
  /**
   * Returnerar det lokala namnet på språket
   */
  public get nativeName(): string {
    return this.details.nativeName;
  }
  
  /**
   * Returnerar flagg-emoji för språket
   */
  public get flagEmoji(): string {
    return this.details.flagEmoji;
  }
  
  /**
   * Returnerar den lokala strängen för språket (t.ex. 'sv-SE', 'en-US')
   */
  public get locale(): string {
    return this.details.locale;
  }
  
  /**
   * Kontrollerar om språket är fullt stött i systemet
   */
  public get isSupported(): boolean {
    return this.details.isSupported;
  }
  
  /**
   * Formaterar ett datum enligt språkets standardformat
   */
  public formatDate(date: Date): string {
    return date.toLocaleDateString(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  /**
   * Formaterar en tid enligt språkets standardformat
   */
  public formatTime(date: Date): string {
    return date.toLocaleTimeString(this.locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Formaterar ett belopp enligt språkets valuta
   */
  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.details.defaultCurrency
    }).format(amount);
  }
  
  /**
   * Returnerar en strängrepresentation av språket
   */
  public toString(): string {
    // Normalisera språkkoden (lowercase)
    const normalizedCode = code.toLowerCase();
    
    // Kontrollera om språket stöds
    if (!Language.SUPPORTED_LANGUAGES.includes(normalizedCode as LanguageCode)) {
      return Result.err(
        new Error(
          `Språket "${code}" stöds inte. Tillgängliga språk: ${Language.SUPPORTED_LANGUAGES.join(', ')}`
        )
      );
    }

    return Result.ok(new Language(normalizedCode));
  }

  public static getDefaultLanguage(): Language {
    // Skapa en instans av standardspråket (Svenska)
    const result = Language.create('sv');
    
    if (result.isErr()) {
      // Detta ska inte kunna hända eftersom 'sv' är en giltig språkkod
      throw new Error('Kunde inte skapa standardspråk');
    }
    
    return result.value;
  }

  public static getAllSupportedLanguages(): LanguageCode[] {
    return [...Language.SUPPORTED_LANGUAGES];
  }

  public get code(): string {
    return this.props;
  }

  public get displayName(): string {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].displayName;
  }

  public get nativeName(): string {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].nativeName;
  }

  public get isRightToLeft(): boolean {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].isRightToLeft;
  }

  public get defaultDateFormat(): string {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].defaultDateFormat;
  }

  public get defaultTimeFormat(): string {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].defaultTimeFormat;
  }

  public get defaultCurrency(): string {
    return Language.LANGUAGE_DETAILS[this.code as LanguageCode].defaultCurrency;
  }

  public equals(other: Language): boolean {
    return this.code === other.code;
  }
  
  public isNordic(): boolean {
    return ['sv', 'no', 'dk', 'fi'].includes(this.code);
  }
  
  public isEuropean(): boolean {
    // Alla våra nuvarande språk är europeiska
    return true;
  }
  
  public toString(): string {
    return this.code;
  }
} 