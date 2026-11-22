import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { Empty, Field, Modal, Note, Page, PageHeader, Spinner } from "../components/ui";
import { PHOTOS } from "../constants";

function BoardCard({ board }) {
  const tiles = [0, 1, 2, 3].map((i) => board.items?.[i]);
  return (
    <Link to={`/boards/${board.id}`} className="group block">
      <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-brand-50">
        {tiles.map((it, i) => {
          const src = it?.imageUrl || it?.listing?.images?.[0];
          return src ? (
            <img key={i} src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div key={i} className={it ? "bg-brand-200" : "bg-brand-50"} />
          );
        })}
      </div>
      <h3 className="mt-3 font-semibold">{board.name}</h3>
      <p className="text-sm text-muted">
        {board._count?.items ?? 0} ideas
        {board.user ? ` · by ${board.user.name}` : board.isPublic ? " · Public" : " · Private"}
      </p>
    </Link>
  );
}

function NewBoard({ onClose }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", description: "", tags: "", isPublic: false });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api("/boards", {
        method: "POST",
        body: { name: f.name, description: f.description, isPublic: f.isPublic, tags: f.tags.split(",") },
      });
      navigate(`/boards/${d.board.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title="New idea board" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Board name"><input className="input" required placeholder="e.g. Wedding gift ideas" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="What is it for?"><textarea className="input min-h-20" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Tags" hint="Separate with commas, e.g. illustration, portrait, gift. Sellers and the assistant use these.">
          <input className="input" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-brand-500" checked={f.isPublic} onChange={(e) => setF({ ...f, isPublic: e.target.checked })} />
          Make this board public so sellers can see it and offer ideas
        </label>
        <Note>{error}</Note>
        <button className="btn btn-primary w-full">Create board</button>
      </form>
    </Modal>
  );
}

export default function Boards() {
  const { isSeller } = useAuth();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [match, setMatch] = useState(false);

  const qs = new URLSearchParams({ ...(search && { search }), ...(match && { matchMine: "true" }) }).toString();
  const { data, error, loading } = useFetch(isSeller ? `/boards/discover?${qs}` : "/boards/mine");

  return (
    <Page>
      <PageHeader
        title={isSeller ? "Idea Boards" : "Your idea boards"}
        text={
          isSeller
            ? "See what buyers are dreaming up, then offer products or services that fit."
            : "Save, organise and share ideas for things you'd like to buy or commission."
        }
        image={PHOTOS.painter}
      >
        {!isSeller && (
          <button onClick={() => setCreating(true)} className="btn btn-primary btn-lg">
            <Plus size={18} /> New board
          </button>
        )}
      </PageHeader>

      {isSeller && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className="input sm:max-w-sm" placeholder="Search boards" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setMatch(!match)} className={`chip ${match ? "chip-on" : ""}`}>Matches my craft</button>
        </div>
      )}

      {error ? (
        <Note>{error}</Note>
      ) : loading ? (
        <Spinner />
      ) : data.boards.length === 0 ? (
        <Empty
          title={isSeller ? "No public boards yet" : "You don't have any boards yet"}
          hint={isSeller ? "When buyers make their boards public, they show up here." : "Start a board for a project or a style you love."}
        >
          {!isSeller && <button onClick={() => setCreating(true)} className="btn btn-primary">Create your first board</button>}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.boards.map((b) => <BoardCard key={b.id} board={b} />)}
        </div>
      )}
      {creating && <NewBoard onClose={() => setCreating(false)} />}
    </Page>
  );
}