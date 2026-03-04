export const DefaultAvatarSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="3"
    stroke="#000000"
    fill="none"
    role="img"
    aria-label="Default avatar"
    {...props}
  >
    <circle cx="32" cy="18.14" r="11.14" />
    <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
  </svg>
)
