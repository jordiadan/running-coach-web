import { Link } from "react-router-dom";

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      aria-label="Running Coach home"
    >
      <svg
        className="brand-mark"
        viewBox="0 0 36 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 27 13 5M13 27 23 5M23 27 33 5"
          stroke="currentColor"
          strokeWidth="5"
        />
      </svg>
      <span>
        Running<span className="brand-second">Coach</span>
      </span>
    </Link>
  );
}
