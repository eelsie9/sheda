import { Link } from "react-router-dom";
import { money } from "../constants";
import { Avatar, Img } from "./ui";

export default function ListingCard({ listing }) {
  const s = listing.seller;
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-3xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-200/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-100">
        <Img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur">
          {listing.type === "SERVICE" ? "Service" : listing.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-snug">{listing.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted">
            <Avatar name={s?.name} src={s?.avatar} size={24} />
            <span className="truncate">{s?.name}</span>
          </span>
          <b className="shrink-0 text-brand-600">{money(listing.price)}</b>
        </div>
      </div>
    </Link>
  );
}