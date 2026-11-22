import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const PASSWORD = "demo1234";
const day = (n) => new Date(Date.now() - n * 86400000);
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const face = (f) => (f ? `https://randomuser.me/api/portraits/${f[0]}/${f[1]}.jpg` : null);

// Photo pools (Unsplash). The script checks every photo and drops any that don't load.
const POOLS = {
  crafts: ["1595351298020-038700609878", "1597696929736-6d13bed8e6a8", "1605117012605-b68dedd4accc", "1590605095243-072811dbe64c", "1609881583302-61548332039c", "1607556671927-78a6605e290b", "1590422749897-47036da0b0ff", "1631125915902-d8abe9225ff2", "1577576223085-3eb295cd414f", "1620140036708-455ed5c0426a", "1422246358533-95dcd3d48961"],
  art: ["1541961017774-22349e4a1262", "1533158388470-9a56699990c6", "1579783900882-c0d3dad7b119", "1579783902614-a3fb3927b6a5", "1578301978018-3005759f48f7", "1513364776144-60967b0f800f", "1541701494587-cb58502866ab", "1549490349-8643362247b5", "1460661419201-fd4cecdf8a8b", "1456086272160-b28b0645b729"],
  illustration: ["1515405295579-ba7b45403062", "1547891654-e66ed7ebb968", "1513364776144-60967b0f800f", "1541701494587-cb58502866ab", "1549490349-8643362247b5", "1579783902915-f0b0de2c2eb3", "1533158388470-9a56699990c6", "1460661419201-fd4cecdf8a8b"],
  design: ["1561070791-2526d30994b5", "1558655146-9f40138edfeb", "1586717791821-3f44a563fa4c", "1572044162444-ad60f128bdea", "1626785774573-4b799315345d", "1609921212029-bb5a28e60960", "1558655146-d09347e92766"],
  fashion: ["1523381210434-271e8be1f52b", "1490481651871-ab68de25d43d", "1445205170230-053b83016050", "1469334031218-e382a71b716b", "1515886657613-9f3515b0c78f", "1529139574466-a303027c1d8b", "1539109136881-3be0616acf4b", "1509631179647-0177331693ae", "1483985988355-763728e1935b"],
  jewelry: ["1515562141207-7a88fb7ce338", "1535632066927-ab7c9ab60908", "1599643478518-a784e5dc4c8f", "1611591437281-460bfbe1220a", "1573408301185-9146fe634ad0", "1602173574767-37ac01994b2a"],
  photography: ["1516035069371-29a1b244cc32", "1452587925148-ce544e77e70d", "1554048612-b6a482bc67e5", "1502920917128-1aa500764cbd", "1495745966610-2a67f2297e5e"],
  videography: ["1492691527719-9d1e07e534b4", "1485846234645-a62644f84728", "1536240478700-b869070f9279", "1598899134739-24c46f58b8c0"],
  music: ["1511671782779-c97d3d27a1d4", "1520523839897-bd0b52f945a0", "1598488035139-bdbb2231ce04", "1493225457124-a3eb161ffa5f", "1514320291840-2e0a9bf2a9ae", "1470225620780-dba8ba36b745"],
  beauty: ["1522335789203-aabd1fc54bc9", "1487412947147-5cebf100ffc2", "1596462502278-27bfdc403348", "1560066984-138dadb4c035", "1522337360788-8b13dee7a37e", "1503236823255-94609f598e71"],
};

const alive = async (id) => {
  try {
    const r = await fetch(U(id, 200), { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(8000) });
    return r.status === 200 || r.status === 206;
  } catch {
    return false;
  }
};

async function verifyPools() {
  const all = [...new Set(Object.values(POOLS).flat())];
  const ok = new Set();
  for (let i = 0; i < all.length; i += 8) {
    await Promise.all(all.slice(i, i + 8).map(async (id) => ((await alive(id)) ? ok.add(id) : null)));
  }
  if (ok.size === 0) throw new Error("Couldn't load any photos. Check your internet connection and run again.");
  const spare = [...ok];
  for (const k of Object.keys(POOLS)) {
    POOLS[k] = POOLS[k].filter((id) => ok.has(id));
    if (!POOLS[k].length) POOLS[k] = spare.slice(0, 6);
  }
  console.log(`Photos checked: ${ok.size} of ${all.length} load.`);
}
const pic = (pool, i, w = 900) => U(POOLS[pool][i % POOLS[pool].length], w);

