import { CoverLetterData } from "@/lib/types";

interface Props {
  data: CoverLetterData;
}

export default function ModernCoverLetter({ data }: Props) {
  const { personalInfo, recipient, letterDetails } = data;

  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CL";

  return (
    <div className="cl-modern">
      {/* Swiss Modernist Header */}
      <header className="cl-modern-header">
        <div className="cl-modern-avatar">{initials}</div>
        <div className="cl-modern-identity">
          <h1 className="cl-modern-name">{personalInfo.fullName || "Your Name"}</h1>
          <p className="cl-modern-title">{personalInfo.title || "Professional Profile"}</p>
        </div>
        <div className="cl-modern-contacts">
          {personalInfo.email && (
            <div className="cl-modern-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="cl-modern-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="cl-modern-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.website && (
            <div className="cl-modern-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              <span>{personalInfo.website}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Letter Body */}
      <main className="cl-modern-body">
        {/* Date & Recipient Block */}
        <div className="cl-modern-meta">
          <p className="cl-modern-date">{letterDetails.date}</p>
          <div className="cl-modern-recipient">
            <p className="cl-modern-recipient-name">{recipient.hiringManager}</p>
            {recipient.jobTitle && <p className="cl-modern-recipient-role">Regarding: {recipient.jobTitle}</p>}
            <p className="cl-modern-recipient-company">{recipient.companyName}</p>
            {recipient.department && <p className="cl-modern-recipient-sub">{recipient.department}</p>}
            {recipient.companyAddress && <p className="cl-modern-recipient-sub">{recipient.companyAddress}</p>}
          </div>
        </div>

        {/* Salutation */}
        <p className="cl-modern-salutation">{letterDetails.greeting}</p>

        {/* Paragraphs */}
        <div className="cl-modern-content">
          {letterDetails.openingParagraph && (
            <p className="cl-modern-paragraph">{letterDetails.openingParagraph}</p>
          )}
          {letterDetails.bodyParagraph1 && (
            <p className="cl-modern-paragraph">{letterDetails.bodyParagraph1}</p>
          )}
          {letterDetails.bodyParagraph2 && (
            <p className="cl-modern-paragraph">{letterDetails.bodyParagraph2}</p>
          )}
          {letterDetails.closingParagraph && (
            <p className="cl-modern-paragraph">{letterDetails.closingParagraph}</p>
          )}
        </div>

        {/* Sign-off */}
        <div className="cl-modern-signoff">
          <p className="cl-modern-signoff-word">{letterDetails.signOff || "Sincerely,"}</p>
          <p className="cl-modern-signature-name">{personalInfo.fullName}</p>
          {personalInfo.title && <p className="cl-modern-signature-title">{personalInfo.title}</p>}
        </div>
      </main>
    </div>
  );
}
