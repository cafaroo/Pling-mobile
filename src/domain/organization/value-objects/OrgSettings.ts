import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Interface för OrgSettings properties
 */
interface OrgSettingsProps {
  description: string;
  logoUrl: string;
  maxMembers: number | null;
  colorSchema?: string;
  allowTeamCreation?: boolean;
  [key: string]: any; // Tillåt extra egenskaper för framtida utökning
}

/**
 * Värde-objekt för organisationsinställningar
 */
export class OrgSettings extends ValueObject<OrgSettingsProps> {
  private constructor(props: OrgSettingsProps) {
    super(props);
  }

  /**
   * Skapar nya organisationsinställningar med standardvärden om inga anges
   * 
   * @param props Egenskaper för inställningarna
   * @returns Ett Result med OrgSettings eller felmeddelande
   */
  public static create(props: Partial<OrgSettingsProps> = {}): Result<OrgSettings, string> {
    try {
      // Sätt standardvärden för egenskaper som inte anges
      const defaultProps: OrgSettingsProps = {
        description: props.description || '',
        logoUrl: props.logoUrl || '',
        maxMembers: props.maxMembers !== undefined ? props.maxMembers : 3, // Standard är 3 medlemmar
        colorSchema: props.colorSchema || 'default',
        allowTeamCreation: props.allowTeamCreation !== undefined ? props.allowTeamCreation : true,
      };

      // Kopiera eventuella extraegenskaper från props
      Object.keys(props).forEach(key => {
        if (!defaultProps.hasOwnProperty(key)) {
          defaultProps[key] = props[key];
        }
      });

      return ok(new OrgSettings(defaultProps));
    } catch (error) {
      return err(`Kunde inte skapa organisationsinställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar inställningarna med nya värden
   * 
   * @param newProps Nya egenskaper att uppdatera med
   * @returns En ny OrgSettings-instans med uppdaterade värden
   */
  public update(newProps: Partial<OrgSettingsProps>): OrgSettings {
    const updatedResult = OrgSettings.create({
      ...this.props,
      ...newProps
    });

    if (updatedResult.isErr()) {
      throw new Error(updatedResult.error);
    }

    return updatedResult.value;
  }

  /**
   * Konverterar inställningarna till ett rent JavaScript-objekt
   */
  public toJSON(): OrgSettingsProps {
    return { ...this.props };
  }

  /**
   * Getters för olika inställningar
   */
  get description(): string {
    return this.props.description;
  }

  get logoUrl(): string {
    return this.props.logoUrl;
  }

  get maxMembers(): number | null {
    return this.props.maxMembers;
  }

  get colorSchema(): string {
    return this.props.colorSchema || 'default';
  }

  get allowTeamCreation(): boolean {
    return this.props.allowTeamCreation !== undefined ? this.props.allowTeamCreation : true;
  }
} 