const SELLERS = [
  { k: "adaeze", name: "Adaeze Okonkwo", face: ["women", 44], craft: "Illustration", pool: "illustration", joined: 130,
    bio: "Illustrator in Lagos turning your people and stories into portraits you'll want to frame.",
    offer: "Custom portrait illustration, character design for books and brands, and art prints.",
    port: ["behance.net/adaezedraws"], soc: ["instagram.com/adaeze.draws", "wa.me/2348011100001"],
    items: [
      ["Custom portrait illustration", "Hand-drawn digital portrait of you, your partner or your family, delivered in 5 days as a high-resolution file.", 25000, "SERVICE"],
      ["Children's book character design", "Characters and a style guide for your picture book, with three rounds of revisions.", 60000, "SERVICE"],
      ["Framed couple caricature (A4)", "A playful hand-drawn caricature, printed and framed, ready to gift.", 18000, "PRODUCT"],
      ["Afro-futurist art print set", "Three limited-edition A3 prints on thick matte paper. Ships nationwide.", 12000, "PRODUCT"],
    ] },
  { k: "tunde", name: "Tunde Bakare", face: ["men", 32], craft: "Graphic Design", pool: "design", joined: 120,
    bio: "Brand designer helping Nigerian startups look as good as they work.",
    offer: "Logo design, branding, brand identity, flyers, social media kits and web design for small businesses.",
    port: ["behance.net/tundebakare"], soc: ["instagram.com/tunde.designs", "wa.me/2348011100002"],
    items: [
      ["Logo and brand identity pack", "A logo, colour palette, fonts and a one-page brand guide. Three concepts, two rounds of changes.", 85000, "SERVICE"],
      ["Event flyer design", "Print and social-ready flyer for your event, delivered in 48 hours.", 15000, "SERVICE"],
      ["Social media template kit (30 designs)", "Editable templates in your brand colours so your page always looks put together.", 35000, "SERVICE"],
      ["Business card design with print-ready files", "Front and back design with files your printer will love.", 10000, "SERVICE"],
    ] },
  { k: "kemi", name: "Kemi Adeyemi", face: ["women", 68], craft: "Fashion", pool: "fashion", joined: 110,
    bio: "Tailor and fashion designer in Lagos. Every stitch is made to measure.",
    offer: "Made-to-measure Ankara and aso-oke outfits, asoebi tailoring and handmade bags.",
    port: ["pinterest.com/kemistitches"], soc: ["instagram.com/kemi.stitches", "wa.me/2348011100003"],
    items: [
      ["Ankara two-piece set (made to measure)", "Skirt and top in the Ankara print of your choice, cut to your measurements.", 45000, "PRODUCT"],
      ["Aso-oke gele and fila set", "Hand-woven aso-oke gele and matching fila for weddings and big occasions.", 38000, "PRODUCT"],
      ["Custom bridal asoebi tailoring", "Matching outfits for your bridal party, sewn to size with fittings included.", 120000, "SERVICE"],
      ["Ankara tote bag", "Roomy lined tote with a zip pocket, handmade from leftover prints.", 9500, "PRODUCT"],
    ] },
  { k: "chidi", name: "Chidi Eze", face: ["men", 45], craft: "Photography", pool: "photography", joined: 100,
    bio: "Photographer capturing real moments in Enugu and Lagos.",
    offer: "Portrait, graduation, product and event photography.",
    port: ["chidieze.pixieset.com"],
    items: [
      ["Portrait session (1 hour, 15 edited photos)", "Relaxed outdoor or studio portraits with guidance on poses and outfits.", 40000, "SERVICE"],
      ["Graduation shoot package", "Cap, gown and friends. Includes 25 edited photos.", 55000, "SERVICE"],
      ["Product photography (10 items)", "Clean, bright product photos for your online shop.", 50000, "SERVICE"],
      ["Event coverage (4 hours)", "Candid and group photos with a sneak peek within 24 hours.", 90000, "SERVICE"],
    ] },
  { k: "zainab", name: "Zainab Bello", face: ["women", 55], craft: "Jewelry", pool: "jewelry", joined: 95,
    bio: "Abuja-based jeweller handmaking beaded pieces with a modern twist.",
    offer: "Beaded necklaces, waist beads, earrings and personalised bracelets.",
    port: ["etsy.com/shop/zainabbeads"], soc: ["instagram.com/zainab.beads", "wa.me/2348011100005"],
    items: [
      ["Handmade beaded necklace", "A bold statement necklace strung by hand in colours you choose.", 14000, "PRODUCT"],
      ["Waist beads set (custom length)", "Glass waist beads made to your size and colour preference.", 8500, "PRODUCT"],
      ["Gold-plated hoop earrings", "Lightweight hoops that stay bright and don't tarnish easily.", 22000, "PRODUCT"],
      ["Personalised name bracelet", "Your name or a short word in tiny beads on stretch cord.", 12000, "PRODUCT"],
    ] },
  { k: "emeka", name: "Emeka Nwosu", face: ["men", 76], craft: "Art", pool: "art", joined: 90,
    offer: "Canvas paintings, commissioned portraits and murals for homes, cafés and offices.",
    port: ["instagram.com/emeka.paints"], soc: ["wa.me/2348011100006"],
    items: [
      ["Abstract canvas painting (60x90cm)", "Original acrylic painting with bold colour and texture, signed and ready to hang.", 150000, "PRODUCT"],
      ["Commissioned oil portrait", "A portrait painted from your photo. Allow three weeks.", 200000, "SERVICE"],
      ["Mural painting (per square metre)", "Walls for cafés, shops and homes. Design consultation included.", 25000, "SERVICE"],
      ["Small watercolour landscape", "A6 watercolour of a place you love, framed.", 35000, "PRODUCT"],
    ] },
  { k: "funmi", name: "Funmi Ogunleye", face: ["women", 29], craft: "Crafts", pool: "crafts", joined: 85,
    bio: "Potter in Lagos making everyday ceramics that feel good in your hands.",
    offer: "Handmade pottery: mugs, plates, planters and pottery classes.",
    port: ["instagram.com/funmi.clay"], soc: ["instagram.com/funmi.clay", "wa.me/2348011100007"],
    items: [
      ["Hand-thrown ceramic mug set (4)", "Four stoneware mugs in a speckled glaze. Dishwasher safe.", 28000, "PRODUCT"],
      ["Terracotta plant pot trio", "Three pots in graduating sizes with saucers.", 18500, "PRODUCT"],
      ["Pottery class for two", "Two hours at the wheel. Take home your finished pieces.", 30000, "SERVICE"],
      ["Custom dinner plate set (6)", "Six plates in a glaze and size you choose. Allow four weeks.", 65000, "PRODUCT"],
    ] },
  { k: "tobi", name: "Tobi Salako", face: ["men", 52], craft: "Videography", pool: "videography", joined: 80,
    bio: "Filmmaker telling stories for weddings, brands and artists.",
    offer: "Wedding films, brand promos, music videos and short documentaries.",
    soc: ["instagram.com/tobi.frames", "wa.me/2348011100008"],
    items: [
      ["Wedding highlight film", "A 4 to 6 minute cinematic highlight film of your day.", 250000, "SERVICE"],
      ["30-second brand promo video", "Shot and edited for Instagram and TikTok.", 120000, "SERVICE"],
      ["Music video shoot (1 day)", "Full-day shoot with edit and one round of revisions.", 300000, "SERVICE"],
      ["Short documentary edit", "We shape your footage into a clear, moving story.", 80000, "SERVICE"],
    ] },
  { k: "ngozi", name: "Ngozi Ibe", face: ["women", 12], craft: "Beauty", pool: "beauty", joined: 75,
    bio: "Makeup artist for brides and big nights across Lagos.",
    offer: "Bridal and event makeup, gele tying and makeup masterclasses.",
    port: ["instagram.com/ngozi.glam"], soc: ["instagram.com/ngozi.glam", "wa.me/2348011100009"],
    items: [
      ["Bridal makeup (trial included)", "Long-lasting bridal makeup with a trial session beforehand.", 80000, "SERVICE"],
      ["Soft glam makeup for events", "Natural, glowing makeup for parties and photoshoots.", 25000, "SERVICE"],
      ["Makeup masterclass (2 hours)", "Learn to do your own makeup with products you own.", 40000, "SERVICE"],
      ["Gele tying and makeup bundle", "Gele and soft glam makeup in one booking.", 35000, "SERVICE"],
    ] },
  { k: "seyi", name: "Seyi Aluko", craft: "Music", pool: "music", joined: 70,
    bio: "Producer in Abuja making Afrobeats and soulful instrumentals.",
    offer: "Afrobeats production, custom beats, brand jingles and live guitar for events.",
    port: ["soundcloud.com/seyialuko"], soc: ["wa.me/2348011100010"],
    items: [
      ["Custom beat (exclusive)", "An original instrumental made for you, delivered with stems.", 50000, "SERVICE"],
      ["Afrobeats production package", "Full production for your song, from beat to final mix.", 150000, "SERVICE"],
      ["Jingle for your brand (30s)", "A catchy jingle for ads, podcasts and videos.", 60000, "SERVICE"],
      ["Live guitar for events (3 hours)", "Soulful live guitar for weddings and dinners.", 70000, "SERVICE"],
    ] },
];

