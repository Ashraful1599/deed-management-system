import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read how DolilBD collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | DolilBD',
    url: 'https://dolilbd.com/privacy',
  },
};

const LAST_UPDATED = 'March 1, 2026';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        subtitle: '1.1 Information you provide directly',
        body: 'When you register an account, we collect your name, email address, phone number, and role (user, dolil writer, or administrator). Dolil writers additionally provide their registration number, office name, and geographic location (district, upazila, union). When booking an appointment as a guest, we collect your name, phone number, and optionally your email address.',
      },
      {
        subtitle: '1.2 Information collected automatically',
        body: 'We collect standard server logs including your IP address, browser type, pages visited, and timestamps. This information is used solely for security monitoring and service improvement. We do not use tracking cookies for advertising purposes.',
      },
      {
        subtitle: '1.3 Profile photos',
        body: 'Dolil writers may optionally upload a profile photo. This photo is stored on our servers and displayed publicly on their profile page.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: '2.1 To provide the service',
        body: 'We use your information to operate the platform — creating your account, displaying dolil writer profiles to the public, routing appointment requests to the correct dolil writer, and sending in-platform notifications when appointments are confirmed or cancelled.',
      },
      {
        subtitle: '2.2 Communications',
        body: 'We may send transactional emails for account verification, password resets, and appointment status updates. We do not send marketing emails without your explicit opt-in consent.',
      },
      {
        subtitle: '2.3 Platform safety',
        body: 'We use account information and activity logs to detect fraudulent or abusive behaviour and to enforce our Terms of Service.',
      },
    ],
  },
  {
    title: '3. How We Share Your Information',
    content: [
      {
        subtitle: '3.1 Public profile information',
        body: 'Dolil writer profile information — including name, office name, registration number, location, and review ratings — is publicly visible to anyone who visits the platform, whether or not they are logged in. Phone numbers are displayed publicly to allow clients to contact writers directly.',
      },
      {
        subtitle: '3.2 Appointment requests',
        body: 'When you submit an appointment request, your name, phone number, email (if provided), preferred date, and message are shared with the dolil writer you are contacting. This information is necessary to fulfil the purpose of the booking.',
      },
      {
        subtitle: '3.3 No sale of data',
        body: 'We do not sell, rent, or trade your personal information to third parties for commercial purposes under any circumstances.',
      },
      {
        subtitle: '3.4 Legal disclosure',
        body: 'We may disclose your information if required to do so by law, court order, or governmental authority in Bangladesh, or to protect the rights, property, or safety of our users or the public.',
      },
    ],
  },
  {
    title: '4. Data Retention',
    content: [
      {
        subtitle: '',
        body: 'We retain your account information for as long as your account is active. If you request account deletion, we will remove your personal information within 30 days, except where we are required to retain it by law or for legitimate business purposes such as resolving disputes. Appointment records may be retained for up to 12 months for dispute resolution purposes.',
      },
    ],
  },
  {
    title: '5. Security',
    content: [
      {
        subtitle: '',
        body: 'We implement industry-standard security measures including HTTPS encryption for all data in transit, hashed password storage (bcrypt), and token-based authentication (Laravel Sanctum). However, no system is completely secure. We encourage you to use a strong, unique password and to report any suspected security issues to us immediately at support@dolilbd.com.',
      },
    ],
  },
  {
    title: '6. Your Rights',
    content: [
      {
        subtitle: '6.1 Access and correction',
        body: 'You may view and update your personal information at any time through your account profile settings.',
      },
      {
        subtitle: '6.2 Account deletion',
        body: 'You may request deletion of your account by contacting us at support@dolilbd.com. We will process your request within 30 days.',
      },
      {
        subtitle: '6.3 Data portability',
        body: 'You may request a copy of the personal data we hold about you. Contact us at the email address above and we will provide it in a machine-readable format within 14 days.',
      },
    ],
  },
  {
    title: '7. Cookies',
    content: [
      {
        subtitle: '',
        body: 'We use a single session cookie to maintain your login state. This cookie is essential for the platform to function and cannot be disabled. We do not use third-party analytics or advertising cookies.',
      },
    ],
  },
  {
    title: '8. Children\'s Privacy',
    content: [
      {
        subtitle: '',
        body: 'Our service is not directed at children under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
      },
    ],
  },
  {
    title: '9. Changes to This Policy',
    content: [
      {
        subtitle: '',
        body: 'We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. Continued use of the platform after changes constitutes your acceptance of the revised policy. For significant changes, we will notify registered users by email.',
      },
    ],
  },
  {
    title: '10. Contact Us',
    content: [
      {
        subtitle: '',
        body: 'If you have questions about this Privacy Policy or how we handle your data, please contact us at:\n\nDolilBD\nEmail: support@dolilbd.com\nPhone: +880 1700-000000\nDhaka, Bangladesh',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      {/* Page header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Intro */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-10">
            <p className="text-sm text-blue-800 leading-relaxed">
              DolilBD (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the DolilBD platform
              at dolilbd.com. This Privacy Policy explains what personal information we collect,
              how we use it, and your rights regarding that information. By using our platform,
              you agree to the practices described in this policy.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      {item.subtitle && (
                        <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{item.subtitle}</h3>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
            <Link href="/" className="text-gray-500 hover:text-gray-700">Back to Home</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
