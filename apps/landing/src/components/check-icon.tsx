export function CheckIcon({ withDefs = false }: { withDefs?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="url(#chk)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {withDefs ? (
        <defs>
          <linearGradient id="chk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0AB6CC" />
            <stop offset="1" stopColor="#E6488F" />
          </linearGradient>
        </defs>
      ) : null}
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}
