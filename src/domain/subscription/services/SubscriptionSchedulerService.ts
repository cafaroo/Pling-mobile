import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../../infrastructure/logger/Logger';
import { StripeIntegrationService } from './StripeIntegrationService';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Service för att hantera schemalagda jobb relaterade till prenumerationer
 */
export class SubscriptionSchedulerService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly stripeService: StripeIntegrationService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  /**
   * Kontrollerar prenumerationer som är nära förnyelsedatum och skickar påminnelser
   * Körs dagligen
   */
  async checkRenewalReminders(): Promise<void> {
    this.logger.info('Kör schemalagt jobb: checkRenewalReminders');
    
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dagar framåt
      
      // Hämta alla prenumerationer som förnyas inom 7 dagar
      const subscriptions = await this.subscriptionRepository.getSubscriptionsRenewingBetween(now, in7Days);
      
      for (const subscription of subscriptions) {
        // Skicka påminnelse om automatisk förnyelse
        if (!subscription.cancelAtPeriodEnd) {
          this.eventBus.publish('subscription.renewal_reminder', {
            organizationId: subscription.organizationId,
            subscriptionId: subscription.id,
            renewalDate: subscription.currentPeriodEnd,
          });
          
          this.logger.info(`Skickade förnyelsenotifiering för prenumeration: ${subscription.id}`);
        }
        // Skicka påminnelse om att prenumerationen avslutas snart
        else {
          this.eventBus.publish('subscription.expiry_reminder', {
            organizationId: subscription.organizationId,
            subscriptionId: subscription.id,
            expiryDate: subscription.currentPeriodEnd,
          });
          
          this.logger.info(`Skickade upphörandenotifiering för prenumeration: ${subscription.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Fel vid körning av checkRenewalReminders:', error);
    }
  }

  /**
   * Kontrollerar och synkroniserar prenumerationsstatus med Stripe
   * Körs varje timme
   */
  async syncSubscriptionStatuses(): Promise<void> {
    this.logger.info('Kör schemalagt jobb: syncSubscriptionStatuses');
    
    try {
      // Hämta alla aktiva prenumerationer
      const subscriptions = await this.subscriptionRepository.getActiveSubscriptions();
      
      for (const subscription of subscriptions) {
        try {
          // Synkronisera prenumerationsstatus med Stripe
          if (subscription.payment?.subscriptionId) {
            await this.stripeService.syncSubscriptionStatus(subscription.id);
            this.logger.info(`Synkroniserade prenumerationsstatus för: ${subscription.id}`);
          }
        } catch (subError) {
          this.logger.error(`Fel vid synkronisering av prenumeration ${subscription.id}:`, subError);
          // Fortsätt med nästa prenumeration även om denna misslyckades
        }
      }
    } catch (error) {
      this.logger.error('Fel vid körning av syncSubscriptionStatuses:', error);
    }
  }

  /**
   * Stänger av utgångna prenumerationer och skickar notifikationer
   * Körs dagligen
   */
  async processExpiredSubscriptions(): Promise<void> {
    this.logger.info('Kör schemalagt jobb: processExpiredSubscriptions');
    
    try {
      const now = new Date();
      
      // Hämta prenumerationer där:
      // 1. De är markerade för att inte förnyas (cancelAtPeriodEnd = true)
      // 2. Slutdatumet har passerats
      // 3. De fortfarande har status 'active'
      const expiredSubscriptions = await this.subscriptionRepository.getExpiredSubscriptions(now);
      
      for (const subscription of expiredSubscriptions) {
        try {
          // Uppdatera status till 'canceled'
          await this.subscriptionRepository.updateSubscription(subscription.id, {
            status: 'canceled',
            updatedAt: now,
          });
          
          // Publicera händelse
          this.eventBus.publish('subscription.expired', {
            organizationId: subscription.organizationId,
            subscriptionId: subscription.id,
          });
          
          this.logger.info(`Stängde av utgången prenumeration: ${subscription.id}`);
        } catch (subError) {
          this.logger.error(`Fel vid avstängning av prenumeration ${subscription.id}:`, subError);
        }
      }
    } catch (error) {
      this.logger.error('Fel vid körning av processExpiredSubscriptions:', error);
    }
  }

  /**
   * Skickar påminnelse till kunder med förfallna betalningar
   * Körs dagligen
   */
  async sendPaymentFailureReminders(): Promise<void> {
    this.logger.info('Kör schemalagt jobb: sendPaymentFailureReminders');
    
    try {
      // Hämta prenumerationer med status 'past_due'
      const pastDueSubscriptions = await this.subscriptionRepository.getSubscriptionsByStatus('past_due');
      
      for (const subscription of pastDueSubscriptions) {
        // Skicka påminnelse om betalningsproblem
        this.eventBus.publish('subscription.payment_reminder', {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
        });
        
        this.logger.info(`Skickade påminnelse om betalningsproblem för: ${subscription.id}`);
      }
    } catch (error) {
      this.logger.error('Fel vid körning av sendPaymentFailureReminders:', error);
    }
  }

  /**
   * Uppdaterar statistik om prenumerationer i databasen
   * Körs veckovis
   */
  async updateSubscriptionStatistics(): Promise<void> {
    this.logger.info('Kör schemalagt jobb: updateSubscriptionStatistics');
    
    try {
      const now = new Date();
      
      // Hämta alla aktiva prenumerationer
      const activeSubscriptions = await this.subscriptionRepository.getSubscriptionsByStatus('active');
      
      // Beräkna statistik
      const stats = {
        totalActive: activeSubscriptions.length,
        byPlan: {} as Record<string, number>,
        totalMRR: 0, // Monthly Recurring Revenue
      };
      
      // OBS: I en verklig implementation skulle MRR beräknas baserat på prenumerationsplaner
      // Detta är en förenklad implementation för demonstration
      
      // Publicera statistik som en händelse
      this.eventBus.publish('subscription.statistics_updated', {
        timestamp: now,
        statistics: stats,
      });
      
      this.logger.info('Prenumerationsstatistik uppdaterad');
    } catch (error) {
      this.logger.error('Fel vid körning av updateSubscriptionStatistics:', error);
    }
  }

  /**
   * Registrerar alla schemalagda jobb
   * Denna metod skulle anropas vid applikationsstart
   */
  registerScheduledJobs(scheduler: any): void {
    // OBS: I en verklig implementation skulle vi använda ett schemaläggningsbibliotek
    // såsom node-cron, node-schedule eller liknande
    
    // Dagliga jobb
    scheduler.scheduleDaily('0 8 * * *', () => this.checkRenewalReminders());
    scheduler.scheduleDaily('0 9 * * *', () => this.processExpiredSubscriptions());
    scheduler.scheduleDaily('0 10 * * *', () => this.sendPaymentFailureReminders());
    
    // Timvisa jobb
    scheduler.scheduleHourly('0 * * * *', () => this.syncSubscriptionStatuses());
    
    // Veckovisa jobb
    scheduler.scheduleWeekly('0 7 * * 1', () => this.updateSubscriptionStatistics());
    
    this.logger.info('Prenumerations-schemaläggningsjobb registrerade');
  }

  /**
   * Kör schemalagda jobb relaterade till prenumerationer
   */
  async runScheduledJobs(): Promise<Result<any, string>> {
    try {
      // Detta är bara en stub för tester
      return ok({ processed: true });
    } catch (error) {
      return err(`Failed to run scheduled jobs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 