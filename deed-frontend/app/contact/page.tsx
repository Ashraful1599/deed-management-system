import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import ContactFormClient from '@/app/_components/ContactFormClient';

export const metadata: Metadata = {
  title: 'Contact DolilBD',
  description: 'Get in touch with the DolilBD team. We respond within 24 hours.',
  openGraph: {
    title: 'Contact DolilBD',
    url: 'https://dolilbd.com/contact',
  },
};

const contactInfo = [
  {
    label: 'Email',
    value: 'dolilbd247@gmail.com',
    href: 'mailto:dolilbd247@gmail.com',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+880 1700-000000',
    href: 'tel:+8801700000000',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Office Hours',
    value: 'Sun – Thu, 9:00 AM – 6:00 PM',
    href: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Location',
    value: 'Dhaka, Bangladesh',
    href: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Have a question or feedback? We&apos;d love to hear from you.
            Fill in the form and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      <section className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Get in Touch</h2>
              {contactInfo.map((info) => (
                <div key={info.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-sm">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    {info.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{info.label}</p>
                    {info.href ? (
                      <a href={info.href} className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors break-all">
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-800">{info.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <ContactFormClient />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
