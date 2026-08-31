"use client";

import { CVData } from "@/lib/types";

export default function TechnicalTemplate({ data }: { data: CVData }) {
  const { personalInfo, experience, education, skills, languages, customSections } = data;

  return (
    <div className="cv-tech">
      {/* Header */}
      <header className="cv-tech-header">
        <div className="cv-tech-header-top">
          <h1 className="cv-tech-name">{personalInfo.fullName || "Your Full Name"}</h1>
          <span className="cv-tech-badge">Dev / Engineering</span>
        </div>
        <p className="cv-tech-title">// {personalInfo.title || "Software Engineer & System Architect"}</p>

        <div className="cv-tech-contact-row">
          {personalInfo.email && <span className="cv-tech-contact-tag">email: {personalInfo.email}</span>}
          {personalInfo.phone && <span className="cv-tech-contact-tag">phone: {personalInfo.phone}</span>}
          {personalInfo.location && <span className="cv-tech-contact-tag">location: {personalInfo.location}</span>}
          {personalInfo.website && <span className="cv-tech-contact-tag">web: {personalInfo.website}</span>}
          {personalInfo.linkedin && <span className="cv-tech-contact-tag">in: {personalInfo.linkedin}</span>}
        </div>
      </header>

      {/* Summary / System Overview */}
      {personalInfo.summary && (
        <section className="cv-tech-section">
          <h2 className="cv-tech-section-title">
            <span className="cv-tech-prompt">&gt;</span> System Overview & Summary
          </h2>
          <p className="cv-tech-text">{personalInfo.summary}</p>
        </section>
      )}

      {/* Skills Matrix */}
      {skills.length > 0 && (
        <section className="cv-tech-section">
          <h2 className="cv-tech-section-title">
            <span className="cv-tech-prompt">&gt;</span> Technical Stack & Proficiencies
          </h2>
          <div className="cv-tech-skills-matrix">
            {skills.map((skill) => (
              <div key={skill.id} className="cv-tech-skill-chip">
                <span className="cv-tech-skill-name">{skill.name}</span>
                <span className="cv-tech-skill-dots">
                  {"★".repeat(skill.level)}{"☆".repeat(5 - skill.level)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="cv-tech-section">
          <h2 className="cv-tech-section-title">
            <span className="cv-tech-prompt">&gt;</span> Professional Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="cv-tech-entry">
              <div className="cv-tech-entry-header">
                <div>
                  <h3 className="cv-tech-role">{exp.position}</h3>
                  <span className="cv-tech-company">@ {exp.company}</span>
                </div>
                <span className="cv-tech-date">
                  [{exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? "–" : ""}{" "}
                  {exp.current ? "PRESENT" : exp.endDate}]
                </span>
              </div>
              {exp.description && (
                <div className="cv-tech-desc-block">
                  <p className="cv-tech-text">{exp.description}</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="cv-tech-section">
          <h2 className="cv-tech-section-title">
            <span className="cv-tech-prompt">&gt;</span> Education & Credentials
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="cv-tech-entry">
              <div className="cv-tech-entry-header">
                <div>
                  <h3 className="cv-tech-role">{edu.degree} {edu.field ? `(${edu.field})` : ""}</h3>
                  <span className="cv-tech-company">{edu.institution}</span>
                </div>
                <span className="cv-tech-date">
                  [{edu.startDate} {edu.startDate && edu.endDate ? "–" : ""} {edu.endDate}]
                </span>
              </div>
              {edu.description && <p className="cv-tech-text cv-tech-desc-block">{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Languages & Custom Sections */}
      {(languages.length > 0 || customSections.length > 0) && (
        <div className="cv-tech-grid-2">
          {languages.length > 0 && (
            <section className="cv-tech-section">
              <h2 className="cv-tech-section-title">
                <span className="cv-tech-prompt">&gt;</span> Languages
              </h2>
              <div className="cv-tech-lang-wrap">
                {languages.map((lang) => (
                  <div key={lang.id} className="cv-tech-lang-row">
                    <span className="cv-tech-lang-name">{lang.name}</span>
                    <span className="cv-tech-lang-level">:{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {customSections.map((sec) => (
            <section key={sec.id} className="cv-tech-section">
              <h2 className="cv-tech-section-title">
                <span className="cv-tech-prompt">&gt;</span> {sec.title || "Custom Section"}
              </h2>
              <ul className="cv-tech-list">
                {sec.items.map((item) => (
                  <li key={item.id} className="cv-tech-text">
                    {item.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
