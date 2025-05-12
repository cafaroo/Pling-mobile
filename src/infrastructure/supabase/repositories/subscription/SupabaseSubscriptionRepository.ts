import { SupabaseClient } from '@supabase/supabase-js';
import { UniqueId } from '../../../../domain/core/UniqueId';
import { Subscription } from '../../../../domain/subscription/entities/Subscription';
import { SubscriptionPlan } from '../../../../domain/subscription/entities/SubscriptionPlan';
import { SubscriptionRepository } from '../../../../domain/subscription/repositories/SubscriptionRepository';
import { SubscriptionEvents } from '../../../../domain/subscription/events/SubscriptionEvents';
import { EventBus } from '../../../../domain/core/EventBus';
import { SubscriptionDTO, SubscriptionMapper, SubscriptionPlanDTO } from '../../mappers/subscription/SubscriptionMapper';

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: EventBus
  ) {}

  // Subscription methods
  async getSubscriptionById(id: UniqueId): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error || !data) {
      return null;
    }

    return SubscriptionMapper.toDomain(data as SubscriptionDTO);
  }

  async getSubscriptionByOrganizationId(organizationId: UniqueId): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId.toString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return SubscriptionMapper.toDomain(data as SubscriptionDTO);
  }

  async saveSubscription(subscription: Subscription): Promise<void> {
    const dto = SubscriptionMapper.toDTO(subscription);
    const { error } = await this.supabase
      .from('subscriptions')
      .upsert(dto, { onConflict: 'id' });

    if (error) {
      throw new Error(`Kunde inte spara prenumeration: ${error.message}`);
    }

    // Spara händelser i subscription_history
    const events = subscription.flushEvents();
    
    if (events.length > 0) {
      for (const event of events) {
        await this.saveSubscriptionEvent(subscription.id, event);
        await this.eventBus.publish(event);
      }
    }
  }

  async deleteSubscription(id: UniqueId): Promise<void> {
    const { error } = await this.supabase
      .from('subscriptions')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Kunde inte ta bort prenumeration: ${error.message}`);
    }
  }

  // SubscriptionPlan methods
  async getSubscriptionPlanById(id: UniqueId): Promise<SubscriptionPlan | null> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error || !data) {
      return null;
    }

    return SubscriptionMapper.planToDomain(data as SubscriptionPlanDTO);
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(plan => SubscriptionMapper.planToDomain(plan as SubscriptionPlanDTO));
  }

  async saveSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
    const dto = SubscriptionMapper.planToDTO(plan);
    const { error } = await this.supabase
      .from('subscription_plans')
      .upsert(dto, { onConflict: 'id' });

    if (error) {
      throw new Error(`Kunde inte spara prenumerationsplan: ${error.message}`);
    }
  }

  async deleteSubscriptionPlan(id: UniqueId): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Kunde inte ta bort prenumerationsplan: ${error.message}`);
    }
  }

  // Usage tracking methods
  async updateSubscriptionUsage(subscriptionId: UniqueId, metricName: string, value: number): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_usage')
      .insert({
        subscription_id: subscriptionId.toString(),
        metric: metricName,
        value,
      });

    if (error) {
      throw new Error(`Kunde inte uppdatera användningsstatistik: ${error.message}`);
    }

    // Uppdatera även huvudtabellen för enkel åtkomst till senaste värden
    const subscription = await this.getSubscriptionById(subscriptionId);
    
    if (subscription) {
      const usage = { ...subscription.usage };
      
      if (metricName === 'teamMembers') {
        usage.teamMembers = value;
      } else if (metricName === 'mediaStorage') {
        usage.mediaStorage = value;
      } else if (metricName === 'apiRequests') {
        usage.apiRequests = value;
      }
      
      subscription.updateUsage(usage);
      await this.saveSubscription(subscription);
    }
  }

  async getSubscriptionUsageHistory(
    subscriptionId: UniqueId,
    metricName: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const { data, error } = await this.supabase
      .from('subscription_usage')
      .select('recorded_at, value')
      .eq('subscription_id', subscriptionId.toString())
      .eq('metric', metricName)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      timestamp: new Date(item.recorded_at),
      value: item.value,
    }));
  }

  // Subscription history methods
  async getSubscriptionHistory(subscriptionId: UniqueId): Promise<Array<{
    eventType: string;
    eventData: Record<string, any>;
    createdAt: Date;
  }>> {
    const { data, error } = await this.supabase
      .from('subscription_history')
      .select('event_type, event_data, created_at')
      .eq('subscription_id', subscriptionId.toString())
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      eventType: item.event_type,
      eventData: item.event_data,
      createdAt: new Date(item.created_at),
    }));
  }

  private async saveSubscriptionEvent(
    subscriptionId: UniqueId,
    event: SubscriptionEvents.Event
  ): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_history')
      .insert({
        subscription_id: subscriptionId.toString(),
        event_type: event.name,
        event_data: this.serializeEvent(event),
      });

    if (error) {
      throw new Error(`Kunde inte spara prenumerationshändelse: ${error.message}`);
    }
  }

  private serializeEvent(event: SubscriptionEvents.Event): Record<string, any> {
    const eventData: Record<string, any> = { ...event };
    
    // Exkludera metoderna och konvertera datum till ISO-strängar
    delete eventData.name;
    
    for (const [key, value] of Object.entries(eventData)) {
      if (value instanceof Date) {
        eventData[key] = value.toISOString();
      } else if (value instanceof UniqueId) {
        eventData[key] = value.toString();
      }
    }
    
    return eventData;
  }
} 