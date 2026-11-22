import { Link } from "react-router-dom";

const S_PATH =
  "M66.8 27.5C66.8 26.8 65.9 26.2 65.1 25.3C64.4 24.3 63.4 23 62.2 22C61.1 21.1 59.6 20 58.1 19.5C56.6 19 54.8 19 53.1 19C51.4 19 49.4 19.2 47.6 19.7C45.8 20.1 43.9 20.7 42.3 21.6C40.7 22.5 39.1 23.7 37.7 25.1C36.4 26.4 35.2 28 34.3 29.6C33.3 31.3 32.5 33.3 32.2 35.1C32 37 32.2 39 32.6 40.7C33.1 42.5 33.8 44 34.7 45.4C35.5 46.8 36.4 48.1 37.6 49.4C38.9 50.6 40.7 51.8 42.2 52.7C43.7 53.6 45.3 54.2 46.6 54.8C47.8 55.5 48.6 55.9 49.9 56.5C51.1 57.2 52.7 58.2 53.9 58.9C55.1 59.7 56.3 60.4 57 60.9C57.8 61.4 57.9 61.4 58.1 61.8C58.4 62.2 58.5 62.6 58.6 63.2C58.6 63.7 58.6 64.7 58.5 65.3C58.4 66 58.4 66.4 58.1 67C57.7 67.5 57.3 68.1 56.5 68.8C55.7 69.5 54.3 70.4 53.2 71.1C52 71.8 50.9 72.4 49.7 72.8C48.4 73.2 47.2 73.4 45.8 73.5C44.5 73.6 42.7 73.6 41.3 73.5C39.9 73.4 38.5 73.2 37.4 73C36.4 72.7 35.7 72.4 34.9 71.9C34.2 71.4 33.4 70.5 32.7 69.9C32.1 69.3 31.6 68.3 31 68.3C30.4 68.3 29.4 69.3 29.2 69.9C29 70.5 29.6 71.1 30 71.9C30.4 72.8 30.9 74 31.7 75C32.5 76 33.6 77.1 34.8 77.9C36 78.6 37.5 79.1 39.1 79.6C40.7 80.1 42.6 80.6 44.4 80.8C46.2 81 48.2 81.1 50.1 80.9C52.1 80.6 54 80.1 55.9 79.4C57.7 78.7 59.7 77.9 61.4 76.7C63.2 75.6 65 74.2 66.4 72.6C67.8 71 68.9 69 69.6 67.1C70.3 65.2 70.8 63.2 70.8 61.3C70.9 59.3 70.7 57.2 69.9 55.4C69.2 53.6 67.6 51.8 66.2 50.5C64.9 49.2 63.3 48.4 62 47.5C60.6 46.6 59.6 46 58.2 45.2C56.8 44.4 55 43.5 53.5 42.8C52.1 42.1 50.6 41.6 49.5 41.1C48.5 40.6 48 40.3 47.2 39.8C46.5 39.2 45.8 38.4 45.2 37.7C44.6 37 44.1 36.1 43.8 35.5C43.4 35 43.3 34.8 43.2 34.4C43.1 33.9 43.1 33.5 43.3 32.8C43.5 32.1 44 31.1 44.5 30.3C45 29.6 45.3 28.9 46.1 28.3C46.8 27.7 47.7 27.1 48.8 26.6C49.9 26.1 51.6 25.6 52.8 25.2C54.1 24.9 55.3 24.7 56.4 24.7C57.5 24.8 58.4 25 59.4 25.5C60.5 26 61.8 27 62.7 27.7C63.7 28.3 64.6 29.4 65.3 29.4C66 29.3 66.9 28.2 66.8 27.5Z";

// The short logo: a brush "s", centred exactly in the square.
// tile = draw the rounded square behind it. tone = "blush" or "rose".
// Without tile it is just the s, in the current text colour.
export function Mark({ size = 48, tile = false, tone = "blush", className = "" }) {
  const bg = tone === "rose" ? "#C8445F" : "#FBE4E9";
  const fg = tone === "rose" ? "#FFFFFF" : "#C8445F";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Sheda" className={className}>
      {tile && <rect width="100" height="100" rx="27" fill={bg} />}
      <path d={S_PATH} fill={tile ? fg : "currentColor"} />
    </svg>
  );
}

// size is a Tailwind text size, e.g. "text-4xl". short = the small icon version.
// light = white version for pink backgrounds.
export default function Logo({ size = "text-4xl", short = false, link = true, light = false }) {
  const ink = light ? "text-white" : "text-brand-500";
  const dot = light ? "bg-white" : "bg-brand-500";
  const mark = short ? (
    <Mark size={40} tile />
  ) : (
    <span className={`relative inline-block pr-[0.62em] font-brush leading-none ${ink} ${size}`}>
      sh
      <span className="relative inline-block">
        e
        <i className={`absolute -bottom-[0.14em] left-1/2 h-[0.15em] w-[0.15em] -translate-x-1/2 rounded-full ${dot}`} />
      </span>
      da
      <b className={`absolute bottom-[0.14em] right-0 font-sans text-[0.24em] font-bold leading-none tracking-wider ${light ? "text-white/90" : "text-brand-600"}`}>
        NG
      </b>
    </span>
  );
  return link ? (
    <Link to="/" aria-label="Sheda NG home">
      {mark}
    </Link>
  ) : (
    mark
  );
}