import { useEffect, useState } from "react";
import { Play, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchNGOsData, handleProjectDesign } from "../services/api/project";
import { toast } from "react-toastify";
import jsPDF from "jspdf";


const Chip = ({ label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all
      ${active
                    ? "bg-blue-50 text-blue-600 border-blue-300"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                }`}
        >
            {label}
        </button>
    );
};

export default function ProjectForm() {
    const [showLogin, setShowLogin] = useState(false);
    const [activeTab, setActiveTab] = useState("vision");
    const [generatedTab, setgeneratedTab] = useState("proposal")

    const [generatedProject, setGeneratedProject] = useState(null);
    const [ngoList, setNGOList] = useState([])
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        vision: "",
        gender: "",
        geography: "",
        budget: "",
        beneficiary: "",
        area: "",
        scale: "",
    });

    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // textarea onchange
    const handleVisionChange = (e) => {
        setFormData({
            ...formData,
            vision: e.target.value,
        });
    };

    // chip onchange
    const handleSelect = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    // login input onchange
    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value,
        });
    };

    // generate button
    const handleGenerate = async () => {
        const {
            vision,
            gender,
            geography,
            budget,
            beneficiary,
            area,
            scale,
        } = formData;

        if (
            !vision ||
            !gender ||
            !geography ||
            !budget ||
            !beneficiary ||
            !area ||
            !scale
        ) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);

            const response = await handleProjectDesign(formData);

            console.log(response);

            setGeneratedProject(response.rfp);
            setNGOList(response.recommended_ngos)
            console.log("Generated Project:", generatedProject);
            console.log(typeof generatedProject);

            toast.success("Project generated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate project");
        } finally {
            setLoading(false);
        }
    };



    const extractSection = (text, start, end) => {
        if (!text || typeof text !== "string") {
            return "";
        }

        const startIndex = text.indexOf(start);

        if (startIndex === -1) {
            return "";
        }

        const endIndex = end
            ? text.indexOf(end, startIndex)
            : text.length;

        return text.substring(
            startIndex + start.length,
            endIndex === -1 ? text.length : endIndex
        ).trim();
    };

    const projectTitle = extractSection(
        generatedProject,
        "Project Title:",
        "Submitted by:"
    );

    const executiveSummary = extractSection(
        generatedProject,
        "EXECUTIVE SUMMARY",
        "PROBLEM STATEMENT"
    );

    const problemStatement = extractSection(
        generatedProject,
        "PROBLEM STATEMENT",
        "PROJECT OBJECTIVES"
    );

    const objectives = extractSection(
        generatedProject,
        "PROJECT OBJECTIVES",
        "TARGET BENEFICIARIES"
    );

    const targetBeneficiaries = extractSection(
        generatedProject,
        "TARGET BENEFICIARIES",
        "PROJECT APPROACH"
    );

    const projectApproach = extractSection(
        generatedProject,
        "PROJECT APPROACH",
        "EXPECTED OUTCOMES"
    );

    const expectedOutcomes = extractSection(
        generatedProject,
        "EXPECTED OUTCOMES",
        "IMPLEMENTATION TIMELINE"
    );

    const implementationTimeline = extractSection(
        generatedProject,
        "IMPLEMENTATION TIMELINE",
        "ESTIMATED BUDGET SUMMARY"
    );

    const budgetSummary = extractSection(
        generatedProject,
        "ESTIMATED BUDGET SUMMARY",
        "CONCLUSION"
    );

    const conclusion = extractSection(
        generatedProject,
        "CONCLUSION",
        null
    );

    const downloadProposalPDF = () => {
        const doc = new jsPDF();

        let y = 20;

        doc.setFontSize(18);
        doc.text(projectTitle || "CSR Project Proposal", 15, y);

        y += 15;

        const sections = [
            ["Executive Summary", executiveSummary],
            ["Problem Statement", problemStatement],
            ["Objectives", objectives],
            ["Target Beneficiaries", targetBeneficiaries],
            ["Project Approach", projectApproach],
            ["Expected Outcomes", expectedOutcomes],
            ["Implementation Timeline", implementationTimeline],
            ["Estimated Budget Summary", budgetSummary],
            ["Conclusion", conclusion],
        ];

        sections.forEach(([title, content]) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, "bold");
            doc.text(title, 15, y);

            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, "normal");

            const lines = doc.splitTextToSize(content || "", 180);

            doc.text(lines, 15, y);

            y += lines.length * 5 + 10;
        });

        doc.save(`${projectTitle || "proposal"}.pdf`);
    };

    return (
        <div className="w-full min-h-screen ">
            <div className="w-full">
                {/* Header */}


                {/* Main Form */}
                <div className="mt-5 bg-[#F8F8FC] border border-gray-200 rounded-[24px] p-5">
                    {/* Tabs */}
                    <div className="bg-[#ECECF6] rounded-xl p-1 flex items-center">
                        <button
                            onClick={() => setActiveTab("vision")}
                            className={`flex-1 font-medium rounded-lg py-1.5 text-[12px] transition-all ${activeTab === "vision"
                                ? "bg-white border border-[#C7D2FE] text-blue-600 shadow-sm"
                                : "text-gray-500"
                                }`}
                        >
                            Write your vision
                        </button>

                        {/* <button
                            onClick={() => setActiveTab("builder")}
                            className={`flex-1 font-medium rounded-lg py-1.5 text-[12px] transition-all ${activeTab === "builder"
                                ? "bg-white border border-[#C7D2FE] text-blue-600 shadow-sm"
                                : "text-gray-500"
                                }`}
                        >
                            Step-by-step builder
                        </button> */}
                    </div>

                    {activeTab === "vision" && (
                        <div>
                            {/* Textarea */}
                            <div className="mt-6">
                                <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-2 uppercase">
                                    Describe what you want to achieve
                                </label>

                                <textarea
                                    rows={4}
                                    value={formData.vision}
                                    onChange={handleVisionChange}
                                    placeholder="e.g. I want to support girls' education in rural Rajasthan..."
                                    className="w-full rounded-xl border border-gray-300 bg-[#F3F4FA] p-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />
                            </div>

                            {/* Gender Focus */}
                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                    Gender Focus
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Children",
                                        "Women",
                                        "Rural Women",
                                        "Pregnant Women",
                                        "Adolescents",
                                        "Senior Citizens",
                                        "Persons with Disability",
                                        "Farmers",
                                        "Youth",
                                        "Urban Poor",
                                        "Rural Poor",
                                        "SC/ST Communities"
                                    ].map((item) => (
                                        <Chip
                                            key={item}
                                            label={item}
                                            active={formData.gender === item}
                                            onClick={() => handleSelect("gender", item)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Geography */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Geography */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Geography
                                    </h3>

                                    <select
                                        value={formData.geography}
                                        onChange={(e) =>
                                            handleSelect("geography", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select State</option>

                                        {[
                                            "Andhra Pradesh",
                                            "Arunachal Pradesh",
                                            "Assam",
                                            "Bihar",
                                            "Chhattisgarh",
                                            "Goa",
                                            "Gujarat",
                                            "Haryana",
                                            "Himachal Pradesh",
                                            "Jharkhand",
                                            "Karnataka",
                                            "Kerala",
                                            "Madhya Pradesh",
                                            "Maharashtra",
                                            "Manipur",
                                            "Meghalaya",
                                            "Mizoram",
                                            "Nagaland",
                                            "Odisha",
                                            "Punjab",
                                            "Rajasthan",
                                            "Sikkim",
                                            "Tamil Nadu",
                                            "Telangana",
                                            "Tripura",
                                            "Uttar Pradesh",
                                            "Uttarakhand",
                                            "West Bengal",
                                        ].map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Budget */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Budget Range
                                    </h3>

                                    <select
                                        value={formData.budget}
                                        onChange={(e) =>
                                            handleSelect("budget", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Budget</option>

                                        {[
                                            "Below ₹10 Lakhs",
                                            "₹10 - ₹25 Lakhs",
                                            "₹25 - ₹50 Lakhs",
                                            "₹50 Lakhs - ₹1 Crore",
                                            "₹1 - ₹5 Crores",
                                            "Above ₹5 Crores",
                                        ].map((budget) => (
                                            <option key={budget} value={budget}>
                                                {budget}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            {/* Beneficiary */}
                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                    Beneficiary Type
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Out-of-school children",
                                        "Persons with disability",
                                        "Rural women",
                                        "Urban poor / migrants",
                                        "SC / ST communities",
                                        "Senior citizens",
                                    ].map((item) => (
                                        <Chip
                                            key={item}
                                            label={item}
                                            active={formData.beneficiary === item}
                                            onClick={() => handleSelect("beneficiary", item)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* focus area */}
                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                    Focus Area
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Healthcare Access",
                                        "Malnutrition",
                                        "Maternal Health",
                                        "Child Health",
                                        "Education Gap",
                                        "Skill Development",
                                        "Women Empowerment",
                                        "Disability Inclusion",
                                        "Water & Sanitation",
                                        "Livelihood Opportunities"
                                    ].map((item) => (
                                        <Chip
                                            key={item}
                                            label={item}
                                            active={formData.area === item}
                                            onClick={() => handleSelect("area", item)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Scale */}
                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                    Scale
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Pilot — 1 block",
                                        "District-level",
                                        "Multi-district",
                                        "State-level",
                                    ].map((item) => (
                                        <Chip
                                            key={item}
                                            label={item}
                                            active={formData.scale === item}
                                            onClick={() => handleSelect("scale", item)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Button */}
                            <div className="mt-8">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full bg-[#2952F3] hover:bg-[#1f45dd] text-white rounded-xl py-4 text-sm font-semibold"
                                >
                                    {loading
                                        ? "Generating..."
                                        : generatedProject
                                            ? "Regenerate Project"
                                            : "Generate Project with HELPSTiR AI"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {
                    generatedProject && (
                        <div className="bg-white border border-[#DCE3FF] rounded-[24px] p-8 mt-8">

                            <p className="text-[10px] font-semibold text-blue-600 uppercase mb-4">
                                HELPSTIR AI — PROJECT DESIGN COMPLETE
                            </p>

                            <h1 className="font-heading text-[17px] font-bold text-[#111827] mb-4">
                                {projectTitle}
                            </h1>

                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] ">
                                    {formData.gender}
                                </span>

                                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[11px]">
                                    {formData.area}
                                </span>

                                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px]">
                                    {formData.geography}
                                </span>

                                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[11px]">
                                    {formData.scale}
                                </span>
                            </div>

                            <div className="border-b mb-6">
                                <div className="flex gap-8">
                                    <button
                                        onClick={() => setgeneratedTab("proposal")}
                                        className={`text-[12px] pb-3 font-medium border-b-2 ${generatedTab === "proposal"
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-500"
                                            }`}
                                    >
                                        Proposal
                                    </button>

                                    <button
                                        onClick={() => setgeneratedTab("ngo")}
                                        className={`text-[12px] pb-3 font-medium border-b-2 ${generatedTab === "ngo"
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-500"
                                            }`}
                                    >
                                        NGO Matches
                                    </button>
                                </div>
                            </div>

                            {generatedTab === "proposal" ? (
                                <div className="space-y-8">

                                    {/* Executive Summary */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Executive Summary
                                        </h3>
                                        <p className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {executiveSummary}
                                        </p>
                                    </div>

                                    {/* Problem Statement */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Problem Statement
                                        </h3>
                                        <p className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {problemStatement}
                                        </p>
                                    </div>

                                    {/* Objectives */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Objectives
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {objectives}
                                        </div>
                                    </div>

                                    {/* Target Beneficiaries */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Target Beneficiaries
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {targetBeneficiaries}
                                        </div>
                                    </div>

                                    {/* Project Approach */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Project Approach
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {projectApproach}
                                        </div>
                                    </div>

                                    {/* Expected Outcomes */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Expected Outcomes
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {expectedOutcomes}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Implementation Timeline
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {implementationTimeline}
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Estimated Budget Summary
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {budgetSummary}
                                        </div>
                                    </div>

                                    {/* Conclusion */}
                                    <div>
                                        <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                            Conclusion
                                        </h3>
                                        <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                            {conclusion}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-[11px] font-semibold text-[#8A8AA8] mb-3">SELECT NGOS TO SEND RFP — MATCHED FROM HELPSTiR NETWORK</p>
                                    {ngoList?.length > 0 ? (
                                        ngoList.map((ngo, index) => {
                                            const initials = ngo.name
                                                ?.split(" ")
                                                .map(word => word[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase();

                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between py-3 border-b border-gray-200 mt-4"
                                                >
                                                    <div className="flex items-start gap-4 flex-1">

                                                        {/* NGO Logo */}
                                                        <div className="w-10 h-10 rounded-xl bg-[#E8E8F1] flex items-center justify-center text-[#4A4A6A] font-semibold">
                                                            {initials}
                                                        </div>

                                                        {/* NGO Details */}
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-[13px] text-[#111827]">
                                                                {ngo.name}
                                                            </h3>

                                                            <p className="text-[11px] text-[#7C7C98] mt-1">
                                                                {ngo.description}
                                                            </p>

                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {ngo.focus_areas?.map((area, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-2 py-1 bg-[#F3F4FA] rounded-md text-[12px] text-[#7C7C98]"
                                                                    >
                                                                        {area}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="flex items-center gap-4 ml-6">

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-[4px] rounded-full bg-gray-200 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${ngo.score >= 90
                                                                        ? "bg-green-500"
                                                                        : ngo.score >= 85
                                                                            ? "bg-blue-500"
                                                                            : "bg-orange-400"
                                                                        }`}
                                                                    style={{
                                                                        width: `${ngo.score}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <span
                                                                className={`font-semibold text-[12px] ${ngo.score >= 90
                                                                    ? "text-green-500"
                                                                    : ngo.score >= 85
                                                                        ? "text-blue-500"
                                                                        : "text-orange-400"
                                                                    }`}
                                                            >
                                                                {ngo.score}
                                                            </span>
                                                        </div>

                                                        <input
                                                            type="radio"
                                                            name="selectedNgo"
                                                            className="w-5 h-5"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            No NGO recommendations available.
                                        </div>
                                    )}

                                    {/* Info Box */}
                                    <div className="flex mt-10 bg-[#FFF6E8] border border-[#F4D29A] rounded-2xl p-3 gap-4">
                                        <div className="flex items-center justify-center">
                                            <p className="font-semibold text-[#92400E] text-[14px]">
                                                🔒
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#92400E] mb-1 text-[12px]">
                                                All communication stays within HELPSTiR
                                            </p>

                                            <p className="text-[12px] text-[#6B7280]">
                                                NGO contact details, phone numbers, and email addresses are not
                                                disclosed. All interactions happen through the platform.
                                                Funds are processed via HELPSTiR escrow only.
                                            </p>
                                        </div>

                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <button className="bg-[#2952F3] text-[13px] hover:bg-[#1F45DD] text-white py-2 rounded-xl font-semibold">
                                            Send RFP to selected NGOs
                                        </button>

                                        <button
                                            onClick={downloadProposalPDF}
                                            className="border text-[13px] border-gray-300 py-2 rounded-xl font-semibold text-gray-700"
                                        >
                                            Export as Proposal PDF
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )
                }
            </div>


        </div>
    );
}