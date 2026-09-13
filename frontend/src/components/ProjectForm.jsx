import { useEffect, useRef, useState } from "react";
import { Play, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchNGOsData, handleProjectDesign, sendRFP } from "../services/api/project";
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
                }`}>
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
    const [selectedNgo, setSelectedNgo] = useState(null);
    const [isSendingRFP, setIsSendingRFP] = useState(false);

    const [projectId, setProjectId] = useState(null)
    const [showCommunityOptions, setShowCommunityOptions] = useState(false);
    const [communitySearch, setCommunitySearch] = useState("");
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    const communityDropdownRef = useRef(null);


    const [formData, setFormData] = useState({
        vision: "",
        geography: "",
        budget: "",
        duration: "",
        beneficiary: ["Out-of-school children"],
        area: "",
        scale: "",
        ageGroup: "",
        genderFocus: "",
        technologyApproach: "",
        timelineType: "estimated",
        start: "",
        startDate: "",
        endDate: "",
        section135: false,
    });

    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });


    const handleVisionChange = (e) => {
        setFormData({
            ...formData,
            vision: e.target.value,
        });
    };


    const handleSelect = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    // generate button
    const handleGenerate = async () => {
        const {
            vision,
            geography,
            budget,
            duration,
            beneficiary,
            area,
            scale,
            ageGroup,
            genderFocus,
            technologyApproach,
            timelineType,
            start,
            startDate,
            endDate,
            section135,
        } = formData;

        const missingFields = [];

        // Basic fields
        if (!vision?.trim()) {
            missingFields.push("Vision");
        }

        if (!geography) {
            missingFields.push("Geography");
        }

        if (!budget) {
            missingFields.push("Budget");
        }

        if (!duration) {
            missingFields.push("Duration");
        }

        if (!beneficiary?.length) {
            missingFields.push("Target Community");
        }

        if (!area) {
            missingFields.push("Focus Area");
        }

        if (!scale) {
            missingFields.push("Scale");
        }

        // Additional details
        if (!ageGroup) {
            missingFields.push("Age Group");
        }

        if (!genderFocus) {
            missingFields.push("Gender Focus");
        }

        if (!technologyApproach) {
            missingFields.push("Technology Approach");
        }

        // Timeline
        if (timelineType === "estimated" && !start) {
            missingFields.push("Expected Start Timeline");
        }

        if (timelineType === "exact") {
            if (!startDate) {
                missingFields.push("Start Date");
            }

            if (!endDate) {
                missingFields.push("End Date");
            }
        }

        // Print missing fields
        if (missingFields.length > 0) {
            missingFields.forEach((field, index) => {
                console.log(
                    `${index + 1}. ${field}`
                );
            });

            toast.error(`Please fill: ${missingFields.join(", ")}`);

            return;
        }

        try {
            setLoading(true);
            const response = await handleProjectDesign(formData);

            setGeneratedProject(response);
            setProjectId(response.project_id);
            setNGOList(response.ngo_details || []);

            toast.success("Project generated successfully");

        } catch (error) {
            toast.error(
                error?.response?.data?.detail ||
                "Failed to generate project"
            );

        } finally {
            setLoading(false);
        }
    };

    const extractSection = (
        text,
        startMarker,
        endMarker = null
    ) => {
        if (!text || typeof text !== "string") {
            return "";
        }

        const normalizedText = text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

        const startIndex = normalizedText
            .toLowerCase()
            .indexOf(
                startMarker.toLowerCase()
            );

        if (startIndex === -1) {
            console.warn(
                `Section not found: ${startMarker}`
            );

            return "";
        }

        const contentStart =
            startIndex + startMarker.length;

        let contentEnd =
            normalizedText.length;

        if (endMarker) {
            const endIndex = normalizedText
                .toLowerCase()
                .indexOf(
                    endMarker.toLowerCase(),
                    contentStart
                );

            if (endIndex !== -1) {
                contentEnd = endIndex;
            }
        }

        return normalizedText
            .substring(
                contentStart,
                contentEnd
            )
            .trim();
    };

    const proposalText = generatedProject?.proposal || "";
    const projectTitle = generatedProject?.project_title || "CSR Project Proposal";
    const executiveSummary = extractSection(proposalText, "EXECUTIVE SUMMARY", "PROBLEM STATEMENT");
    const problemStatement = extractSection(proposalText, "PROBLEM STATEMENT", "PROJECT OBJECTIVES");
    const objectives = extractSection(proposalText, "PROJECT OBJECTIVES", "TARGET BENEFICIARIES");
    const targetBeneficiaries = extractSection(proposalText, "TARGET BENEFICIARIES", "PROJECT APPROACH");
    const projectApproach = extractSection(proposalText, "PROJECT APPROACH", "EXPECTED OUTCOMES");
    const expectedOutcomes = extractSection(proposalText, "EXPECTED OUTCOMES", "IMPLEMENTATION TIMELINE");
    const implementationTimeline = extractSection(proposalText, "IMPLEMENTATION TIMELINE", "ESTIMATED BUDGET SUMMARY");
    const budgetSummary = extractSection(proposalText, "ESTIMATED BUDGET SUMMARY", "CONCLUSION");
    const conclusion = extractSection(proposalText, "CONCLUSION");

    const cleanPDFText = (text) => {
        if (!text) return "";

        let cleaned = String(text);

        // Convert non-breaking / special spaces to normal spaces
        cleaned = cleaned
            .replace(/\u00A0/g, " ")
            .replace(/\u2007/g, " ")
            .replace(/\u202F/g, " ")
            .replace(/\u2009/g, " ")
            .replace(/\u200A/g, " ");

        // Process each line separately
        cleaned = cleaned
            .split("\n")
            .map((line) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return "";
                }

                const words = trimmed.split(/\s+/);

                // Count single-character alphabetic tokens
                const singleLetterCount = words.filter(
                    (word) => /^[A-Za-z]$/.test(word)
                ).length;

                // If many tokens are single letters,
                // the text is character-spaced.
                if (
                    words.length >= 4 &&
                    singleLetterCount >= 3 &&
                    singleLetterCount / words.length >= 0.4
                ) {
                    let result = "";
                    let letterRun = [];

                    const flushLetters = () => {
                        if (letterRun.length > 0) {
                            result += letterRun.join("");
                            letterRun = [];
                        }
                    };

                    words.forEach((word) => {
                        if (/^[A-Za-z]$/.test(word)) {
                            letterRun.push(word);
                        } else {
                            flushLetters();

                            if (result && !result.endsWith(" ")) {
                                result += " ";
                            }

                            result += word;
                        }
                    });

                    flushLetters();

                    return result;
                }

                return trimmed;
            })
            .join("\n");

        // Normalize multiple spaces
        cleaned = cleaned.replace(/[ \t]+/g, " ");

        // Normalize excessive blank lines
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

        return cleaned.trim();
    };

    const downloadProposalPDF = () => {
        const doc = new jsPDF();

        let y = 20;

        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        const marginLeft = 15;
        const marginRight = 15;
        const contentWidth = pageWidth - marginLeft - marginRight;

        const addPageIfNeeded = (requiredHeight = 20) => {
            if (y + requiredHeight > pageHeight - 15) {
                doc.addPage();
                y = 20;
            }
        };

        // Project title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);

        const title = cleanPDFText(
            projectTitle || "CSR Project Proposal"
        );

        const titleLines = doc.splitTextToSize(
            title,
            contentWidth
        );

        doc.text(
            titleLines,
            marginLeft,
            y
        );

        y += titleLines.length * 8 + 10;

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

            const cleanedTitle = cleanPDFText(title);
            const cleanedContent = cleanPDFText(content);

            // Section heading
            addPageIfNeeded(25);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);

            doc.text(
                cleanedTitle,
                marginLeft,
                y
            );

            y += 8;

            // Section content
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const lines = doc.splitTextToSize(
                cleanedContent || "",
                contentWidth
            );

            lines.forEach((line) => {

                addPageIfNeeded(7);

                doc.text(
                    line,
                    marginLeft,
                    y
                );

                y += 5;
            });

            y += 8;
        });

        const filename = cleanPDFText(
            projectTitle || "proposal"
        )
            .replace(/[<>:"/\\|?*]+/g, "")
            .trim();

        doc.save(`${filename || "proposal"}.pdf`);
    };

    const handleSendRFP = async () => {
        if (!selectedNgo) {
            toast.error("Please select an NGO first.");
            return;
        }

        if (!selectedNgo.contact_email) {
            toast.error("Selected NGO does not have a contact email.");
            return;
        }

        setIsSendingRFP(true);

        try {
            const response = await sendRFP(projectId, selectedNgo.org_id);

            if (!response.success) {
                throw new Error(response.detail.message || "Failed to send RFP");
            }

            toast.success("RFP sent successfully to the NGO.");

        } catch (error) {
            console.error("Send RFP error:", error);
            toast.error(error.message || "Failed to send RFP.");

        } finally {
            setIsSendingRFP(false);
        }
    };

    const TC_DATA = [
        {
            g: "Children and youth",
            items: [
                "Out-of-school children",
                "First-generation learners",
                "Government school students",
                "Anganwadi children (0-6)",
                "Adolescent girls (10-19)",
                "Children in care institutions",
                "Children in child labour or rescued",
                "Youth not in education or work",
                "Children with special needs",
            ],
        },
        {
            g: "Women and girls",
            items: [
                "Rural women",
                "Urban poor women",
                "SHG or collective members",
                "Women farmers",
                "Women-headed households, widows, single women",
                "Survivors of violence",
                "Nano and micro women entrepreneurs",
                "Pregnant and lactating women",
                "Frontline workers (ASHA, Anganwadi, ANM)",
            ],
        },
        {
            g: "Livelihood and work",
            items: [
                "Small and marginal farmers",
                "Landless agricultural labourers",
                "Daily-wage and informal workers",
                "Inter-state migrant workers",
                "Street vendors",
                "Domestic workers",
                "Sanitation and waste workers",
                "Artisans, weavers and craftspersons",
                "Fisherfolk",
                "Gig and platform workers",
                "Micro-enterprise owners",
                "Construction workers",
            ],
        },
        {
            g: "Social identity groups",
            items: [
                "SC communities",
                "ST or Adivasi communities",
                "Particularly Vulnerable Tribal Groups (PVTG)",
                "De-notified and nomadic tribes",
                "Minority communities",
                "Transgender and gender-diverse persons",
                "Persons with disabilities",
                "Families in manual scavenging",
            ],
        },
        {
            g: "Health and care needs",
            items: [
                "Malnourished children (SAM or MAM)",
                "Households affected by TB",
                "Persons with chronic illness",
                "Persons with mental health needs",
                "Senior citizens",
                "Family caregivers",
                "Persons needing palliative care",
            ],
        },
        {
            g: "Place and vulnerability",
            items: [
                "Urban slum and basti residents",
                "Homeless and shelter residents",
                "Aspirational district communities",
                "Forest-dependent communities",
                "Remote hill, desert and island habitations",
                "Coastal and flood-prone communities",
                "Disaster-affected households",
                "Tea garden and plantation communities",
                "Border-area communities",
                "Drought-prone and water-stressed villages",
            ],
        },
        {
            g: "Service and special categories",
            items: [
                "Armed forces veterans and war widows",
                "Families of martyrs",
                "Trafficking survivors",
                "Released prisoners and their families",
                "Destitute and abandoned persons",
                "Grassroots and para-athletes",
                "Internally displaced households",
            ],
        },
    ];

    const TC_SUGGEST = {
        Education: [
            "Out-of-school children",
            "First-generation learners",
            "Adolescent girls (10-19)",
        ],

        Healthcare: [
            "Pregnant and lactating women",
            "Malnourished children (SAM or MAM)",
            "Senior citizens",
        ],

        Livelihood: [
            "Rural women",
            "Daily-wage and informal workers",
            "Small and marginal farmers",
        ],

        "Women Empowerment": [
            "Rural women",
            "SHG or collective members",
            "Survivors of violence",
        ],

        "Skill Development": [
            "Youth not in education or work",
            "Urban poor women",
            "Persons with disabilities",
        ],

        Nutrition: [
            "Malnourished children (SAM or MAM)",
            "Anganwadi children (0-6)",
            "Pregnant and lactating women",
        ],

        Environment: [
            "Forest-dependent communities",
            "Coastal and flood-prone communities",
            "Drought-prone and water-stressed villages",
        ],

        "Child Development": [
            "Out-of-school children",
            "Anganwadi children (0-6)",
            "Children with special needs",
        ],

        "Rural Development": [
            "Small and marginal farmers",
            "Landless agricultural labourers",
            "Drought-prone and water-stressed villages",
        ],

        Agriculture: [
            "Small and marginal farmers",
            "Women farmers",
            "Landless agricultural labourers",
        ],

        "Digital Literacy": [
            "First-generation learners",
            "Youth not in education or work",
            "Rural women",
        ],

        "Mental Health": [
            "Persons with mental health needs",
            "Adolescent girls (10-19)",
            "Senior citizens",
        ],

        Disability: [
            "Persons with disabilities",
            "Children with special needs",
            "Grassroots and para-athletes",
        ],

        "Elderly Care": [
            "Senior citizens",
            "Family caregivers",
            "Persons needing palliative care",
        ],

        "Legal Aid": [
            "Survivors of violence",
            "Trafficking survivors",
            "Released prisoners and their families",
        ],

        "Disaster Relief": [
            "Disaster-affected households",
            "Coastal and flood-prone communities",
            "Internally displaced households",
        ],

        Housing: [
            "Urban slum and basti residents",
            "Homeless and shelter residents",
            "Urban poor women",
        ],
    };

    const scaleOptions = [
        "Single habitation, basti or village",
        "Gram panchayat cluster",
        "Urban ward or ULB zone",
        "Block or taluka",
        "Single district",
        "Aspirational district cohort",
        "Multi-district (2 to 5)",
        "State-wide",
        "Multi-state or zonal",
        "Pan-India",
    ];

    const ageGroupOptions = [
        "0–5 years",
        "6–14 years",
        "15–18 years",
        "18–40 years",
        "Above 40 years",
        "Mixed/All age groups",
    ];

    const toggleBeneficiary = (item) => {
        setFormData((prev) => {
            const selected = prev.beneficiary || [];

            if (selected.includes(item)) {
                return {
                    ...prev,
                    beneficiary: selected.filter(
                        (value) => value !== item
                    ),
                };
            }

            return {
                ...prev,
                beneficiary: [...selected, item],
            };
        });

        setCommunitySearch("");
        setShowCommunityOptions(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                communityDropdownRef.current &&
                !communityDropdownRef.current.contains(event.target)
            ) {
                setShowCommunityOptions(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const getBriefStrength = () => {
        let completed = 0;

        if (formData.area) completed++;

        if (
            Array.isArray(formData.beneficiary) &&
            formData.beneficiary.length > 0
        ) { completed++ }

        // Additional details
        if (formData.scale) completed++;
        if (formData.ageGroup) completed++;
        if (formData.genderFocus) completed++;
        if (formData.technologyApproach) completed++;

        // Timeline
        if (formData.timelineType === "exact") {
            if (formData.startDate) completed++;
            if (formData.endDate) completed++;
        } else {
            if (formData.start) completed++;
        }

        if (formData.section135) completed++;

        if (completed <= 2) {
            return {
                label: "basic",
                bars: 1,
            };
        }

        if (completed <= 5) {
            return {
                label: "medium",
                bars: 2,
            };
        }

        return {
            label: "strong",
            bars: 4,
        };
    };

    const briefStrength = getBriefStrength();


    return (
        <div className="w-full min-h-screen ">
            <div className="w-full">

                <div className="mt-5 bg-[#F8F8FC] border border-gray-200 rounded-[24px] p-5">

                    <div className="bg-[#ECECF6] rounded-xl p-1 flex items-center">
                        <button
                            onClick={() => setActiveTab("vision")}
                            className={`flex-1 font-medium rounded-lg py-1.5 text-[12px] transition-all ${activeTab === "vision"
                                ? "bg-white border border-[#C7D2FE] text-blue-600 shadow-sm"
                                : "text-gray-500"
                                }`}>
                            Write your vision
                        </button>
                    </div>

                    {activeTab === "vision" && (
                        <div>
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


                            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Focus Area
                                    </h3>

                                    <select
                                        value={formData.area}
                                        onChange={(e) =>
                                            handleSelect("area", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select Category</option>

                                        {[
                                            "Education",
                                            "Healthcare",
                                            "Livelihood",
                                            "Environment",
                                            "Women Empowerment",
                                            "Child Development",
                                            "Rural Development",
                                            "WASH (Water, Sanitation)",
                                            "Agriculture",
                                            "Digital Literacy",
                                            "Mental Health",
                                            "Skill Development",
                                            "Disability",
                                            "Elderly Care",
                                            "Nutrition",
                                            "Legal Aid",
                                            "Disaster Relief",
                                            "Housing",
                                        ].map((area) => (
                                            <option key={area} value={area}>
                                                {area}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Where
                                    </h3>

                                    <select
                                        value={formData.geography}
                                        onChange={(e) =>
                                            handleSelect("geography", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Budget Range
                                    </h3>

                                    <select
                                        value={formData.budget}
                                        onChange={(e) =>
                                            handleSelect("budget", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                        Duration
                                    </h3>

                                    <select
                                        value={formData.duration}
                                        onChange={(e) =>
                                            handleSelect("duration", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select Duration</option>

                                        {[
                                            "3 months",
                                            "6 months",
                                            "9 months",
                                            "12 months",
                                            "18 months",
                                            "24 months",
                                            "30 months",
                                            "36 months",
                                            "beyond 36 months",
                                        ].map((duration) => (
                                            <option key={duration} value={duration}>
                                                {duration}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-700 mb-3">
                                    Target Community
                                </h3>

                                <div
                                    ref={communityDropdownRef}
                                    className="relative"
                                >
                                    <div className="min-h-[52px] w-full rounded-lg border border-[#E1E5EF] bg-[#F8F9FC] px-3 py-2 flex flex-wrap items-center gap-2">

                                        {formData.beneficiary?.length > 0 ? (
                                            <>
                                                {formData.beneficiary.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1.5 text-sm font-medium text-[#1557FF]"
                                                    >
                                                        {item}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleBeneficiary(item)
                                                            }
                                                            className="text-[#7B9AF7] hover:text-[#1557FF]"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}

                                                {/* Add another */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCommunityOptions(true);
                                                        setCommunitySearch("");
                                                    }}
                                                    className="text-sm text-gray-500 hover:text-[#1557FF]"
                                                >
                                                    Add another
                                                </button>
                                            </>
                                        ) : (

                                            <input
                                                type="text"
                                                value={communitySearch}
                                                onChange={(e) => {
                                                    setCommunitySearch(e.target.value);
                                                    setShowCommunityOptions(true);
                                                }}
                                                onFocus={() =>
                                                    setShowCommunityOptions(true)
                                                }
                                                placeholder="Type to search"
                                                className="flex-1 min-w-[150px] bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                            />
                                        )}
                                    </div>


                                    {showCommunityOptions && (
                                        <div className="absolute left-0 right-0 z-50 mt-2 rounded-lg border border-[#E1E5EF] bg-white shadow-lg">

                                            <div className="max-h-[400px] overflow-y-auto px-4 py-4">

                                                {TC_DATA.map((group) => {

                                                    const availableItems =
                                                        group.items.filter((item) => {
                                                            // Don't show already selected
                                                            if (
                                                                formData.beneficiary?.includes(
                                                                    item
                                                                )
                                                            ) {
                                                                return false;
                                                            }

                                                            // Search filtering
                                                            if (
                                                                communitySearch.trim() &&
                                                                !item
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        communitySearch
                                                                            .toLowerCase()
                                                                    )
                                                            ) {
                                                                return false;
                                                            }

                                                            return true;
                                                        });

                                                    // Hide group if no items match
                                                    if (
                                                        availableItems.length === 0
                                                    ) {
                                                        return null;
                                                    }

                                                    return (
                                                        <div
                                                            key={group.g}
                                                            className="mb-6 last:mb-0"
                                                        >
                                                            {/* GROUP */}
                                                            <h4 className="mb-2 text-[11px] font-semibold uppercase text-[#5B6685]">
                                                                {group.g}
                                                            </h4>

                                                            {/* ITEMS */}
                                                            <div className="space-y-0.5">
                                                                {availableItems.map(
                                                                    (item) => (
                                                                        <button
                                                                            key={item}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                toggleBeneficiary(
                                                                                    item
                                                                                )
                                                                            }
                                                                            className="block w-full rounded-md px-2 py-2 text-left text-[12px] text-gray-700 hover:bg-[#F5F7FF] hover:text-[#1557FF]"
                                                                        >
                                                                            {item}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* No results */}
                                                {TC_DATA.every((group) =>
                                                    group.items.every((item) => {
                                                        if (
                                                            formData.beneficiary?.includes(
                                                                item
                                                            )
                                                        ) {
                                                            return true;
                                                        }

                                                        if (
                                                            !communitySearch.trim()
                                                        ) {
                                                            return false;
                                                        }

                                                        return !item
                                                            .toLowerCase()
                                                            .includes(
                                                                communitySearch.toLowerCase()
                                                            );
                                                    })
                                                ) && (
                                                        <div className="py-6 text-center text-sm text-gray-400">
                                                            No communities found
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}


                                    {formData.area &&
                                        TC_SUGGEST[formData.area] && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">

                                                <span className="text-[12px] text-[#8A8FA8]">
                                                    Common for{" "}
                                                    {formData.area.toLowerCase()}:
                                                </span>

                                                {TC_SUGGEST[formData.area]
                                                    .filter(
                                                        (item) =>
                                                            !formData.beneficiary?.includes(
                                                                item
                                                            )
                                                    )
                                                    .map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleBeneficiary(item)
                                                            }
                                                            className="rounded-full border border-dashed border-[#D8DCE8] bg-white px-3 py-1.5 text-[12px] text-[#4F5570] hover:border-[#1557FF] hover:text-[#1557FF]">
                                                            + {item}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMoreDetails((prev) => !prev)
                                    }
                                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-4 text-left transition ${showMoreDetails
                                        ? "border-[#E1E5EF] bg-[#F8F9FC]"
                                        : "border-[#B7C7FF] bg-[#EEF3FF]"
                                        }`}>
                                    <div className="flex items-start gap-3">

                                        {/* Arrow */}
                                        <span className="mt-0.5 text-[#1557FF] text-[14px">
                                            {showMoreDetails ? "▼" : "▶"}
                                        </span>

                                        <div>
                                            <div className="text-[13px] font-medium text-[#111827]">
                                                {showMoreDetails
                                                    ? "Keep going, each answer narrows the shortlist"
                                                    : "Tell us four more things, get a sharper NGO shortlist"}
                                            </div>

                                            <div className="mt-1 text-[12px] text-[#7A86A8]">
                                                {showMoreDetails
                                                    ? "Leave anything blank and the AI fills it from what NGOs in this district already run."
                                                    : "Scale, age group, gender focus, timeline. Under a minute, and it goes straight into the RFP the NGOs answer."}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brief strength */}
                                    <div className="hidden sm:block min-w-[140px]">

                                        <div className="flex justify-end gap-1 mb-2">
                                            {[0, 1, 2, 3].map((bar) => (
                                                <span
                                                    key={bar}
                                                    className={`h-1 w-7 rounded-full ${bar < briefStrength.bars
                                                        ? "bg-[#1557FF]"
                                                        : "bg-[#E1E5EF]"
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <div className="text-right text-xs text-[#7A86A8]">
                                            Brief strength:{" "}
                                            <span className="font-semibold text-[#1557FF]">
                                                {briefStrength.label}
                                            </span>
                                        </div>

                                    </div>
                                </button>

                                {showMoreDetails && (
                                    <div className="mt-4 px-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                    Scale
                                                </h3>

                                                <select
                                                    value={formData.scale || ""}
                                                    onChange={(e) =>
                                                        handleSelect("scale", e.target.value)
                                                    }
                                                    className="w-full rounded-lg border border-gray-200 bg-[#F8F9FC] px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1557FF] focus:ring-2 focus:ring-[#1557FF]/20"
                                                >
                                                    <option value="">Select scale</option>

                                                    {scaleOptions.map((item) => (
                                                        <option key={item} value={item}>
                                                            {item}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>


                                            {/* AGE GROUP */}
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                    Age Group
                                                </h3>

                                                <select
                                                    value={formData.ageGroup || ""}
                                                    onChange={(e) =>
                                                        handleSelect(
                                                            "ageGroup",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-200 bg-[#F8F9FC] px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1557FF] focus:ring-2 focus:ring-[#1557FF]/20">
                                                    <option value="">
                                                        Select age group
                                                    </option>

                                                    {ageGroupOptions.map((item) => (
                                                        <option key={item} value={item}>
                                                            {item}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                        </div>

                                        <div className="mt-5">

                                            <h3 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                Gender Focus
                                            </h3>

                                            <div className="flex flex-wrap gap-2">

                                                {[
                                                    "Girls",
                                                    "Women",
                                                    "Boys",
                                                    "Men",
                                                    "Gender-neutral",
                                                    "Trans-inclusive",
                                                ].map((item) => (
                                                    <Chip
                                                        key={item}
                                                        label={item}
                                                        active={
                                                            formData.genderFocus === item
                                                        }
                                                        onClick={() =>
                                                            handleSelect(
                                                                "genderFocus",
                                                                item
                                                            )
                                                        }
                                                    />
                                                ))}

                                            </div>

                                        </div>

                                        <div className="mt-5">

                                            <h3 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                Technology Approach
                                            </h3>

                                            <div className="flex flex-wrap gap-2">

                                                {[
                                                    "Offline-first tech",
                                                    "No tech, community-led",
                                                    "Mobile-based",
                                                    "AI-powered tools",
                                                    "IoT or sensors",
                                                ].map((item) => (
                                                    <Chip
                                                        key={item}
                                                        label={item}
                                                        active={
                                                            formData.technologyApproach ===
                                                            item
                                                        }
                                                        onClick={() =>
                                                            handleSelect(
                                                                "technologyApproach",
                                                                item
                                                            )
                                                        }
                                                    />
                                                ))}

                                            </div>

                                        </div>

                                        <div className="mt-5">

                                            <h3 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                Timeline
                                            </h3>


                                            {/* Timeline type */}
                                            <div className="inline-flex rounded-lg bg-[#EEF0F8] p-1">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelect(
                                                            "timelineType",
                                                            "estimated"
                                                        )
                                                    }
                                                    className={`rounded-md px-4 py-2 text-sm ${formData.timelineType ===
                                                        "estimated"
                                                        ? "bg-white text-[#1557FF] shadow-sm"
                                                        : "text-[#7A86A8]"
                                                        }`}
                                                >
                                                    Estimated duration
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelect(
                                                            "timelineType",
                                                            "exact"
                                                        )
                                                    }
                                                    className={`rounded-md px-4 py-2 text-sm ${formData.timelineType ===
                                                        "exact"
                                                        ? "bg-white text-[#1557FF] shadow-sm"
                                                        : "text-[#7A86A8]"
                                                        }`}
                                                >
                                                    Exact dates
                                                </button>

                                            </div>


                                            {/* Estimated duration */}
                                            {formData.timelineType !== "exact" && (
                                                <div className="mt-4 max-w-[350px]">

                                                    <h4 className="text-xs font-semibold uppercase text-[#34466F] mb-2">
                                                        Start
                                                    </h4>

                                                    <select
                                                        value={formData.start || ""}
                                                        onChange={(e) =>
                                                            handleSelect(
                                                                "start",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-200 bg-[#F8F9FC] px-4 py-3 text-sm outline-none focus:border-[#1557FF]"
                                                    >
                                                        <option value="">
                                                            Select start
                                                        </option>

                                                        <option value="Start of next financial year">
                                                            Start of next financial year
                                                        </option>

                                                        <option value="Within 3 months">
                                                            Within 3 months
                                                        </option>

                                                        <option value="Within 6 months">
                                                            Within 6 months
                                                        </option>

                                                        <option value="Immediate">
                                                            Immediate
                                                        </option>
                                                    </select>

                                                </div>
                                            )}


                                            {/* Exact dates */}
                                            {formData.timelineType === "exact" && (
                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[700px]">

                                                    <div>
                                                        <label className="text-xs font-semibold uppercase text-[#34466F]">
                                                            Start Date
                                                        </label>

                                                        <input
                                                            type="date"
                                                            value={formData.startDate || ""}
                                                            onChange={(e) =>
                                                                handleSelect("startDate", e.target.value)
                                                            }
                                                            className="mt-2 w-full rounded-lg border border-gray-200 bg-[#F8F9FC] px-4 py-3 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-semibold uppercase text-[#34466F]">
                                                            End Date
                                                        </label>

                                                        <input
                                                            type="date"
                                                            value={formData.endDate || ""}
                                                            onChange={(e) =>
                                                                handleSelect("endDate", e.target.value)
                                                            }
                                                            className="mt-2 w-full rounded-lg border border-gray-200 bg-[#F8F9FC] px-4 py-3 text-sm"
                                                        />
                                                    </div>

                                                </div>
                                            )}

                                        </div>

                                        <div className="mt-5">

                                            <label className="flex items-start gap-3 cursor-pointer">

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        formData.section135 || false
                                                    }
                                                    onChange={(e) =>
                                                        handleSelect(
                                                            "section135",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 accent-[#1557FF]"
                                                />

                                                <div>
                                                    <div className="text-sm text-[#526084]">
                                                        Ongoing project under Section 135
                                                    </div>
                                                    <div className="mt-1 text-sm text-[#7A86A8]">
                                                        Multi-year. Unspent CSR for the year
                                                        moves to the Unspent CSR Account,
                                                        for up to three years excluding the
                                                        year of commencement.
                                                    </div>
                                                </div>
                                            </label>

                                        </div>

                                    </div>
                                )}

                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="flex-1 bg-[#2952F3] hover:bg-[#1f45dd] disabled:bg-gray-300 text-white rounded-xl py-4 text-sm font-semibold"
                                >
                                    {loading
                                        ? "Generating..."
                                        : generatedProject
                                            ? "Regenerate Project"
                                            : "Generate Project with HELPSTiR AI"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setGeneratedProject(null);
                                        setNGOList([]);
                                        setLoading(false);
                                        setSelectedNgo(null);
                                        setIsSendingRFP(false);
                                        setFormData({
                                            vision: "",
                                            gender: "",
                                            geography: "",
                                            budget: "",
                                            beneficiary: "",
                                            area: "",
                                            scale: "",
                                        });
                                    }}
                                    className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-4 text-sm font-semibold"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {generatedProject && (
                    <div className="bg-white border border-[#DCE3FF] rounded-[24px] p-8 mt-8">

                        <p className="text-[10px] font-semibold text-blue-600 uppercase mb-4">
                            HELPSTIR AI — PROJECT DESIGN COMPLETE
                        </p>

                        <h1 className="font-heading text-[17px] font-bold text-[#111827] mb-4">
                            {projectTitle}
                        </h1>

                        <div className="flex flex-wrap gap-2 mb-8">
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] ">
                                {formData.genderFocus}
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

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Executive Summary
                                    </h3>
                                    <p className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {executiveSummary}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Problem Statement
                                    </h3>
                                    <p className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {problemStatement}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Objectives
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {objectives}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Target Beneficiaries
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {targetBeneficiaries}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Project Approach
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {projectApproach}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Expected Outcomes
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {expectedOutcomes}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Implementation Timeline
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {implementationTimeline}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-semibold uppercase text-gray-500 mb-3">
                                        Estimated Budget Summary
                                    </h3>
                                    <div className="text-gray-700 leading-8 whitespace-pre-wrap text-[13px]">
                                        {budgetSummary}
                                    </div>
                                </div>

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


                                                    <div className="w-10 h-10 rounded-xl bg-[#E8E8F1] flex items-center justify-center text-[#4A4A6A] font-semibold">
                                                        {initials}
                                                    </div>


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
                                                        value={ngo.org_id}
                                                        checked={selectedNgo?.org_id === ngo.org_id}
                                                        onChange={() => setSelectedNgo(ngo)}
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


                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <button
                                        onClick={handleSendRFP}
                                        disabled={!selectedNgo || isSendingRFP}
                                        className="bg-[#2952F3] text-[13px] hover:bg-[#1F45DD] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-xl font-semibold"
                                    >
                                        {isSendingRFP ? "Sending RFP..." : "Send RFP to selected NGOs"}
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
                )}
            </div>


        </div>
    );
}