import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRFPDetails } from "../services/api/rfp";
import { generateProposalPdf } from "../utils/generateProposalPdf";

const NA = "NA";

const getValue = (value, fallback = NA) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback;
  }

  return value;
};

const formatDate = (date) => {
  if (!date) return NA;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return NA;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return NA;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return NA;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  const cleanName = String(name || "").trim();

  if (!cleanName) {
    return "NA";
  }

  const words = cleanName.split(/\s+/);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase();
};

const getScoreClass = (score) => {
  const value = Number(score);

  if (Number.isNaN(value)) {
    return {
      wrapper: "border-[#DDE3EA] bg-[#F8FAFC]",
      number: "bg-[#94A3B8] text-white",
    };
  }

  if (value >= 80) {
    return {
      wrapper: "border-[#DCC8FF] bg-[#FAF5FF]",
      number: "bg-[#9747FF] text-white",
    };
  }

  if (value >= 70) {
    return {
      wrapper: "border-[#FFD9A8] bg-[#FFF9F0]",
      number: "bg-[#FF9800] text-white",
    };
  }

  return {
    wrapper: "border-[#C7D8FF] bg-[#F5F8FF]",
    number: "bg-[#2874FF] text-white",
  };
};

const getNgoStatus = (ngo) => {
  const rfpSent = ngo?.rfp_sent === true;

  const eoiReceived =
    ngo?.eoi_received === true ||
    ngo?.status === "eoi_received" ||
    ngo?.status === "eoi_received";

  if (!rfpSent) {
    return {
      type: "not-sent",
      label: "NA",
    };
  }

  if (eoiReceived) {
    return {
      type: "eoi",
      label: "EOI received",
    };
  }

  return {
    type: "opened",
    label: "Opened, no response",
  };
};


