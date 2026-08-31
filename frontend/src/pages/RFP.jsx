import React, { useEffect, useState } from "react";
import RfpTracker from "../components/RfpTracker";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function RFP() {
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
        <div className="min-h-screen bg-[#F7F7FB] flex">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />


            <div
                className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-60"
                    }`}>
                <Navbar collapsed={collapsed} />

                <main className="flex-1 min-w-0 max-w-full overflow-x-hidden px-4 py-6 md:p-8 md:pt-20">
                    <h1 className="font-heading text-[20px] sm:text-[22px] font-bold text-[#071D3A]">
                        RFP Tracker
                    </h1>

                    <p className="mt-2 text-[13px] sm:text-[14px] text-gray-500">
                        Monitor NGO responses to your open project proposals.
                    </p>

                    <div className="mt-6 sm:mt-8">
                        <RfpTracker />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default RFP;