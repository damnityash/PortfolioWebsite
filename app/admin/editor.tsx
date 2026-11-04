"use client";

import { useState, useTransition } from "react";
import {
  normalizePortfolio,
  type Education,
  type Experience,
  type Portfolio,
  type TechGroup,
} from "@/lib/portfolio";
import { logout, savePortfolioAction } from "./actions";

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const commas = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

function Field({
  label,
  hint,
  value,
  onChange,
  multiline,
  rows,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={rows ?? 4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Keeps the raw text locally so typing newlines/commas is not swallowed by parsing. */
function ListField({
  label,
  hint,
  items,
  separator,
  onChange,
  rows,
}: {
  label: string;
  hint: string;
  items: string[];
  separator: "line" | "comma";
  onChange: (v: string[]) => void;
  rows?: number;
}) {
  const [text, setText] = useState(items.join(separator === "line" ? "\n" : ", "));
  const parse = separator === "line" ? lines : commas;
  return (
    <Field
      label={label}
      hint={hint}
      multiline={separator === "line"}
      rows={rows}
      value={text}
      onChange={(v) => {
        setText(v);
        onChange(parse(v));
      }}
    />
  );
}

const move = <T,>(arr: T[], i: number, patch: Partial<T>) =>
  arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

export function Editor({ initial }: { initial: Portfolio }) {
  const [data, setData] = useState<Portfolio>(initial);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [json, setJson] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "idle"; text: string }>({
    tone: "idle",
    text: "",
  });
  const [pending, startTransition] = useTransition();
  const [rev, setRev] = useState(0); // bumps on removal so local text state remounts

  const set = <K extends keyof Portfolio>(k: K, v: Portfolio[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  function switchMode(next: "form" | "json") {
    if (next === mode) return;
    if (next === "json") {
      setJson(JSON.stringify(data, null, 2));
    } else {
      try {
        setData(normalizePortfolio(JSON.parse(json)));
        setRev((r) => r + 1);
      } catch {
        setStatus({ tone: "error", text: "The JSON is not valid. Fix it before switching to the form." });
        return;
      }
    }
    setStatus({ tone: "idle", text: "" });
    setMode(next);
  }

  function save() {
    const payload = mode === "json" ? json : JSON.stringify(data);
    setStatus({ tone: "idle", text: "Saving…" });
    startTransition(async () => {
      const res = await savePortfolioAction(payload);
      setStatus({ tone: res.ok ? "ok" : "error", text: res.message });
    });
  }

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="wrap">
          <h1>Edit portfolio</h1>
          <span className="status" role="status" data-tone={status.tone}>
            {status.text}
          </span>
          <div className="tabs" role="group" aria-label="Editor mode">
            <button type="button" aria-pressed={mode === "form"} onClick={() => switchMode("form")}>
              Form
            </button>
            <button type="button" aria-pressed={mode === "json"} onClick={() => switchMode("json")}>
              JSON
            </button>
          </div>
          <a className="btn" data-variant="quiet" href="/" target="_blank" rel="noopener noreferrer">
            View site
          </a>
          <form action={logout}>
            <button className="btn" data-variant="quiet">
              Sign out
            </button>
          </form>
          <button className="btn" data-variant="solid" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: "52rem" }}>
        {mode === "json" ? (
          <div className="fieldset json-editor">
            <label className="field">
              <span>Portfolio JSON</span>
              <textarea
                value={json}
                spellCheck={false}
                onChange={(e) => setJson(e.target.value)}
              />
              <small>This is exactly what is stored in the backend.</small>
            </label>
          </div>
        ) : (
          <>
            <section className="fieldset">
              <h2>Profile</h2>
              <div className="field-grid">
                <Field label="Name" value={data.name} onChange={(v) => set("name", v)} />
                <Field label="Role" value={data.role} onChange={(v) => set("role", v)} />
                <Field label="Location" value={data.location} onChange={(v) => set("location", v)} />
              </div>
              <Field
                label="Professional summary"
                multiline
                rows={5}
                value={data.summary}
                onChange={(v) => set("summary", v)}
              />
            </section>

            <section className="fieldset">
              <h2>Contact</h2>
              <div className="field-grid">
                <Field
                  label="Email"
                  type="email"
                  value={data.contact.email}
                  onChange={(v) => set("contact", { ...data.contact, email: v })}
                />
                <Field
                  label="Phone"
                  value={data.contact.phone}
                  onChange={(v) => set("contact", { ...data.contact, phone: v })}
                />
                <Field
                  label="GitHub URL"
                  value={data.contact.github}
                  onChange={(v) => set("contact", { ...data.contact, github: v })}
                />
                <Field
                  label="LinkedIn URL"
                  value={data.contact.linkedin}
                  onChange={(v) => set("contact", { ...data.contact, linkedin: v })}
                />
              </div>
            </section>

            <section className="fieldset">
              <h2>Experience</h2>
              {data.experience.map((e, i) => (
                <div className="repeat" key={`${rev}-${i}`}>
                  <div className="repeat-head">
                    <span>{e.company || `Position ${i + 1}`}</span>
                    <button
                      type="button"
                      className="btn"
                      data-variant="danger"
                      onClick={() => {
                        set("experience", data.experience.filter((_, j) => j !== i));
                        setRev((r) => r + 1);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="field-grid">
                    <Field label="Role" value={e.role} onChange={(v) => set("experience", move<Experience>(data.experience, i, { role: v }))} />
                    <Field label="Company" value={e.company} onChange={(v) => set("experience", move<Experience>(data.experience, i, { company: v }))} />
                    <Field label="Period" value={e.period} onChange={(v) => set("experience", move<Experience>(data.experience, i, { period: v }))} />
                    <Field label="Location" value={e.location} onChange={(v) => set("experience", move<Experience>(data.experience, i, { location: v }))} />
                  </div>
                  <Field
                    label="Highlights"
                    hint="One per line."
                    multiline
                    rows={5}
                    value={e.points.join("\n")}
                    onChange={(v) => set("experience", move<Experience>(data.experience, i, { points: lines(v) }))}
                  />
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    set("experience", [
                      ...data.experience,
                      { company: "", role: "", period: "", location: "", points: [] },
                    ])
                  }
                >
                  Add position
                </button>
              </div>
            </section>

            <section className="fieldset">
              <h2>Education</h2>
              {data.education.map((e, i) => (
                <div className="repeat" key={`${rev}-${i}`}>
                  <div className="repeat-head">
                    <span>{e.school || `Entry ${i + 1}`}</span>
                    <button
                      type="button"
                      className="btn"
                      data-variant="danger"
                      onClick={() => {
                        set("education", data.education.filter((_, j) => j !== i));
                        setRev((r) => r + 1);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="field-grid">
                    <Field label="Degree" value={e.degree} onChange={(v) => set("education", move<Education>(data.education, i, { degree: v }))} />
                    <Field label="School" value={e.school} onChange={(v) => set("education", move<Education>(data.education, i, { school: v }))} />
                    <Field label="Period" value={e.period} onChange={(v) => set("education", move<Education>(data.education, i, { period: v }))} />
                  </div>
                  <Field
                    label="Details"
                    multiline
                    rows={3}
                    value={e.details}
                    onChange={(v) => set("education", move<Education>(data.education, i, { details: v }))}
                  />
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    set("education", [...data.education, { school: "", degree: "", period: "", details: "" }])
                  }
                >
                  Add education
                </button>
              </div>
            </section>

            <section className="fieldset">
              <h2>Tech stack</h2>
              {data.techStack.map((g, i) => (
                <div className="repeat" key={`${rev}-${i}`}>
                  <div className="repeat-head">
                    <span>{g.group || `Group ${i + 1}`}</span>
                    <button
                      type="button"
                      className="btn"
                      data-variant="danger"
                      onClick={() => {
                        set("techStack", data.techStack.filter((_, j) => j !== i));
                        setRev((r) => r + 1);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="Group name" value={g.group} onChange={(v) => set("techStack", move<TechGroup>(data.techStack, i, { group: v }))} />
                  <ListField
                    label="Technologies"
                    hint="Separate with commas."
                    separator="comma"
                    items={g.items}
                    onChange={(v) => set("techStack", move<TechGroup>(data.techStack, i, { items: v }))}
                  />
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => set("techStack", [...data.techStack, { group: "", items: [] }])}
                >
                  Add group
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
