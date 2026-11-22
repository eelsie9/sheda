import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, PHOTOS, lines, timeAgo } from "../constants";
import { Avatar, Empty, Field, Modal, Note, Page, PageHeader, Spinner, Tabs } from "../components/ui";
import ListingCard from "../components/ListingCard";

// The "Add a listing" form. Profile.jsx uses it too.
export function ListingForm({ onClose, onDone }) {
  const [f, setF] = useState({ title: "", description: "", price: "", category: CATEGORIES[0], type: "PRODUCT", images: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/listings", { method: "POST", body: { ...f, images: lines(f.images) } });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a listing" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title"><input className="input" required value={f.title} onChange={set("title")} /></Field>
        <Field label="Description"><textarea className="input min-h-24" required value={f.description} onChange={set("description")} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₦)"><input className="input" type="number" min="0" required value={f.price} onChange={set("price")} /></Field>
          <Field label="Type">
            <select className="input" value={f.type} onChange={set("type")}>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </select>
          </Field>
        </div>
        <Field label="Category">
          <select className="input" value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Image links" hint="Paste one link per line. Photo uploads are coming soon.">
          <textarea className="input min-h-20" value={f.images} onChange={set("images")} />
        </Field>
        <Note>{error}</Note>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Publish listing"}</button>
      </form>
    </Modal>
  );
}

function Shop() {
  const { isSeller } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("search") || "");
  const [adding, setAdding] = useState(false);
  const { data, error, loading, reload } = useFetch(`/listings?${params.toString()}`);
  const category = params.get("category") || "";
  const type = params.get("type") || "";

  const set = (k, v) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p);
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          set("search", q.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-11" placeholder="Search products and services" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primary">Search</button>
        {isSeller && (
          <button type="button" onClick={() => setAdding(true)} className="btn btn-soft">
            <Plus size={18} /> Add listing
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => set("category", "")} className={`chip ${!category ? "chip-on" : ""}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => set("category", category === c ? "" : c)} className={`chip ${category === c ? "chip-on" : ""}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {[["", "Everything"], ["PRODUCT", "Products"], ["SERVICE", "Services"]].map(([v, l]) => (
          <button key={v} onClick={() => set("type", v)} className={`chip ${type === v ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>

      <div className="mt-8">
        {error ? (
          <Note>{error}</Note>
        ) : loading ? (
          <Spinner />
        ) : data.listings.length === 0 ? (
          <Empty title="Nothing here yet" hint="Try another category, or post a request and let creators find you.">
            <Link to="/requests" className="btn btn-primary">Make a request</Link>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {data.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
      {adding && <ListingForm onClose={() => setAdding(false)} onDone={reload} />}
    </>
  );
}

function Community() {
  const { user, gate } = useAuth();
  const [by, setBy] = useState("");
  const { data, error, loading, reload } = useFetch(`/posts${by ? `?by=${by}` : ""}`);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [msg, setMsg] = useState("");

  const post = (e) => {
    e.preventDefault();
    gate(async () => {
      try {
        await api("/posts", { method: "POST", body: { text, images: image ? [image] : [] } });
        setText("");
        setImage("");
        setMsg("");
        reload();
      } catch (err) {
        setMsg(err.message);
      }
    });
  };
  const remove = async (id) => {
    await api(`/posts/${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={post} className="card space-y-3 p-5">
        <textarea className="input min-h-20" placeholder="Share something you loved or recommend…" value={text} onChange={(e) => setText(e.target.value)} />
        <input className="input" placeholder="Image link (optional)" value={image} onChange={(e) => setImage(e.target.value)} />
        <Note>{msg}</Note>
        <button className="btn btn-primary">Post</button>
      </form>

      <div className="my-6 flex gap-2">
        {[["", "Everyone"], ["sellers", "Sellers"], ["buyers", "Buyers"]].map(([v, l]) => (
          <button key={v} onClick={() => setBy(v)} className={`chip ${by === v ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>

      {error ? (
        <Note>{error}</Note>
      ) : loading ? (
        <Spinner />
      ) : data.posts.length === 0 ? (
        <Empty title="No posts yet" hint="Be the first to share something." />
      ) : (
        <div className="space-y-4">
          {data.posts.map((p) => (
            <article key={p.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={p.user.name} src={p.user.avatar} />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${p.user.id}`} className="font-semibold hover:underline">{p.user.name}</Link>
                  <p className="text-xs text-muted">{p.user.activeRole === "SELLER" ? "Seller" : "Buyer"} · {timeAgo(p.createdAt)}</p>
                </div>
                {user?.id === p.user.id && (
                  <button onClick={() => remove(p.id)} aria-label="Delete post" className="rounded-full p-2 text-muted hover:bg-brand-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {p.text && <p className="mt-3 whitespace-pre-wrap">{p.text}</p>}
              {p.images?.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {p.images.map((src) => <img key={src} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />)}
                </div>
              )}
              {p.listing && <Link to={`/listing/${p.listing.id}`} className="chip mt-3">{p.listing.title}</Link>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Marketplace() {
  const [tab, setTab] = useState("shop");
  return (
    <Page>
      <PageHeader title="Marketplace" text="Products, services and what the community is talking about." image={PHOTOS.vases} />
      <Tabs tabs={[["shop", "Shop"], ["community", "Community posts"]]} value={tab} onChange={setTab} />
      <div className="mt-6">{tab === "shop" ? <Shop /> : <Community />}</div>
    </Page>
  );
}