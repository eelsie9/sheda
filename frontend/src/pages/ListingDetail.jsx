import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { host, href, isVerified, money } from "../constants";
import { Avatar, Empty, Modal, Note, Page, Spinner, VerifiedBadge } from "../components/ui";
import { Mark } from "../components/Logo";

function SaveToBoard({ listingId, onClose }) {
  const { data, loading, reload } = useFetch("/boards/mine");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");

  async function save(boardId) {
    try {
      await api(`/boards/${boardId}/items`, { method: "POST", body: { listingId } });
      setMsg("Saved to your board.");
    } catch (e) {
      setMsg(e.message);
    }
  }
  async function create(e) {
    e.preventDefault();
    try {
      const d = await api("/boards", { method: "POST", body: { name } });
      await save(d.board.id);
      setName("");
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <Modal title="Save to an idea board" onClose={onClose}>
      {loading ? (
        <Spinner />
      ) : (
        data?.boards.map((b) => (
          <button key={b.id} onClick={() => save(b.id)} className="card mb-2 flex w-full justify-between p-4 text-left hover:bg-brand-50">
            <span className="font-semibold">{b.name}</span>
            <span className="text-sm text-muted">{b._count.items} ideas</span>
          </button>
        ))
      )}
      <form onSubmit={create} className="mt-4 flex gap-2">
        <input className="input" placeholder="Or start a new board" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn btn-primary">Create</button>
      </form>
      <div className="mt-3"><Note>{msg}</Note></div>
    </Modal>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user, gate } = useAuth();
  const { data, error, loading } = useFetch(`/listings/${id}`);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  if (loading) return <Page><Spinner /></Page>;
  if (error)
    return (
      <Page>
        <Empty title="Listing not found" hint={error}>
          <Link to="/marketplace" className="btn btn-primary">Back to marketplace</Link>
        </Empty>
      </Page>
    );

  const l = data.listing;
  const s = l.seller;
  const sp = s.sellerProfile;
  const mine = user?.id === s.id;

  const order = () =>
    gate(async () => {
      try {
        await api("/orders", { method: "POST", body: { listingId: l.id } });
        setNote("Order placed. The seller will confirm it. You can follow it on your profile.");
      } catch (e) {
        setNote(e.message);
      }
    });

  return (
    <Page>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-brand-100">
            {l.images[idx] ? (
              <img src={l.images[idx]} alt={l.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-500/60"><Mark size={160} /></div>
            )}
          </div>
          {l.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {l.images.map((src, i) => (
                <button key={src} onClick={() => setIdx(i)} className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${i === idx ? "border-brand-500" : "border-transparent"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2">
            <span className="chip">{l.category}</span>
            <span className="chip">{l.type === "SERVICE" ? "Service" : "Product"}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{l.title}</h1>
          <p className="mt-2 text-2xl font-bold text-brand-600">{money(l.price)}</p>
          <p className="mt-5 whitespace-pre-wrap text-lg">{l.description}</p>

          {mine ? (
            <p className="mt-6 rounded-xl bg-brand-50 p-4 text-muted">This is your listing. Manage it from your profile.</p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={order} className="btn btn-primary btn-lg">Order this</button>
              <button onClick={() => gate(() => setSaving(true))} className="btn btn-outline btn-lg">Save to idea board</button>
            </div>
          )}
          <div className="mt-4"><Note>{note}</Note></div>

          <div className="card mt-8 p-5">
            <Link to={`/u/${s.id}`} className="flex items-center gap-3">
              <Avatar name={s.name} src={s.avatar} size={48} />
              <span>
                <b className="flex flex-wrap items-center gap-2">{s.name} {isVerified(s) && <VerifiedBadge />}</b>
                <span className="text-sm text-muted">{sp?.creativeType}</span>
              </span>
            </Link>
            {sp?.offerings && <p className="mt-4 text-sm text-muted">{sp.offerings}</p>}
            {(sp?.portfolioLinks?.length > 0 || sp?.socialLinks?.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sp.portfolioLinks.map((u) => <a key={u} href={href(u)} target="_blank" rel="noreferrer" className="chip">Portfolio: {host(u)}</a>)}
                {sp.socialLinks.map((u) => <a key={u} href={href(u)} target="_blank" rel="noreferrer" className="chip">Contact: {host(u)}</a>)}
              </div>
            )}
          </div>
        </div>
      </div>
      {saving && <SaveToBoard listingId={l.id} onClose={() => setSaving(false)} />}
    </Page>
  );
}