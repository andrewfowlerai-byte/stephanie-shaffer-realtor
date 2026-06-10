/** Stephanie's public profiles. Inline SVG icons so they render regardless of
 *  the icon library version. Update the URLs here in one place. */

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" aria-hidden="true">
    <path d="M9.2 21.5v-8.01H6.6V9.5h2.6V7.49c0-2.58 1.54-4 3.9-4 1.12 0 2.3.2 2.3.2v2.52h-1.3c-1.27 0-1.67.79-1.67 1.6V9.5h2.84l-.45 3.99H12.4v8.01H9.2Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" aria-hidden="true">
    <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.46.66.26 1.22.6 1.77 1.15.56.55.9 1.11 1.15 1.77.24.64.41 1.36.46 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.46 2.43-.26.66-.6 1.22-1.15 1.77-.55.56-1.11.9-1.77 1.15-.64.24-1.36.41-2.43.46-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.46-.66-.26-1.22-.6-1.77-1.15-.56-.55-.9-1.11-1.15-1.77-.24-.64-.41-1.36-.46-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.46-2.43.26-.66.6-1.22 1.15-1.77.55-.56 1.11-.9 1.77-1.15.64-.24 1.36-.41 2.43-.46C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.97.04-1.5.21-1.86.34-.46.18-.8.4-1.15.75-.35.35-.57.69-.75 1.15-.13.36-.3.89-.34 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.97.21 1.5.34 1.86.18.46.4.8.75 1.15.35.35.69.57 1.15.75.36.13.89.3 1.86.34 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.97-.04 1.5-.21 1.86-.34.46-.18.8-.4 1.15-.75.35-.35.57-.69.75-1.15.13-.36.3-.89.34-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.97-.21-1.5-.34-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.36-.13-.89-.3-1.86-.34-1.05-.05-1.37-.06-4.04-.06Zm0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28Zm0 8.47a3.33 3.33 0 1 0 0-6.67 3.33 3.33 0 0 0 0 6.67Zm6.54-8.67a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 9.66H5.67V18h2.67V9.66Zm-1.34-4.2a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Zm11.34 7.73c0-2.31-1.23-3.38-2.88-3.38-1.33 0-1.92.73-2.26 1.24V9.66h-2.67V18h2.67v-4.55c0-.24.02-.49.09-.66.2-.49.64-.99 1.39-.99.98 0 1.37.75 1.37 1.84V18h2.67l.01-4.8Z" />
  </svg>
);

const HomesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" aria-hidden="true">
    <path d="M12 3.2 2.5 11h2.3v9.8h5V15h4.4v5.8h5V11h2.3L12 3.2Z" />
  </svg>
);

const LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/StephanieShaffer.Realtor/', icon: <FacebookIcon /> },
  { name: 'Instagram', href: 'https://www.instagram.com/stephanie.shaffer.realtor/', icon: <InstagramIcon /> },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/stephanie-shaffer-4345b85b/', icon: <LinkedInIcon /> },
  { name: 'Homes.com', href: 'https://www.homes.com/real-estate-agents/stephanie-shaffer/zzpkpcw/', icon: <HomesIcon /> },
];

export default function SocialLinks({ tone = 'dark', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  const styles = tone === 'dark'
    ? 'text-silver-300 hover:text-white hover:bg-white/10'
    : 'text-midnight-700 hover:text-flame-600 hover:bg-silver-100';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {LINKS.map(({ name, href, icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          title={name}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${styles}`}
        >
          <span className="w-5 h-5 block">{icon}</span>
        </a>
      ))}
    </div>
  );
}
