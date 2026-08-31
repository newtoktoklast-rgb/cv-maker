import { CVData } from "@/lib/types";

interface Props {
  data: CVData;
}

export default function ExecutiveTemplate({ data }: Props) {
  const { personalInfo, experience, education, skills, languages, customSections = [] } = data;

  return (
    <div className="cv-exec">
      {/* Bold Header */}
      <header className="cv-exec-header">
        <h1 className="cv-exec-name">{personalInfo.fullName || "Your Name"}</h1>
        <p className="cv-exec-title">{personalInfo.title || "Professional Title"}</p>
        <div className="cv-exec-contact">
          {personalInfo.email && (
            <div className="cv-exec-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
              {personalInfo.email}
            </div>
          )}
          {personalInfo.phone && (
            <div className="cv-exec-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              {personalInfo.phone}
            </div>
          )}
          {personalInfo.location && (
            <div className="cv-exec-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {personalInfo.location}
            </div>
          )}
          {personalInfo.website && (
            <div className="cv-exec-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              {personalInfo.website}
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="cv-exec-contact-item">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{stroke:"none"}}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              {personalInfo.linkedin}
            </div>
          )}
        </div>
      </header>

      {/* Body — Two Columns */}
      <div className="cv-exec-body">
        {/* Left Column */}
        <div className="cv-exec-left">
          {/* Summary */}
          {personalInfo.summary && (
            <section className="cv-exec-section">
              <h2 className="cv-exec-section-title">Profile</h2>
              <p className="cv-exec-text">{personalInfo.summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="cv-exec-section">
              <h2 className="cv-exec-section-title">Experience</h2>
              {experience.map((exp) => (
                <div key={exp.id} className="cv-exec-entry">
                  <div className="cv-exec-entry-top">
                    <h3 className="cv-exec-entry-title">{exp.position}</h3>
                    <span className="cv-exec-entry-date">
                      {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <p className="cv-exec-entry-org">{exp.company}</p>
                  {exp.description && (
                    <p className="cv-exec-text">{exp.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="cv-exec-right">
          {/* Education */}
          {education.length > 0 && (
            <section className="cv-exec-section">
              <h2 className="cv-exec-section-title">Education</h2>
              {education.map((edu) => (
                <div key={edu.id} className="cv-exec-entry">
                  <h3 className="cv-exec-entry-title">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </h3>
                  <p className="cv-exec-entry-org">{edu.institution}</p>
                  <span className="cv-exec-entry-date-inline">
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section className="cv-exec-section">
              <h2 className="cv-exec-section-title">Skills</h2>
              <div className="cv-exec-tags">
                {skills.map((skill) => (
                  <span key={skill.id} className="cv-exec-tag">{skill.name}</span>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <section className="cv-exec-section">
              <h2 className="cv-exec-section-title">Languages</h2>
              {languages.map((lang) => (
                <div key={lang.id} className="cv-exec-lang">
                  <span>{lang.name}</span>
                  <span className="cv-exec-lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </section>
          )}

          {/* Custom Sections (Awards, Hobbies, etc.) */}
          {customSections.length > 0 &&
            customSections.map((sec) => {
              if (!sec.title && (!sec.items || sec.items.length === 0)) return null;
              return (
                <section key={sec.id} className="cv-exec-section">
                  <h2 className="cv-exec-section-title">{sec.title}</h2>
                  <ul className="cv-exec-custom-list">
                    {sec.items.map((item) =>
                      item.text ? (
                        <li key={item.id} className="cv-exec-text">
                          {item.text}
                        </li>
                      ) : null
                    )}
                  </ul>
                </section>
              );
            })}
        </div>
      </div>
    </div>
  );
}
