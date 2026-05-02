import { useEffect, useState } from "react";
import type { ProjectDetail } from "../types/api";
import { getProject, awardProject, deleteProject } from "../services/api";
import ProjectReport from "../components/ProjectReport";

interface Props {
  projectId: number;
  onBack: () => void;
}

export default function ProjectDetailPage({ projectId, onBack }: Props) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProject(projectId).then(setProject).catch((e) => setError(e.message));
  }, [projectId]);

  const handleAward = async (ngoId: number) => {
    setAwarding(true);
    try {
      await awardProject(projectId, ngoId);
      const updated = await getProject(projectId);
      setProject(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Award failed");
    } finally {
      setAwarding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  if (error) return <div className="project-detail-page"><p className="error">{error}</p><button onClick={onBack}>Back</button></div>;
  if (!project) return <div className="loading">Loading project...</div>;

  return (
    <div className="project-detail-page">
      <div className="detail-top-bar">
        <button className="back-btn" onClick={onBack}>← Back to portfolio</button>
        <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete project"}
        </button>
      </div>

      <ProjectReport project={project} />

      {project.status === "generated" && project.recommendations.length > 0 && (
        <section className="award-section">
          <h3>Select Implementation Partner</h3>
          <div className="award-cards">
            {project.recommendations.map((r) => (
              <div key={r.ngo_id} className="award-card">
                <div className="award-card-info">
                  <span className="rec-rank">#{r.rank}</span>
                  <span className="rec-score">{(r.match_score * 100).toFixed(0)}% match</span>
                </div>
                <button
                  className="primary award-btn"
                  disabled={awarding}
                  onClick={() => handleAward(r.ngo_id)}
                >
                  {awarding ? "Awarding..." : "Award to this NGO"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
