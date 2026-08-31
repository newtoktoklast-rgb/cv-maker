import { CVData } from "@/lib/types";

interface Props {
  data: CVData;
}

export default function ClassicTemplate({ data }: Props) {
  const { personalInfo, experience, education, skills, languages, customSections = [] } = data;

  return (
    <div className="cv-classic">
      {/* Header */}
      <header className="cv-classic-header">
        <h1 className="cv-classic-name">{personalInfo.fullName || "Your Name"}</h1>
        <p className="cv-classic-title">{personalInfo.title || "Professional Title"}</p>
        <div className="cv-classic-contact">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
        </div>
      </header>

      <hr className="cv-classic-divider" />

      {/* Summary */}
      {personalInfo.summary && (
        <>
          <section className="cv-classic-section">
            <h2 className="cv-classic-section-title">Professional Summary</h2>
            <p className="cv-classic-text">{personalInfo.summary}</p>
          </section>
          <hr className="cv-classic-divider" />
        </>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <>
          <section className="cv-classic-section">
            <h2 className="cv-classic-section-title">Professional Experience</h2>
            {experience.map((exp) => (
              <div key={exp.id} className="cv-classic-entry">
                <div className="cv-classic-entry-row">
                  <div>
                    <h3 className="cv-classic-entry-title">{exp.position}</h3>
                    <p className="cv-classic-entry-org">{exp.company}</p>
                  </div>
                  <span className="cv-classic-entry-date">
                    {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                {exp.description && (
                  <p className="cv-classic-text cv-classic-entry-desc">{exp.description}</p>
                )}
              </div>
            ))}
          </section>
          <hr className="cv-classic-divider" />
        </>
      )}

      {/* Education */}
      {education.length > 0 && (
        <>
          <section className="cv-classic-section">
            <h2 className="cv-classic-section-title">Education</h2>
            {education.map((edu) => (
              <div key={edu.id} className="cv-classic-entry">
                <div className="cv-classic-entry-row">
                  <div>
                    <h3 className="cv-classic-entry-title">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </h3>
                    <p className="cv-classic-entry-org">{edu.institution}</p>
                  </div>
                  <span className="cv-classic-entry-date">
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
                {edu.description && (
                  <p className="cv-classic-text cv-classic-entry-desc">{edu.description}</p>
                )}
              </div>
            ))}
          </section>
          <hr className="cv-classic-divider" />
        </>
      )}

      {/* Skills & Languages */}
      <div className="cv-classic-bottom">
        {skills.length > 0 && (
          <section className="cv-classic-section">
            <h2 className="cv-classic-section-title">Skills</h2>
            <div className="cv-classic-skills">
              {skills.map((skill) => (
                <span key={skill.id} className="cv-classic-skill-tag">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section className="cv-classic-section">
            <h2 className="cv-classic-section-title">Languages</h2>
            <div className="cv-classic-languages">
              {languages.map((lang) => (
                <span key={lang.id} className="cv-classic-lang">
                  {lang.name} — <em>{lang.proficiency}</em>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Custom Sections (Awards, Hobbies, etc.) */}
      {customSections.length > 0 &&
        customSections.map((sec) => {
          if (!sec.title && (!sec.items || sec.items.length === 0)) return null;
          return (
            <div key={sec.id}>
              <hr className="cv-classic-divider" />
              <section className="cv-classic-section">
                <h2 className="cv-classic-section-title">{sec.title}</h2>
                <ul className="cv-classic-custom-list">
                  {sec.items.map((item) =>
                    item.text ? (
                      <li key={item.id} className="cv-classic-text">
                        {item.text}
                      </li>
                    ) : null
                  )}
                </ul>
              </section>
            </div>
          );
        })}
    </div>
  );
}
