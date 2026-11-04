import seed from "@/data/portfolio.seed.json";

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  points: string[];
};

export type Education = {
  school: string;
  degree: string;
  period: string;
  details: string;
};

export type TechGroup = {
  group: string;
  items: string[];
};

export type Portfolio = {
  name: string;
  role: string;
  location: string;
  summary: string;
  contact: {
    email: string;
    phone: string;
    github: string;
    linkedin: string;
  };
  experience: Experience[];
  education: Education[];
  techStack: TechGroup[];
};

export const seedPortfolio = seed as Portfolio;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const list = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    : [];

/** Coerces untrusted JSON (admin form or stored document) into a valid Portfolio. */
export function normalizePortfolio(input: unknown): Portfolio {
  const o = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const c = (o.contact && typeof o.contact === "object" ? o.contact : {}) as Record<
    string,
    unknown
  >;
  return {
    name: str(o.name),
    role: str(o.role),
    location: str(o.location),
    summary: str(o.summary),
    contact: {
      email: str(c.email),
      phone: str(c.phone),
      github: str(c.github),
      linkedin: str(c.linkedin),
    },
    experience: list(o.experience).map((e) => ({
      company: str(e.company),
      role: str(e.role),
      period: str(e.period),
      location: str(e.location),
      points: strList(e.points),
    })),
    education: list(o.education).map((e) => ({
      school: str(e.school),
      degree: str(e.degree),
      period: str(e.period),
      details: str(e.details),
    })),
    techStack: list(o.techStack).map((g) => ({
      group: str(g.group),
      items: strList(g.items),
    })),
  };
}
