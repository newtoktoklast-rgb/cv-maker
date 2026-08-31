import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <>
      <div className="auth-background">
        <div className="auth-grid-overlay" />
      </div>

      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 2.5rem",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="auth-logo-icon" style={{ width: 34, height: 34, borderRadius: 8 }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path fill="white" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          </div>
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: "1.1rem" }}>CV Studio</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/sign-in" className="btn-secondary" style={{ width: "auto", padding: "0.55rem 1.25rem", fontSize: "0.85rem" }}>
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary" style={{ width: "auto", padding: "0.55rem 1.4rem", fontSize: "0.85rem" }}>
            Get Started
          </Link>
        </div>
      </nav>

      <main className="landing-container">
        <div className="landing-content">
          <div className="landing-pill">
            <span className="landing-pill-dot" />
            Museum-Grade Resume Typography & Layout
          </div>

          <h1>
            Resumes engineered for the{" "}
            <span className="editorial-serif">most demanding</span> rooms.
          </h1>

          <p>
            Say goodbye to cookie-cutter templates. Build an authoritative, ATS-compliant CV with refined typography, live A4 preview, and instant print-perfect PDF export.
          </p>

          <div className="landing-buttons">
            <Link href="/sign-up">
              <button className="btn-primary">
                Start Crafting Free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="btn-secondary">Sign In to Dashboard</button>
            </Link>
          </div>

          {/* Handcrafted Template Showcase */}
          <div className="landing-showcase">
            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge">Atelier</div>
              <h3 className="landing-showcase-title">Swiss Modernist</h3>
              <p className="landing-showcase-desc">
                High-density asymmetric grid with deep slate accents, metric skill bars, and crisp geometry. Ideal for engineers and architects.
              </p>
            </div>

            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge" style={{ color: "var(--accent-warm)" }}>Meridian</div>
              <h3 className="landing-showcase-title">Editorial Monograph</h3>
              <p className="landing-showcase-desc">
                Typeset in warm literary serif typography with balanced margins and delicate dividing hairlines. Favored by executives and academics.
              </p>
            </div>

            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge" style={{ color: "#38bdf8" }}>Metropolis</div>
              <h3 className="landing-showcase-title">Executive Minimalist</h3>
              <p className="landing-showcase-desc">
                Deep obsidian header with subtle border luminance, dual-column balance, and structured skill chips. Built for high-growth tech leadership.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