const BUYERS = [
  { k: "tolu", name: "Tolu Adebayo", face: ["women", 21], interests: ["Illustration", "Fashion"], bio: "Brand manager in Lagos who loves backing local talent." },
  { k: "amaka", name: "Amaka Obi", face: ["women", 33], interests: ["Jewelry", "Beauty"], bio: "Planning a December wedding and collecting ideas." },
  { k: "ibrahim", name: "Ibrahim Musa", face: ["men", 60], interests: ["Photography", "Videography"], bio: "Film student in Abuja." },
  { k: "halima", name: "Halima Yusuf", face: ["women", 40], interests: ["Fashion", "Crafts"], bio: "Teacher who dresses for the joy of it." },
  { k: "femi", name: "Femi Coker", face: ["men", 27], interests: ["Graphic Design", "Web Design"], bio: "Founder of a small fintech startup." },
  { k: "ifeoma", name: "Ifeoma Nnadi", face: ["women", 8], interests: ["Art", "Crafts"], bio: "Interior stylist with a soft spot for handmade things." },
  { k: "bola", name: "Bola Sanni", face: ["women", 90], interests: ["Beauty", "Fashion"], bio: "Event planner in Lekki." },
  { k: "david", name: "David Akpan", face: ["men", 84], interests: ["Music", "Videography"], bio: "Podcaster and weekend DJ." },
  { k: "sade", name: "Sade Lawal", face: ["women", 72], interests: ["Illustration", "Art"], bio: "Writer who collects illustrated portraits." },
  { k: "uche", name: "Uche Okafor", face: ["men", 22], interests: ["Crafts", "Jewelry"], bio: "Gift-giver with a soft spot for handmade." },
];

