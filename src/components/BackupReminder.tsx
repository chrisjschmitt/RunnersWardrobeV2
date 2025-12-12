import { useState, useEffect } from 'react';

const STORAGE_KEY_SESSION_COUNT = 'trailkit_sessions_since_backup';
const STORAGE_KEY_DISMISSED_UNTIL = 'trailkit_backup_reminder_dismissed';
const SESSIONS_BEFORE_REMINDER = 5;
const DISMISS_DAYS = 7;

interface BackupReminderProps {
  onExport: () => void;
}

export function BackupReminder({ onExport }: BackupReminderProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    checkShouldShowReminder();
  }, []);

  const checkShouldShowReminder = () => {
    // Check if dismissed recently
    const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED_UNTIL);
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      return; // Still dismissed
    }

    // Check session count
    const count = parseInt(localStorage.getItem(STORAGE_KEY_SESSION_COUNT) || '0', 10);
    setSessionCount(count);

    if (count >= SESSIONS_BEFORE_REMINDER) {
      setShowReminder(true);
    }
  };

  const handleDismiss = () => {
    // Dismiss for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + DISMISS_DAYS);
    localStorage.setItem(STORAGE_KEY_DISMISSED_UNTIL, dismissUntil.toISOString());
    setShowReminder(false);
  };

  const handleExport = () => {
    // Reset session count after export
    localStorage.setItem(STORAGE_KEY_SESSION_COUNT, '0');
    setShowReminder(false);
    onExport();
  };

  if (!showReminder) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-[rgba(34,197,94,0.15)] border border-[var(--color-success)] rounded-xl animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💾</span>
        <div className="flex-1">
          <p className="font-medium text-[var(--color-success)] mb-1">
            Time to back up your data!
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            You've completed {sessionCount} sessions. Export your data to keep it safe.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[var(--color-success)] text-white rounded-lg text-sm font-medium hover:bg-[#16a34a] transition-colors"
            >
              Export Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] rounded-lg text-sm hover:bg-[rgba(255,255,255,0.15)] transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Call this when a session is completed (feedback submitted)
export function incrementSessionCount() {
  const count = parseInt(localStorage.getItem(STORAGE_KEY_SESSION_COUNT) || '0', 10);
  localStorage.setItem(STORAGE_KEY_SESSION_COUNT, String(count + 1));
}

// Call this after a successful export to reset the counter
export function resetSessionCount() {
  localStorage.setItem(STORAGE_KEY_SESSION_COUNT, '0');
}

