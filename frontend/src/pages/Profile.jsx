import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, host, href, isVerified, lines, money, timeAgo, verifyChecks } from "../constants";
import { Avatar, AvatarPicker, ChipSelect, CraftSelect, Empty, Field, Group, Modal, Note, Page, Spinner, Stars, StatusBadge, Tabs, VerifiedBadge } from "../components/ui";
import { ListingForm } from "./Marketplace";
import { RequestCard } from "./Requests";

// Used for editing your profile AND for finishing details after you switch roles
function ProfileForm({ intro, onClose }) {
  const { user, isSeller, updateProfile } = useAuth();
  const sp = user.sellerProfile;
  const [f, setF] = useState({
    name: user.name,
    bio: user.bio || "",
    avatar: user.avatar || "",
    interests: user.interests || [],
    creativeType: sp?.creativeType || "",
    offerings: sp?.offerings || "",
    portfolio: (sp?.portfolioLinks || []).join("\n"),
    social: (sp?.socialLinks || []).join("\n"),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (isSeller && (!f.creativeType || !f.offerings.trim())) return setError("Choose what you create and describe what you offer.");
    setBusy(true);
    try {
      await updateProfile({
        name: f.name,
        bio: f.bio,
        avatar: f.avatar,
        interests: f.interests,
        ...(isSeller && {
          sellerProfile: { creativeType: f.creativeType, offerings: f.offerings, portfolioLinks: lines(f.portfolio), socialLinks: lines(f.social) },
        }),
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={intro ? "Finish your details" : "Edit profile"} onClose={onClose}>
      {intro && <p className="mb-4 text-muted">{intro}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name"><input className="input" required value={f.name} onChange={set("name")} /></Field>
        <Field label="Bio"><textarea className="input min-h-20" value={f.bio} onChange={set("bio")} /></Field>
        <Field label="Profile picture link"><input className="input" value={f.avatar} onChange={set("avatar")} /></Field>
        {isSeller ? (
          <>
            <Group label="What do you create?"><CraftSelect value={f.creativeType} onChange={(v) => setF({ ...f, creativeType: v })} /></Group>
            <Field label="What do you offer?"><textarea className="input min-h-24" value={f.offerings} onChange={set("offerings")} /></Field>
            <Field label="Portfolio links" hint="One per line. Buyers trust sellers who show their work.">
              <textarea className="input min-h-20" value={f.portfolio} onChange={set("portfolio")} />
            </Field>
            <Field label="Instagram, WhatsApp or website" hint="One per line. Buyers use these to contact you.">
              <textarea className="input min-h-20" value={f.social} onChange={set("social")} />
            </Field>
          </>
        ) : (
          <Group label="What kinds of creatives do you love?">
            <ChipSelect multi options={CATEGORIES} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
          </Group>
        )}
        <Note>{error}</Note>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </form>
    </Modal>
  );
}

function OrderRow({ o, label, actions = [], onChange }) {
  const setStatus = async (status) => {
    await api(`/orders/${o.id}/status`, { method: "PATCH", body: { status } });
    onChange();
  };
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <b>{o.title}</b>
        <p className="text-sm text-muted">{label} · {timeAgo(o.createdAt)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <b className="text-brand-600">{money(o.price)}</b>
        <StatusBadge status={o.status} />
        {actions.map((a) => (
          <button key={a} onClick={() => setStatus(a)} className="btn btn-soft btn-sm">{a[0] + a.slice(1).toLowerCase()}</button>
        ))}
      </div>
    </div>
  );
}

function Purchases() {
  const { data, error, loading, reload } = useFetch("/orders/mine");
  if (error) return <Note>{error}</Note>;
  if (loading) return <Spinner />;
  if (!data.orders.length)
    return (
      <Empty title="No purchases yet" hint="When you order something, it shows up here.">
        <Link to="/marketplace" className="btn btn-primary">Browse the marketplace</Link>
      </Empty>
    );
  return (
    <div className="space-y-3">
      {data.orders.map((o) => (
        <OrderRow key={o.id} o={o} label={`From ${o.seller?.name}`} actions={o.status === "PENDING" ? ["CANCELLED"] : []} onChange={reload} />
      ))}
    </div>
  );
}

function Sales() {
  const { data, error, loading, reload } = useFetch("/orders/sales");
  if (error) return <Note>{error}</Note>;
  if (loading) return <Spinner />;
  if (!data.orders.length) return <Empty title="No orders yet" hint="Orders from buyers show up here." />;
  const next = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["COMPLETED", "CANCELLED"] };
  return (
    <div className="space-y-3">
      {data.orders.map((o) => (
        <OrderRow key={o.id} o={o} label={`For ${o.buyer?.name}`} actions={next[o.status] || []} onChange={reload} />
      ))}
    </div>
  );
}

function History({ part }) {
  const { data, error, loading, reload } = useFetch("/users/me/history");
  if (error) return <Note>{error}</Note>;
  if (loading) return <Spinner />;

  if (part === "searches") {
    const clear = async () => {
      await api("/users/me/history/searches", { method: "DELETE" });
      reload();
    };
    return data.searches.length === 0 ? (
      <Empty title="No searches yet" hint="Things you search for in the marketplace show up here." />
    ) : (
      <>
        <div className="flex flex-wrap gap-2">
          {data.searches.map((s) => (
            <Link key={s.id} to={`/marketplace?search=${encodeURIComponent(s.query)}`} className="chip">{s.query}</Link>
          ))}
        </div>
        <button onClick={clear} className="btn btn-soft btn-sm mt-5">Clear search history</button>
      </>
    );
  }
  return data.viewedListings.length === 0 ? (
    <Empty title="Nothing viewed yet" hint="Products you open show up here." />
  ) : (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {data.viewedListings.map((l) => <ListingCard key={l.id} listing={l} />)}
    </div>
  );
}

function MyRequests() {
  const { data, error, loading } = useFetch("/asks/mine");
  if (error) return <Note>{error}</Note>;
  if (loading) return <Spinner />;
  if (!data.asks.length)
    return (
      <Empty title="No requests yet" hint="Tell creators what you're looking for.">
        <Link to="/requests" className="btn btn-primary">Make a request</Link>
      </Empty>
    );
  return <div className="space-y-4">{data.asks.map((a) => <RequestCard key={a.id} ask={a} />)}</div>;
}

function MyListings() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch(`/listings?sellerId=${user.id}`);
  const [adding, setAdding] = useState(false);
  const del = async (id) => {
    if (!confirm("Delete this listing?")) return;
    await api(`/listings/${id}`, { method: "DELETE" });
    reload();
  };
  return (
    <>
      <button onClick={() => setAdding(true)} className="btn btn-primary mb-6">Add a listing</button>
      {error ? (
        <Note>{error}</Note>
      ) : loading ? (
        <Spinner />
      ) : data.listings.length === 0 ? (
        <Empty title="No listings yet" hint="Add your first product or service so buyers can find you." />
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {data.listings.map((l) => (
            <div key={l.id}>
              <ListingCard listing={l} />
              <button onClick={() => del(l.id)} className="mt-1 text-xs font-semibold text-muted hover:text-brand-600">Delete</button>
            </div>
          ))}
        </div>
      )}
      {adding && <ListingForm onClose={() => setAdding(false)} onDone={reload} />}
    </>
  );
}

function Showcase({ onEdit }) {
  const { user } = useAuth();
  const sp = user.sellerProfile;
  if (!sp) return <Empty title="Your showcase is empty" hint="Add what you create and your portfolio."><button onClick={onEdit} className="btn btn-primary">Set up showcase</button></Empty>;
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <p className="text-sm text-muted">I create</p>
        <p className="text-xl font-bold">{sp.creativeType}</p>
        <p className="mt-4 text-sm text-muted">What I offer</p>
        <p className="whitespace-pre-wrap">{sp.offerings}</p>
      </div>
      <div className="card p-6">
        <p className="mb-3 font-semibold">Portfolio and contact links</p>
        {sp.portfolioLinks.length + sp.socialLinks.length === 0 ? (
          <p className="text-muted">Add portfolio links so buyers can trust your work.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sp.portfolioLinks.map((u) => <a key={u} href={href(u)} target="_blank" rel="noreferrer" className="chip">Portfolio: {host(u)}</a>)}
            {sp.socialLinks.map((u) => <a key={u} href={href(u)} target="_blank" rel="noreferrer" className="chip">Contact: {host(u)}</a>)}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onEdit} className="btn btn-outline">Edit showcase</button>
        <Link to={`/u/${user.id}`} className="btn btn-soft">See how buyers see me</Link>
      </div>
    </div>
  );
}

function Reviews() {
  const { user } = useAuth();
  const { data, error, loading } = useFetch(`/users/${user.id}`);
  if (error) return <Note>{error}</Note>;
  if (loading) return <Spinner />;
  const u = data.user;
  if (!u.reviews.length) return <Empty title="No reviews yet" hint="Reviews from buyers show up here." />;
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-lg font-bold"><Stars value={u.averageRating} size={20} /> {u.averageRating} from {u.reviewCount} reviews</p>
      {u.reviews.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-center gap-3"><Avatar name={r.reviewer.name} src={r.reviewer.avatar} size={32} /><b>{r.reviewer.name}</b><Stars value={r.rating} size={14} /></div>
          {r.comment && <p className="mt-2">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

function VerificationCard({ user }) {
  const checks = verifyChecks(user);
  const done = checks.filter(([, ok]) => ok).length;
  return (
    <div className="card mb-5 overflow-hidden">
      <div className="bg-dots flex items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">{isVerified(user) ? "You're a Verified seller" : "Get your Verified badge"}</p>
          <p className="text-sm text-muted">{done} of {checks.length} done. Verified sellers are recommended first.</p>
        </div>
        {isVerified(user) && <VerifiedBadge />}
      </div>
      <ul className="grid gap-2 p-5 sm:grid-cols-2">
        {checks.map(([label, ok]) => (
          <li key={label} className={`flex items-center gap-2 text-sm ${ok ? "text-ink" : "text-muted"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${ok ? "bg-brand-500 text-white" : "border border-line"}`}>
              {ok ? "✓" : ""}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Profile() {
  const { user, isSeller, switchRole, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(isSeller ? "showcase" : "overview");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(
    location.state?.switched ? `You're now using Sheda as a ${location.state.switched.toLowerCase()}.` : ""
  );
  const target = isSeller ? "BUYER" : "SELLER";

  async function doSwitch() {
    // Already set up for the other role? Switch straight away.
    // First time? Go to a page that asks for what that role needs.
    const ready =
      target === "BUYER"
        ? user.interests?.length > 0
        : !!(user.sellerProfile?.creativeType && user.sellerProfile?.offerings);
    if (!ready) return navigate(`/switch/${target.toLowerCase()}`);
    setBusy(true);
    setNote("");
    try {
      await switchRole(target);
      setTab(target === "SELLER" ? "showcase" : "overview");
      setNote(`You're now using Sheda as a ${target.toLowerCase()}.`);
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tabs = isSeller
    ? [["showcase", "Showcase"], ["listings", "My listings"], ["reviews", "Reviews"], ["orders", "Orders"]]
    : [["overview", "Overview"], ["searches", "Search history"], ["viewed", "Interacted with"], ["purchases", "Purchases"], ["requests", "My requests"]];

  return (
    <Page className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white">
        <div className="bg-ankara-rose h-36 sm:h-44" />
        <div className="flex flex-wrap items-end justify-between gap-5 px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end gap-5">
            <div className="rounded-full border-4 border-white bg-white shadow">
              <AvatarPicker name={user.name} src={user.avatar} size={104} onUploaded={(url) => updateProfile({ avatar: url })} />
            </div>
            <div className="pb-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
                {user.name} {isSeller && isVerified(user) && <VerifiedBadge />}
              </h1>
              <span className="mt-1 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                {isSeller ? "Seller" : "Buyer"}
              </span>
              {user.bio && <p className="mt-2 max-w-md text-muted">{user.bio}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm">Edit profile</button>
            <button onClick={doSwitch} disabled={busy} className="btn btn-primary btn-sm">
              {busy ? "Switching…" : `Switch to ${isSeller ? "buyer" : "seller"}`}
            </button>
            <button onClick={() => { logout(); navigate("/"); }} className="btn btn-soft btn-sm">Log out</button>
          </div>
        </div>
      </div>

      <Note>{note}</Note>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div>
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="card p-6">
              <p className="font-semibold">Creatives you love</p>
              {user.interests.length ? (
                <div className="mt-3 flex flex-wrap gap-2">{user.interests.map((i) => <span key={i} className="chip">{i}</span>)}</div>
              ) : (
                <p className="mt-1 text-muted">Pick a few so we can recommend sellers for you.</p>
              )}
              <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm mt-4">Edit interests</button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/boards" className="btn btn-primary">My idea boards</Link>
              <Link to="/requests" className="btn btn-outline">Make a request</Link>
            </div>
          </div>
        )}
        {tab === "searches" && <History part="searches" />}
        {tab === "viewed" && <History part="viewed" />}
        {tab === "purchases" && <Purchases />}
        {tab === "requests" && <MyRequests />}
        {tab === "showcase" && (
          <>
            <VerificationCard user={user} />
            <Showcase onEdit={() => setEditing(true)} />
          </>
        )}
        {tab === "listings" && <MyListings />}
        {tab === "reviews" && <Reviews />}
        {tab === "orders" && <Sales />}
      </div>

      {editing && <ProfileForm intro="" onClose={() => setEditing(false)} />}
    </Page>
  );
}