const REVIEWS = [
  ["tolu", "adaeze", 5, "My portrait came out so beautiful my mum cried. Fast, kind and patient with my edits."],
  ["sade", "adaeze", 5, "Adaeze captured my sister perfectly. Already ordering a second one."],
  ["femi", "adaeze", 4, "Lovely art prints. Shipping to Ibadan took a few days longer than expected."],
  ["tolu", "tunde", 5, "Tunde delivered a full brand kit in a week. Clean, modern, exactly what we wanted."],
  ["femi", "tunde", 5, "Professional from brief to final files. Great communication."],
  ["amaka", "tunde", 4, "Flyer design was sharp. Would book again."],
  ["halima", "kemi", 5, "The Ankara set fits like it was made for me, because it was. Stunning stitching."],
  ["bola", "kemi", 5, "Kemi made my asoebi in record time. Everybody asked where I got it."],
  ["tolu", "kemi", 4, "Beautiful fabric choices and a fair price."],
  ["ibrahim", "chidi", 5, "Chidi made our graduation shoot feel effortless. The photos are gorgeous."],
  ["david", "chidi", 4, "Great eye for light. Edits were done in three days."],
  ["amaka", "zainab", 5, "The beaded necklace is even prettier in person. Packaging was lovely too."],
  ["bola", "zainab", 5, "My waist beads fit perfectly and the colours are so rich."],
  ["uche", "zainab", 4, "Bought the name bracelet as a gift and she loved it."],
  ["ifeoma", "emeka", 5, "The canvas is the centrepiece of my living room now. Emeka is a real artist."],
  ["sade", "emeka", 4, "Beautiful watercolour. It took a bit long but it was worth the wait."],
  ["halima", "funmi", 5, "These mugs are gorgeous and feel so good to hold. The pottery class was the best date night."],
  ["uche", "funmi", 5, "Terracotta pots arrived safely wrapped. My balcony looks amazing."],
  ["ifeoma", "funmi", 4, "Lovely handmade plates. The colour was slightly different from the photo, but still beautiful."],
  ["david", "tobi", 4, "Great energy on set and a smooth edit. The final film made us emotional."],
  ["ibrahim", "tobi", 5, "Tobi shot our promo in one day. Crisp, cinematic and on budget."],
  ["amaka", "ngozi", 5, "Ngozi's bridal makeup lasted all day and looked flawless in every photo."],
  ["bola", "ngozi", 5, "Soft glam done right. She really listens to what you want."],
  ["david", "seyi", 4, "The beat is fire. Revisions were quick."],
];

