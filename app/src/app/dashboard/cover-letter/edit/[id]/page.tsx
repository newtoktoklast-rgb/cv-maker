import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import client from "@/lib/db";
import { ObjectId } from "mongodb";
import CoverLetterBuilder from "@/components/cover-letter/CoverLetterBuilder";
import { CVData, CoverLetterData } from "@/lib/types";

export default async function EditCoverLetterPage({ params }: { params: Promise<{ id: string }> }) {
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
  const letterDoc = await db.collection("cover_letters").findOne({ _id: objectId, userId: session.user.id });
  if (!letterDoc) notFound();

  const cvDocs = await db
    .collection("cvs")
    .find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  const userCVs: CVData[] = cvDocs.map((c) => ({
    _id: c._id.toString(),
    userId: c.userId,
    templateId: c.templateId,
    personalInfo: c.personalInfo,
    experience: c.experience || [],
    education: c.education || [],
    skills: c.skills || [],
    languages: c.languages || [],
    customSections: c.customSections || [],
  }));

  const initial: CoverLetterData = {
    _id: letterDoc._id.toString(),
    userId: letterDoc.userId,
    cvId: letterDoc.cvId,
    title: letterDoc.title,
    templateId: letterDoc.templateId,
    personalInfo: letterDoc.personalInfo,
    recipient: letterDoc.recipient,
    letterDetails: letterDoc.letterDetails,
    createdAt: letterDoc.createdAt,
    updatedAt: letterDoc.updatedAt,
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
        <CoverLetterBuilder initial={initial} letterId={id} userCVs={userCVs} />
      </main>
    </div>
  );
}
