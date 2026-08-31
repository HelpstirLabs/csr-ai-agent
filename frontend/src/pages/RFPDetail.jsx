import React, { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import RfpTrackerDetail from "../components/RfpTrackerDetail";

function RFPDetail() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 800);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F7F7FB] flex overflow-x-hidden">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-60"
        }`}
      >
        <Navbar collapsed={collapsed} />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden px-4 py-5 md:p-8 md:pt-6">
          <div className="mt-3 md:mt-8 min-w-0 max-w-full">
            <RfpTrackerDetail />
          </div>
        </main>
      </div>
    </div>
  );
}

export default RFPDetail;