const BOARDS = [
  { b: "tolu", name: "Brand refresh ideas", desc: "Looks, logos and illustration styles for my skincare brand.", tags: ["branding", "logo", "illustration"],
    items: [["design", 0, "Clean wordmark with lots of white space"], ["design", 1, "Soft pink and cream palette"], "Logo and brand identity pack", ["illustration", 2, "Hand-drawn icons for packaging"], "Custom portrait illustration"] },
  { b: "tolu", name: "Gift ideas for mum", desc: "She loves art and statement jewellery.", tags: ["gift", "portrait", "jewelry"],
    items: ["Custom portrait illustration", "Handmade beaded necklace", ["jewelry", 3, "Gold hoops she would love"], "Framed couple caricature (A4)"] },
  { b: "amaka", name: "Wedding glam", desc: "Makeup, beads and bridal looks for December.", tags: ["makeup", "beads", "bridal"],
    items: [["beauty", 0, "Soft glam with glowing skin"], "Bridal makeup (trial included)", "Waist beads set (custom length)", ["beauty", 2, "Gele and makeup together"]] },
  { b: "ibrahim", name: "Shoot inspiration", desc: "Light, mood and framing for my film school project.", tags: ["photography", "portrait", "film"],
    items: [["photography", 0, "Golden hour portraits"], ["photography", 2, "Moody studio lighting"], ["videography", 1, "Cinematic wedding trailer"], "Portrait session (1 hour, 15 edited photos)"] },
  { b: "halima", name: "Ankara dreams", desc: "Bold prints with clean cuts.", tags: ["fashion", "ankara", "tailoring"],
    items: [["fashion", 1, "Bold prints, clean cuts"], "Ankara two-piece set (made to measure)", ["fashion", 4, "A jumpsuit silhouette"], "Ankara tote bag"] },
  { b: "femi", name: "Startup look and feel", desc: "How I want our fintech to look and feel.", tags: ["web design", "branding", "startup"],
    items: [["design", 2, "Landing page layout I like"], ["design", 3, "Colour system"], "Social media template kit (30 designs)"] },
  { b: "ifeoma", name: "Home décor, handmade", desc: "Pieces for a warm, textured living room.", tags: ["pottery", "art", "crafts", "home"],
    items: [["crafts", 1, "Neutral vases for the shelf"], "Hand-thrown ceramic mug set (4)", ["art", 0, "A statement canvas for the lounge"], "Abstract canvas painting (60x90cm)", "Custom dinner plate set (6)"] },
  { b: "sade", name: "Illustration style board", desc: "Styles I would love in a portrait of my family.", tags: ["illustration", "portrait", "colour"],
    items: [["illustration", 0, "Bold outlines"], ["art", 3, "Watercolour textures"], "Custom portrait illustration", "Afro-futurist art print set"] },
  { b: "david", name: "Music video moodboard", desc: "Energy and lighting for my next release.", tags: ["music", "videography", "afrobeats"],
    items: [["music", 3, "Neon stage lighting"], ["videography", 0, "Handheld energy"], "Music video shoot (1 day)", "Custom beat (exclusive)"] },
  { b: "uche", name: "Handmade gift box", desc: "Gifts that feel personal.", tags: ["crafts", "jewelry", "gift"],
    items: [["crafts", 4, "Terracotta and gold"], "Terracotta plant pot trio", "Personalised name bracelet", "Handmade beaded necklace"] },
];

