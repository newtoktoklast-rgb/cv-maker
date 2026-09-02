import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import client from "@/lib/db";
import DashboardClient from "../dashboard-client";

export default async function DocumentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const db = client.db();
  const [cvDocs, letterDocs, userDocuments] = await Promise.all([
    db.collection("cvs").find({ userId: session.user.id }).sort({ updatedAt: -1 }).toArray(),
    db.collection("cover_letters").find({ userId: session.user.id }).sort({ updatedAt: -1 }).toArray(),
    db.collection("documents").find({ userId: session.user.id }).sort({ createdAt: -1 }).toArray(),
  ]);

  const mappedCVs = cvDocs.map((cv) => ({
    _id: cv._id.toString(),
    templateId: cv.templateId,
    personalInfo: cv.personalInfo,
    updatedAt: cv.updatedAt,
  }));

  const mappedLetters = letterDocs.map((l) => ({
    _id: l._id.toString(),
    cvId: l.cvId,
    title: l.title,
    templateId: l.templateId,
    recipient: l.recipient,
    updatedAt: l.updatedAt,
  }));

  const mappedDocuments = userDocuments.map((doc) => ({
    _id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    category: doc.category,
    customCategory: doc.customCategory || "",
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    publicId: doc.publicId || "",
    rotation: doc.rotation || 0,
    createdAt: doc.createdAt,

    updatedAt: doc.updatedAt,
  }));

  return (
    <DashboardClient
      user={{ name: session.user.name, email: session.user.email }}
      cvs={mappedCVs}
      coverLetters={mappedLetters}
      documents={mappedDocuments}
    />
  );
}
