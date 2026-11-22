import { Link, NavLink } from "react-router-dom";
import { Home, Megaphone, ShoppingBag, Sparkles, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";
import Logo from "./Logo";

export default function Navbar() {
  const { user, isSeller } = useAuth();
  const links = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { to: "/boards", label: "Idea Boards", icon: Sparkles },
    { to: "/requests", label: isSeller ? "Requests" : "Make A Request", icon: Megaphone },
  ];
  const top = ({ isActive }) =>
    `rounded-full px-4 py-2 text-[15px] font-medium transition ${
      isActive ? "bg-brand-100 text-brand-700" : "text-muted hover:text-ink"
    }`;
  const bottom = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
      isActive ? "text-brand-600" : "text-muted"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo size="text-3xl" />
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={top}>
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/about" className={top}>About</NavLink>
          </nav>
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-brand-50">
              <Avatar name={user.name} src={user.avatar} size={32} />
              <span className="hidden text-sm font-semibold sm:inline">{user.name.split(" ")[0]}</span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {isSeller ? "Seller" : "Buyer"}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link to="/login" className="px-3 py-2 text-sm font-semibold">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span className="hidden sm:inline">Create account</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white py-1 md:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={bottom}>
            <Icon size={22} />
            {label.replace("Make A Request", "Request")}
          </NavLink>
        ))}
        <NavLink to={user ? "/profile" : "/login"} className={bottom}>
          <User size={22} />
          {user ? "Profile" : "Log in"}
        </NavLink>
      </nav>
    </>
  );
}