import { useSubscription } from '../hooks/useSubscription';
import './UsageBadge.css';

interface UsageBadgeProps {
  onUpgradeClick?: () => void;
}

export function UsageBadge({ onUpgradeClick }: UsageBadgeProps) {
  const { usage, isLoading } = useSubscription();

  if (isLoading || !usage) {
    return null;
  }

  const percentUsed = (usage.minutes_used / usage.daily_limit_minutes) * 100;
  const isLow = usage.remaining_minutes <= 1;
  const isExhausted = usage.remaining_minutes <= 0;

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'basic': return 'Basic';
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      default: return 'Free';
    }
  };

  return (
    <div className={`usage-badge ${isExhausted ? 'exhausted' : isLow ? 'low' : ''}`}>
      <div className="usage-header">
        <span className="plan-label">{getPlanLabel(usage.plan)}</span>
        <span className="usage-text">
          {usage.remaining_minutes.toFixed(1)} min left today
        </span>
      </div>
      <div className="usage-bar">
        <div
          className="usage-fill"
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
      {isExhausted && onUpgradeClick && (
        <button className="upgrade-hint" onClick={onUpgradeClick}>
          Upgrade for more time
        </button>
      )}
    </div>
  );
}
