import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, PHOTOS, lines, money, timeAgo } from "../constants";
import { Empty, Field, Modal, Note, Page, PageHeader, Spinner, StatusBadge, Tabs } from "../components/ui";

export function RequestCard({ ask }) {
  return (
    <Link to={`/requests/${ask.id}`} className="card block p-5 transition hover:border-brand-300">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{ask.title}</h3>
        <StatusBadge status={ask.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{ask.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        {ask.budget != null && <b className="text-brand-600">{money(ask.budget)}</b>}
        {ask.category && <span>{ask.category}</span>}
        {ask.user && <span>by {ask.user.name}</span>}
        <span>{ask._count?.proposals ?? 0} proposals</span>
        <span>{timeAgo(ask.createdAt)}</span>
      </div>
    </Link>
  );
}

function AskForm({ onClose }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ title: "", description: "", budget: "", category: "", images: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("/asks", {
        method: "POST",
        body: { title: f.title, description: f.description, budget: f.budget, category: f.category, referenceImages: lines(f.images) },
      });
      navigate(`/requests/${d.ask.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Make a request" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="What are you looking for?"><input className="input" required placeholder="e.g. A logo for my campus art club" value={f.title} onChange={set("title")} /></Field>
        <Field label="Details" hint="Style, size, deadline, anything that helps a creator say yes.">
          <textarea className="input min-h-28" required value={f.description} onChange={set("description")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget (₦)"><input className="input" type="number" min="0" value={f.budget} onChange={set("budget")} /></Field>
          <Field label="Category">
            <select className="input" value={f.category} onChange={set("category")}>
              <option value="">Any</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Reference images" hint="Paste image links, one per line (optional).">
          <textarea className="input min-h-20" value={f.images} onChange={set("images")} />
        </Field>
        <Note>{error}</Note>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Posting…" : "Post request"}</button>
      </form>
    </Modal>
  );
}

export default function Requests() {
  const { user, isSeller, gate } = useAuth();
  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [making, setMaking] = useState(false);

  const qs = new URLSearchParams({ ...(search && { search }), ...(category && { category }) }).toString();
  const path = tab === "open" ? `/asks?${qs}` : tab === "mine" ? "/asks/mine" : "/proposals/mine";
  const { data, error, loading } = useFetch(path);
  const tabs = [["open", "Open requests"], ...(user ? [isSeller ? ["proposals", "My proposals"] : ["mine", "My requests"]] : [])];

  return (
    <Page>
      <PageHeader
        title={isSeller ? "Requests" : "Make A Request"}
        text={
          isSeller
            ? "See what buyers are looking for. Respond with a proposal and samples of your work."
            : "Can't find it on Sheda? Tell creators what you need and let them come to you."
        }
        image={PHOTOS.team}
      >
        {!isSeller && (
          <button onClick={() => gate(() => setMaking(true))} className="btn btn-primary btn-lg">
            <Plus size={18} /> Make a request
          </button>
        )}
      </PageHeader>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "open" && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input className="input" placeholder="Search requests" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {error ? (
          <Note>{error}</Note>
        ) : loading ? (
          <Spinner />
        ) : tab === "proposals" ? (
          data.proposals.length === 0 ? (
            <Empty title="No proposals yet" hint="Open a request and send your first proposal." />
          ) : (
            data.proposals.map((p) => (
              <Link key={p.id} to={`/requests/${p.ask.id}`} className="card flex items-center justify-between gap-4 p-5 hover:border-brand-300">
                <div>
                  <b>{p.ask.title}</b>
                  <p className="text-sm text-muted">For {p.ask.user.name} · {p._count.messages} messages</p>
                </div>
                <div className="flex items-center gap-3">
                  {p.price != null && <b className="text-brand-600">{money(p.price)}</b>}
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))
          )
        ) : data.asks.length === 0 ? (
          <Empty title="No requests here yet" hint={tab === "mine" ? "Post your first request and creators will respond." : "Check back soon, or try different filters."} />
        ) : (
          data.asks.map((a) => <RequestCard key={a.id} ask={a} />)
        )}
      </div>
      {making && <AskForm onClose={() => setMaking(false)} />}
    </Page>
  );
}