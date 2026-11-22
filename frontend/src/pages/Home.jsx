import { Link } from "react-router-dom";
import { Megaphone, MessageCircle, Quote, Search } from "lucide-react";
import { useFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { PHOTOS, money, timeAgo } from "../constants";
import { Avatar, Empty, Img, Page, Spinner, Stars, VerifiedBadge } from "../components/ui";
import ListingCard from "../components/ListingCard";
import CategoryCircle from "../components/CategoryCircle";

const Heading = ({ children, to, link, sub }) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold sm:text-3xl">{children}</h2>
      {sub && <p className="mt-1 text-muted">{sub}</p>}
    </div>
    {to && <Link to={to} className="shrink-0 text-sm font-semibold text-brand-600 hover:underline">{link}</Link>}
  </div>
);

const STEPS = [
  [Search, "Discover", "Browse products and services from creatives across Nigeria, or save ideas on a board."],
  [Megaphone, "Request", "Can't find it? Post what you want and let creatives send you proposals."],
  [MessageCircle, "Create together", "Chat, agree on the details and bring your idea to life."],
];

export default function Home() {
  const { user, isSeller } = useAuth();
  const { data, error, loading } = useFetch("/home");

  if (error)
    return (
      <Page>
        <Empty title="Can't reach the server" hint="Check that your backend is running (npm run dev in sheda-backend)." />
      </Page>
    );
  if (loading) return <Page><Spinner /></Page>;

  const { categories, recommended, featuredCreators, latestRequests, testimonials, stats } = data;
  const personal = user?.interests?.length > 0;

  return (
    <Page className="space-y-20">
      {user ? (
        <section className="bg-ankara-rose relative animate-rise overflow-hidden rounded-[2.5rem] p-8 text-white sm:p-12">
          <div className="relative z-10 max-w-lg">
            <h1 className="text-3xl font-bold sm:text-4xl">Hi, {user.name.split(" ")[0]}</h1>
            <p className="mt-2 text-lg text-white/90">
              {isSeller ? "See what people are asking for today." : "What are you looking for today?"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/marketplace" className="btn btn-white btn-lg">Browse the marketplace</Link>
              <Link to="/requests" className="btn btn-lg border border-white/70 text-white hover:bg-white/10">
                {isSeller ? "See requests" : "Make a request"}
              </Link>
            </div>
          </div>
          <Img src={PHOTOS.team} className="absolute inset-y-0 right-0 hidden h-full w-1/3 object-cover [mask-image:linear-gradient(to_right,transparent,black_50%)] md:block" />
        </section>
      ) : (
        <section className="bg-ankara relative overflow-hidden rounded-[2.5rem] px-6 py-10 sm:px-12 sm:py-14">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div className="animate-rise">
              <span className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 shadow-sm">
                Made in Lagos, for creatives everywhere
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Find the creative behind your next idea.
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted">
                Shop handmade work, save ideas on boards, or post a request and let creators come to you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">Create an account</Link>
                <Link to="/marketplace" className="btn btn-outline btn-lg">Browse the marketplace</Link>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {featuredCreators.slice(0, 4).map((c) => (
                    <span key={c.id} className="rounded-full border-2 border-white"><Avatar name={c.name} src={c.avatar} size={40} /></span>
                  ))}
                </div>
                <p className="text-sm text-muted">
                  <b className="text-ink">{stats.creators} creatives</b> and {stats.listings} listings are already here
                </p>
              </div>
            </div>
            <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3">
              <Img src={PHOTOS.friends} className="col-span-2 h-52 w-full rounded-[2rem] object-cover shadow-lg" />
              <Img src={PHOTOS.potter} className="h-44 w-full rounded-[2rem] rounded-tr-[4rem] object-cover shadow-lg" />
              <Img src={PHOTOS.fashion} className="h-44 w-full rounded-[2rem] rounded-bl-[4rem] object-cover shadow-lg" />
              <div className="absolute -left-3 top-1/2 animate-floaty rounded-2xl bg-white px-4 py-3 shadow-xl">
                <p className="text-xs text-muted">Open requests</p>
                <p className="text-xl font-bold text-brand-600">{stats.requests}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <Heading sub="Pick a craft and see who is making it.">Browse by category</Heading>
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-8 sm:px-0">
          {categories.map((c, i) => (
            <CategoryCircle key={c.name} name={c.name} count={c.count} index={i} />
          ))}
        </div>
      </section>

      <section>
        <Heading to="/marketplace" link="See everything">{personal ? "Picked for you" : "Fresh on Sheda"}</Heading>
        {recommended.length ? (
          <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {recommended.slice(0, 8).map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <Empty title="No listings yet" hint="Sellers are still setting up. Check back soon." />
        )}
      </section>

      <section className="bg-waves -mx-4 rounded-[2.5rem] px-4 py-12 sm:mx-0 sm:px-12">
        <Heading sub="Three simple steps from idea to finished piece.">How Sheda works</Heading>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(([Icon, title, text], i) => (
            <div key={title} className="relative rounded-3xl bg-white p-7 shadow-sm">
              <span className="absolute right-6 top-4 font-brush text-6xl text-brand-100">{i + 1}</span>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white"><Icon size={26} /></span>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Heading sub="Verified creatives are shown first.">Check out these creators</Heading>
        {featuredCreators.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCreators.map((c) => (
              <Link key={c.id} to={`/u/${c.id}`} className="group overflow-hidden rounded-3xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-200/50">
                <div className="h-28 overflow-hidden bg-brand-100">
                  <Img src={c.cover} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="px-5 pb-5">
                  <span className="-mt-8 block w-fit rounded-full border-4 border-white"><Avatar name={c.name} src={c.avatar} size={64} /></span>
                  <p className="mt-2 flex flex-wrap items-center gap-2 font-bold">{c.name} {c.verified && <VerifiedBadge />}</p>
                  <p className="text-sm text-muted">{c.creativeType}</p>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted">
                    {c.averageRating ? <span className="flex items-center gap-1"><Stars value={c.averageRating} size={14} />{c.averageRating}</span> : <span>New</span>}
                    <span>{c.listingCount} listings</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="No creators yet" hint="Be the first to join as a seller." />
        )}
      </section>

      {testimonials.length > 0 && (
        <section className="bg-ankara-rose relative overflow-hidden rounded-[2.5rem] px-6 py-12 text-white sm:px-12">
          <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">People love what they find here</h2>
              <p className="mt-1 text-white/85">Real reviews from buyers on Sheda.</p>
            </div>
            <div className="flex gap-3">
              <Img src={PHOTOS.laughing} className="h-16 w-16 rounded-full border-2 border-white object-cover" />
              <Img src={PHOTOS.celebrate} className="h-16 w-16 rounded-full border-2 border-white object-cover" />
              <Img src={PHOTOS.team} className="h-16 w-16 rounded-full border-2 border-white object-cover" />
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-3xl bg-white p-6 text-ink">
                <Quote className="text-brand-300" size={28} />
                <blockquote className="mt-3">{t.comment}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={t.reviewer.name} src={t.reviewer.avatar} size={40} />
                  <span className="text-sm">
                    <b className="block">{t.reviewer.name}</b>
                    <span className="text-muted">on {t.seller.name}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {latestRequests.length > 0 && (
        <section>
          <Heading to="/requests" link="See all requests" sub="Buyers post what they need. Creatives respond.">What people are looking for</Heading>
          <div className="grid gap-4 md:grid-cols-2">
            {latestRequests.slice(0, 4).map((a) => (
              <Link key={a.id} to={`/requests/${a.id}`} className="card flex gap-4 p-5 transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-200/40">
                <Avatar name={a.user.name} src={a.user.avatar} size={48} />
                <div className="min-w-0">
                  <b>{a.title}</b>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
                  <p className="mt-2 text-sm text-muted">
                    {a.budget != null && <b className="mr-3 text-brand-600">{money(a.budget)}</b>}
                    {a.user.name} · {timeAgo(a.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-ankara relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2.5rem] p-8 sm:flex-row sm:items-center sm:p-12">
        <div>
          <h2 className="text-3xl font-bold">Can't find what you need?</h2>
          <p className="mt-2 text-lg text-muted">Post a request and let creators send you proposals.</p>
        </div>
        <Link to="/requests" className="btn btn-primary btn-lg relative z-10">{isSeller ? "See requests" : "Make a request"}</Link>
      </section>
    </Page>
  );
}