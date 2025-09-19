import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-bold text-lg">🐾</span>
        </div>
      </div>
      <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        AI-Petography
      </span>
    </Link>
  );
}
