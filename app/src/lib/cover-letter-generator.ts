import { CVData, CoverLetterDetails } from "./types";

interface GenerateOptions {
  companyName: string;
  jobTitle: string;
  hiringManager?: string;
  tone?: "confident" | "professional" | "creative" | "executive";
}

export function generateCoverLetterFromCV(cv: CVData | Omit<CVData, "userId">, options: GenerateOptions): CoverLetterDetails {
  const { personalInfo, experience = [], skills = [], education = [] } = cv;
  const company = options.companyName.trim() || "your organization";
  const targetRole = options.jobTitle.trim() || personalInfo.title || "this role";
  const manager = options.hiringManager?.trim() || "Hiring Team";
  const tone = options.tone || "professional";

  const topExp = experience[0];
  const secondExp = experience[1];
  const currentRole = topExp?.position || personalInfo.title || "experienced specialist";
  const currentCompany = topExp?.company ? ` at ${topExp.company}` : "";

  // Extract top skill names
  const skillNames = skills.slice(0, 5).map((s) => s.name);
  const skillsList =
    skillNames.length > 0
      ? skillNames.length === 1
        ? skillNames[0]
        : `${skillNames.slice(0, -1).join(", ")} and ${skillNames[skillNames.length - 1]}`
      : "cross-functional architecture, strategic problem solving, and technical leadership";

  // Extract highlight achievements from top experiences
  const expHighlights = extractExperienceHighlights(experience);

  // Formulate greeting
  const greeting = manager.toLowerCase().includes("team") || manager.toLowerCase().includes("committee")
    ? `Dear ${manager},`
    : `Dear ${manager},`;

  // Opening Paragraph
  let openingParagraph = "";
  if (tone === "executive") {
    openingParagraph = `I am writing to submit my candidacy for the ${targetRole} leadership position at ${company}. Having spent years leading high-performing teams and scaling mission-critical systems as a ${currentRole}${currentCompany}, I have consistently delivered transformative operational and product results. I am deeply drawn to ${company}'s strategic momentum and would welcome the opportunity to accelerate your organizational objectives.`;
  } else if (tone === "confident") {
    openingParagraph = `I am writing with great enthusiasm to apply for the ${targetRole} opening at ${company}. With a track record of driving rapid growth, shipping zero-defect products, and solving complex technical challenges as a ${currentRole}${currentCompany}, I am confident in my ability to immediately elevate your engineering standards and deliver substantial value to your team.`;
  } else if (tone === "creative") {
    openingParagraph = `Great products are born at the intersection of relentless curiosity, exceptional craftsmanship, and sound architecture. As a ${currentRole}${currentCompany}, I have dedicated my career to building memorable, high-impact experiences. I have followed ${company}'s work with immense admiration and would be thrilled to bring my passion and perspective to the ${targetRole} role.`;
  } else {
    // professional
    openingParagraph = `I am writing to express my strong interest in the ${targetRole} position at ${company}. Currently serving as a ${currentRole}${currentCompany}, I have developed deep expertise in driving high-impact initiatives from concept through production. Given ${company}'s reputation for innovation and quality, I am eager to leverage my background to contribute directly to your team's ongoing success.`;
  }

  // Body Paragraph 1: Experience & Proven Track Record
  let bodyParagraph1 = "";
  if (expHighlights.length > 0) {
    bodyParagraph1 = `Throughout my career, I have prioritized measurable business impact and architectural resilience. ${expHighlights.join(" ")}`;
  } else if (topExp) {
    bodyParagraph1 = `In my role as ${topExp.position}${topExp.company ? ` at ${topExp.company}` : ""}, I was directly responsible for executing critical projects and collaborating across departments to exceed key performance metrics. My hands-on experience navigating complex deliverables under tight timelines has prepared me to hit the ground running at ${company}.`;
  } else {
    bodyParagraph1 = `My professional background has centered on delivering reliable, user-centric solutions while maintaining high standards of execution. Whether architecting new systems or optimizing existing workflows, I approach every challenge with analytical rigor, clear communication, and a focus on long-term value creation.`;
  }

  // Body Paragraph 2: Skills & Company Alignment
  let bodyParagraph2 = "";
  const eduHighlight = education[0] ? ` My academic foundation in ${education[0].field || education[0].degree} from ${education[0].institution} complements my industry experience.` : "";

  if (tone === "executive") {
    bodyParagraph2 = `My technical toolkit spans ${skillsList}, coupled with extensive experience establishing engineering best practices, mentoring team members, and aligning technical roadmaps with executive business goals.${eduHighlight} What excites me most about ${company} is the opportunity to tackle high-leverage challenges alongside a world-class team.`;
  } else if (tone === "creative") {
    bodyParagraph2 = `My core competencies include ${skillsList}. I thrive in collaborative environments where bold ideas are refined through rigorous iteration and deep empathy for end users.${eduHighlight} I am particularly energized by ${company}'s vision, and I look forward to contributing both technical precision and creative problem-solving to your roadmap.`;
  } else {
    bodyParagraph2 = `My technical competencies center on ${skillsList}. In addition to technical execution, I place a high premium on cross-functional alignment, proactive documentation, and continuous knowledge sharing.${eduHighlight} I am particularly drawn to ${company}'s culture and would relish the opportunity to help solve your most challenging problems.`;
  }

  // Closing Paragraph
  let closingParagraph = "";
  if (tone === "executive") {
    closingParagraph = `I would welcome the opportunity to discuss how my strategic vision and operational leadership can support ${company}'s growth. Thank you for your time, consideration, and leadership review.`;
  } else if (tone === "confident") {
    closingParagraph = `I am excited about the prospect of joining ${company} and making an immediate contribution to the ${targetRole} role. I look forward to the possibility of discussing my background in greater detail. Thank you for your consideration.`;
  } else {
    closingParagraph = `I would be delighted to speak with you regarding how my background and enthusiasm align with the goals of the ${targetRole} team at ${company}. Thank you very much for your time and consideration; I look forward to hearing from you.`;
  }

  return {
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    greeting,
    openingParagraph,
    bodyParagraph1,
    bodyParagraph2,
    closingParagraph,
    signOff: "Sincerely,",
  };
}

function extractExperienceHighlights(experience: CVData["experience"]): string[] {
  const highlights: string[] = [];

  for (const exp of experience.slice(0, 2)) {
    if (!exp.description) continue;

    // Split description into sentences or bullet points
    const lines = exp.description
      .split(/\r?\n|•|\. /)
      .map((l) => l.trim())
      .filter((l) => l.length > 20);

    if (lines.length > 0) {
      // Pick the strongest line (prefer one with numbers or metrics)
      const metricLine = lines.find((l) => /\d+%|\$\d+|\d+x|\d+\s*(users|teams|ms|seconds|million|thousand)/i.test(l)) || lines[0];
      const cleanLine = metricLine.replace(/^[•\-\*]\s*/, "").trim();
      const sentence = cleanLine.endsWith(".") ? cleanLine : `${cleanLine}.`;

      if (exp.company) {
        highlights.push(`At ${exp.company}, where I served as ${exp.position}, ${lowercaseFirst(sentence)}`);
      } else {
        highlights.push(sentence);
      }
    }
  }

  return highlights;
}

function lowercaseFirst(str: string): string {
  if (!str) return "";
  // Check if first word is an acronym (all caps)
  const firstWord = str.split(" ")[0];
  if (firstWord === firstWord.toUpperCase() && firstWord.length > 1) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}
