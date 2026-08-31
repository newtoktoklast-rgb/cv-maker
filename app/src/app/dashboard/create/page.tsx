import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CVBuilder from "@/components/CVBuilder";

export default async function CreateCVPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <a href="/dashboard" className="dashboard-nav-brand">
          <div className="dashboard-nav-brand-icon">
            <svg viewBox="0 0 24 24"><path fill="white" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          </div>
          <span>CV Studio</span>
        </a>
        <a href="/dashboard" className="btn-secondary" style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.84rem" }}>
          ← Back to Studio
        </a>
      </nav>
      <main style={{ flex: 1, padding: "1.5rem" }}>
        <CVBuilder />
      </main>
    </div>
  );
}