const ASKS = [
  { k: "logo", b: "tolu", title: "Logo for my new skincare brand", desc: "Soft, friendly and clean. Think glowing skin and natural ingredients. I need a logo and a simple colour palette.", budget: 80000, cat: "Graphic Design", pool: "design", refs: [0, 1], age: 6 },
  { k: "bridal", b: "amaka", title: "Bridal makeup artist for my Lagos wedding", desc: "14 December in Lekki. I want a soft, glowing look that lasts all day. A trial session beforehand, please.", budget: 90000, cat: "Beauty", pool: "beauty", refs: [0, 2], age: 5 },
  { k: "doc", b: "ibrahim", title: "Videographer for a 30-minute documentary", desc: "A short documentary about street food vendors in Abuja. Looking for someone who can shoot and edit.", budget: 300000, cat: "Videography", pool: "videography", refs: [1], age: 8 },
  { k: "jumpsuit", b: "halima", title: "Ankara jumpsuit, size 14", desc: "Wide-leg with a fitted waist and pockets. I'll buy the fabric or you can suggest prints.", budget: 50000, cat: "Fashion", pool: "fashion", refs: [4, 5], age: 4 },
  { k: "landing", b: "femi", title: "Landing page design for my app", desc: "Modern and trustworthy. Figma file for the home page, pricing and sign-up screens.", budget: 150000, cat: "Web Design", pool: "design", refs: [2, 3], age: 3 },
  { k: "dinner", b: "ifeoma", title: "Custom ceramic dinner set for 8", desc: "Earthy tones with a matte finish. Plates, bowls and side plates. No rush on the timeline.", budget: 120000, cat: "Crafts", pool: "crafts", refs: [1, 4], age: 7 },
  { k: "map", b: "sade", title: "Illustrated map of Lagos for my wall", desc: "Colourful, with landmarks like Third Mainland Bridge, Lekki Conservation Centre and Freedom Park.", budget: 40000, cat: "Illustration", pool: "illustration", refs: [0, 2], age: 2 },
  { k: "jingle", b: "david", title: "Afrobeats jingle for my podcast", desc: "A 20 to 30 second intro with a catchy hook. Upbeat, with a little highlife in it.", budget: 60000, cat: "Music", pool: "music", refs: [3], age: 9 },
  { k: "beads", b: "uche", title: "Beaded jewellery set for my sister's birthday", desc: "Necklace and bracelet in earthy greens and gold. Her birthday is in two weeks.", budget: 25000, cat: "Jewelry", pool: "jewelry", refs: [0, 3], age: 12, status: "CLOSED" },
  { k: "shoot", b: "bola", title: "Birthday photoshoot in Lekki", desc: "Golden hour, 3 outfit changes. About 20 edited photos please.", budget: 70000, cat: "Photography", pool: "photography", refs: [0, 2], age: 1 },
  { k: "mural", b: "tolu", title: "Hand-painted mural for our café wall", desc: "A 4m by 2m wall. Playful and colourful, with plants and people.", budget: 200000, cat: "Art", pool: "art", refs: [0, 1], age: 20, status: "CLOSED" },
  { k: "class", b: "ifeoma", title: "Pottery class for six friends", desc: "A fun weekend afternoon in Lagos. Beginners welcome.", budget: 90000, cat: "Crafts", pool: "crafts", refs: [0, 6], age: 2 },
];

const PROPOSALS = [
  ["logo", "tunde", 75000, "I'd love to design this. I'll send three logo concepts in 5 days, then refine your favourite. My brand work is in the portfolio link.", "PENDING"],
  ["logo", "adaeze", 60000, "I can create an illustrated mark with hand-drawn details that feels warm and natural for skincare.", "PENDING"],
  ["bridal", "ngozi", 85000, "Congratulations! I'm free in December. The price includes a trial session and a touch-up kit.", "ACCEPTED"],
  ["doc", "tobi", 280000, "I can shoot and edit over two weeks, with a 30-minute final cut and a short teaser for social.", "PENDING"],
  ["jumpsuit", "kemi", 48000, "I can sew this in 10 days. Send your measurements and I'll share fabric swatches.", "PENDING"],
  ["landing", "tunde", 140000, "I design landing pages that convert. Delivery in two weeks with all source files.", "PENDING"],
  ["dinner", "funmi", 110000, "I can make a set of 8 in your preferred glaze. About four weeks, including firing.", "PENDING"],
  ["map", "adaeze", 38000, "I'd love to draw this: Lagos landmarks in my flat, colourful style. I can print it at A2 too.", "PENDING"],
  ["jingle", "seyi", 55000, "Tell me the vibe of your podcast and I'll send two demo hooks within three days.", "PENDING"],
  ["beads", "zainab", 24000, "I can match the colours to her favourites. Ready in a week.", "ACCEPTED"],
  ["shoot", "chidi", 65000, "Lekki is one of my favourite locations. Includes 20 edited photos and golden-hour timing.", "PENDING"],
  ["mural", "emeka", 190000, "I'll sketch the concept first and paint it over four days. Materials included.", "ACCEPTED"],
  ["class", "funmi", 85000, "I'd love to host your group at my studio. All materials and firing are included.", "PENDING"],
];

