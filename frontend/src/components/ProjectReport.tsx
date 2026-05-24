import { useRef } from "react";
import type { ProjectDetail } from "../types/api";

interface Props {
  project: ProjectDetail;
}

function tryParseJSON(text: string): unknown | null {
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function RenderOutcomes({ data }: { data: Record<string, unknown> }) {
  const sections: { key: string; label: string }[] = [
    { key: "direct_intended", label: "Direct Intended Outcomes" },
    { key: "indirect_intended", label: "Indirect Intended Outcomes" },
    { key: "unintended_positive", label: "Unintended Positive Effects" },
    { key: "risks_unintended_negative", label: "Risks & Unintended Negative Effects" },
  ];

  return (
    <div className="structured-content">
      {sections.map(({ key, label }) => {
        const items = data[key];
        if (!Array.isArray(items) || items.length === 0) return null;
        return (
          <div key={key} className="outcome-group">
            <h4 className="outcome-label">{label}</h4>
            <ul className="outcome-list">
              {items.map((item: string, i: number) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function RenderMEFramework({ data }: { data: Record<string, unknown> }) {
  const indicators = data.indicators as Record<string, unknown[]> | undefined;
  const milestones = data.milestone_schedule as Record<string, string[]> | undefined;
  const collection = data.data_collection as Record<string, unknown> | undefined;
  const sustainability = data.sustainability_plan as Record<string, string> | undefined;

  return (
    <div className="structured-content">
      {indicators && Object.entries(indicators).map(([level, items]) => (
        <div key={level} className="me-indicator-group">
          <h4 className="outcome-label">{level.charAt(0).toUpperCase() + level.slice(1)} Indicators</h4>
          <div className="me-indicators">
            {(items as Array<Record<string, unknown>>).map((ind, i) => (
              <div key={i} className="me-indicator-card">
                <div className="me-indicator-name">{ind.indicator as string}</div>
                <div className="me-indicator-meta">
                  <span>Baseline: {String(ind.baseline)}</span>
                  <span>Target: {String(ind.target)}{ind.unit ? ` ${ind.unit}` : ""}</span>
                  {ind.frequency && <span>Frequency: {ind.frequency as string}</span>}
                </div>
                {ind.data_source && <div className="me-indicator-source">Source: {ind.data_source as string}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {milestones && (
        <div className="me-milestones">
          <h4 className="outcome-label">Milestone Schedule</h4>
          {Object.entries(milestones).map(([period, items]) => (
            <div key={period} className="milestone-period">
              <span className="milestone-period-label">{period}</span>
              <ul className="outcome-list">
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {collection && (
        <div className="me-collection">
          <h4 className="outcome-label">Data Collection</h4>
          {Object.entries(collection).map(([type, items]) => {
            if (typeof items === "string") {
              return <p key={type} className="me-collection-note">{items}</p>;
            }
            if (!Array.isArray(items)) return null;
            return (
              <div key={type} className="outcome-group">
                <h5 className="me-sub-label">{type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                <ul className="outcome-list">
                  {items.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {sustainability && (
        <div className="me-sustainability">
          <h4 className="outcome-label">Sustainability Plan</h4>
          {Object.entries(sustainability).map(([key, value]) => (
            <div key={key} className="sustainability-item">
              <span className="sustainability-label">{key.replace(/_/g, " ")}</span>
              <p>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmartSection({ content }: { content: string }) {
  const parsed = tryParseJSON(content);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.direct_intended || obj.indirect_intended || obj.risks_unintended_negative) {
      return <RenderOutcomes data={obj} />;
    }
    if (obj.indicators || obj.milestone_schedule || obj.data_collection) {
      return <RenderMEFramework data={obj} />;
    }
  }

  return <p>{content}</p>;
}

export default function ProjectReport({ project }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !reportRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.title} — HELPSTiR Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${reportRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const scheduleLabel = project.schedule_vii_head?.replace(/_/g, " ") ?? "—";

  const THEME_MAP: Record<string, { cls: string; icon: string }> = {
    education: { cls: "education", icon: "📚" },
    healthcare: { cls: "healthcare", icon: "🏥" },
    environment: { cls: "environment", icon: "🌿" },
    livelihood: { cls: "livelihood", icon: "🌾" },
    gender_equality: { cls: "gender", icon: "⚖️" },
    heritage: { cls: "heritage", icon: "🏛️" },
    armed_forces: { cls: "armed_forces", icon: "🎖️" },
    sports: { cls: "sports", icon: "🏅" },
    technology: { cls: "technology", icon: "💡" },
    rural_development: { cls: "rural", icon: "🏘️" },
    disaster_relief: { cls: "disaster", icon: "🆘" },
  };

  const headKey = project.schedule_vii_head ?? "";
  const theme = THEME_MAP[headKey] ?? { cls: "default", icon: "✦" };

  return (
    <div>
      <div className="report-actions">
        <button className="primary download-pdf-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <div className="report-container" ref={reportRef}>
        <div className={`report-banner ${theme.cls}`}>
          <div className="report-banner-pattern" />
          <span className="report-banner-icon">{theme.icon}</span>
        </div>

        <div className="report-header">
          <div className="report-brand">
            <div className="report-logo">HELPST<span style={{ color: "#1A52FF" }}>i</span>R</div>
            <div className="report-tagline">CSR Intelligence Platform</div>
          </div>
          <div className="report-doc-type">CSR Project Proposal</div>
        </div>

        <div className="report-divider" />

        <div className="report-title-block">
          <h1 className="report-title">{project.title}</h1>
          <div className="report-meta-row">
            <div className="report-meta-item">
              <span className="report-meta-label">Schedule VII</span>
              <span className="report-meta-value">{scheduleLabel}</span>
            </div>
            <div className="report-meta-item">
              <span className="report-meta-label">Status</span>
              <span className="report-meta-value">{project.status}</span>
            </div>
            {project.platform_fee_percent && (
              <div className="report-meta-item">
                <span className="report-meta-label">Platform Fee</span>
                <span className="report-meta-value">{project.platform_fee_percent}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-number">01</div>
          <div className="report-section-content">
            <h2>Problem Statement</h2>
            <SmartSection content={project.problem_statement} />
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-number">02</div>
          <div className="report-section-content">
            <h2>Intervention Logic</h2>
            <SmartSection content={project.intervention_logic} />
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-number">03</div>
          <div className="report-section-content">
            <h2>Projected Outcomes</h2>
            <SmartSection content={project.projected_outcomes} />
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-number">04</div>
          <div className="report-section-content">
            <h2>Monitoring & Evaluation Framework</h2>
            <SmartSection content={project.me_framework} />
          </div>
        </div>

        {project.recommendations.length > 0 && (
          <div className="report-section">
            <div className="report-section-number">05</div>
            <div className="report-section-content">
              <h2>Recommended Implementation Partners</h2>
              <div className="report-ngo-list">
                {project.recommendations.map((r) => (
                  <div key={r.ngo_id} className="report-ngo-card">
                    <div className="report-ngo-header">
                      <span className="report-ngo-rank">Rank #{r.rank}</span>
                      <span className="report-ngo-score">{(r.match_score * 100).toFixed(0)}% match</span>
                    </div>
                    <p className="report-ngo-rationale">{r.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="report-divider" />
        <div className="report-footer">
          <div className="report-footer-brand">HELPST<span style={{ color: "#1A52FF" }}>i</span>R</div>
          <div className="report-footer-text">
            GladVen Technologies Pvt. Ltd. · Paschim Vihar, New Delhi<br />
            connect@helpstir.in · www.helpstir.in
          </div>
          <div className="report-footer-note">
            This proposal was generated by the HELPSTiR CSR Intelligence Platform. All NGO data is sourced from verified profiles on the HELPSTiR registry.
          </div>
        </div>
      </div>
    </div>
  );
}

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Space Grotesk', Arial, sans-serif; color: #1a1a2e; line-height: 1.7; padding: 40px; }
  .report-banner { height: 100px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-banner-icon { font-size: 2.5rem; z-index: 1; }
  .report-banner-pattern { position: absolute; inset: 0; opacity: 0.12; background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px); background-size: 40px 40px, 60px 60px, 50px 50px; }
  .report-banner.education    { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
  .report-banner.healthcare   { background: linear-gradient(135deg, #065f46 0%, #10b981 100%); }
  .report-banner.environment  { background: linear-gradient(135deg, #166534 0%, #4ade80 100%); }
  .report-banner.livelihood   { background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%); }
  .report-banner.gender       { background: linear-gradient(135deg, #831843 0%, #ec4899 100%); }
  .report-banner.heritage     { background: linear-gradient(135deg, #7c2d12 0%, #ea580c 100%); }
  .report-banner.armed_forces { background: linear-gradient(135deg, #1e3a5f 0%, #475569 100%); }
  .report-banner.sports       { background: linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%); }
  .report-banner.technology   { background: linear-gradient(135deg, #0f172a 0%, #6366f1 100%); }
  .report-banner.rural        { background: linear-gradient(135deg, #365314 0%, #84cc16 100%); }
  .report-banner.disaster     { background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%); }
  .report-banner.default      { background: linear-gradient(135deg, #1A52FF 0%, #6366f1 100%); }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .report-logo { font-size: 28px; font-weight: 700; }
  .report-tagline { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .report-doc-type { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; padding-top: 8px; }
  .report-divider { height: 3px; background: linear-gradient(90deg, #1A52FF 0%, #e8eeff 100%); margin: 24px 0; border-radius: 2px; }
  .report-title-block { margin-bottom: 32px; }
  .report-title { font-size: 24px; font-weight: 700; line-height: 1.3; margin-bottom: 16px; }
  .report-meta-row { display: flex; gap: 32px; }
  .report-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .report-meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
  .report-meta-value { font-size: 14px; font-weight: 600; text-transform: capitalize; }
  .report-section { display: flex; gap: 24px; margin-bottom: 28px; page-break-inside: avoid; }
  .report-section-number { font-size: 32px; font-weight: 700; color: #e8eeff; line-height: 1; min-width: 48px; }
  .report-section-content { flex: 1; }
  .report-section-content h2 { font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #1A52FF; margin-bottom: 10px; }
  .report-section-content p { font-size: 14px; line-height: 1.8; white-space: pre-line; }
  .structured-content { font-size: 14px; line-height: 1.8; }
  .outcome-group { margin-bottom: 16px; }
  .outcome-label { font-size: 13px; font-weight: 600; color: #1e40af; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .outcome-list { margin: 0; padding-left: 20px; }
  .outcome-list li { margin-bottom: 8px; font-size: 13px; line-height: 1.7; }
  .me-indicator-group { margin-bottom: 20px; }
  .me-indicators { display: flex; flex-direction: column; gap: 10px; }
  .me-indicator-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
  .me-indicator-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
  .me-indicator-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #6b7280; }
  .me-indicator-source { font-size: 11px; color: #9ca3af; margin-top: 4px; }
  .me-milestones { margin-bottom: 20px; }
  .milestone-period { margin-bottom: 12px; }
  .milestone-period-label { font-weight: 600; font-size: 13px; color: #1A52FF; display: inline-block; margin-bottom: 4px; }
  .me-collection { margin-bottom: 20px; }
  .me-collection-note { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .me-sub-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: capitalize; }
  .me-sustainability { margin-bottom: 20px; }
  .sustainability-item { margin-bottom: 12px; }
  .sustainability-label { font-weight: 600; font-size: 13px; color: #1A52FF; text-transform: capitalize; display: block; margin-bottom: 4px; }
  .sustainability-item p { font-size: 13px; line-height: 1.7; }
  .report-ngo-list { display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
  .report-ngo-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .report-ngo-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .report-ngo-rank { font-weight: 700; color: #1A52FF; font-size: 14px; }
  .report-ngo-score { font-size: 13px; color: #6b7280; }
  .report-ngo-rationale { font-size: 13px; line-height: 1.7; }
  .report-footer { text-align: center; margin-top: 8px; }
  .report-footer-brand { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .report-footer-text { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
  .report-footer-note { font-size: 11px; color: #9ca3af; font-style: italic; max-width: 500px; margin: 0 auto; }
  @media print { body { padding: 20px; } .report-section { page-break-inside: avoid; } }
`;
