import Link from 'next/link';

interface LogoProps {
  darkBg?: boolean;
  className?: string;
}

export default function Logo({ darkBg = false, className = '' }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      {/* Icon badge */}
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.5 2h8L16 5.5V17a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"
            fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2"
          />
          <path d="M12.5 2v3.5H16" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 9h6M7 11.5h6M7 14h3.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <span className={`text-lg font-extrabold tracking-tight ${darkBg ? 'text-white' : 'text-gray-900'}`}>
        Dolil<span className={darkBg ? 'text-blue-300' : 'text-blue-600'}>BD</span>
      </span>
    </Link>
  );
}
