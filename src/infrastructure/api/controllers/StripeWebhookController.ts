import { Request, Response } from 'express';
import { StripeWebhookHandler } from '../../../domain/subscription/services/StripeWebhookHandler';
import { Logger } from '../../logger/Logger';
import { DependencyContainer } from '../../../domain/core/DependencyContainer';

/**
 * Controller för att hantera webhook-anrop från Stripe
 */
export class StripeWebhookController {
  private webhookHandler: StripeWebhookHandler;
  private logger: Logger;
  private webhookSecret: string;

  constructor(dependencies: DependencyContainer) {
    this.webhookHandler = dependencies.resolve<StripeWebhookHandler>('StripeWebhookHandler');
    this.logger = dependencies.resolve<Logger>('Logger');
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Hanterar inkommande webhook från Stripe
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      this.logger.warn('Stripe webhook mottagen utan signatur');
      res.status(400).send({ error: 'Ogiltig förfrågan: Stripe-Signature header saknas' });
      return;
    }

    try {
      const payload = req.body;
      const rawBody = req.rawBody || JSON.stringify(payload);
      
      // Verifiera webhook-signaturen
      const isValid = await this.webhookHandler.verifyWebhookSignature(
        rawBody,
        signature,
        this.webhookSecret
      );
      
      if (!isValid) {
        this.logger.warn('Ogiltig Stripe webhook-signatur mottagen');
        res.status(400).send({ error: 'Ogiltig Stripe webhook-signatur' });
        return;
      }
      
      // Bearbeta webhook-händelsen
      const event = payload.type;
      const data = payload.data;
      
      this.logger.info(`Webhook mottagen från Stripe: ${event}`);
      
      await this.webhookHandler.handleWebhookEvent(event, data);
      
      // Svara med 200 OK för att bekräfta mottagning
      res.status(200).send({ received: true });
    } catch (error) {
      let errorMessage = 'Ett oväntat fel inträffade';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      this.logger.error(`Fel vid hantering av Stripe webhook: ${errorMessage}`, error);
      
      // Webhook-fel bör inte skicka tillbaka 5xx-fel eftersom Stripe kommer att försöka igen
      // Vi skickar 200 för att indikera att vi tog emot och bearbetade webhook, även om det misslyckades
      res.status(200).send({ 
        received: true,
        error: errorMessage 
      });
    }
  }
} 