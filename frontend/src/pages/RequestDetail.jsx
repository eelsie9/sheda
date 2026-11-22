import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { host, href, lines, money, timeAgo } from "../constants";
import { Avatar, Empty, Field, Note, Page, Spinner, StatusBadge } from "../components/ui";

// The negotiation chat between the buyer and one seller
function Chat({ proposalId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const bottom = useRef(null);

  const load = () => api(`/proposals/${proposalId}`).then((d) => setMessages(d.messages)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [proposalId]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const d = await api(`/proposals/${proposalId}/messages`, { method: "POST", body: { text } });
      setMessages((m) => [...m, d.message]);
      setText("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-brand-50 p-4">
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet. Say hello and agree on the details.</p>}
        {messages.map((m) => {
          const mine = m.sender.id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "bg-brand-500 text-white" : "bg-white"}`}>
                <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="input" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" aria-label="Send"><Send size={16} /></button>
      </form>
      <div className="mt-2"><Note>{error}</Note></div>
    </div>
  );
}

function ProposalCard({ p, onChange }) {
  const [chat, setChat] = useState(false);
  const decide = async (status) => {
    await api(`/proposals/${p.id}/status`, { method: "PATCH", body: { status } });
    onChange();
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/u/${p.seller.id}`} className="flex items-center gap-3">
          <Avatar name={p.seller.name} src={p.seller.avatar} />
          <span>
            <b className="block">{p.seller.name}</b>
            <span className="text-sm text-muted">{p.seller.sellerProfile?.creativeType}</span>
          </span>
        </Link>
        <StatusBadge status={p.status} />
      </div>
      {p.price != null && <p className="mt-3 font-bold text-brand-600">{money(p.price)}</p>}
      <p className="mt-2 whitespace-pre-wrap">{p.message}</p>
      {p.sampleLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.sampleLinks.map((u) => <a key={u} href={href(u)} target="_blank" rel="noreferrer" className="chip">{host(u)}</a>)}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {p.status === "PENDING" && (
          <>
            <button onClick={() => decide("ACCEPTED")} className="btn btn-primary btn-sm">Accept</button>
            <button onClick={() => decide("DECLINED")} className="btn btn-outline btn-sm">Decline</button>
          </>
        )}
        <button onClick={() => setChat(!chat)} className="btn btn-soft btn-sm"><MessageCircle size={16} /> {chat ? "Hide chat" : "Chat"}</button>
      </div>
      {chat && <Chat proposalId={p.id} />}
    </div>
  );
}

function ProposalForm({ askId, onDone }) {
  const [f, setF] = useState({ message: "", price: "", samples: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      await api(`/asks/${askId}/proposals`, { method: "POST", body: { message: f.message, price: f.price, sampleLinks: lines(f.samples) } });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h2 className="text-xl font-bold">Send a proposal</h2>
      <Field label="Your message" hint="Say how you'd do it and why you're a good fit.">
        <textarea className="input min-h-28" required value={f.message} onChange={set("message")} />
      </Field>
      <Field label="Your price (₦)"><input className="input" type="number" min="0" value={f.price} onChange={set("price")} /></Field>
      <Field label="Samples of your work" hint="Paste links, one per line.">
        <textarea className="input min-h-20" value={f.samples} onChange={set("samples")} />
      </Field>
      <Note>{error}</Note>
      <button className="btn btn-primary">Send proposal</button>
    </form>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSeller } = useAuth();
  const { data, error, loading, reload } = useFetch(`/asks/${id}`);

  if (loading) return <Page><Spinner /></Page>;
  if (error)
    return (
      <Page>
        <Empty title="Request not found" hint={error}>
          <Link to="/requests" className="btn btn-primary">Back to requests</Link>
        </Empty>
      </Page>
    );

  const { ask, proposals, myProposal } = data;
  const owner = user?.id === ask.user.id;

  const toggle = async () => {
    await api(`/asks/${id}`, { method: "PATCH", body: { status: ask.status === "OPEN" ? "CLOSED" : "OPEN" } });
    reload();
  };
  const remove = async () => {
    if (!confirm("Delete this request?")) return;
    await api(`/asks/${id}`, { method: "DELETE" });
    navigate("/requests");
  };

  return (
    <Page className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{ask.title}</h1>
          <StatusBadge status={ask.status} />
        </div>
        <Link to={`/u/${ask.user.id}`} className="mt-3 flex items-center gap-2 text-muted">
          <Avatar name={ask.user.name} src={ask.user.avatar} size={28} />
          {ask.user.name} · {timeAgo(ask.createdAt)}
        </Link>
        <p className="mt-5 whitespace-pre-wrap text-lg">{ask.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ask.budget != null && <span className="chip">Budget {money(ask.budget)}</span>}
          {ask.category && <span className="chip">{ask.category}</span>}
        </div>
        {ask.referenceImages.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {ask.referenceImages.map((src) => <img key={src} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />)}
          </div>
        )}
        {owner && (
          <div className="mt-5 flex gap-2">
            <button onClick={toggle} className="btn btn-outline btn-sm">{ask.status === "OPEN" ? "Close request" : "Reopen request"}</button>
            <button onClick={remove} className="btn btn-soft btn-sm">Delete</button>
          </div>
        )}
      </div>

      {owner ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">Proposals ({proposals?.length ?? 0})</h2>
          {proposals?.length ? (
            <div className="space-y-4">{proposals.map((p) => <ProposalCard key={p.id} p={p} onChange={reload} />)}</div>
          ) : (
            <Empty title="No proposals yet" hint="Creators will send proposals here. You can chat with each one." />
          )}
        </section>
      ) : myProposal ? (
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your proposal</h2>
            <StatusBadge status={myProposal.status} />
          </div>
          {myProposal.price != null && <p className="mt-2 font-bold text-brand-600">{money(myProposal.price)}</p>}
          <p className="mt-2 whitespace-pre-wrap">{myProposal.message}</p>
          <Chat proposalId={myProposal.id} />
        </section>
      ) : !user ? (
        <Empty title="Want to respond?" hint="Log in with a seller account to send a proposal.">
          <Link to="/login" state={{ from: `/requests/${id}` }} className="btn btn-primary">Log in</Link>
          <Link to="/register" state={{ from: `/requests/${id}` }} className="btn btn-outline">Create account</Link>
        </Empty>
      ) : !isSeller ? (
        <Empty title="Want to respond?" hint="Switch to your seller account on your profile to send a proposal.">
          <Link to="/profile" className="btn btn-primary">Go to profile</Link>
        </Empty>
      ) : ask.status === "OPEN" ? (
        <ProposalForm askId={id} onDone={reload} />
      ) : (
        <Empty title="This request is closed" />
      )}
    </Page>
  );
}