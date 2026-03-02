import Link from 'next/link';
import Logo from '@/components/Logo';

const year = new Date().getFullYear();

const footerLinks = {
  Platform: [
    { label: 'Find a Writer', href: '/#directory' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Register as Writer', href: '/register' },
    { label: 'Sign In', href: '/login' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo darkBg className="mb-3" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Bangladesh&apos;s trusted platform for finding licensed dolil writers. Connect with verified professionals across all 64 districts.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {year} DolilBD. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Made for the people of Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}
