import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './UserMenu.css';

interface UserMenuProps {
  onShowPlans?: () => void;
}

export function UserMenu({ onShowPlans }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const displayName = user.name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="user-avatar">{initial}</span>
        <span className="user-name">{displayName}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="user-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-email">{user.email}</span>
              {user.subscription && (
                <span className="dropdown-plan">
                  {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)} Plan
                </span>
              )}
            </div>
            <div className="dropdown-divider" />
            <button
              className="dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onShowPlans?.();
              }}
            >
              Subscription & Plans
            </button>
            <button
              className="dropdown-item logout"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
