import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import client from "@/lib/db";
import { ObjectId } from "mongodb";
import CVBuilder from "@/components/CVBuilder";

export default async function EditCVPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id } = await params;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    notFound();
  }

  const db = client.db();
  const cv = await db.collection("cvs").findOne({ _id: objectId, userId: session.user.id });
  if (!cv) notFound();

  const initial = {
    templateId: cv.templateId as "modern" | "classic" | "executive",
    personalInfo: cv.personalInfo,
    experience: cv.experience || [],
    education: cv.education || [],
    skills: cv.skills || [],
    languages: cv.languages || [],
    customSections: cv.customSections || [],
  };

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
        <CVBuilder initial={initial} cvId={id} />
      </main>
    </div>
  );
}
