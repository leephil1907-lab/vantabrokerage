import { PageHero, Prose } from '@/components/marketing-ui';
export const metadata = { title: 'Cookie policy' };
export default function CookiesPage() {
  return (<><PageHero eyebrow="Legal" title="Cookie policy" body="This platform uses the minimum cookies required to operate securely." />
    <Prose>
      <h2>Essential cookies</h2>
      <p><strong>vanta_session</strong> — an HTTP-only session cookie storing a signed session token. Required for authentication, set with SameSite=Lax and Secure in production. Deleting it signs you out.</p>
      <h2>Local storage</h2>
      <p>Your selected trading account and interface preferences are stored locally in your browser so terminals open on the account you last used. No personal data is transmitted from local storage to third parties.</p>
      <h2>No advertising cookies</h2>
      <p>This platform does not set advertising or cross-site tracking cookies.</p>
      <h2>Managing cookies</h2>
      <p>You can clear cookies in your browser settings. Blocking the session cookie prevents sign-in.</p>
    </Prose></>);
}
