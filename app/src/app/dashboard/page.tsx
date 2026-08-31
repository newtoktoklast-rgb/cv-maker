import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import client from "@/lib/db";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const db = client.db();
  const [cvDocs, letterDocs] = await Promise.all([
    db.collection("cvs").find({ userId: session.user.id }).sort({ updatedAt: -1 }).toArray(),
    db.collection("cover_letters").find({ userId: session.user.id }).sort({ updatedAt: -1 }).toArray(),
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

  return (
    <DashboardClient
      user={{ name: session.user.name, email: session.user.email }}
      cvs={mappedCVs}
      coverLetters={mappedLetters}
    />
  );
}
