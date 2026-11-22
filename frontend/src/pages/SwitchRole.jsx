import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, lines } from "../constants";
import { AuthLayout, AvatarPicker, ChipSelect, CraftSelect, Field, Group, Note } from "../components/ui";

// The first time you switch to a role, you fill in what that role needs
export default function SwitchRole() {
  const { role } = useParams();
  const { user, updateProfile, switchRole } = useAuth();
  const navigate = useNavigate();
  const target = role === "seller" ? "SELLER" : role === "buyer" ? "BUYER" : null;
  const sp = user.sellerProfile;

  const [f, setF] = useState({
    bio: user.bio || "",
    offerings: sp?.offerings || "",
    portfolio: (sp?.portfolioLinks || []).join("\n"),
    social: (sp?.socialLinks || []).join("\n"),
  });
  const [interests, setInterests] = useState(user.interests || []);
  const [creativeType, setCreativeType] = useState(sp?.creativeType || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!target || user.activeRole === target) return <Navigate to="/profile" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (target === "SELLER" && !creativeType) return setError("Choose what you create.");
    if (target === "BUYER" && interests.length === 0) return setError("Pick at least one kind of creative you love.");
    setBusy(true);
    try {
      await updateProfile(
        target === "SELLER"
          ? {
              bio: f.bio,
              sellerProfile: {
                creativeType,
                offerings: f.offerings,
                portfolioLinks: lines(f.portfolio),
                socialLinks: lines(f.social),
              },
            }
          : { interests }
      );
      await switchRole(target);
      navigate("/profile", { replace: true, state: { switched: target } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={target === "SELLER" ? "Start selling on Sheda" : "Start shopping on Sheda"}
      subtitle={
        target === "SELLER"
          ? "This is your first time as a seller, so tell buyers about your craft. A photo, bio, portfolio and contact link earn you a Verified badge."
          : "This is your first time as a buyer. Tell us what you love so we can recommend sellers."
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <AvatarPicker name={user.name} src={user.avatar} size={72} onUploaded={(url) => updateProfile({ avatar: url })} />
        <p className="text-sm text-muted">Add a profile photo (optional)</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {target === "BUYER" ? (
          <Group label="What kinds of creatives do you love?" hint="Pick a few.">
            <ChipSelect multi options={CATEGORIES} value={interests} onChange={setInterests} />
          </Group>
        ) : (
          <>
            <Group label="What do you create?">
              <CraftSelect value={creativeType} onChange={setCreativeType} />
            </Group>
            <Field label="Short bio" hint="One or two lines buyers will see on your profile.">
              <textarea className="input min-h-20" value={f.bio} onChange={set("bio")} />
            </Field>
            <Field label="What do you offer?">
              <textarea className="input min-h-24" required value={f.offerings} onChange={set("offerings")} />
            </Field>
            <Field label="Portfolio links" hint="One per line.">
              <textarea className="input min-h-20" value={f.portfolio} onChange={set("portfolio")} />
            </Field>
            <Field label="Instagram, WhatsApp or website" hint="One per line. Buyers use these to contact you.">
              <textarea className="input min-h-20" value={f.social} onChange={set("social")} />
            </Field>
          </>
        )}
        <Note>{error}</Note>
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy ? "Saving…" : `Save and switch to ${target === "SELLER" ? "seller" : "buyer"}`}
        </button>
        <Link to="/profile" className="block text-center text-sm font-semibold text-muted hover:text-ink">Cancel</Link>
      </form>
    </AuthLayout>
  );
}