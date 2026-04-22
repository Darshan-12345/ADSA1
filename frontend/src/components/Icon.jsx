export default function Icon({ name, className = '' }) {
  const paths = {
    dashboard: 'M4 13h7V4H4v9Zm9 7h7v-7h-7v7ZM4 20h7v-5H4v5Zm9-9h7V4h-7v7Z',
    search: 'M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 22l2-2-6.5-6ZM6.5 11a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z',
    explorer: 'M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z',
    structure: 'M5 5h6v4H5V5Zm8 0h6v4h-6V5ZM5 11h6v8H5v-8Zm8 6h6v2h-6v-2Zm0-4h6v2h-6v-2Z',
    insights: 'M4 19h16v2H4v-2Zm2-2V9h3v8H6Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z',
    temporary: 'M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 11h4v2h-6V7h2Z',
    graph: 'M6 6a3 3 0 1 1 2.83 4H15.2a3 3 0 1 1 0 2H8.83A3 3 0 1 1 6 6Zm12 10a3 3 0 1 1-2.83-4H8.8a3 3 0 1 1 0-2h6.37A3 3 0 1 1 18 16Z',
    folder: 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1H3V7Zm0 3h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z',
    file: 'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm6 1.5V9h4.5',
    spark: 'm12 2 1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2Z',
    user: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z',
    dots: 'M5 12a2 2 0 1 0 0-.01ZM12 12a2 2 0 1 0 0-.01ZM19 12a2 2 0 1 0 0-.01Z',
    'chevron-right': 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    terminal: 'M20 19V7H4v12h16Zm0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16Zm-7 12v-2h5v2h-5Zm-7-2 1-1 3 3-3 3-1-1 2-2-2-2Z'
  };

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
}
