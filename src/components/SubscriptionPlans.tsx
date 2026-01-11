import { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import './SubscriptionPlans.css';

interface SubscriptionPlansProps {
  onAuthRequired?: () => void;
}

export function SubscriptionPlans({ onAuthRequired }: SubscriptionPlansProps) {
  const { isAuthenticated } = useAuth();
  const { usage, startCheckout, openBillingPortal } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: 'basic' | 'standard' | 'premium') => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    try {
      await startCheckout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setError(null);
    try {
      await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  const currentPlan = usage?.plan || 'free';
  const isPaidPlan = currentPlan !== 'free';

  const planDetails = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      minutes: 2,
      description: 'Try it out',
      features: ['2 minutes per day', 'All practice modes', 'Basic progress tracking'],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 25,
      minutes: 5,
      description: 'Great for casual learners',
      features: ['5 minutes per day', 'All practice modes', 'Progress tracking', 'Pronunciation scoring'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 49,
      minutes: 10,
      description: 'Most popular',
      popular: true,
      features: ['10 minutes per day', 'All practice modes', 'Progress tracking', 'Pronunciation scoring', 'Priority support'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 79,
      minutes: 15,
      description: 'For serious learners',
      features: ['15 minutes per day', 'All practice modes', 'Progress tracking', 'Pronunciation scoring', 'Priority support', 'Early access to new features'],
    },
  ];

  return (
    <div className="subscription-plans">
      <div className="plans-header">
        <h2>Choose Your Plan</h2>
        <p>Practice more with a paid plan. Cancel anytime.</p>
      </div>

      {error && <div className="plans-error">{error}</div>}

      <div className="plans-grid">
        {planDetails.map(plan => {
          const isCurrentPlan = plan.id === currentPlan;
          const isDisabled = plan.id === 'free' || isCurrentPlan;

          return (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              {isCurrentPlan && <span className="current-badge">Current Plan</span>}

              <h3>{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>

              <div className="plan-price">
                <span className="price-amount">${plan.price}</span>
                <span className="price-period">/month AUD</span>
              </div>

              <div className="plan-minutes">
                {plan.minutes} min/day
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>

              {plan.id !== 'free' && (
                <button
                  className={`plan-button ${isCurrentPlan ? 'current' : ''}`}
                  onClick={() => handleSelectPlan(plan.id as 'basic' | 'standard' | 'premium')}
                  disabled={isDisabled || loadingPlan !== null}
                >
                  {loadingPlan === plan.id
                    ? 'Loading...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : 'Select Plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isPaidPlan && (
        <div className="manage-subscription">
          <button onClick={handleManageSubscription} className="manage-btn">
            Manage Subscription
          </button>
        </div>
      )}
    </div>
  );
}
