"use client";

import { CVData } from "@/lib/types";

export default function CreativeTemplate({ data }: { data: CVData }) {
  const { personalInfo, experience, education, skills, languages, customSections } = data;

  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CV";

  return (
    <div className="cv-creative">
      {/* Top Banner Header */}
      <header className="cv-cr-header">
        <div className="cv-cr-header-content">
          <div className="cv-cr-avatar">{initials}</div>
          <div className="cv-cr-header-text">
            <h1 className="cv-cr-name">{personalInfo.fullName || "Your Full Name"}</h1>
            <p className="cv-cr-title">{personalInfo.title || "Professional Title"}</p>
          </div>
        </div>

        <div className="cv-cr-contact-bar">
          {personalInfo.email && (
            <div className="cv-cr-contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="cv-cr-contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="cv-cr-contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.website && (
            <div className="cv-cr-contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
              <span>{personalInfo.website}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="cv-cr-contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              <span>{personalInfo.linkedin}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="cv-cr-body">
        {/* Main Column */}
        <div className="cv-cr-main">
          {personalInfo.summary && (
            <section className="cv-cr-section">
              <h2 className="cv-cr-section-title">About Me</h2>
              <p className="cv-cr-text">{personalInfo.summary}</p>
            </section>
          )}

          {experience.length > 0 && (
            <section className="cv-cr-section">
              <h2 className="cv-cr-section-title">Experience</h2>
              {experience.map((exp) => (
                <div key={exp.id} className="cv-cr-entry">
                  <div className="cv-cr-entry-top">
                    <div>
                      <h3 className="cv-cr-entry-title">{exp.position}</h3>
                      <span className="cv-cr-entry-company">{exp.company}</span>
                    </div>
                    <span className="cv-cr-entry-date">
                      {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? "–" : ""}{" "}
                      {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  {exp.description && <p className="cv-cr-text cv-cr-desc">{exp.description}</p>}
                </div>
              ))}
            </section>
          )}

          {education.length > 0 && (
            <section className="cv-cr-section">
              <h2 className="cv-cr-section-title">Education</h2>
              {education.map((edu) => (
                <div key={edu.id} className="cv-cr-entry">
                  <div className="cv-cr-entry-top">
                    <div>
                      <h3 className="cv-cr-entry-title">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</h3>
                      <span className="cv-cr-entry-company">{edu.institution}</span>
                    </div>
                    <span className="cv-cr-entry-date">
                      {edu.startDate} {edu.startDate && edu.endDate ? "–" : ""} {edu.endDate}
                    </span>
                  </div>
                  {edu.description && <p className="cv-cr-text cv-cr-desc">{edu.description}</p>}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="cv-cr-sidebar">
          {skills.length > 0 && (
            <div className="cv-cr-side-card">
              <h3 className="cv-cr-side-title">Skills & Expertise</h3>
              <div className="cv-cr-skills-list">
                {skills.map((skill) => (
                  <div key={skill.id} className="cv-cr-skill-item">
                    <div className="cv-cr-skill-info">
                      <span>{skill.name}</span>
                    </div>
                    <div className="cv-cr-skill-bar">
                      <div
                        className="cv-cr-skill-fill"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="cv-cr-side-card">
              <h3 className="cv-cr-side-title">Languages</h3>
              <div className="cv-cr-lang-list">
                {languages.map((lang) => (
                  <div key={lang.id} className="cv-cr-lang-item">
                    <span className="cv-cr-lang-name">{lang.name}</span>
                    <span className="cv-cr-lang-badge">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customSections.map((sec) => (
            <div key={sec.id} className="cv-cr-side-card">
              <h3 className="cv-cr-side-title">{sec.title || "Custom Section"}</h3>
              <ul className="cv-cr-custom-list">
                {sec.items.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
