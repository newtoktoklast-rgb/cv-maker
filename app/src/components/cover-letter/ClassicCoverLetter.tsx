import { CoverLetterData } from "@/lib/types";

interface Props {
  data: CoverLetterData;
}

export default function ClassicCoverLetter({ data }: Props) {
  const { personalInfo, recipient, letterDetails } = data;

  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.website,
  ].filter(Boolean);

  return (
    <div className="cl-classic">
      {/* Editorial Header */}
      <header className="cl-classic-header">
        <h1 className="cl-classic-name">{personalInfo.fullName || "Your Name"}</h1>
        <p className="cl-classic-title">{personalInfo.title || "Professional Profile"}</p>
        <div className="cl-classic-contacts">
          {contactItems.map((c, i) => (
            <span key={i} className="cl-classic-contact-item">{c}</span>
          ))}
        </div>
      </header>

      <hr className="cl-classic-divider" />

      {/* Date & Recipient */}
      <div className="cl-classic-meta">
        <p className="cl-classic-date">{letterDetails.date}</p>
        <div className="cl-classic-recipient">
          <p className="cl-classic-recipient-name">{recipient.hiringManager}</p>
          {recipient.jobTitle && <p className="cl-classic-recipient-role">Regarding: {recipient.jobTitle}</p>}
          <p className="cl-classic-recipient-company">{recipient.companyName}</p>
          {recipient.department && <p className="cl-classic-recipient-sub">{recipient.department}</p>}
          {recipient.companyAddress && <p className="cl-classic-recipient-sub">{recipient.companyAddress}</p>}
        </div>
      </div>

      {/* Salutation */}
      <p className="cl-classic-salutation">{letterDetails.greeting}</p>

      {/* Body Content */}
      <div className="cl-classic-content">
        {letterDetails.openingParagraph && (
          <p className="cl-classic-paragraph">{letterDetails.openingParagraph}</p>
        )}
        {letterDetails.bodyParagraph1 && (
          <p className="cl-classic-paragraph">{letterDetails.bodyParagraph1}</p>
        )}
        {letterDetails.bodyParagraph2 && (
          <p className="cl-classic-paragraph">{letterDetails.bodyParagraph2}</p>
        )}
        {letterDetails.closingParagraph && (
          <p className="cl-classic-paragraph">{letterDetails.closingParagraph}</p>
        )}
      </div>

      {/* Sign-off */}
      <div className="cl-classic-signoff">
        <p className="cl-classic-signoff-word">{letterDetails.signOff || "Sincerely,"}</p>
        <p className="cl-classic-signature-name">{personalInfo.fullName}</p>
      </div>
    </div>
  );
}
