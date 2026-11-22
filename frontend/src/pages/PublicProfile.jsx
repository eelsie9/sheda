import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { api, useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { host, href, isVerified, timeAgo } from "../constants";
import { Avatar, Empty, Note, Page, Spinner, Stars, VerifiedBadge } from "../components/ui";
import ListingCard from "../components/ListingCard";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: me, gate } = useAuth();
  const { data, error, loading, reload } = useFetch(`/users/${id}`);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <Page><Spinner /></Page>;
  if (error)
    return (
      <Page>
        <Empty title="Profile not found" hint={error}><Link to="/" className="btn btn-primary">Go home</Link></Empty>
      </Page>
    );

  const u = data.user;
  const sp = u.sellerProfile;
  const self = me?.id === u.id;

  const review = (e) => {
    e.preventDefault();
    gate(async () => {
      try {
        await api(`/users/${id}/reviews`, { method: "POST", body: { rating, comment } });
        setComment("");
        setMsg("Thanks for your review.");
        reload();
      } catch (err) {
        setMsg(err.message);
      }
    });
  };

  return (
    <Page className="space-y-12">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white">
        <div className="bg-ankara-rose h-36 sm:h-44" />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6 sm:px-8">
          <span className="-mt-14 rounded-full border-4 border-white bg-white shadow"><Avatar name={u.name} src={u.avatar} size={104} /></span>
          <div className="pb-1">
            <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight">
              {u.name} {isVerified(u) && <VerifiedBadge />}
            </h1>
            {sp && <p className="text-lg text-muted">{sp.creativeType}</p>}
            {sp && u.reviewCount > 0 && (
              <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Stars value={u.averageRating} /> {u.averageRating} ({u.reviewCount} reviews)</p>
            )}
            {u.bio && <p className="mt-2 max-w-lg">{u.bio}</p>}
            {self && <Link to="/profile" className="btn btn-outline btn-sm mt-3">Manage your profile</Link>}
          </div>
        </div>
      </div>

      {sp && (
        <section className="bg-dots rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold">About my work</h2>
          <p className="mt-2 whitespace-pre-wrap">{sp.offerings}</p>
          {(sp.portfolioLinks.length > 0 || sp.socialLinks.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sp.portfolioLinks.map((l) => <a key={l} href={href(l)} target="_blank" rel="noreferrer" className="chip bg-white">Portfolio: {host(l)}</a>)}
              {sp.socialLinks.map((l) => <a key={l} href={href(l)} target="_blank" rel="noreferrer" className="chip bg-white">Contact: {host(l)}</a>)}
            </div>
          )}
        </section>
      )}

      {sp && (
        <section>
          <h2 className="mb-5 text-2xl font-bold">Products and services</h2>
          {u.listings.length ? (
            <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {u.listings.map((l) => <ListingCard key={l.id} listing={{ ...l, seller: { name: u.name, avatar: u.avatar } }} />)}
            </div>
          ) : (
            <Empty title="Nothing listed yet" />
          )}
        </section>
      )}

      {sp && (
        <section className="max-w-2xl">
          <h2 className="mb-5 text-2xl font-bold">Reviews</h2>
          {!self && (
            <form onSubmit={review} className="card mb-6 space-y-3 p-5">
              <p className="font-semibold">Leave a review</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="text-brand-500">
                    <Star size={28} fill={n <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <textarea className="input min-h-20" placeholder="What was it like to work with them?" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Note>{msg}</Note>
              <button className="btn btn-primary">Post review</button>
            </form>
          )}
          {u.reviews.length === 0 ? (
            <p className="text-muted">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {u.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.reviewer.name} src={r.reviewer.avatar} size={32} />
                    <b>{r.reviewer.name}</b>
                    <Stars value={r.rating} size={14} />
                    <span className="ml-auto text-xs text-muted">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="mt-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {u.posts.length > 0 && (
        <section className="max-w-2xl">
          <h2 className="mb-5 text-2xl font-bold">Posts</h2>
          <div className="space-y-4">
            {u.posts.map((p) => (
              <div key={p.id} className="card p-4">
                <p className="whitespace-pre-wrap">{p.text}</p>
                <p className="mt-2 text-xs text-muted">{timeAgo(p.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}