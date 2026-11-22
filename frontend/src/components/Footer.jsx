import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-ankara mt-10 border-t border-line pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size="text-4xl" />
          <p className="mt-3 max-w-xs text-muted">Where creatives make things happen, and where people who want creative work find it.</p>
          <p className="mt-4 text-sm font-semibold text-brand-700">Made in Lagos, Nigeria</p>
        </div>
        <nav className="space-y-2 text-sm">
          <p className="mb-3 font-bold">Explore</p>
          <Link className="block text-muted hover:text-ink" to="/marketplace">Marketplace</Link>
          <Link className="block text-muted hover:text-ink" to="/boards">Idea Boards</Link>
          <Link className="block text-muted hover:text-ink" to="/requests">Requests</Link>
        </nav>
        <nav className="space-y-2 text-sm">
          <p className="mb-3 font-bold">Sheda</p>
          <Link className="block text-muted hover:text-ink" to="/about">About</Link>
          <Link className="block text-muted hover:text-ink" to="/register">Create an account</Link>
          <Link className="block text-muted hover:text-ink" to="/login">Log in</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Sheda NG. All rights reserved.
      </div>
    </footer>
  );
}