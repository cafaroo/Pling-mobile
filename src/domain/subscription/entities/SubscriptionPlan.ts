import { UniqueId } from '../../core/UniqueId';
import { PlanFeature, PlanLimits } from '../value-objects/PlanTypes';

export type PlanName = 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlanProps {
  id: UniqueId;
  name: PlanName;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: PlanFeature[];
  limits: PlanLimits;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionPlan {
  private props: SubscriptionPlanProps;

  constructor(props: SubscriptionPlanProps) {
    this.props = props;
  }

  get id(): UniqueId {
    return this.props.id;
  }

  get name(): PlanName {
    return this.props.name;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): { monthly: number; yearly: number; currency: string } {
    return this.props.price;
  }

  get features(): PlanFeature[] {
    return this.props.features;
  }

  get limits(): PlanLimits {
    return this.props.limits;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasFeature(featureId: string): boolean {
    return this.props.features.some(feature => feature.id === featureId && feature.enabled);
  }

  getYearlySavingsPercentage(): number {
    const monthlyCost = this.props.price.monthly * 12;
    const yearlyCost = this.props.price.yearly;
    
    if (monthlyCost <= 0) return 0;
    
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
  }

  static createBasicPlan(id: UniqueId): SubscriptionPlan {
    return new SubscriptionPlan({
      id,
      name: 'basic',
      displayName: 'Pling Basic',
      description: 'Perfekt för små team och testanvändare',
      price: {
        monthly: 0,
        yearly: 0,
        currency: 'SEK',
      },
      features: [
        { id: 'basic_goal_management', name: 'Grundläggande målhantering', description: 'Hantera enkla mål', enabled: true, tier: 'basic' },
        { id: 'basic_statistics', name: 'Begränsad statistik', description: 'Enkel statistik över måluppfyllnad', enabled: true, tier: 'basic' },
        { id: 'basic_competitions', name: 'Grundläggande tävlingsfunktioner', description: 'Skapa enkla tävlingar', enabled: true, tier: 'basic' },
      ],
      limits: {
        teamMembers: 3,
        mediaStorage: 100,
        customDashboards: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createProPlan(id: UniqueId): SubscriptionPlan {
    return new SubscriptionPlan({
      id,
      name: 'pro',
      displayName: 'Pling Pro',
      description: 'För medelstora team och aktiva användare',
      price: {
        monthly: 299,
        yearly: 2990,
        currency: 'SEK',
      },
      features: [
        { id: 'basic_goal_management', name: 'Grundläggande målhantering', description: 'Hantera enkla mål', enabled: true, tier: 'basic' },
        { id: 'advanced_goal_management', name: 'Avancerad målhantering', description: 'Målberoenden och avancerade inställningar', enabled: true, tier: 'pro' },
        { id: 'basic_statistics', name: 'Begränsad statistik', description: 'Enkel statistik över måluppfyllnad', enabled: true, tier: 'basic' },
        { id: 'full_statistics', name: 'Fullständig statistik', description: 'Detaljerade rapporter och insikter', enabled: true, tier: 'pro' },
        { id: 'basic_competitions', name: 'Grundläggande tävlingsfunktioner', description: 'Skapa enkla tävlingar', enabled: true, tier: 'basic' },
        { id: 'all_competitions', name: 'Alla tävlingsfunktioner', description: 'Anpassade tävlingar och belöningar', enabled: true, tier: 'pro' },
        { id: 'priority_support', name: 'Prioriterad support', description: 'Snabbare svarstid på supportärenden', enabled: true, tier: 'pro' },
        { id: 'custom_dashboards', name: 'Anpassade team-dashboards', description: 'Skapa och anpassa team-dashboards', enabled: true, tier: 'pro' },
      ],
      limits: {
        teamMembers: 10,
        mediaStorage: 1024,
        customDashboards: 3,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createEnterprisePlan(id: UniqueId): SubscriptionPlan {
    return new SubscriptionPlan({
      id,
      name: 'enterprise',
      displayName: 'Pling Enterprise',
      description: 'För stora organisationer och företag',
      price: {
        monthly: 999,
        yearly: 9990,
        currency: 'SEK',
      },
      features: [
        { id: 'basic_goal_management', name: 'Grundläggande målhantering', description: 'Hantera enkla mål', enabled: true, tier: 'basic' },
        { id: 'advanced_goal_management', name: 'Avancerad målhantering', description: 'Målberoenden och avancerade inställningar', enabled: true, tier: 'pro' },
        { id: 'enterprise_goal_management', name: 'Enterprise-funktioner för målhantering', description: 'Organisationsövergripande mål och hierarkier', enabled: true, tier: 'enterprise' },
        { id: 'basic_statistics', name: 'Begränsad statistik', description: 'Enkel statistik över måluppfyllnad', enabled: true, tier: 'basic' },
        { id: 'full_statistics', name: 'Fullständig statistik', description: 'Detaljerade rapporter och insikter', enabled: true, tier: 'pro' },
        { id: 'advanced_analytics', name: 'Avancerad analys', description: 'Prediktiv statistik och trendanalys', enabled: true, tier: 'enterprise' },
        { id: 'basic_competitions', name: 'Grundläggande tävlingsfunktioner', description: 'Skapa enkla tävlingar', enabled: true, tier: 'basic' },
        { id: 'all_competitions', name: 'Alla tävlingsfunktioner', description: 'Anpassade tävlingar och belöningar', enabled: true, tier: 'pro' },
        { id: 'custom_competitions', name: 'Anpassade tävlingar och belöningar', description: 'Skapa helt anpassade tävlingar', enabled: true, tier: 'enterprise' },
        { id: 'priority_support', name: 'Prioriterad support', description: 'Snabbare svarstid på supportärenden', enabled: true, tier: 'pro' },
        { id: 'dedicated_support', name: 'Dedikerad support', description: 'Personlig kontaktperson', enabled: true, tier: 'enterprise' },
        { id: 'custom_dashboards', name: 'Anpassade team-dashboards', description: 'Skapa och anpassa team-dashboards', enabled: true, tier: 'pro' },
        { id: 'api_access', name: 'API-tillgång', description: 'Tillgång till Pling API', enabled: true, tier: 'enterprise' },
        { id: 'sso_integration', name: 'SSO-integration', description: 'Enkel inloggning med företagets identitetssystem', enabled: true, tier: 'enterprise' },
        { id: 'custom_security', name: 'Anpassade säkerhetsinställningar', description: 'Skräddarsydda säkerhetspolicyer', enabled: true, tier: 'enterprise' },
      ],
      limits: {
        teamMembers: 25,
        mediaStorage: 15 * 1024,
        customDashboards: 10,
        apiRequests: 10000,
        concurrentUsers: 100,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
} 