const CHATS = [
  ["logo", "tunde", [["b", "Hi Tunde, I love your portfolio. Can you do the logo in soft pinks?"], ["s", "Absolutely. Send me two brands you admire and I'll build a palette around them."], ["b", "Glossier and Rare Beauty. Clean and friendly."], ["s", "Perfect. First concepts coming in five days."]]],
  ["bridal", "ngozi", [["b", "Hi Ngozi, the wedding is on 14 December. Can we do the trial in November?"], ["s", "Yes! I have slots on the 20th and 27th."], ["b", "The 27th works. Thank you!"]]],
  ["mural", "emeka", [["b", "Hi Emeka, we'd love a playful mural. Can you do plants and people?"], ["s", "Definitely. I'll send a sketch tomorrow."], ["b", "Amazing, the sketch is approved. Let's go ahead!"]]],
];

const POSTS = [
  ["adaeze", "New portrait drop! I'm taking three commission slots this month, so message me if you want yours before December.", "illustration", 0],
  ["kemi", "Fresh Ankara prints just landed. Booking made-to-measure slots for the festive season.", "fashion", 3, "Ankara two-piece set (made to measure)"],
  ["funmi", "Fired a new batch of mugs this morning and the glaze came out better than I hoped.", "crafts", 4, "Hand-thrown ceramic mug set (4)"],
  ["tolu", "Just got my brand kit from Tunde and I can't stop staring. Support local creatives!", "design", 0, "Logo and brand identity pack"],
  ["halima", "My Ankara set from Kemi arrived and the fit is perfect. Already planning the next one.", "fashion", 6],
  ["amaka", "Obsessed with this beaded necklace from Zainab. It goes with everything.", "jewelry", 1, "Handmade beaded necklace"],
  ["ibrahim", "Shoot day with Chidi was a dream. The light in Enugu at 5pm is unreal.", "photography", 1],
  ["ifeoma", "Gallery wall in progress, with Emeka's canvas as the centrepiece.", "art", 2, "Abstract canvas painting (60x90cm)"],
  ["uche", "Terracotta pots from Funmi are thriving on my balcony.", "crafts", 5, "Terracotta plant pot trio"],
  ["ngozi", "Bridal season is here! Trial slots open for November.", "beauty", 4],
  ["tobi", "Behind the scenes from this weekend's wedding film.", "videography", 2],
  ["zainab", "Waist beads in every colour, made to order this week.", "jewelry", 5, "Waist beads set (custom length)"],
  ["emeka", "Mural day. Four metres of colour for a café in Port Harcourt.", "art", 4],
  ["david", "Seyi sent the first cut of my jingle. Chills.", "music", 2],
  ["sade", "Obsessed with my new illustrated portrait. Worth every kobo.", "illustration", 3, "Custom portrait illustration"],
  ["seyi", "Studio session tonight. New Afrobeats loop dropping soon.", "music", 5],
];

const ORDERS = [
  ["tolu", "Afro-futurist art print set", "COMPLETED"],
  ["amaka", "Handmade beaded necklace", "COMPLETED"],
  ["halima", "Ankara tote bag", "CONFIRMED"],
  ["uche", "Terracotta plant pot trio", "PENDING"],
  ["ifeoma", "Hand-thrown ceramic mug set (4)", "COMPLETED"],
];

