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

      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="auth-logo-icon" style={{ width: 30, height: 30, borderRadius: 6 }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
              <path fill="white" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1rem", color: "var(--text-primary)" }}>CV Studio</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Link href="/sign-in" className="btn-secondary" style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.82rem" }}>
            Sign in
          </Link>
          <Link href="/sign-up" className="btn-primary" style={{ width: "auto", padding: "0.45rem 1.1rem", fontSize: "0.82rem" }}>
            Get started
          </Link>
        </div>
      </nav>

      <main className="landing-container">
        <div className="landing-content">
          <div className="landing-pill">
            <span className="landing-pill-dot" />
            ATS-optimised · Print-perfect PDF
          </div>

          <h1>
            Build resumes that get{" "}
            <span className="editorial-serif">noticed.</span>
          </h1>

          <p>
            Craft a polished, professional CV in minutes. Live A4 preview, multiple templates, and one-click PDF export.
          </p>

          <div className="landing-buttons">
            <Link href="/sign-up">
              <button className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
                Start for free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="btn-secondary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>Sign in</button>
            </Link>
          </div>

          <div className="landing-showcase">
            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge">Atelier</div>
              <h3 className="landing-showcase-title">Swiss Modernist</h3>
              <p className="landing-showcase-desc">Asymmetric grid with skill bars. Ideal for engineers and designers.</p>
            </div>
            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge">Meridian</div>
              <h3 className="landing-showcase-title">Editorial Monograph</h3>
              <p className="landing-showcase-desc">Literary serif typography with refined margins. For executives and academics.</p>
            </div>
            <div className="landing-showcase-item glass-card">
              <div className="landing-showcase-badge">Metropolis</div>
              <h3 className="landing-showcase-title">Executive Minimalist</h3>
              <p className="landing-showcase-desc">Dual-column structure with structured skill chips. Built for leadership roles.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
