import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the DolilBD platform.',
  openGraph: {
    title: 'Terms of Service | DolilBD',
    url: 'https://dolilbd.com/terms',
  },
};

const LAST_UPDATED = 'March 1, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      {
        subtitle: '',
        body: 'By accessing or using the DolilBD platform ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all visitors, registered users, and dolil writers who access the platform.',
      },
    ],
  },
  {
    title: '2. Description of Service',
    content: [
      {
        subtitle: '',
        body: 'DolilBD is an online directory and appointment booking platform that connects members of the public with licensed dolil writers in Bangladesh. The platform allows dolil writers to create public profiles and allows clients to search for writers, view profiles, read reviews, and submit appointment requests.',
      },
      {
        subtitle: '',
        body: 'DolilBD is a facilitating platform only. We are not a law firm, we do not provide legal advice, and we are not a party to any agreement between a client and a dolil writer. All legal services are provided solely by the dolil writer.',
      },
    ],
  },
  {
    title: '3. User Accounts',
    content: [
      {
        subtitle: '3.1 Registration',
        body: 'To access certain features of the platform (such as booking appointments with a saved profile or accessing your dashboard), you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.',
      },
      {
        subtitle: '3.2 Account security',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately at support@dolilbd.com if you suspect any unauthorised access to your account.',
      },
      {
        subtitle: '3.3 One account per person',
        body: 'Each individual may only maintain one personal account. Creating multiple accounts to circumvent restrictions or bans is prohibited.',
      },
      {
        subtitle: '3.4 Account suspension',
        body: 'We reserve the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in behaviour harmful to other users or the platform.',
      },
    ],
  },
  {
    title: '4. Dolil Writer Listings',
    content: [
      {
        subtitle: '4.1 Eligibility',
        body: 'Only individuals who hold a valid dolil writer licence issued by the competent authority in Bangladesh may register as a dolil writer on this platform. By registering as a dolil writer, you represent and warrant that you hold a valid, current licence and that all information in your profile is accurate.',
      },
      {
        subtitle: '4.2 Profile accuracy',
        body: 'Dolil writers are solely responsible for the accuracy and completeness of their profile information, including their registration number, office name, location, and contact details. DolilBD may verify this information but is not obligated to do so.',
      },
      {
        subtitle: '4.3 Profile removal',
        body: 'We reserve the right to remove or suspend any dolil writer profile that contains false or misleading information, that has received substantiated complaints, or whose licence has expired or been revoked.',
      },
    ],
  },
  {
    title: '5. Appointment Bookings',
    content: [
      {
        subtitle: '5.1 Nature of bookings',
        body: 'Submitting an appointment request through the platform is a request only — it does not constitute a confirmed appointment or a binding contract. An appointment is only confirmed when the dolil writer explicitly confirms it through the platform.',
      },
      {
        subtitle: '5.2 Client responsibilities',
        body: 'When submitting an appointment request, you must provide accurate contact information. Submitting false information or booking appointments with no intention of attending is prohibited and may result in your account being suspended.',
      },
      {
        subtitle: '5.3 Dolil writer responsibilities',
        body: 'Dolil writers who confirm an appointment are expected to honour it. Repeated unexplained cancellations or no-shows may result in profile suspension.',
      },
      {
        subtitle: '5.4 Disputes',
        body: 'Any disputes arising from a service engagement between a client and a dolil writer are between those two parties. DolilBD is not responsible for the quality, outcome, or legality of any services provided by a dolil writer.',
      },
    ],
  },
  {
    title: '6. Reviews and Ratings',
    content: [
      {
        subtitle: '6.1 Honest reviews',
        body: 'Users may submit reviews and ratings for dolil writers they have engaged with. Reviews must be honest, based on genuine experience, and must not contain false statements, defamatory content, or personal attacks.',
      },
      {
        subtitle: '6.2 Prohibited review conduct',
        body: 'The following are prohibited: submitting fake or incentivised reviews, submitting reviews for dolil writers you have not engaged with, and attempting to manipulate a dolil writer\'s rating through coordinated positive or negative reviews.',
      },
      {
        subtitle: '6.3 Review removal',
        body: 'We reserve the right to remove reviews that violate these Terms or that we have reasonable grounds to believe are false or manipulated.',
      },
    ],
  },
  {
    title: '7. Prohibited Conduct',
    content: [
      {
        subtitle: '',
        body: 'You agree not to:\n\n• Use the platform for any unlawful purpose or in violation of any applicable Bangladeshi law\n• Post false, misleading, or fraudulent information\n• Impersonate any person or entity\n• Harass, threaten, or harm other users\n• Attempt to gain unauthorised access to any part of the platform or other users\' accounts\n• Use automated tools to scrape, crawl, or extract data from the platform without our written permission\n• Upload malicious code, viruses, or any content designed to disrupt the platform\n• Use the platform to send unsolicited commercial communications (spam)',
      },
    ],
  },
  {
    title: '8. Intellectual Property',
    content: [
      {
        subtitle: '8.1 Our content',
        body: 'The DolilBD platform, including its design, code, logos, and written content, is owned by DolilBD and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without our written permission.',
      },
      {
        subtitle: '8.2 Your content',
        body: 'You retain ownership of content you submit to the platform (such as profile information and reviews). By submitting content, you grant DolilBD a non-exclusive, royalty-free, worldwide licence to display and distribute that content as part of operating the Service.',
      },
    ],
  },
  {
    title: '9. Disclaimers',
    content: [
      {
        subtitle: '9.1 No legal advice',
        body: 'Nothing on this platform constitutes legal advice. DolilBD is a directory service. Always consult a qualified legal professional for advice on your specific legal situation.',
      },
      {
        subtitle: '9.2 No warranty',
        body: 'The Service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that any defects will be corrected.',
      },
      {
        subtitle: '9.3 Third-party conduct',
        body: 'DolilBD is not responsible for the conduct, services, or advice of any dolil writer listed on the platform. We do not endorse any specific dolil writer.',
      },
    ],
  },
  {
    title: '10. Limitation of Liability',
    content: [
      {
        subtitle: '',
        body: 'To the maximum extent permitted by applicable law, DolilBD shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, including but not limited to damages for lost profits, data loss, or goodwill, even if we have been advised of the possibility of such damages.\n\nOur total liability to you for any claim arising from these Terms or your use of the Service shall not exceed BDT 1,000 (one thousand taka).',
      },
    ],
  },
  {
    title: '11. Governing Law',
    content: [
      {
        subtitle: '',
        body: 'These Terms are governed by and construed in accordance with the laws of the People\'s Republic of Bangladesh. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.',
      },
    ],
  },
  {
    title: '12. Changes to These Terms',
    content: [
      {
        subtitle: '',
        body: 'We may revise these Terms at any time. When we do, we will update the "Last Updated" date at the top of this page. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms. We will notify registered users of material changes by email.',
      },
    ],
  },
  {
    title: '13. Contact',
    content: [
      {
        subtitle: '',
        body: 'For questions about these Terms, please contact us:\n\nDolilBD\nEmail: support@dolilbd.com\nPhone: +880 1700-000000\nDhaka, Bangladesh',
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      {/* Page header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Intro notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-10">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Please read these Terms carefully</strong> before using DolilBD.
              These Terms form a legally binding agreement between you and DolilBD.
              By accessing or using our platform, you confirm that you have read,
              understood, and agreed to be bound by these Terms.
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
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
            <Link href="/" className="text-gray-500 hover:text-gray-700">Back to Home</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
