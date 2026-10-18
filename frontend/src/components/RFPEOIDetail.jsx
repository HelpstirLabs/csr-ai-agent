import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    FileText,
    ExternalLink,
    CheckCircle2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEOIDetails,
    submitAccept,
    submitDecline,
    getEOIInfo
} from "../services/api/rfp";

export default function RFPEOIDetail() {
    const { projectId, ngomatchId } = useParams();

    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [selectedNgo, setSelectedNgo] = useState(null);
    const [ngoDetailLoading, setNgoDetailLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (!selectedNgo) return;

        const originalOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, [selectedNgo]);

    const closeNgoDrawer = () => {
        if (isClosing) return;

        setIsClosing(true);

        setTimeout(() => {
            setSelectedNgo(null);
            setIsClosing(false);
        }, 300);
    };

    // =========================================================
    // ACCEPT EOI
    // =========================================================

    const handleAccept = async () => {
        try {
            setAccepting(true);
            setError("");

            const response = await submitAccept(ngomatchId);

            if (!response?.success) {
                throw new Error(
                    response?.detail ||
                    response?.message ||
                    "Failed to accept EOI"
                );
            }

            // Refresh the details after accepting
            const updatedData = await getEOIDetails(
                projectId,
                ngomatchId
            );

            setData(updatedData.data);

        } catch (error) {
            console.error("Accept EOI error:", error);

            setError(
                error.message ||
                "Failed to accept EOI"
            );
        } finally {
            setAccepting(false);
        }
    };

    // =========================================================
    // DECLINE EOI
    // =========================================================

    const handleDecline = async () => {
        try {
            setDeclining(true);
            setError("");

            const response = await submitDecline(
                ngomatchId
            );

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                    "Failed to decline EOI"
                );
            }

            // Refresh the details after declining
            const updatedData = await getEOIDetails(
                projectId,
                ngomatchId
            );

            setData(updatedData.data);

        } catch (error) {
            console.error(
                "Decline EOI error:",
                error
            );

            setError(
                error.message ||
                "Failed to decline EOI"
            );
        } finally {
            setDeclining(false);
        }
    };

    // =========================================================
    // FETCH EOI DETAILS
    // =========================================================

    useEffect(() => {
        if (!projectId || !ngomatchId) {
            setError(
                "Project ID or NGO Match ID is missing"
            );

            setLoading(false);

            return;
        }

        const fetchEOIDetail = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await getEOIDetails(
                    projectId,
                    ngomatchId
                );

                setData(result.data);

            } catch (error) {
                console.error(
                    "EOI detail error:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to fetch EOI details"
                );

            } finally {
                setLoading(false);
            }
        };

        fetchEOIDetail();
    }, [projectId, ngomatchId]);

    // =========================================================
    // ESTABLISHED YEAR
    // =========================================================

    const getEstablishedYear = (value) => {
        if (!value) return "NA";

        // Already a year
        if (/^\d{4}$/.test(String(value))) {
            return value;
        }

        // Extract year from datetime/string
        const match = String(value).match(
            /\b(18|19|20)\d{2}\b/
        );

        return match ? match[0] : "NA";
    };

    // =========================================================
    // NGO Detals
    // =========================================================

    const handleNgoClick = async (ngoSummary = ngo) => {
        // Show the drawer immediately with the information already on the page.
        setSelectedNgo(ngoSummary);
        setNgoDetailLoading(true);

        try {
            const matchId =
                ngoSummary?.match_id ||
                ngoSummary?.ngo_match_id ||
                ngoSummary?.id ||
                ngomatchId;

            const response = await getEOIInfo(projectId, matchId);

            // Supports both Axios-style responses and helpers that already
            // return the parsed response body.
            const payload =
                response?.data?.data ??
                response?.data ??
                response;

            if (payload?.ngo) {
                // Response from the EOI details endpoint:
                // { ngo: {...}, organization: {...}, programs: [...] }
                const organization = payload.organization || {};
                setSelectedNgo({
                    ...ngoSummary,
                    ...organization,
                    ...payload.ngo,
                    organization,
                    programs: payload.programs || [],
                    name:
                        payload.ngo?.name ||
                        organization.name ||
                        ngoSummary?.name,
                    email:
                        payload.ngo?.contact_email ||
                        payload.ngo?.email ||
                        organization.email ||
                        ngoSummary?.email,
                    phone:
                        payload.ngo?.contact_phone ||
                        payload.ngo?.phone ||
                        organization.phone ||
                        ngoSummary?.phone,
                    whatsapp:
                        payload.ngo?.contact_whatsapp ||
                        payload.ngo?.whatsapp ||
                        organization.whatsapp ||
                        ngoSummary?.whatsapp,
                    website:
                        payload.ngo?.website ||
                        organization.website ||
                        ngoSummary?.website,
                    description:
                        payload.ngo?.description ||
                        organization.description ||
                        ngoSummary?.description,
                    area:
                        payload.ngo?.area ||
                        organization.area ||
                        ngoSummary?.area,
                });
            } else if (payload && (payload.id || payload.name)) {
                // Response from /ngo/info/{project_id}/{ngo_match_id}:
                // { success, status_code, data: { id, name, description, ... } }
                setSelectedNgo({
                    ...ngoSummary,
                    ...payload,
                });
            } else {
                throw new Error(
                    payload?.detail ||
                    payload?.message ||
                    "NGO details were not found in the API response."
                );
            }
        } catch (error) {
            console.error("Failed to fetch NGO details:", error);
            // Keep the summary in the drawer if the detail request fails.
        } finally {
            setNgoDetailLoading(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">

                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#3867EE]" />

                    <p className="text-sm font-medium text-[#60748e]">
                        Loading EOI details...
                    </p>

                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">

                    <p className="text-sm text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/rfptracker/${projectId}`
                            )
                        }
                        className="mt-4 rounded-lg border border-[#E2E6EC] bg-white px-4 py-2 text-sm font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
                    >
                        ← Back
                    </button>

                </div>
            </div>
        );
    }

    // =========================================================
    // NO DATA
    // =========================================================

    if (!data) {
        return null;
    }

    const { ngo } = data;

    const programmes =
        data.programs || [];

    const organization =
        data.organization || [];

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen py-6 text-[#071b36]">

            <div className="mx-auto">

                {/* Back Button */}

                <button
                    onClick={() =>
                        navigate(
                            `/rfptracker/${projectId}`
                        )
                    }
                    type="button"
                    className="mt-2 mb-6 rounded-[10px] border border-[#E2E6EC] bg-white px-3 py-1.5 text-[12px] font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
                >
                    ← Back
                </button>


                {/* =====================================================
                    NGO HEADER
                ====================================================== */}

                <section className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start">

                    <div className="mt-2 flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-[16px] font-bold text-white">

                        {/* {ngo.logo ? (

                            <img
                                src={`http://127.0.0.1:8000${ngo.logo}`}
                                alt={
                                    ngo.name ||
                                    "NGO Logo"
                                }
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display =
                                        "none";
                                }}
                            />

                        ) : ( */}

                            <span className="text-[#4A4A6A] font-semibold text-lg">
                                {ngo.name
                                    ?.slice(
                                        0,
                                        2
                                    )
                                    .toUpperCase()}
                            </span>

                         {/* )}  */}

                    </div>


                    <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                            <button
                                type="button"
                                onClick={() => handleNgoClick(ngo)}
                                className="text-[24px] underline font-bold text-[#3867ee]"
                            >
                                {ngo.name}
                            </button>

                        </div>


                        <p className="mt-1.5 text-[13px] text-[#60748e]">

                            Registered Society ·{" "}
                            {organization?.city ||
                                "NA"}
                            ,{" "}
                            {organization?.state ||
                                "NA"}{" "}
                            · Established{" "}
                            {getEstablishedYear(
                                organization?.established
                            )}

                        </p>


                        <div className="mt-3 flex flex-wrap gap-2">

                            {ngo.badges?.map(
                                (badge) => (
                                    <span
                                        key={
                                            badge
                                        }
                                        className="rounded-md bg-[#ecf9f2] px-3 py-1.5 text-[12px] font-bold text-[#009447]"
                                    >
                                        {
                                            badge
                                        }
                                    </span>
                                )
                            )}

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    PROGRAMMES
                ====================================================== */}

                <section className="rounded-[10px] border border-[#dfe4e9] bg-white px-5 py-3 shadow-[0_2px_4px_rgba(15,23,42,0.05)]">

                    <h2 className="mb-4 text-[16px] font-bold text-[#071b36]">
                        Programmes submitted for this project
                    </h2>


                    <div className="space-y-3">

                        {programmes?.map(
                            (programme) => (

                                <div
                                    key={
                                        programme.id
                                    }
                                    className="flex gap-3 rounded-[10px] border border-[#dfe4e9] px-3 py-2 sm:px-5"
                                >

                                    <div className="mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[#f2f4f7]">

                                        <FileText
                                            size={
                                                12
                                            }
                                            strokeWidth={
                                                1.7
                                            }
                                            className="text-[#263c57]"
                                        />

                                    </div>


                                    <div className="min-w-0">

                                        <h3 className="text-[14px] font-semibold leading-5 text-[#061a34]">
                                            {
                                                programme.title
                                            }
                                        </h3>


                                        <p className="text-[12px] leading-6 text-[#60748e]">

                                            {programme.geography_served?.length >
                                                0
                                                ? programme.geography_served
                                                    .map(
                                                        (
                                                            location
                                                        ) =>
                                                            [
                                                                location.district,
                                                                location.state,
                                                            ]
                                                                .filter(
                                                                    Boolean
                                                                )
                                                                .join(
                                                                    ", "
                                                                )
                                                    )
                                                    .join(
                                                        " · "
                                                    )
                                                : "Location not specified"}{" "}
                                            · ₹
                                            {programme.annual_budget_inr?.toLocaleString(
                                                "en-IN"
                                            ) ||
                                                "NA"}{" "}
                                            ·{" "}
                                            {programme.is_open ===
                                                true
                                                ? "Active"
                                                : "Closed"}

                                        </p>


                                        {programme.description && (
                                            <p className="text-[12px] leading-6 text-[#60748e]">
                                                {
                                                    programme.description
                                                }
                                            </p>
                                        )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </section>


                {/* =====================================================
                    NOTE FROM NGO
                ====================================================== */}

                <section className="mt-5 rounded-[10px] border border-[#dfe4e9] bg-white px-5 py-3.5 shadow-[0_2px_4px_rgba(15,23,42,0.05)]">

                    <h2 className="text-[16px] font-bold text-[#071b36]">
                        Note from the NGO
                    </h2>


                    {ngo && (
                        <p className="max-w-[1080px] text-[14px] leading-5 text-[#143a66]">
                            {ngo.eoi_note}
                        </p>
                    )}

                </section>


                {/* =====================================================
                    EOI ACTIONS
                ====================================================== */}

                <section className="mt-7 rounded-[10px] border border-[#dfe4e9] bg-white p-5 shadow-[0_2px_4px_rgba(15,23,42,0.05)] sm:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <p className="max-w-[780px] text-[14px] leading-6 text-[#60748e]">
                            Accepting shares your organisation and contact details with
                            SumArth Foundation. Declining notifies them that you are not
                            proceeding.
                        </p>


                        <div className="flex shrink-0 items-center gap-3">

                            {ngo.accepted ? (

                                <span className="rounded-[8px] bg-[#ecfdf3] px-5 py-2.5 text-[13px] font-semibold text-[#16a653]">
                                    Accepted
                                </span>

                            ) : ngo.declined ? (

                                <span className="rounded-[8px] bg-[#fff1f1] px-5 py-2.5 text-[13px] font-semibold text-[#ef1111]">
                                    Declined
                                </span>

                            ) : (

                                <>

                                    <button
                                        type="button"
                                        onClick={
                                            handleDecline
                                        }
                                        disabled={
                                            declining
                                        }
                                        className="rounded-[8px] border border-[#ffb8b8] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#ef1111] transition hover:bg-[#fff6f6] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {declining
                                            ? "Declining..."
                                            : "Decline"}
                                    </button>


                                    <button
                                        type="button"
                                        onClick={
                                            handleAccept
                                        }
                                        disabled={
                                            accepting
                                        }
                                        className="rounded-[8px] bg-[#16a653] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(22,166,83,0.25)] transition hover:bg-[#119149] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {accepting
                                            ? "Accepting..."
                                            : "Accept EOI"}
                                    </button>

                                </>

                            )}

                        </div>

                    </div>

                </section>

            </div>

            {selectedNgo && (
                <div
                    className={`fixed inset-0 z-50 ${isClosing ? "pointer-events-none" : ""
                        }`}
                    onClick={closeNgoDrawer}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/40 ${isClosing
                            ? "animate-[fadeOut_300ms_ease-in_forwards]"
                            : "animate-[fadeIn_300ms_ease-out]"
                            }`}
                    />

                    {/* Right-side drawer */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-0 h-full w-full max-w-[650px] overflow-y-auto bg-[#F8FAFC] p-6 shadow-2xl sm:p-8 ${isClosing
                            ? "animate-[slideOutRight_300ms_ease-in_forwards]"
                            : "animate-[slideInRight_300ms_ease-out]"
                            }`}
                    >
                        {/* Header */}
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm text-[#64748B]">
                                    Organization Details
                                </p>

                                <h2 className="mt-1 break-words text-2xl font-semibold text-[#0F172A]">
                                    {selectedNgo.name ||
                                        selectedNgo.organization_name ||
                                        selectedNgo.org_name ||
                                        "NA"}
                                </h2>

                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#64748B]">
                                    {selectedNgo.area ||
                                        selectedNgo.location ||
                                        selectedNgo.district ||
                                        selectedNgo.state ||
                                        "NA"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeNgoDrawer}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl text-[#64748B] transition hover:bg-[#E8EDF4] hover:text-[#0F172A]"
                                aria-label="Close NGO details"
                            >
                                &times;
                            </button>
                        </div>

                        {ngoDetailLoading && (
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#DBEAFE] bg-white px-4 py-3 text-sm text-[#3867EE]">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#DBEAFE] border-t-[#3867EE]" />
                                Loading the latest NGO details...
                            </div>
                        )}

                        {/* Contact and organization details */}
                        <div className="grid grid-cols-1 gap-x-8 gap-y-6 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:grid-cols-2">
                            {[
                                [
                                    "Contact Person",
                                    selectedNgo.contact_person ||
                                    selectedNgo.contact_name,
                                ],
                                [
                                    "Category",
                                    selectedNgo.category ||
                                    selectedNgo.thematic_area,
                                ],
                                [
                                    "Phone",
                                    selectedNgo.phone ||
                                    selectedNgo.phone_number,
                                ],
                                [
                                    "WhatsApp",
                                    selectedNgo.whatsapp ||
                                    selectedNgo.whatsapp_number,
                                ],
                                ["Email", selectedNgo.email],
                                ["Website", selectedNgo.website],
                                [
                                    "Established",
                                    selectedNgo.established_year ||
                                    selectedNgo.established,
                                ],
                            ].map(([label, value]) => (
                                <div key={label} className="min-w-0">
                                    <p className="text-sm text-[#64748B]">
                                        {label}
                                    </p>

                                    {label === "Email" && value ? (
                                        <a
                                            href={`mailto:${value}`}
                                            className="mt-1 block break-all text-[15px] text-[#2952F3] hover:underline"
                                        >
                                            {value}
                                        </a>
                                    ) : label === "Website" && value ? (
                                        <a
                                            href={
                                                /^https?:\/\//i.test(value)
                                                    ? value
                                                    : `https://${value}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 block break-all text-[15px] text-[#2952F3] hover:underline"
                                        >
                                            {value}
                                        </a>
                                    ) : (
                                        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-[#0F172A]">
                                            {value || "NA"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mission and description */}
                        <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-white p-6">
                            <h3 className="mb-3 text-sm font-medium text-[#64748B]">
                                Mission & Description
                            </h3>

                            <p className="whitespace-pre-wrap break-words leading-7 text-[#0F172A]">
                                {selectedNgo.description ||
                                    "No description available."}
                            </p>

                            {/* Specific area of work */}
                            <h3 className="mb-3 mt-6 text-sm font-medium text-[#64748B]">
                                Specific Area of Work
                            </h3>

                            <p className="whitespace-pre-wrap break-words leading-7 text-[#0F172A]">
                                {selectedNgo.area ||
                                    "NA"}
                            </p>

                            {/* Focus areas */}
                            {/* <h3 className="mb-3 mt-6 text-sm font-medium text-[#64748B]">
                                Focus Areas
                            </h3>

                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const focusAreas =
                                        selectedNgo.focus_areas ||
                                        selectedNgo.focusAreas ||
                                        selectedNgo.thematic_areas ||
                                        [];

                                    const areas = Array.isArray(focusAreas)
                                        ? focusAreas
                                        : typeof focusAreas === "string"
                                            ? focusAreas
                                                .split(",")
                                                .map((area) => area.trim())
                                                .filter(Boolean)
                                            : [];

                                    return areas.length > 0 ? (
                                        areas.map((area, index) => {
                                            const name =
                                                typeof area === "string"
                                                    ? area
                                                    : area?.name || area?.label || "Other";

                                            return (
                                                <span
                                                    key={`${name}-${index}`}
                                                    className="rounded-full bg-[#00A847] px-4 py-1.5 text-sm font-medium text-white"
                                                >
                                                    #{name.replace(/^#/, "")}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-[#94A3B8]">
                                            NA
                                        </span>
                                    );
                                })()}
                            </div> */}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end pb-2">
                            <button
                                type="button"
                                onClick={closeNgoDrawer}
                                className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
