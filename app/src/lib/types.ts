export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  website: string;
  linkedin: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

export interface Language {
  id: string;
  name: string;
  proficiency: "Beginner" | "Elementary" | "Intermediate" | "Advanced" | "Native";
}

export interface CustomSectionItem {
  id: string;
  text: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export type TemplateId = "modern" | "classic" | "executive" | "minimalist" | "creative" | "technical";

export interface CVData {
  _id?: string;
  userId: string;
  templateId: TemplateId;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  customSections: CustomSection[];
  pdfBase64?: string;
  createdAt?: string;
  updatedAt?: string;
}


export const emptyPersonalInfo: PersonalInfo = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  website: "",
  linkedin: "",
};

export const emptyCV: Omit<CVData, "userId"> = {
  templateId: "modern",
  personalInfo: emptyPersonalInfo,
  experience: [],
  education: [],
  skills: [],
  languages: [],
  customSections: [],
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const dummyCVData: Omit<CVData, "userId"> = {
  templateId: "modern",
  personalInfo: {
    fullName: "Alexander Vance",
    title: "Senior Full-Stack Architect",
    email: "alexander.vance@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    summary:
      "Innovative Senior Full-Stack Engineer with 8+ years of expertise in building enterprise web applications, high-throughput microservices, and AI-driven solutions. Proven track record leading agile engineering squads, scaling cloud architectures on AWS, and architecting elegant, responsive user experiences.",
    website: "https://alexandervance.dev",
    linkedin: "linkedin.com/in/alexvance",
  },
  experience: [
    {
      id: "exp-1",
      company: "Stripe Inc.",
      position: "Lead Full-Stack Architect",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      description:
        "• Spearheaded the architectural overhaul of merchant checkout APIs, reducing p99 latency by 35% and lifting global transaction conversions by 18%.\n• Mentored a team of 8 engineers and introduced TypeScript and Next.js best practices across 4 core product services.\n• Managed cross-region database replication on MongoDB Atlas and PostgreSQL handling 50M+ events daily.",
    },
    {
      id: "exp-2",
      company: "Airbnb",
      position: "Senior Frontend Engineer",
      startDate: "Aug 2018",
      endDate: "Dec 2020",
      current: false,
      description:
        "• Designed and shipped core UI modules for Airbnb Experiences, resulting in a 24% uplift in booking completions.\n• Spearheaded performance optimizations that shaved 1.2s off initial bundle load time across all mobile web viewports.\n• Collaborated closely with product designers to implement an accessible, cross-platform design token system.",
    },
    {
      id: "exp-3",
      company: "Spotify",
      position: "Software Engineer",
      startDate: "Jun 2016",
      endDate: "Jul 2018",
      current: false,
      description:
        "• Built interactive audio streaming features and real-time social activity widgets for desktop and web clients.\n• Implemented automated CI/CD deployment pipelines using Docker, GitHub Actions, and Kubernetes.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Stanford University",
      degree: "Master of Science",
      field: "Computer Science (Distributed Systems)",
      startDate: "Sep 2014",
      endDate: "Jun 2016",
      description: "GPA: 3.92/4.0. Graduate Research Assistant in Artificial Intelligence and Cloud Infrastructure.",
    },
    {
      id: "edu-2",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Software Engineering",
      startDate: "Sep 2010",
      endDate: "May 2014",
      description: "Magna Cum Laude. Dean's Honor List for 7 consecutive semesters. President of Computer Science Club.",
    },
  ],
  skills: [
    { id: "sk-1", name: "TypeScript & JavaScript", level: 5 },
    { id: "sk-2", name: "React & Next.js", level: 5 },
    { id: "sk-3", name: "Node.js & Express", level: 5 },
    { id: "sk-4", name: "MongoDB & PostgreSQL", level: 4 },
    { id: "sk-5", name: "Cloud Architecture (AWS / GCP)", level: 4 },
    { id: "sk-6", name: "System Design & Microservices", level: 5 },
    { id: "sk-7", name: "Docker & Kubernetes", level: 4 },
    { id: "sk-8", name: "GraphQL & RESTful APIs", level: 5 },
  ],
  languages: [
    { id: "lang-1", name: "English", proficiency: "Native" },
    { id: "lang-2", name: "Spanish", proficiency: "Advanced" },
    { id: "lang-3", name: "French", proficiency: "Intermediate" },
  ],
  customSections: [
    {
      id: "cust-1",
      title: "Awards & Honors",
      items: [
        { id: "item-1", text: "🏆 1st Place Winner — Global FinTech Hackathon 2023 (out of 180+ teams)" },
        { id: "item-2", text: "⭐ Stripe Engineering Excellence & Leadership Award (Q3 2022)" },
        { id: "item-3", text: "🚀 Top Open-Source Contributor Award — Next.js & React ecosystem" },
      ],
    },
    {
      id: "cust-2",
      title: "Hobbies & Interests",
      items: [
        { id: "item-4", text: "📷 Landscape & Astro Photography (featured in Outdoor Magazine)" },
        { id: "item-5", text: "♟️ Competitive Chess (USCF 1980 rating)" },
        { id: "item-6", text: "🏃 Marathon Runner (Completed Boston Marathon 2023 & NYC Marathon 2024)" },
        { id: "item-7", text: "☕ Specialty Coffee Roasting and Espresso brewing" },
      ],
    },
    {
      id: "cust-3",
      title: "Certifications",
      items: [
        { id: "item-8", text: "AWS Certified Solutions Architect — Professional (2024)" },
        { id: "item-9", text: "Certified Kubernetes Administrator (CKA) — Linux Foundation" },
      ],
    },
  ],
};

/* ==================== Cover Letter Types ==================== */

export interface CoverLetterRecipient {
  hiringManager: string;
  companyName: string;
  department?: string;
  companyAddress?: string;
  jobTitle: string;
}

export interface CoverLetterDetails {
  date: string;
  greeting: string;
  openingParagraph: string;
  bodyParagraph1: string;
  bodyParagraph2: string;
  closingParagraph: string;
  signOff: string;
}

export interface CoverLetterData {
  _id?: string;
  userId: string;
  cvId?: string;
  title: string;
  templateId: "modern" | "classic" | "executive" | "creative";

  personalInfo: PersonalInfo;
  recipient: CoverLetterRecipient;
  letterDetails: CoverLetterDetails;
  pdfBase64?: string;
  createdAt?: string;
  updatedAt?: string;
}


export const emptyCoverLetter: CoverLetterData = {
  userId: "",
  cvId: "",
  title: "Untitled Cover Letter",
  templateId: "modern",
  personalInfo: emptyPersonalInfo,
  recipient: {
    hiringManager: "Hiring Manager",
    companyName: "",
    department: "",
    companyAddress: "",
    jobTitle: "",
  },
  letterDetails: {
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    greeting: "Dear Hiring Team,",
    openingParagraph: "",
    bodyParagraph1: "",
    bodyParagraph2: "",
    closingParagraph: "",
    signOff: "Sincerely,",
  },
};

export const dummyCoverLetterData: CoverLetterData = {
  userId: "dummy",
  cvId: "dummy-cv",
  title: "Cover Letter — Principal Engineer at Stripe",
  templateId: "modern",
  personalInfo: dummyCVData.personalInfo,
  recipient: {
    hiringManager: "Hiring Committee",
    companyName: "Stripe",
    department: "Global Payments Infrastructure",
    companyAddress: "510 Townsend St, San Francisco, CA 94103",
    jobTitle: "Staff / Principal Frontend Engineer",
  },
  letterDetails: {
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    greeting: "Dear Hiring Committee,",
    openingParagraph:
      "I am writing to express my strong enthusiasm for the Staff / Principal Frontend Engineer position at Stripe. Having spent over eight years architecting resilient, high-throughput web applications and scalable design systems, I have long admired Stripe's world-class engineering standards and relentless focus on developer ergonomics. I am excited by the opportunity to bring my background in platform scalability and frontend architecture to your infrastructure team.",
    bodyParagraph1:
      "In my current role at Stripe, I led the architectural modernization of core checkout interfaces, which directly reduced bundle sizes by 42% and accelerated global page-load speeds by 1.8 seconds. This effort measurably boosted conversion rates across more than 25 million monthly active users. Additionally, during my tenure at Airbnb, I architected a distributed design token pipeline that unified UI components across 40+ engineering squads, cutting new feature delivery times by 35%. My work consistently bridges deep technical rigor with measurable business velocity.",
    bodyParagraph2:
      "Beyond core technical execution, my expertise spans distributed systems, TypeScript, Next.js, and micro-frontend orchestration. I take pride in fostering rigorous engineering cultures through proactive code reviews, comprehensive mentorship programs, and establishing latency budgets across production deployments. What excites me most about Stripe is your commitment to building the financial operating system for the internet—a challenge where performance, reliability, and precision are paramount.",
    closingParagraph:
      "I welcome the opportunity to discuss how my technical leadership, architectural discipline, and passion for polished user experiences can contribute to Stripe's ongoing mission. Thank you for your time and consideration; I look forward to hearing from you soon.",
    signOff: "Sincerely,",
  },
};

/* ==================== Educational & Custom Document Types ==================== */

export type DocCategory = "CV" | "Cover Letter" | "Grade8" | "Grade10" | "Grade12" | "University Certificate" | "Custom";


export interface UserDocument {
  _id: string;
  userId: string;
  title: string;
  category: DocCategory;
  customCategory?: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  fileName: string;
  fileSize: number;
  publicId?: string;
  rotation?: number; // 0, 90, 180, 270 degrees
  createdAt: string;
  updatedAt: string;
}


export interface MergeOrderItem {
  id: string;
  type: "cv" | "cover_letter" | "document";
}

export interface MergeSelectionRequest {
  cvId?: string;
  coverLetterId?: string;
  documentIds?: string[];
  orderedItems?: MergeOrderItem[];
}


