import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Cookie policy' };

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      summary="This platform uses the minimum cookies and local storage required to operate securely. No advertising or cross-site tracking cookies are set."
      breadcrumb="Cookies"
      updated="31 October 2026"
      sections={[
        { id: 'essential', title: 'Essential cookies', body: (
          <p><strong>vanta_session</strong> — an HTTP-only session cookie storing a signed session token. Required for authentication; set with SameSite=Lax and Secure in production. Deleting it signs you out.</p>
        ) },
        { id: 'storage', title: 'Local storage', body: (
          <p>Your selected trading account, terminal layout and interface preferences are stored locally in your browser so terminals open where you left them. Nothing in local storage is transmitted to third parties.</p>
        ) },
        { id: 'no-ads', title: 'No advertising cookies', body: (
          <p>This platform does not set advertising, profiling or cross-site tracking cookies, and does not load third-party analytics scripts.</p>
        ) },
        { id: 'control', title: 'Managing cookies', body: (
          <p>You can clear cookies and local storage from your browser settings. Blocking the session cookie prevents sign-in, since authentication depends on it.</p>
        ) },
      ]}
    />
  );
}
