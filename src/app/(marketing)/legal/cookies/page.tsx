import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Cookie policy' };

export default function CookiesPage() {
  return <LegalPage title="Cookie policy" summary="The small number of cookies and device-storage items the Platform uses, why each exists, and how to control them." breadcrumb="Cookies" updated="4 November 2026" version="2.0" sections={[
    { id: 'what', title: '1. What cookies are', body: <>
      <p>Cookies are small files a site stores in your browser; similar mechanisms include local and session storage. They keep you signed in, protect sessions and remember preferences. This policy explains exactly which items PRIMEVEST sets and why.</p>
    </> },
    { id: 'necessary', title: '2. Strictly necessary', body: <>
      <p>Session and security cookies authenticate you, protect forms against forgery and bind your session to your device characteristics. These cannot be switched off: without them the terminal, wallet and admin surfaces cannot function securely.</p>
    </> },
    { id: 'functional', title: '3. Functional preferences', body: <>
      <p>We store your theme choice, smooth-scroll preference and support-chat launcher position in first-party device storage so the Platform looks and behaves as you left it. These items contain no identifiers shared with anyone and never leave your browser.</p>
    </> },
    { id: 'third-party', title: '4. Embedded third-party widgets', body: <>
      <p>Chart panels are rendered by an embedded TradingView widget; when a chart loads, TradingView may set its own cookies under its privacy policy. Market prices are fetched server-side, so quote venues receive no cookies or browser identifiers from you. No advertising, social or cross-site tracking cookies are set by PRIMEVEST.</p>
    </> },
    { id: 'manage', title: '5. Managing cookies', body: <>
      <p>Your browser lets you inspect, block and delete cookies and site storage. Blocking strictly necessary items will sign you out and prevent authenticated use; deleting functional storage simply resets preferences. Clearing site data also removes locally cached offline shells.</p>
    </> },
    { id: 'changes', title: '6. Changes and contact', body: <>
      <p>If we introduce additional storage purposes, this policy is updated before they go live and the version date above changes. Questions about cookies or the wider handling of personal data are answered under the <a href="/legal/privacy">privacy policy</a> contact route.</p>
    </> },
  ]} />;
}
