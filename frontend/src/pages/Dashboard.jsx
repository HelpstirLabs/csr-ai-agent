import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

export default function Dashboard() {
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
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <Navbar collapsed={collapsed} />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-60"
        }`}
      >
        <main className="p-8 pt-20">
          <h1 className="font-heading text-[22px] font-bold">
            Dashboard
          </h1>
        </main>
      </div>
    </div>
  );
}