export default function RfpTrackerDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [ngoMatches, setNgoMatches] = useState([]);
  const [summary, setSummary] = useState({
    due_date: null,
    ngo_matched_count: 0,
    rfp_sent_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const fetchRfpDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRFPDetails(projectId);

      console.log("RFP Detail API Response:", response);

      const apiData =
        response?.data?.data ||
        response?.data ||
        response;

      console.log("Parsed RFP Detail Data:", apiData);

      if (
        !response?.success &&
        !response?.data?.success &&
        response?.status !== 200
      ) {
        throw new Error("Failed to fetch RFP details");
      }

      const projectRequest =
        apiData?.project_request || null;

      const matches = Array.isArray(apiData?.ngo_matches)
        ? apiData.ngo_matches
        : [];

      const apiSummary =
        apiData?.summary || {};

      if (!projectRequest) {
        throw new Error("Project request not found");
      }

      setProject(projectRequest);
      setNgoMatches(matches);

      setSummary({
        due_date:
          apiSummary?.due_date || null,

        ngo_matched_count:
          apiSummary?.ngo_matched_count ??
          matches.length,

        rfp_sent_count:
          apiSummary?.rfp_sent_count ??
          matches.filter(
            (ngo) => ngo?.rfp_sent === true
          ).length,
      });

      console.log("Project Request:", projectRequest);
      console.log("NGO Matches:", matches);
      console.log("Summary:", apiSummary);

    } catch (error) {
      console.error(
        "Error fetching RFP detail:",
        error
      );

      setError(
        error?.message ||
        "Unable to load RFP details"
      );

      setProject(null);
      setNgoMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRfpDetail();
    }
  }, [projectId]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-sm text-[#64748B]">
          Loading RFP details...
        </div>
      </div>
    );
  }


  if (!project) {
    return (
      <div className="min-h-screen p-6">

        <button
          onClick={() => navigate("/rfptracker")}
          className="rounded-xl border border-[#E2E6EC] bg-white px-4 py-2.5 text-sm font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
        >
          ← Back to RFP Tracker
        </button>

        <div className="mt-10 rounded-2xl border border-[#E2E6EC] bg-white p-10 text-center">

          <h2 className="text-lg font-semibold text-[#071D3A]">
            RFP not found
          </h2>

          <p className="mt-2 text-sm text-[#64748B]">
            {error || "The requested project could not be found."}
          </p>

        </div>
      </div>
    );
  }


  const sentCount = ngoMatches.filter(
    (ngo) => ngo?.rfp_sent === true
  ).length;

  const eoiCount = ngoMatches.filter(
    (ngo) =>
      ngo?.eoi_received === true ||
      ngo?.status === "eoi_received"
  ).length;

  const projectStatus =
    sentCount > 0
      ? "sent"
      : "draft";

  const statusLabel =
    projectStatus === "sent"
      ? "Responses received"
      : "Draft";

  const firstRfpSentNgo = ngoMatches.find(
    (ngo) => ngo?.rfp_sent === true
  );

  const rfpSentDate =
    firstRfpSentNgo?.rfp_sent_at ||
    firstRfpSentNgo?.sent_at ||
    null;


  return (
    <div className="min-h-screen py-8">

      <button
        onClick={() => navigate("/rfptracker")}
        className="inline-flex items-center rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-[11px] font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
      >
        ← Back to RFP Tracker
      </button>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <span className="inline-flex items-center gap-2 rounded-lg bg-[#FFF7EA] px-3 py-2 text-[12px] font-medium text-[#B56A00]">
              <span className="h-2 w-2 rounded-full bg-[#B56A00]" />
              {statusLabel}
            </span>

            {/* <span className="text-[13px] font-semibold tracking-wide text-[#94A3B8]">
              RFP-
              {String(
                project.id || projectId
              )
                .substring(0, 8)
                .toUpperCase()}
            </span> */}

          </div>

          <h1 className="mt-3 max-w-[900px] text-[25px] font-bold leading-tight text-[#071D3A] sm:text-[28px]">
            {getValue(project.vision)}
          </h1>

          <p className="mt-1 text-[12px] text-[#64748B]">
            Generated{" "}
            {formatDate(project.created_at)}
            {" · "}
            RFP sent{" "}
            {formatDate(rfpSentDate)}
            {" · "}
            proposals due{" "}
            <span className="text-[#FF2D2D]">
              {formatDate(summary.due_date)}
            </span>
          </p>

        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">

          <button
            className="flex items-center gap-3 rounded-[12px] bg-gradient-to-r from-[#3769F5] to-[#087CFA] px-4 py-3 text-left text-white shadow-[0_8px_25px_rgba(37,99,235,0.25)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-[12px]">
              📄
            </span>
            <span>
              <span className="block text-[14px] font-bold">
                View concept note
              </span>
              <span className=" block text-[11px] font-medium text-white/90">
                PDF · 6 pages
              </span>
            </span>

          </button>

          <button
            onClick={() => {

              generateProposalPdf(project);
            }}
            className="pr-2 text-[14px] font-semibold text-[#2952F3] hover:underline"
          >
            ↓ Download
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">

        <div className="overflow-hidden rounded-[22px] border border-[#E2E6EC] bg-white shadow-sm">
          <div className="px-6 pb-4 pt-7">
            <h2 className="text-[20px] font-bold text-[#071D3A]">
              Partners suggested
            </h2>
            <p className="mt-2 text-[14px] text-[#64748B]">
              <span className="font-medium">
                {getValue(
                  summary.ngo_matched_count,
                  ngoMatches.length
                )}
              </span>
              {" "}suggested by HELPSTiR AI
              {" · "}
              RFP sent to{" "}
              <span className="font-medium">
                {getValue(
                  summary.rfp_sent_count,
                  sentCount
                )}
              </span>
              {" · "}
              <span className="font-medium">
                {eoiCount}
              </span>
              {" "}expressions of interest received
              {" · "}
              click a name to open the full profile
            </p>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Organisation
                  </th>

                  <th className="w-[180px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    RFP Sent
                  </th>

                  <th className="w-[230px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Status
                  </th>

                  <th className="w-[150px] px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {ngoMatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-[#64748B]"
                    >
                      No partner organisations found.
                    </td>
                  </tr>
                ) : (
                  ngoMatches.map((ngo, index) => {
                    const status = getNgoStatus(ngo);

                    const ngoName =
                      ngo?.name ||
                      ngo?.organization_name ||
                      NA;

                    const ngoLocation =
                      ngo?.area ||
                      ngo?.location ||
                      ngo?.district ||
                      ngo?.state ||
                      NA;

                    return (
                      <tr
                        key={
                          ngo?.id ||
                          ngo?.org_id ||
                          `${projectId}-${index}`
                        }
                        className="border-b border-[#E9EDF2] last:border-b-0">

                        <td className="px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2874FF] text-[13px] font-bold text-white">
                              {getInitials(ngoName)}
                            </div>

                            <div className="min-w-0">
                              <button
                                onClick={() => {
                                  console.log(
                                    "Open NGO profile:",
                                    ngo?.org_id || NA
                                  );
                                }}
                                className="block max-w-full truncate text-left text-[15px] font-medium text-[#2952F3] hover:underline"
                              >
                                {ngoName}
                              </button>

                              <p className="mt-0.5 truncate text-[13px] text-[#64748B]">
                                {ngoLocation}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-[14px] text-[#071D3A]">
                          {ngo?.rfp_sent === true ? (
                            formatDate(
                              ngo?.rfp_sent_at ||
                              ngo?.sent_at ||
                              ngo?.created_at
                            )
                          ) : (
                            <span className="text-[#64748B]">
                              NA
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {ngo.interested === true && (
                            <span className="inline-flex items-center gap-2 rounded-lg bg-[#FFF7EA] px-3 py-2 text-[12px] font-medium text-[#B56A00]">
                              <span className="h-2 w-2 rounded-full bg-[#B56A00]" />
                              EOI received
                            </span>
                          )}

                          {ngo.interested === false && (
                            <span className="inline-flex items-center gap-2 rounded-lg bg-[#FEF2F2] px-3 py-2 text-[12px] font-medium text-[#DC2626]">
                              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                              Not Interested
                            </span>
                          )}

                          {ngo.interested === null && (
                            <span className="text-[14px] text-[#94A3B8]">
                              NA
                            </span>
                          )}

                        </td>

                        <td className="px-6 py-4 text-right">
                          {ngo?.interested === true ? (
                            <button
                              onClick={() =>
                                navigate(`/rfp/${projectId}/${ngo.id}`)
                              }
                              className="rounded-xl bg-gradient-to-r from-[#3769F5] to-[#087CFA] px-3.5 py-2 text-[11px] font-semibold text-white shadow-[0_5px_15px_rgba(37,99,235,0.2)] transition hover:shadow-[0_7px_20px_rgba(37,99,235,0.3)]"
                            >
                              View EOI
                            </button>
                          ) : ngo?.rfp_sent === true ? (
                            <span className="text-sm font-medium text-[#94A3B8]">
                              N/A
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                console.log(
                                  "Send RFP:",
                                  ngo?.org_id || "N/A"
                                );
                              }}
                              className="rounded-xl border border-[#DDE3EA] bg-white px-5 py-2.5 text-[14px] font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
                            >
                              Send RFP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        <div className="h-fit rounded-[22px] border border-[#E2E6EC] bg-white p-6 shadow-sm">

          <h3 className="text-[13px] font-bold uppercase tracking-wide text-[#94A3B8]">
            Project
          </h3>

          <div className="mt-5 space-y-2">

            <ProjectRow
              label="Date generated"
              value={formatDate(
                project.created_at
              )}
            />

            <ProjectRow
              label="RFP sent"
              value={formatDate(
                rfpSentDate
              )}
            />

            <ProjectRow
              label="Proposals due"
              value={formatDate(
                summary.due_date
              )}
              valueClass="text-[#FF2D2D]"
            />

            <ProjectRow
              label="Budget"
              value={project.budget}
            />

            <ProjectRow
              label="Duration"
              value={project.scale}
            />

            <ProjectRow
              label="Geography"
              value={project.geography}
            />

            <ProjectRow
              label="Focus area"
              value={project.area}
            />

            <ProjectRow
              label="HELPSTiRs"
              value={project.beneficiary}
            />

          </div>

          <div className="mt-5 rounded-[16px] bg-[#F0EEFF] px-4 py-4">

            <div className="flex gap-3">
              <span className="mt-0.5 text-[13px]">
                🕒
              </span>
              <p className="text-[13px] leading-4 text-[#2952F3]">
                NGOs get{" "}
                <span className="font-bold">
                  15 days
                </span>
                {" "}from the date the RFP is sent to submit
                their expression of interest.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}


function ProjectRow({
  label,
  value,
  valueClass = "",
}) {
  return (
    <div className="flex items-start justify-between gap-5">

      <span className="text-[12.5px] text-[#64748B]">{label}</span>

      <span className={`max-w-[180px] text-right text-[12px] font-semibold text-[#071D3A] ${valueClass}`}>
        {getValue(value)}
      </span>

    </div>
  );
}