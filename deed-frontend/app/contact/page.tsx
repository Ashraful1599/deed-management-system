'use client';
import { useState } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const contactInfo = [
  {
    label: 'Email',
    value: 'support@dolilbd.com',
    href: 'mailto:support@dolilbd.com',
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
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]         = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate sending — replace with real API call when backend endpoint exists
    setTimeout(() => {
      setSent(true);
      setSubmitting(false);
    }, 800);
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      {/* Page header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Have a question or feedback? We&apos;d love to hear from you.
            Fill in the form and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Contact info cards */}
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

            {/* Contact form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              {sent ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Thank you for reaching out. We&apos;ll respond to your message within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Send a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text" name="name" required
                          value={form.name} onChange={handleChange}
                          placeholder="Full name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email" name="email" required
                          value={form.email} onChange={handleChange}
                          placeholder="you@example.com"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <select name="subject" value={form.subject} onChange={handleChange} className={inputCls}>
                        <option value="">Select a topic</option>
                        <option value="general">General Enquiry</option>
                        <option value="writer">Register as Dolil Writer</option>
                        <option value="complaint">Complaint</option>
                        <option value="technical">Technical Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message" required rows={5}
                        value={form.message} onChange={handleChange}
                        placeholder="Describe your question or feedback..."
                        className={`${inputCls} resize-none`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
