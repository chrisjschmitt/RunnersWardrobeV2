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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--color-bg-card)] rounded-2xl shadow-2xl border border-[var(--color-success)] overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--color-success)] p-4 text-center">
          <div className="text-4xl mb-2">💾</div>
          <h2 className="text-xl font-bold text-white">Back Up Your Data</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-center text-[var(--color-text-muted)] mb-2">
            You've completed <strong className="text-[var(--color-text-primary)]">{sessionCount} sessions</strong> since your last backup.
          </p>
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-6">
            Export your data now to keep it safe. If you delete the app, your history will be lost!
          </p>
          
          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full py-3 bg-[var(--color-success)] text-white rounded-xl font-semibold hover:bg-[#16a34a] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Now
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] rounded-xl font-medium hover:bg-[rgba(255,255,255,0.15)] transition-colors"
            >
              Remind me in 7 days
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

