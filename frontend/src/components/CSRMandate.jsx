import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCSRMandate, saveCSRMandate } from "../services/api/csrmandate";
import { toast } from "react-toastify";

export default function CSRMandate({
    previousPage,
    nextPage,
}) {
    const { userId, profileStrength, checkAuth } = useAuth();


    const [formData, setFormData] = useState({
        annual_budget: "",
        deployment_timeline: "",
        csr_decision_making: "",
        focus_areas: [],
        geographic_preferences: [],
    });
    const [saving, setSaving] = useState(false);

    const budgetOptions = [
        {
            title: "₹50L - 1 Cr",
            subtitle: "Small CSR",
        },
        {
            title: "₹1 - 5 Cr",
            subtitle: "Mid CSR",
        },
        {
            title: "₹5 - 25 Cr",
            subtitle: "Large CSR",
        },
        {
            title: "₹25 - 100 Cr",
            subtitle: "Enterprise CSR",
        },
        {
            title: "₹100 Cr+",
            subtitle: "Mega CSR",
        },
        {
            title: "Not sure",
            subtitle: "Need help",
        },
    ];

    const focusAreas = [
        "Education",
        "Women empowerment",
        "Healthcare",
        "Disability inclusion",
        "Livelihood & skilling",
        "Environment",
        "Rural development",
        "Child safety",
        "Sports & arts",
    ];

    const geoOptions = [
        "Karnataka",
        "Tamil Nadu",
        "Maharashtra",
        "Telangana",
        "Delhi NCR",
        "Aspirational districts",
        "Pan-India",
    ];

    const toggleFocusArea = (area) => {
        if (formData.focus_areas.includes(area)) {
            setFormData({
                ...formData,
                focus_areas: formData.focus_areas.filter(
                    (item) => item !== area
                ),
            });
        } else {
            setFormData({
                ...formData,
                focus_areas: [...formData.focus_areas, area],
            });
        }
    };

    const toggleLocation = (location) => {
        if (
            formData.geographic_preferences.includes(
                location
            )
        ) {
            setFormData({
                ...formData,
                geographic_preferences:
                    formData.geographic_preferences.filter(
                        (item) => item !== location
                    ),
            });
        } else {
            setFormData({
                ...formData,
                geographic_preferences: [
                    ...formData.geographic_preferences,
                    location,
                ],
            });
        }
    };

    const fetchCSRMandate = async () => {
        try {

            const response =
                await getCSRMandate(userId);

            if (response.success && response.data) {
                setFormData({
                    annual_budget:
                        response.data.annual_budget ||
                        "",

                    deployment_timeline:
                        response.data.deployment_timeline ||
                        "",

                    csr_decision_making:
                        response.data.csr_decision_making ||
                        "",

                    focus_areas:
                        response.data.focus_areas || [],

                    geographic_preferences:
                        response.data.geographic_preferences ||
                        [],
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchCSRMandate();
            checkAuth()
        }
    }, [userId]);

    const handleSave = async () => {
        if (!formData.annual_budget) {
            return toast.error("Please select annual budget");
        }

        if (!formData.deployment_timeline) {
            return toast.error("Please select deployment timeline");
        }

        if (!formData.csr_decision_making) {
            return toast.error("Please select approval process");
        }

        if (formData.focus_areas.length === 0) {
            return toast.error(
                "Please select at least one focus area"
            );
        }

        if (formData.geographic_preferences.length === 0) {
            return toast.error(
                "Please select at least one geographic preference"
            );
        }

        try {
            setSaving(true);

            const response = await saveCSRMandate(
                userId,
                formData
            );

            if (response.success) {
                await checkAuth();
                nextPage();
            } else {
                toast.error(
                    response.message ||
                    "Failed to save CSR mandate"
                );
            }

        } catch (error) {
            console.error("Error saving CSR mandate:", error);

            toast.error(
                error.message ||
                "Something went wrong while saving"
            );

        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 px-6 py-20">
            <div className="max-w-7xl mx-auto flex gap-8">
                {/* Sidebar */}
                <div className="w-[300px] space-y-5">
                    {/* Profile Strength */}
                    <div className="bg-white rounded-2xl border p-6">
                        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                            Profile Strength
                        </p>

                        <h2 className="text-[32px] font-bold text-blue-600 mt-4">
                            {profileStrength}<span className="text-2xl">%</span>
                        </h2>

                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-5">
                            <div
                                className="h-1.5 bg-gradient-to-r from-blue-600 to-green-400 rounded-full transition-all duration-500"
                                style={{ width: `${profileStrength}%` }}
                            />
                        </div>

                        <p className="text-[11px] text-gray-600 mt-4 leading-relaxed">
                            Strong profile. NGOs prioritise
                            outreach to funders who share their
                            CSR mandate.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="bg-white rounded-2xl border p-5">
                        <StepCompleted
                            title="Account created"
                            subtitle="Email & mobile verified"
                        />

                        <div className="h-5" />

                        <StepCompleted
                            title="About you"
                            subtitle="Role & background"
                        />

                        <div className="h-5" />

                        <StepActive
                            number="2"
                            title="About your CSR"
                            subtitle="Budget & focus areas"
                        />

                        <div className="h-5" />

                        <StepPending
                            number="3"
                            title="Your goals"
                            subtitle="What you're looking for"
                        />
                    </div>

                    {/* NGO View */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
                        <h4 className="font-semibold text-indigo-700 text-[12px] uppercase">
                            What NGOs See About You
                        </h4>

                        <ul className="mt-4 space-y-2 text-[12px] text-gray-700">
                            <li>✓ Your name and organisation</li>
                            <li>✓ CSR budget range</li>
                            <li>✓ Schedule VII focus areas</li>
                            <li>✓ Geographic preference</li>
                            <li className="text-gray-400">
                                + CSR track record
                            </li>
                        </ul>
                    </div>

                    <button className="w-full bg-white border rounded-xl py-3 text-[13px] font-medium hover:bg-gray-50 transition">
                        Skip and explore the platform →
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-3xl border p-10">
                    <h1 className="font-heading text-[24px] font-bold text-slate-900">
                        Your CSR Mandate
                    </h1>

                    <p className="text-gray-500 mt-3 text-[13px]">
                        This helps us understand your CSR
                        priorities and connect you with the
                        most relevant NGO partners.
                    </p>

                    {/* Budget & Timing */}
                    {/* Budget & Timing */}
                    <div className="mt-8">
                        <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
                            Budget & Timing
                        </h3>

                        <p className="text-[12px] uppercase font-semibold tracking-wide text-gray-500 mb-4">
                            Annual CSR Budget
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            {budgetOptions.map((item) => (
                                <button
                                    type="button"
                                    key={item.title}
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            annual_budget: item.title,
                                        })
                                    }
                                    className={`border rounded-xl p-4 text-left transition-all duration-200 ${formData.annual_budget === item.title
                                        ? "border-blue-600 bg-blue-50"
                                        : "hover:border-blue-300"
                                        }`}
                                >
                                    <h4 className="font-semibold text-[15px]">
                                        {item.title}
                                    </h4>

                                    <p className="text-[12px] text-gray-500 mt-1">
                                        {item.subtitle}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-5 mt-8">
                            <div>
                                <label className="block text-[12px] uppercase font-semibold tracking-wide text-gray-500 mb-2">
                                    Deployment Timeline
                                </label>

                                <select
                                    value={formData.deployment_timeline}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            deployment_timeline: e.target.value,
                                        })
                                    }
                                    className="w-full h-12 border rounded-xl px-4 text-[14px] outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select Deployment Timeline
                                    </option>

                                    <option value="Q1 FY26 (Apr-Jun)">
                                        Q1 FY26 (Apr-Jun)
                                    </option>

                                    <option value="Q2 FY26 (Jul-Sep)">
                                        Q2 FY26 (Jul-Sep)
                                    </option>

                                    <option value="Q3 FY26 (Oct-Dec)">
                                        Q3 FY26 (Oct-Dec)
                                    </option>

                                    <option value="Q4 FY26 (Jan-Mar)">
                                        Q4 FY26 (Jan-Mar)
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] uppercase font-semibold tracking-wide text-gray-500 mb-2">
                                    CSR Decision-Making
                                </label>

                                <select
                                    value={formData.csr_decision_making}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            csr_decision_making: e.target.value,
                                        })
                                    }
                                    className="w-full h-12 border rounded-xl px-4 text-[14px] outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select Approval Process
                                    </option>

                                    <option value="CSR committee approval">
                                        CSR committee approval
                                    </option>

                                    <option value="Board approval">
                                        Board approval
                                    </option>

                                    <option value="Foundation approval">
                                        Foundation approval
                                    </option>

                                    <option value="CSR Head approval">
                                        CSR Head approval
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Focus Areas */}
                    <div className="mt-10">
                        <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
                            Focus Areas (Schedule VII)
                        </h3>

                        <p className="text-[12px] uppercase font-semibold tracking-wide text-gray-500 mb-4">
                            Select all thematic areas you fund
                        </p>

                        <div className="flex flex-wrap gap-3">
                            {focusAreas.map((area) => (
                                <Chip
                                    key={area}
                                    label={area}
                                    active={formData.focus_areas.includes(
                                        area
                                    )}
                                    onClick={() =>
                                        toggleFocusArea(area)
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    {/* Geography */}
                    <div className="mt-10">
                        <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
                            Geographic Preference
                        </h3>

                        <div className="flex flex-wrap gap-3">
                            {geoOptions.map((item) => (
                                <Chip
                                    key={item}
                                    label={item}
                                    active={formData.geographic_preferences.includes(
                                        item
                                    )}
                                    onClick={() =>
                                        toggleLocation(item)
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t mt-12 pt-8 flex justify-between">
                        <button
                            onClick={previousPage}
                            className="px-6 py-3 border rounded-xl text-[14px] font-medium hover:bg-gray-50 transition"
                        >
                            ← Back
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-medium hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600"
                        >
                            {saving ? "Saving..." : "Save & Continue →"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Chip({
    label,
    active,
    onClick,
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full border text-[13px] font-medium transition-all ${active
                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                : "border-gray-300 text-gray-700 hover:border-indigo-300"
                }`}
        >
            {label}
        </button>
    );
}

function StepCompleted({
    title,
    subtitle,
}) {
    return (
        <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
                ✓
            </div>

            <div>
                <h4 className="font-medium text-[12px]">
                    {title}
                </h4>

                <p className="text-[10px] text-gray-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function StepActive({
    number,
    title,
    subtitle,
}) {
    return (
        <div className="bg-indigo-50 rounded-xl p-3 flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
                {number}
            </div>

            <div>
                <h4 className="font-medium text-indigo-600 text-[12px]">
                    {title}
                </h4>

                <p className="text-[10px] text-gray-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function StepPending({
    number,
    title,
    subtitle,
}) {
    return (
        <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full border flex items-center justify-center text-sm">
                {number}
            </div>

            <div>
                <h4 className="font-medium text-[12px]">
                    {title}
                </h4>

                <p className="text-[10px] text-gray-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}