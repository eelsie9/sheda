import { Link } from "react-router-dom";
import { BookOpen, Camera, Clapperboard, Gem, Monitor, Music, Palette, PenTool, Scissors, Shapes, Shirt, Sparkles, Star } from "lucide-react";

const ICONS = {
  Art: Palette,
  Illustration: PenTool,
  "Graphic Design": Shapes,
  Fashion: Shirt,
  Jewelry: Gem,
  Crafts: Scissors,
  Photography: Camera,
  Videography: Clapperboard,
  Music,
  Writing: BookOpen,
  "Web Design": Monitor,
  Beauty: Sparkles,
  Other: Star,
};
const TONES = ["bg-brand-100", "bg-sand", "bg-brand-200", "bg-brand-50"];

export default function CategoryCircle({ name, count, index }) {
  const Icon = ICONS[name] || Star;
  return (
    <Link to={`/marketplace?category=${encodeURIComponent(name)}`} className="group flex w-24 shrink-0 flex-col items-center gap-3 text-center sm:w-28">
      <span
        className={`flex h-20 w-20 items-center justify-center rounded-full border border-line text-brand-600 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:bg-brand-500 group-hover:text-white group-hover:shadow-lg sm:h-24 sm:w-24 ${TONES[index % TONES.length]}`}
      >
        <Icon size={32} strokeWidth={1.6} />
      </span>
      <span className="text-sm font-semibold leading-tight">{name}</span>
      {count > 0 && <span className="-mt-2 text-xs text-muted">{count} listings</span>}
    </Link>
  );
}