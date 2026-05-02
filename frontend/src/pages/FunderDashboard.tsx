import { useEffect, useState } from "react";
import type { FunderProfile, Project } from "../types/api";
import { getFunderProfile, listProjects, updateFunderProfile } from "../services/api";
import ProjectDesigner from "../components/ProjectDesigner";
import ProjectDetailPage from "./ProjectDetailPage";
import EditableStatCard from "../components/EditableStatCard";

interface Props {
  onLogout: () => void;
}

export default function FunderDashboard({ onLogout }: Props) {
  const [profile, setProfile] = useState<FunderProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"portfolio" | "design" | "detail">("portfolio");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  useEffect(() => {
    getFunderProfile().then(setProfile).catch(console.error);
    listProjects().then(setProjects).catch(console.error);
  }, []);

  const refreshAndGoPortfolio = () => {
    listProjects().then(setProjects);
    getFunderProfile().then(setProfile);
    setView("portfolio");
    setSelectedProjectId(null);
  };

  const openProject = (id: number) => {
    setSelectedProjectId(id);
    setView("detail");
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const handleUpdateBudget = async (value: number) => {
    const updated = await updateFunderProfile({ total_csr_budget_inr: value });
    setProfile(updated);
  };

  const handleUpdateDeployed = async (value: number) => {
    const updated = await updateFunderProfile({ deployed_budget_inr: value });
    setProfile(updated);
  };

  return (
    <div className="dashboard">
      <header>
        <h1>HELPST<span className="accent">i</span>R</h1>
        <nav>
          <button className={view === "portfolio" ? "active" : ""} onClick={refreshAndGoPortfolio}>My Portfolio</button>
          <button className={view === "design" ? "active" : ""} onClick={() => setView("design")}>Design a Project</button>
          <button className="logout" onClick={onLogout}>Sign out</button>
        </nav>
      </header>

      {view === "portfolio" && profile && (
        <main>
          <section className="stats">
            <EditableStatCard
              label="Total CSR Budget"
              value={profile.total_csr_budget_inr}
              formatValue={formatINR}
              onSave={handleUpdateBudget}
            />
            <EditableStatCard
              label="Deployed"
              value={profile.deployed_budget_inr}
              formatValue={formatINR}
              onSave={handleUpdateDeployed}
            />
            <EditableStatCard
              label="Undeployed"
              value={profile.undeployed_budget_inr}
              formatValue={formatINR}
              onSave={async () => {}}
              highlight
              editable={false}
            />
            <EditableStatCard
              label="Active Projects"
              value={projects.length}
              formatValue={(n) => String(n)}
              onSave={async () => {}}
              editable={false}
            />
          </section>

          <section className="projects-list">
            <h2>Projects</h2>
            {projects.length === 0 ? (
              <p className="empty">No projects yet. <button onClick={() => setView("design")}>Design your first project</button></p>
            ) : (
              <div className="cards">
                {projects.map((p) => (
                  <div key={p.id} className="project-card clickable" onClick={() => openProject(p.id)}>
                    <h3>{p.title}</h3>
                    <span className={`status ${p.status}`}>{p.status}</span>
                    <p>{p.problem_statement.slice(0, 150)}...</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {view === "design" && (
        <main>
          <ProjectDesigner onProjectCreated={refreshAndGoPortfolio} />
        </main>
      )}

      {view === "detail" && selectedProjectId && (
        <main>
          <ProjectDetailPage projectId={selectedProjectId} onBack={refreshAndGoPortfolio} />
        </main>
      )}
    </div>
  );
}
