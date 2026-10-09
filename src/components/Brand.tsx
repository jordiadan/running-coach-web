import { Link } from "react-router-dom";
import { MoveUpRight } from "lucide-react";

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Running Coach home">
      <span
        className={inverse ? "brand-mark brand-action" : "brand-mark"}
        aria-hidden="true"
      >
        <MoveUpRight className="h-5 w-5" strokeWidth={2.5} />
      </span>
      Running Coach
    </Link>
  );
}
