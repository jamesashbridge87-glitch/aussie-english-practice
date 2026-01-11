import Stripe from 'stripe';
import { UserModel } from '../models/User.js';
import { SubscriptionModel, PlanType } from '../models/Subscription.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Map plan names to Stripe price IDs from environment
const PRICE_IDS: Record<Exclude<PlanType, 'free'>, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || '',
  standard: process.env.STRIPE_PRICE_STANDARD || '',
  premium: process.env.STRIPE_PRICE_PREMIUM || '',
};

export const StripeService = {
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId },
    });

    UserModel.updateStripeCustomerId(userId, customer.id);
    return customer;
  },

  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    const user = UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.stripe_customer_id) {
      return stripe.customers.retrieve(user.stripe_customer_id) as Promise<Stripe.Customer>;
    }

    return this.createCustomer(userId, user.email, user.name || undefined);
  },

  async createCheckoutSession(
    userId: string,
    plan: Exclude<PlanType, 'free'>,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const priceId = PRICE_IDS[plan];
    if (!priceId) throw new Error(`No price configured for plan: ${plan}`);

    const customer = await this.getOrCreateCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
      },
    });

    return session;
  },

  async createPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const customer = await this.getOrCreateCustomer(userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return session;
  },

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  },

  async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as PlanType;

    if (!userId || !plan) {
      console.error('Missing metadata in checkout session');
      return;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Cancel any existing subscription
    const existingSub = SubscriptionModel.findByUserId(userId);
    if (existingSub) {
      SubscriptionModel.cancel(existingSub.id);
    }

    // Create new subscription record
    SubscriptionModel.create({
      user_id: userId,
      plan,
      status: 'active',
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: stripeSubscription.items.data[0].price.id,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    });
  },

  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = SubscriptionModel.findByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) return;

    const priceId = stripeSubscription.items.data[0].price.id;
    const plan = Object.entries(PRICE_IDS).find(([_, id]) => id === priceId)?.[0] as PlanType | undefined;

    SubscriptionModel.update(subscription.id, {
      status: stripeSubscription.status === 'active' ? 'active' :
              stripeSubscription.status === 'past_due' ? 'past_due' :
              stripeSubscription.status === 'trialing' ? 'trialing' : 'canceled',
      plan: plan || subscription.plan,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end ? 1 : 0,
    });
  },

  async handleSubscriptionCanceled(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = SubscriptionModel.findByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) return;

    SubscriptionModel.update(subscription.id, { status: 'canceled' });

    // Create a free tier subscription for the user
    SubscriptionModel.create({
      user_id: subscription.user_id,
      plan: 'free',
      status: 'active',
    });
  },

  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = SubscriptionModel.findByStripeSubscriptionId(invoice.subscription as string);
    if (!subscription) return;

    SubscriptionModel.update(subscription.id, { status: 'past_due' });
  },

  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('Stripe webhook secret not configured');

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  },
};
