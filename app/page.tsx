import { getPortfolio } from "@/lib/backbone";
import {
  ArrowIcon,
  GithubIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/icons";

const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default async function Home() {
  const p = await getPortfolio();
  const [first, ...rest] = p.name.split(" ");
  const last = rest.join(" ");

  const contacts = [
    { key: "email", label: "Email", icon: MailIcon, value: p.contact.email, href: `mailto:${p.contact.email}` },
    { key: "phone", label: "Phone", icon: PhoneIcon, value: p.contact.phone, href: telHref(p.contact.phone) },
    { key: "github", label: "GitHub", icon: GithubIcon, value: display(p.contact.github), href: p.contact.github },
    { key: "linkedin", label: "LinkedIn", icon: LinkedinIcon, value: display(p.contact.linkedin), href: p.contact.linkedin },
  ].filter((c) => c.value);

  const initials = p.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <a href="#top" className="mark" aria-label={`${p.name}, back to top`}>
            {initials}
          </a>
          <nav className="topnav" aria-label="Sections">
            <a href="#experience">Experience</a>
            <a href="#education">Education</a>
            <a href="#stack">Tech stack</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </div>

      <main id="top" className="wrap">
        <header className="hero">
          <h1 className="hero-name" aria-label={p.name}>
            <span className="hero-line" aria-hidden="true">
              <span>{first}</span>
            </span>
            {last && (
              <span className="hero-line" aria-hidden="true">
                <span>{last}</span>
              </span>
            )}
          </h1>
          <p className="hero-meta">
            <strong>{p.role}</strong>, {p.location}
          </p>
        </header>

        <section className="section" aria-labelledby="summary-h">
          <h2 id="summary-h">Professional summary</h2>
          <div className="section-body">
            <p className="summary">{p.summary}</p>
          </div>
        </section>

        <section className="section" id="experience" aria-labelledby="experience-h">
          <h2 id="experience-h">Experience</h2>
          <div className="section-body entries">
            {p.experience.map((e, i) => (
              <article key={i}>
                <div className="entry-head">
                  <h3 className="entry-title">{e.role}</h3>
                  <span className="entry-period">{e.period}</span>
                </div>
                <p className="entry-sub">
                  <span className="org">{e.company}</span>
                  {e.location && `, ${e.location}`}
                </p>
                {e.points.length > 0 && (
                  <ul className="points">
                    {e.points.map((pt, j) => (
                      <li key={j}>{pt}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="education" aria-labelledby="education-h">
          <h2 id="education-h">Education</h2>
          <div className="section-body entries">
            {p.education.map((e, i) => (
              <article key={i}>
                <div className="entry-head">
                  <h3 className="entry-title">{e.degree}</h3>
                  <span className="entry-period">{e.period}</span>
                </div>
                <p className="entry-sub">
                  <span className="org">{e.school}</span>
                </p>
                {e.details && <p className="entry-details">{e.details}</p>}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="stack" aria-labelledby="stack-h">
          <h2 id="stack-h">Tech stack</h2>
          <dl className="section-body stack">
            {p.techStack.map((g, i) => (
              <div className="stack-row" key={i}>
                <dt>{g.group}</dt>
                <dd>{g.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-h">
          <h2 id="contact-h">Contact</h2>
          <div className="section-body contact">
            {contacts.map(({ key, label, icon: Icon, value, href }) => (
              <a
                key={key}
                className="contact-link"
                href={href}
                {...(key === "github" || key === "linkedin"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon />
                <span className="contact-label">{label}</span>
                <span className="contact-value">{value}</span>
                <ArrowIcon className="contact-go" width={18} height={18} />
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">{p.name}</div>
      </footer>
    </>
  );
}
