import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brush, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, lines } from "../constants";
import { AuthLayout, ChipSelect, CraftSelect, Field, Group, Note } from "../components/ui";

const ROLES = [
  ["BUYER", ShoppingBag, "I'm a buyer", "I'm looking for creatives. I want to shop, save ideas and post requests."],
  ["SELLER", Brush, "I'm a seller", "I create things and want to sell my products or services."],
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [f, setF] = useState({ name: "", email: "", password: "", offerings: "", portfolio: "", social: "" });
  const [interests, setInterests] = useState([]);
  const [creativeType, setCreativeType] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (role === "SELLER" && !creativeType) return setError("Choose what you create.");
    setBusy(true);
    try {
      await register({
        name: f.name,
        email: f.email,
        password: f.password,
        role,
        interests,
        ...(role === "SELLER" && {
          sellerProfile: {
            creativeType,
            offerings: f.offerings,
            portfolioLinks: lines(f.portfolio),
            socialLinks: lines(f.social),
          },
        }),
      });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!role)
    return (
      <AuthLayout title="Create your account" subtitle="First, tell us how you'll use Sheda. You can switch any time.">
        <div className="space-y-4">
          {ROLES.map(([r, Icon, title, text]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="card flex w-full items-start gap-4 p-5 text-left transition hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="rounded-2xl bg-brand-100 p-3 text-brand-600">
                <Icon size={24} />
              </span>
              <span>
                <b className="block text-lg">{title}</b>
                <span className="text-muted">{text}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-8 text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link>
        </p>
      </AuthLayout>
    );

  return (
    <AuthLayout
      title={role === "SELLER" ? "Set up your seller account" : "Set up your buyer account"}
      subtitle={role === "SELLER" ? "Tell buyers about your craft so they can trust you." : "Just a few details to get started."}
    >
      <button type="button" onClick={() => setRole(null)} className="mb-5 text-sm font-semibold text-brand-600">
        Change account type
      </button>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Your name"><input className="input" required value={f.name} onChange={set("name")} /></Field>
        <Field label="Email"><input className="input" type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Password" hint="At least 6 characters">
          <input className="input" type="password" minLength={6} required value={f.password} onChange={set("password")} />
        </Field>

        {role === "BUYER" ? (
          <Group label="What kinds of creatives do you love?" hint="Pick a few. We use these to recommend sellers.">
            <ChipSelect multi options={CATEGORIES} value={interests} onChange={setInterests} />
          </Group>
        ) : (
          <>
            <Group label="What do you create?">
              <CraftSelect value={creativeType} onChange={setCreativeType} />
            </Group>
            <Field label="What do you offer?" hint="Tell buyers what you make and what they can order.">
              <textarea className="input min-h-24" required value={f.offerings} onChange={set("offerings")} />
            </Field>
            <Field label="Portfolio links" hint="One link per line. Buyers trust sellers who show their work.">
              <textarea className="input min-h-20" value={f.portfolio} onChange={set("portfolio")} />
            </Field>
            <Field label="Instagram, WhatsApp or website" hint="One per line. Buyers use these to contact you.">
              <textarea className="input min-h-20" value={f.social} onChange={set("social")} />
            </Field>
          </>
        )}

        <Note>{error}</Note>
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}