// pages/DesignProject.jsx

import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ProjectFlow from "../components/ProjectFlow";
import ProjectForm from "../components/ProjectForm";

export default function DesignProject() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 800);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Navbar */}
      <Navbar collapsed={collapsed} />

      {/* Content */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-60"
        }`}
      >
        <main className="p-8 pt-20">
          <h1 className="font-heading text-[22px] font-bold">
            Design a Project
          </h1>

          <p className="mt-2 text-[13px] text-gray-500">
            Describe your intent or configure step-by-step.
            The AI designs the full project from NGO network data.
          </p>

          {/* <div className="mt-8">
            <ProjectFlow />
          </div> */}

          <div className="mt-8">
            <ProjectForm />
          </div>
        </main>
      </div>
    </div>
  );
}