export const ICONS = {
  layout: 'M3 4h18v16H3V4Zm0 5h18M9 9v11',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z',
  lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3',
  external: 'M14 3h7v7m0-7L10 14m0-10H4v16h16v-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  refresh: 'M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6m-5 4a8 8 0 0 0 14 5l3-3m0 6v-6h-6',
  edit: 'm15 4 5 5-11 11H4v-5L15 4Zm-2 2 5 5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',

  calendar: 'M5 5h14v15H5V5Zm3-2v4m8-4v4M5 10h14m-11 4h2m4 0h2m-8 3h2',
  team: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9v-2a6 6 0 0 1 12 0v2H3Zm13-9a3 3 0 0 0 0-6m2 9a5 5 0 0 1 3 4v2h-3',
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h5V15h3v4.5h5V10',
  jobs: 'M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm5-3h6l1.5 3h-9L9 5Zm-5 6h16',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  apps: 'M7 3h7l4 4v14H7V3Zm7 0v4h4M9.5 12h6M9.5 15.5h6',
  bell: 'M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Zm4 8.5a2.2 2.2 0 0 0 4 0',
  advice: 'M5 4.5h11a2 2 0 0 1 2 2V20l-4-2.5L10 20l-4-2.5L5 17.5V6.5a2 2 0 0 1 2-2Zm11.5 0H20v13',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3 2',
  check: 'm5 12.5 4.5 4.5L19 7',
  plus: 'M12 5v14M5 12h14',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  sms: 'M4 5.5h16v11H9l-5 3.5v-14.5Z',
  briefcase: 'M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm5-3h6l1.5 3h-9L9 5Zm-5 6h16',
  star: 'm12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7L12 4Z',
};

export default function Icon({ name, size = 20, className = '' }) {
  const d = ICONS[name] || '';
  return (
    <svg
      className={`icon ${className}`} width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
