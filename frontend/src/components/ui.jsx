import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, Star, X } from "lucide-react";
import { CATEGORIES, initial } from "../constants";
import { uploadImage } from "../api";
import Logo, { Mark } from "./Logo";

export const Page = ({ children, className = "" }) => (
  <main className={`mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-8 ${className}`}>{children}</main>
);

export const Spinner = () => <p className="py-20 text-center text-muted">Loading…</p>;

// A photo that never leaves an ugly broken box: if it fails, a pink tile shows
export function Img({ src, alt = "", className = "" }) {
  const [bad, setBad] = useState(!src);
  useEffect(() => setBad(!src), [src]);
  if (bad)
    return (
      <div className={`flex items-center justify-center bg-brand-100 text-brand-300 ${className}`}>
        <Mark size={56} />
      </div>
    );
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={className} />;
}

export const Empty = ({ title, hint, children }) => (
  <div className="bg-ankara rounded-3xl px-6 py-14 text-center">
    <Mark size={56} className="mx-auto text-brand-300" />
    <p className="mt-3 text-lg font-semibold">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-sm text-muted">{hint}</p>}
    {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
  </div>
);

// The decorated banner at the top of a page
export const PageHeader = ({ title, text, image, children }) => (
  <section className="bg-ankara relative mb-8 animate-rise overflow-hidden rounded-[2rem] p-7 sm:p-10">
    <div className="relative z-10 max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {text && <p className="mt-2 text-lg text-muted">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap gap-3">{children}</div>}
    </div>
    {image && (
      <Img
        src={image}
        className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] md:block"
      />
    )}
    <span className="pointer-events-none absolute -bottom-10 left-1/3 h-28 w-28 rounded-full bg-brand-200/50" />
  </section>
);

export const Note = ({ children }) =>
  children ? (
    <p role="alert" className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
      {children}
    </p>
  ) : null;

export const Avatar = ({ name, src, size = 40 }) =>
  src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-900"
    >
      {initial(name)}
    </span>
  );

// Click the camera to choose a photo. It is cropped square and uploaded.
export function AvatarPicker({ name, src, size = 96, onUploaded }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const bmp = await createImageBitmap(file);
      const s = Math.min(bmp.width, bmp.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 480;
      canvas.getContext("2d").drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 480, 480);
      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.88));
      const url = await uploadImage(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      await onUploaded(url);
    } catch (err) {
      setError(err.message || "Could not upload that photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar name={name} src={src} size={size} />
      <button
        type="button"
        onClick={() => input.current.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow hover:bg-brand-600 disabled:opacity-60"
      >
        <Camera size={16} />
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/75 text-xs font-semibold">
          Saving…
        </span>
      )}
      {error && <p className="absolute left-0 top-full z-10 mt-2 w-52 text-xs font-medium text-brand-700">{error}</p>}
    </div>
  );
}

export const VerifiedBadge = () => (
  <span title="Verified seller" className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
    <BadgeCheck size={14} /> Verified
  </span>
);

export const Stars = ({ value = 0, size = 16 }) => (
  <span className="inline-flex text-brand-500" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} />
    ))}
  </span>
);

const tones = {
  PENDING: "bg-sand text-brand-900",
  OPEN: "bg-brand-100 text-brand-700",
  ACCEPTED: "bg-brand-500 text-white",
  CONFIRMED: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-brand-500 text-white",
  DECLINED: "bg-line text-muted",
  CANCELLED: "bg-line text-muted",
  CLOSED: "bg-line text-muted",
};
export const StatusBadge = ({ status }) => (
  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tones[status] || "bg-line"}`}>
    {status[0] + status.slice(1).toLowerCase()}
  </span>
);

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ankara-rose h-3" />
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-brand-50">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
  </label>
);

export const Group = ({ label, hint, children }) => (
  <fieldset>
    <legend className="label">{label}</legend>
    {children}
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </fieldset>
);

export function ChipSelect({ options, value, onChange, multi }) {
  const on = (o) => (multi ? value.includes(o) : value === o);
  const toggle = (o) =>
    multi ? onChange(on(o) ? value.filter((v) => v !== o) : [...value, o]) : onChange(o);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button type="button" key={o} onClick={() => toggle(o)} className={`chip ${on(o) ? "chip-on" : ""}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex gap-1 overflow-x-auto border-b border-line">
    {tabs.map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
          value === key ? "border-brand-500 text-brand-600" : "border-transparent text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

// The page shell for register, login and "become a seller or buyer"
export const AuthLayout = ({ title, subtitle, children }) => (
  <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
    <aside className="bg-ankara-rose relative hidden overflow-hidden p-12 text-white md:flex md:flex-col md:justify-between">
      <Logo size="text-5xl" light />
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <Img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=75" className="col-span-2 h-44 w-full rounded-[2rem] object-cover" />
        <Img src="https://images.unsplash.com/photo-1595351298020-038700609878?auto=format&fit=crop&w=500&q=75" className="h-36 w-full rounded-[2rem] rounded-tr-[3.5rem] object-cover" />
        <Img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=75" className="h-36 w-full rounded-[2rem] rounded-bl-[3.5rem] object-cover" />
      </div>
      <p className="relative z-10 max-w-sm text-3xl font-bold leading-tight tracking-tight">
        Where creatives and the people who love their work meet.
      </p>
    </aside>
    <section className="flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 md:hidden"><Logo size="text-4xl" /></div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  </div>
);

// Choose one or more crafts. They are saved as one text, like "Illustration, Fashion".
export function CraftSelect({ value, onChange }) {
  const picked = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  return (
    <div>
      <ChipSelect multi options={CATEGORIES} value={picked} onChange={(list) => onChange(list.join(", "))} />
      <p className="mt-2 text-xs text-muted">Pick as many as you like.</p>
    </div>
  );
}