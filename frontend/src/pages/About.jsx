import { Link } from "react-router-dom";
import { Globe, MapPin, MessageCircle, Share2, Users } from "lucide-react";
import { PHOTOS } from "../constants";
import { Img, Page } from "../components/ui";
import Logo from "../components/Logo";

const PROBLEMS = [
  [Share2, "Instagram"],
  [MessageCircle, "WhatsApp"],
  [Users, "Word-of-mouth referrals"],
];

export default function About() {
  return (
    <Page className="space-y-16">
      <section className="bg-ankara-rose relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div className="animate-rise">
          <Logo size="text-7xl sm:text-8xl" light link={false} />
          <p className="mx-auto mt-6 max-w-xl text-xl text-white/90">
            A platform where creatives make things happen, and where people who want creative work find it.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Why Sheda exists</h2>
          <p className="mt-4 text-lg text-muted">
            Currently, discovering and purchasing creative products and services often happens through
            fragmented platforms such as Instagram, WhatsApp, and word-of-mouth referrals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {PROBLEMS.map(([Icon, label]) => (
              <span key={label} className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 font-medium text-brand-700">
                <Icon size={18} /> {label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Img src={PHOTOS.painter} className="h-56 w-full rounded-[2rem] object-cover" />
          <Img src={PHOTOS.jewelry} className="mt-8 h-56 w-full rounded-[2rem] object-cover" />
        </div>
      </section>

      <section className="bg-dots rounded-[2.5rem] px-6 py-12 text-center sm:px-12">
        <p className="mx-auto max-w-2xl text-xl">
          Thus, this presented an opportunity to develop a platform which brings together:
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {["Creative sellers", "Independent creators", "Customers"].map((t) => (
            <div key={t} className="rounded-3xl bg-white p-6 text-xl font-bold text-brand-700 shadow-sm">{t}</div>
          ))}
        </div>
        <p className="mt-8 text-2xl font-bold">...all in one accessible space!</p>
      </section>

      <section className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        <Img src={PHOTOS.friends} className="h-80 w-full rounded-[2.5rem] object-cover shadow-xl" />
        <div>
          <p className="text-lg">
            Behold <b>Sheda</b>, a platform where creatives make things happen, and where people who want
            creative work find it.
          </p>
          <p className="mt-4 text-lg text-muted">
            What sets it apart is that it's built for <b className="text-ink">demand-driven creation</b>,
            meaning shoppers can say what they want and creatives respond.
          </p>
        </div>
      </section>

      <section className="bg-waves rounded-[2.5rem] px-6 py-14 text-center sm:px-12">
        <p className="text-sm font-semibold text-brand-600">Where the name comes from</p>
        <p className="mt-3 text-6xl font-bold italic text-brand-700 sm:text-7xl">ṣẹ̀dá</p>
        <p className="mx-auto mt-6 max-w-2xl text-lg">
          It is gotten from the Yoruba word <i>ṣẹ̀dá</i>, which means "to create or bring into existence".
          Its origin hints at the culture of the place it was first thought about and started its
          operation:
        </p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-xl font-bold text-white">
          <MapPin size={22} /> Lagos
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white"><Globe size={26} /></span>
          <h2 className="mt-5 text-3xl font-bold">Nigeria now. The world soon.</h2>
          <p className="mt-4 text-lg text-muted">
            Currently, Sheda is Nigerian-based, but will soon be worldwide, so everyone has the chance of
            getting in contact with creatives they've always wanted to have a chance with, and creators
            will get the widespread audience other apps never could give them!
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Img src={PHOTOS.potter} className="h-48 w-full rounded-[2rem] rounded-tr-[4rem] object-cover" />
          <Img src={PHOTOS.laughing} className="h-48 w-full rounded-[2rem] rounded-bl-[4rem] object-cover" />
        </div>
      </section>

      <section className="bg-ankara-rose rounded-[2.5rem] px-6 py-12 text-center text-white sm:px-12">
        <h2 className="text-3xl font-bold">Ready to create something?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn btn-white btn-lg">Join Sheda</Link>
          <Link to="/marketplace" className="btn btn-lg border border-white/70 text-white hover:bg-white/10">Explore the marketplace</Link>
        </div>
      </section>
    </Page>
  );
}