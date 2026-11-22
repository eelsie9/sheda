import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Link2, Sparkles, X } from "lucide-react";
import { api, useFetch } from "../api";
import { money } from "../constants";
import { Avatar, Empty, Note, Page, Spinner, VerifiedBadge } from "../components/ui";

// The side panel that suggests creators for this board (verified creators first)
function Assistant({ boardId, refreshKey, onClose }) {
  const { data, error, loading } = useFetch(`/boards/${boardId}/recommendations?k=${refreshKey}`);
  return (
    <aside className="fixed bottom-16 right-0 top-16 z-30 w-full max-w-sm overflow-y-auto border-l border-line bg-white shadow-xl md:bottom-0">
      <div className="bg-ankara-rose flex items-center justify-between px-5 py-4 text-white">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles size={18} /> Sheda Assistant
        </h2>
        <button onClick={onClose} aria-label="Close assistant" className="rounded-full p-2 hover:bg-white/15"><X size={18} /></button>
      </div>
      <div className="p-5">
        {error ? (
          <Note>{error}</Note>
        ) : loading ? (
          <Spinner />
        ) : data.creators.length === 0 ? (
          <p className="text-muted">Add tags, notes or saved products to this board and I'll suggest creators who fit your ideas.</p>
        ) : (
          <>
            <p className="text-sm text-muted">Creators who fit this board, based on: {data.keywords.slice(0, 5).join(", ")}. Verified creators come first.</p>
            <div className="mt-4 space-y-4">
              {data.creators.map((c) => (
                <Link key={c.id} to={`/u/${c.id}`} className="card block p-4 transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-200/40">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} src={c.avatar} />
                    <div className="min-w-0">
                      <b className="flex flex-wrap items-center gap-2">{c.name} {c.verified && <VerifiedBadge />}</b>
                      <span className="text-sm text-muted">{c.sellerProfile.creativeType}</span>
                    </div>
                  </div>
                  {c.listings.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {c.listings.map((l) => (
                        <div key={l.id} className="aspect-square overflow-hidden rounded-xl bg-brand-100">
                          {l.images?.[0] && <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />}
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(`/boards/${id}`);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <Page><Spinner /></Page>;
  if (error)
    return (
      <Page>
        <Empty title="Can't open this board" hint={error}>
          <Link to="/boards" className="btn btn-primary">Back to boards</Link>
        </Empty>
      </Page>
    );

  const { board, isOwner } = data;

  async function add(e) {
    e.preventDefault();
    try {
      await api(`/boards/${id}/items`, { method: "POST", body: { imageUrl, note } });
      setImageUrl("");
      setNote("");
      setMsg("");
      setRefreshKey((k) => k + 1);
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  }
  const removeItem = async (itemId) => {
    await api(`/boards/${id}/items/${itemId}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
    reload();
  };
  const togglePublic = async () => {
    await api(`/boards/${id}`, { method: "PATCH", body: { isPublic: !board.isPublic } });
    reload();
  };
  const del = async () => {
    if (!confirm("Delete this board?")) return;
    await api(`/boards/${id}`, { method: "DELETE" });
    navigate("/boards");
  };
  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    setMsg("Link copied. Anyone with it can see this board.");
  };

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{board.name}</h1>
          {board.description && <p className="mt-1 max-w-xl text-muted">{board.description}</p>}
          <Link to={`/u/${board.user.id}`} className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Avatar name={board.user.name} src={board.user.avatar} size={24} /> {board.user.name}
          </Link>
          {board.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">{board.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setOpen(!open)} className="btn btn-primary"><Sparkles size={16} /> Sheda Assistant</button>
          {isOwner && board.isPublic && <button onClick={share} className="btn btn-outline"><Link2 size={16} /> Share</button>}
          {isOwner && <button onClick={togglePublic} className="btn btn-soft">{board.isPublic ? "Make private" : "Make public"}</button>}
          {isOwner && <button onClick={del} className="btn btn-soft">Delete</button>}
        </div>
      </div>

      {isOwner && (
        <form onSubmit={add} className="card mt-8 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
          <input className="input" placeholder="Image link" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <input className="input" placeholder="A note about this idea" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-primary">Add idea</button>
          <p className="text-xs text-muted md:col-span-3">To save a product, open it in the marketplace and tap "Save to idea board".</p>
        </form>
      )}
      <div className="mt-3"><Note>{msg}</Note></div>

      {board.items.length === 0 ? (
        <div className="mt-8"><Empty title="This board is empty" hint="Add images, notes and products to build your idea board." /></div>
      ) : (
        <div className="mt-8 columns-2 gap-4 md:columns-3">
          {board.items.map((it) => {
            const img = it.imageUrl || it.listing?.images?.[0];
            return (
              <div key={it.id} className="card mb-4 break-inside-avoid overflow-hidden">
                {img && <img src={img} alt="" className="w-full" />}
                <div className="p-3">
                  {it.listing && <Link to={`/listing/${it.listing.id}`} className="font-semibold hover:underline">{it.listing.title}</Link>}
                  {it.listing && <p className="text-sm font-bold text-brand-600">{money(it.listing.price)}</p>}
                  {it.note && <p className="mt-1 whitespace-pre-wrap text-sm">{it.note}</p>}
                  {isOwner && <button onClick={() => removeItem(it.id)} className="mt-2 text-xs font-semibold text-muted hover:text-brand-600">Remove</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <Assistant boardId={id} refreshKey={refreshKey} onClose={() => setOpen(false)} />}
    </Page>
  );
}