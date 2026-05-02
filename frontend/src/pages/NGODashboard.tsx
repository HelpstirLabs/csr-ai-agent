import { useEffect, useState } from "react";
import type { NGODetail } from "../types/api";
import { getNGOProfile } from "../services/api";

interface Props {
  onLogout: () => void;
}

export default function NGODashboard({ onLogout }: Props) {
  const [profile, setProfile] = useState<NGODetail | null>(null);

  useEffect(() => {
    getNGOProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header>
        <h1>HELPST<span className="accent">i</span>R</h1>
        <nav>
          <button className="active">Overview</button>
          <button className="logout" onClick={onLogout}>Sign out</button>
        </nav>
      </header>

      <main>
        <section className="ngo-header">
          <h2>{profile.name}</h2>
          <p>{profile.description}</p>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span className="label">Trust Score</span>
            <span className="value score">{profile.trust_score}<small>/100</small></span>
          </div>
          <div className="stat-card">
            <span className="label">Impact Score</span>
            <span className="value score">{profile.impact_score}<small>/100</small></span>
          </div>
          <div className="stat-card">
            <span className="label">Team Size</span>
            <span className="value">{profile.team_size ?? "—"}</span>
          </div>
        </section>

        <section className="trust-breakdown">
          <h3>Trust Score Breakdown</h3>
          <div className="breakdown-grid">
            {profile.trust_breakdown.map((item) => (
              <div key={item.credential} className={`breakdown-item ${item.earned ? "earned" : "missing"}`}>
                <span className="cred-name">{item.credential.replace(/_/g, " ")}</span>
                <span className="cred-pts">{item.earned_points}/{item.points} pts</span>
              </div>
            ))}
          </div>
        </section>

        <section className="areas">
          <h3>Thematic Areas</h3>
          <div className="chips">
            {profile.thematic_areas.map((a) => <span key={a} className="chip">{a.replace(/_/g, " ")}</span>)}
          </div>
          <h3>Operating Regions</h3>
          <div className="chips">
            {profile.operating_states.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        </section>
      </main>
    </div>
  );
}
