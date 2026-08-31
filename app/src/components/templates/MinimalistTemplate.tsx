"use client";

import { CVData } from "@/lib/types";

export default function MinimalistTemplate({ data }: { data: CVData }) {
  const { personalInfo, experience, education, skills, languages, customSections } = data;

  return (
    <div className="cv-minimalist">
      {/* Header */}
      <header className="cv-min-header">
        <h1 className="cv-min-name">{personalInfo.fullName || "Your Full Name"}</h1>
        <p className="cv-min-title">{personalInfo.title || "Professional Title"}</p>

        <div className="cv-min-contact-row">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
        </div>
      </header>

      <div className="cv-min-divider" />

      {/* Summary */}
      {personalInfo.summary && (
        <section className="cv-min-section">
          <h2 className="cv-min-section-title">Summary</h2>
          <p className="cv-min-text">{personalInfo.summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="cv-min-section">
          <h2 className="cv-min-section-title">Work Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="cv-min-entry">
              <div className="cv-min-entry-header">
                <div>
                  <h3 className="cv-min-entry-role">{exp.position || "Position"}</h3>
                  <span className="cv-min-entry-company">{exp.company || "Company"}</span>
                </div>
                <span className="cv-min-entry-date">
                  {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? "–" : ""}{" "}
                  {exp.current ? "Present" : exp.endDate}
                </span>
              </div>
              {exp.description && <p className="cv-min-text cv-min-entry-desc">{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="cv-min-section">
          <h2 className="cv-min-section-title">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="cv-min-entry">
              <div className="cv-min-entry-header">
                <div>
                  <h3 className="cv-min-entry-role">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </h3>
                  <span className="cv-min-entry-company">{edu.institution}</span>
                </div>
                <span className="cv-min-entry-date">
                  {edu.startDate} {edu.startDate && edu.endDate ? "–" : ""} {edu.endDate}
                </span>
              </div>
              {edu.description && <p className="cv-min-text cv-min-entry-desc">{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills & Languages Grid */}
      {(skills.length > 0 || languages.length > 0) && (
        <section className="cv-min-section">
          <div className="cv-min-grid-2">
            {skills.length > 0 && (
              <div>
                <h2 className="cv-min-section-title">Skills</h2>
                <div className="cv-min-skills-wrap">
                  {skills.map((skill) => (
                    <span key={skill.id} className="cv-min-skill-tag">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <h2 className="cv-min-section-title">Languages</h2>
                <div className="cv-min-lang-list">
                  {languages.map((lang) => (
                    <div key={lang.id} className="cv-min-lang-item">
                      <span className="cv-min-lang-name">{lang.name}</span>
                      <span className="cv-min-lang-level">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.map((sec) => (
        <section key={sec.id} className="cv-min-section">
          <h2 className="cv-min-section-title">{sec.title || "Additional Information"}</h2>
          <ul className="cv-min-custom-list">
            {sec.items.map((item) => (
              <li key={item.id} className="cv-min-text">
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