async function cleanup() {
  const old = await prisma.user.findMany({ where: { email: { endsWith: "@sheda.demo" } }, select: { id: true } });
  const ids = old.map((u) => u.id);
  if (!ids.length) return;
  await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
  await prisma.proposal.deleteMany({ where: { OR: [{ sellerId: { in: ids } }, { ask: { userId: { in: ids } } }] } });
  await prisma.review.deleteMany({ where: { OR: [{ sellerId: { in: ids } }, { reviewerId: { in: ids } }] } });
  await prisma.post.deleteMany({ where: { userId: { in: ids } } });
  await prisma.order.deleteMany({ where: { OR: [{ buyerId: { in: ids } }, { sellerId: { in: ids } }] } });
  await prisma.searchHistory.deleteMany({ where: { userId: { in: ids } } });
  await prisma.listingView.deleteMany({ where: { OR: [{ userId: { in: ids } }, { listing: { sellerId: { in: ids } } }] } });
  await prisma.board.deleteMany({ where: { userId: { in: ids } } });
  await prisma.ask.deleteMany({ where: { userId: { in: ids } } });
  await prisma.listing.deleteMany({ where: { sellerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await verifyPools();
  await cleanup();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const users = {}, listings = {}, listingList = [], asks = {}, proposals = {};
  const sellerByKey = Object.fromEntries(SELLERS.map((s) => [s.k, s]));

  for (const s of SELLERS) {
    const u = await prisma.user.create({
      data: {
        name: s.name, email: `${s.k}@sheda.demo`, password: hash, activeRole: "SELLER",
        avatar: face(s.face), bio: s.bio || null, createdAt: day(s.joined),
        sellerProfile: { create: { creativeType: s.craft, offerings: s.offer, portfolioLinks: s.port || [], socialLinks: s.soc || [] } },
      },
    });
    users[s.k] = u.id;
    for (const [n, [title, description, price, type]] of s.items.entries()) {
      const l = await prisma.listing.create({
        data: { title, description, price, type, category: s.craft, images: [pic(s.pool, n * 2), pic(s.pool, n * 2 + 1)], sellerId: u.id, createdAt: day(s.joined - 20 - n * 6) },
      });
      listings[title] = l.id;
      listingList.push(l.id);
    }
  }

  for (const b of BUYERS) {
    const u = await prisma.user.create({
      data: { name: b.name, email: `${b.k}@sheda.demo`, password: hash, activeRole: "BUYER", avatar: face(b.face), bio: b.bio, interests: b.interests, createdAt: day(60) },
    });
    users[b.k] = u.id;
  }

  for (const [i, [buyer, seller, rating, comment]] of REVIEWS.entries()) {
    await prisma.review.create({ data: { rating, comment, sellerId: users[seller], reviewerId: users[buyer], createdAt: day(4 + i * 3) } });
  }

  for (const bd of BOARDS) {
    const board = await prisma.board.create({ data: { name: bd.name, description: bd.desc, tags: bd.tags, isPublic: true, userId: users[bd.b], createdAt: day(20) } });
    for (const it of bd.items) {
      await prisma.boardItem.create({
        data: typeof it === "string" ? { boardId: board.id, listingId: listings[it] } : { boardId: board.id, imageUrl: pic(it[0], it[1], 700), note: it[2] },
      });
    }
  }

  for (const a of ASKS) {
    const ask = await prisma.ask.create({
      data: { title: a.title, description: a.desc, budget: a.budget, category: a.cat, referenceImages: a.refs.map((r) => pic(a.pool, r, 700)), status: a.status || "OPEN", userId: users[a.b], createdAt: day(a.age) },
    });
    asks[a.k] = ask.id;
  }

  for (const [ask, seller, price, message, status] of PROPOSALS) {
    const p = await prisma.proposal.create({
      data: { askId: asks[ask], sellerId: users[seller], price, message, status, sampleLinks: sellerByKey[seller].port || [], createdAt: day(1) },
    });
    proposals[`${ask}:${seller}`] = p.id;
  }

  for (const [ask, seller, msgs] of CHATS) {
    const buyerId = (await prisma.ask.findUnique({ where: { id: asks[ask] } })).userId;
    for (const [n, [who, text]] of msgs.entries()) {
      await prisma.message.create({
        data: { proposalId: proposals[`${ask}:${seller}`], senderId: who === "b" ? buyerId : users[seller], text, createdAt: new Date(Date.now() - (msgs.length - n) * 3600000) },
      });
    }
  }

  for (const [i, [author, text, pool, idx, listing]] of POSTS.entries()) {
    await prisma.post.create({
      data: { text, images: [pic(pool, idx, 800)], userId: users[author], listingId: listing ? listings[listing] : null, createdAt: day(i % 9) },
    });
  }

  for (const [buyer, title, status] of ORDERS) {
    const l = await prisma.listing.findUnique({ where: { id: listings[title] } });
    await prisma.order.create({ data: { title: l.title, price: l.price, status, buyerId: users[buyer], sellerId: l.sellerId, listingId: l.id, createdAt: day(10) } });
  }

  for (const [i, b] of BUYERS.entries()) {
    for (const q of [b.interests[0].toLowerCase(), "gift ideas", b.interests[1].toLowerCase()]) {
      await prisma.searchHistory.create({ data: { query: q, userId: users[b.k] } });
    }
    for (let k = 0; k < 3; k++) {
      await prisma.listingView.create({ data: { userId: users[b.k], listingId: listingList[(i * 4 + k * 5) % listingList.length] } });
    }
  }

  console.log(`\nDone. Every demo account uses the password: ${PASSWORD}\n`);
  console.table([
    ...SELLERS.map((s) => ({ role: "seller", name: s.name, email: `${s.k}@sheda.demo` })),
    ...BUYERS.map((b) => ({ role: "buyer", name: b.name, email: `${b.k}@sheda.demo` })),
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());