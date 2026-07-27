import React from "react";
import RfpTracker from "../components/RfpTracker";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function RFP() {
    return (
        <div className="min-h-screen bg-[#f7f7fb] flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Right Section */}
            <div className="flex-1 flex flex-col ml-60">
                {/* Navbar */}
                <Navbar />

                {/* Main Content */}
                <main className="flex-1 p-8 pt-20">
                    <h1 className="font-heading text-[22px] font-bold">
                        RFP tracker
                    </h1>

                    <p className="mt-2 text-[13px] text-gray-500">
                        Monitor NGO responses to your open project proposals.
                    </p>

                    <div className="mt-8">
                        <RfpTracker />
                    </div>

                </main>
            </div>
        </div>
    );
}

export default RFP;