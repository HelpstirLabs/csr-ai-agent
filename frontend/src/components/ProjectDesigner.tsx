import { useState } from "react";
import type { FormEvent } from "react";
import type { ProjectDetail } from "../types/api";
import { generateProject } from "../services/api";
import ProjectReport from "./ProjectReport";

interface Props {
  onProjectCreated: () => void;
}

const THEME_OPTIONS = ["education", "healthcare", "environment", "livelihood", "gender_equality", "rural_development"];
const GENDER_OPTIONS = ["girls", "women", "mixed", "trans-inclusive"];
const BENEFICIARY_OPTIONS = ["out-of-school children", "PWD", "urban poor", "SC-ST", "tribal communities", "women", "farmers"];
const TECH_OPTIONS = ["offline-first", "mobile", "no-tech", "AI-powered"];
const SCALE_OPTIONS = ["pilot", "district", "multi-district", "state"];

export default function ProjectDesigner({ onProjectCreated }: Props) {
  const [briefText, setBriefText] = useState("");
  const [theme, setTheme] = useState("");
  const [geography, setGeography] = useState("");
  const [budget, setBudget] = useState("");
  const [demographic, setDemographic] = useState("");
  const [genderFocus, setGenderFocus] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [techApproach, setTechApproach] = useState("");
  const [scale, setScale] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const project = await generateProject({
        brief_text: briefText,
        theme: theme || undefined,
        geography: geography || undefined,
        budget_inr: budget ? Number(budget) : undefined,
        demographic: demographic || undefined,
        gender_focus: genderFocus || undefined,
        beneficiary_type: beneficiaryType || undefined,
        technology_approach: techApproach || undefined,
        scale: scale || undefined,
      });
      setResult(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="project-result">
        <ProjectReport project={result} />
        <div className="actions">
          <button onClick={() => { setResult(null); setBriefText(""); }}>Design another</button>
          <button className="primary" onClick={onProjectCreated}>Go to portfolio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-designer">
      <h2>Design a CSR Project</h2>
      <p className="subtitle">Describe your vision and let AI generate a complete project proposal.</p>

      <form onSubmit={handleGenerate}>
        <div className="form-group full">
          <label>Your Vision</label>
          <textarea
            rows={4}
            placeholder="Describe what you want to achieve... e.g. 'We want to improve education outcomes for girls in rural Rajasthan with a budget of Rs 50 lakhs'"
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            required
          />
        </div>

        <div className="chip-section">
          <label>Theme</label>
          <div className="chips selectable">
            {THEME_OPTIONS.map((t) => (
              <button type="button" key={t} className={`chip ${theme === t ? "selected" : ""}`} onClick={() => setTheme(theme === t ? "" : t)}>
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Geography</label>
            <input placeholder="e.g. Rajasthan, Ajmer" value={geography} onChange={(e) => setGeography(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Budget (INR)</label>
            <input type="number" placeholder="e.g. 5000000" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Demographic</label>
            <input placeholder="e.g. adolescent girls" value={demographic} onChange={(e) => setDemographic(e.target.value)} />
          </div>
        </div>

        <div className="chip-section">
          <label>Gender Focus</label>
          <div className="chips selectable">
            {GENDER_OPTIONS.map((g) => (
              <button type="button" key={g} className={`chip ${genderFocus === g ? "selected" : ""}`} onClick={() => setGenderFocus(genderFocus === g ? "" : g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="chip-section">
          <label>Beneficiary Type</label>
          <div className="chips selectable">
            {BENEFICIARY_OPTIONS.map((b) => (
              <button type="button" key={b} className={`chip ${beneficiaryType === b ? "selected" : ""}`} onClick={() => setBeneficiaryType(beneficiaryType === b ? "" : b)}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="chip-section">
          <label>Technology Approach</label>
          <div className="chips selectable">
            {TECH_OPTIONS.map((t) => (
              <button type="button" key={t} className={`chip ${techApproach === t ? "selected" : ""}`} onClick={() => setTechApproach(techApproach === t ? "" : t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="chip-section">
          <label>Scale</label>
          <div className="chips selectable">
            {SCALE_OPTIONS.map((s) => (
              <button type="button" key={s} className={`chip ${scale === s ? "selected" : ""}`} onClick={() => setScale(scale === s ? "" : s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary generate-btn" disabled={loading || !briefText.trim()}>
          {loading ? "Generating project proposal..." : "Generate Project"}
        </button>
      </form>
    </div>
  );
}
