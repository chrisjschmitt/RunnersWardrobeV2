import { useState } from 'react';

type Tab = 'terms' | 'privacy';

interface TermsPrivacyProps {
  onBack?: () => void;
}

export function TermsPrivacy({ onBack }: TermsPrivacyProps) {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Help
        </button>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'terms'
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'privacy'
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      {activeTab === 'terms' ? <TermsOfService /> : <PrivacyPolicy />}

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        Last updated: December 2024
      </div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="space-y-6">
      {/* Important Disclaimer */}
      <div className="glass-card p-6 border-2 border-yellow-500/50 bg-[rgba(251,191,36,0.1)]">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Important Disclaimer
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          TrailKit provides clothing suggestions based on weather data and general outdoor activity guidelines. 
          <strong className="text-yellow-200"> These are recommendations only</strong> — use your own judgment 
          based on your fitness level, experience, health conditions, and local conditions.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          We are not responsible for any discomfort, injury, illness, or damage resulting from following 
          these suggestions. Always prioritize your safety and consult professionals when needed.
        </p>
      </div>

      {/* Terms Content */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Terms of Service
        </h2>

        <div className="space-y-6 text-sm">
          <Section title="1. Acceptance of Terms">
            <p>
              By using TrailKit ("the App"), you agree to these Terms of Service. If you don't agree, 
              please don't use the App.
            </p>
          </Section>

          <Section title="2. What TrailKit Does">
            <p>TrailKit is a free tool that:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Suggests clothing based on current weather conditions</li>
              <li>Learns from your activity history and feedback</li>
              <li>Stores your data locally on your device</li>
            </ul>
          </Section>

          <Section title="3. Use at Your Own Risk">
            <p>
              Outdoor activities carry inherent risks. The App's suggestions are general guidelines, not 
              professional advice. You are responsible for:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Assessing conditions at your actual location</li>
              <li>Knowing your own body and limitations</li>
              <li>Making final decisions about what to wear</li>
              <li>Carrying emergency supplies when appropriate</li>
              <li>Checking for weather alerts and warnings</li>
            </ul>
          </Section>

          <Section title="4. No Warranty">
            <p>
              TrailKit is provided "as is" without warranties of any kind. We don't guarantee that:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Weather data is 100% accurate (it comes from third-party APIs)</li>
              <li>Recommendations will be perfect for every situation</li>
              <li>The App will be available at all times</li>
              <li>The App is free of bugs or errors</li>
            </ul>
          </Section>

          <Section title="5. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, TrailKit and its creators shall not be liable for 
              any direct, indirect, incidental, special, or consequential damages resulting from your 
              use of the App, including but not limited to:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Discomfort from being over or underdressed</li>
              <li>Injury, illness, or health issues</li>
              <li>Property damage or loss</li>
              <li>Lost data or device issues</li>
            </ul>
          </Section>

          <Section title="6. Your Responsibilities">
            <p>You agree to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Use the App for lawful purposes only</li>
              <li>Not rely solely on the App for safety-critical decisions</li>
              <li>Keep your device and data secure</li>
              <li>Report any issues or bugs to help improve the App</li>
            </ul>
          </Section>

          <Section title="7. Beta Status">
            <p>
              TrailKit is currently in beta. Features may change, and the App may have bugs. 
              Your patience and feedback are appreciated!
            </p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>
              We may update these terms occasionally. Continued use of the App after changes 
              constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions about these terms? Email us at{' '}
              <span className="text-[var(--color-accent)]">GetTrailKit@gmail.com</span>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="space-y-6">
      {/* Privacy Summary */}
      <div className="glass-card p-6 border-2 border-green-500/50 bg-[rgba(34,197,94,0.1)]">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Privacy Summary
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          <strong className="text-green-200">Your data stays on your device.</strong> We don't have 
          accounts, servers, or cloud storage. Your activity history, preferences, and personal 
          information never leave your phone.
        </p>
      </div>

      {/* Beta Tracking Notice */}
      <div className="glass-card p-6 border-2 border-blue-500/50 bg-[rgba(59,130,246,0.1)]">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Beta Tracking Notice
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          <strong className="text-blue-200">During beta testing only:</strong> When you first open 
          the app, we collect anonymous device information to help with troubleshooting. This is 
          sent once and includes:
        </p>
        <ul className="text-sm text-[var(--color-text-muted)] mt-2 ml-4 list-disc space-y-1">
          <li>Location (city/region if permission granted, via BigDataCloud)</li>
          <li>Coordinates (latitude/longitude)</li>
          <li>IP address (via ipify.org)</li>
          <li>Browser and version</li>
          <li>Operating system</li>
          <li>Device type and screen size</li>
          <li>App version</li>
        </ul>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          <strong className="text-blue-200">This tracking will be removed</strong> before the 
          production release. It helps us understand our beta users and fix device-specific issues.
        </p>
      </div>

      {/* Privacy Content */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy Policy
        </h2>

        <div className="space-y-6 text-sm">
          <Section title="1. Data We Collect">
            <p className="font-medium text-[var(--color-text-primary)] mb-2">Stored Locally on Your Device:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Activity history</strong> — Date, time, location, weather, clothing worn, feedback</li>
              <li><strong>Settings</strong> — Temperature unit preference, API key (if applicable)</li>
              <li><strong>Custom clothing items</strong> — Any items you add to the lists</li>
            </ul>
            <p className="mt-4 font-medium text-[var(--color-text-primary)] mb-2">Used Temporarily (Not Stored by Us):</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Your location</strong> — Used only to fetch weather data, then discarded</li>
            </ul>
          </Section>

          <Section title="2. Third-Party Services">
            <p>TrailKit uses these external services:</p>
            
            <div className="mt-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <p className="font-medium text-[var(--color-text-primary)]">OpenWeatherMap API</p>
              <p className="text-[var(--color-text-muted)] mt-1">
                We send your approximate location (latitude/longitude) to get current weather. 
                See their privacy policy at{' '}
                <a 
                  href="https://openweather.co.uk/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline"
                >
                  openweather.co.uk/privacy-policy
                </a>
              </p>
            </div>

            <div className="mt-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <p className="font-medium text-[var(--color-text-primary)]">Vercel (Hosting)</p>
              <p className="text-[var(--color-text-muted)] mt-1">
                The App is hosted on Vercel. Standard server logs may include IP addresses. 
                See their privacy policy at{' '}
                <a 
                  href="https://vercel.com/legal/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>
          </Section>

          <Section title="3. Data Storage">
            <p>
              All your personal data is stored in IndexedDB, a browser database on your device. 
              This means:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>We cannot access your data</li>
              <li>Clearing browser data will delete your history</li>
              <li>Data doesn't sync between devices automatically</li>
              <li>You can export/import your data via CSV</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              <strong className="text-green-300">We do not sell, share, or transfer your personal data to anyone.</strong>
            </p>
            <p className="mt-2">
              The only external transmission is your location to the weather API, which is 
              necessary for the App to function.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <p>You have full control over your data:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>View</strong> — See all your history in the History tab</li>
              <li><strong>Export</strong> — Download your data as CSV anytime</li>
              <li><strong>Delete</strong> — Clear browser data to remove everything</li>
              <li><strong>Modify</strong> — Edit or delete individual records</li>
            </ul>
          </Section>

          <Section title="6. Cookies & Tracking">
            <p>
              TrailKit does not use cookies or ongoing analytics. During the beta period only, 
              we collect anonymous device information on first launch (see Beta Tracking Notice above). 
              This will be removed before production release.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              TrailKit is not directed at children under 13. We don't knowingly collect 
              data from children. If you're a parent and believe your child has provided 
              data, please contact us.
            </p>
          </Section>

          <Section title="8. Beta Signup (Landing Page)">
            <p>
              If you signed up for beta access on our landing page, we collected your name, 
              email, and preferred activity via Formspree. This data is used only to:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Send you beta access information</li>
              <li>Notify you of major updates</li>
            </ul>
            <p className="mt-2">
              You can unsubscribe at any time by emailing{' '}
              <span className="text-[var(--color-accent)]">GetTrailKit@gmail.com</span>
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this privacy policy occasionally. Changes will be reflected 
              in the "Last updated" date at the bottom of this page.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about privacy? Email us at{' '}
              <span className="text-[var(--color-accent)]">GetTrailKit@gmail.com</span>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      <div className="text-[var(--color-text-muted)]">{children}</div>
    </div>
  );
}


