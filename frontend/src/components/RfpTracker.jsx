import React, { useEffect, useState } from "react";
import { getRFPs } from "../services/api/rfp";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  responses_received: {
    wrapper: "bg-[#FFF7EA] text-[#B56A00]",
    dot: "bg-[#B56A00]",
    label: "Responses received",
  },

  partner_accepted: {
    wrapper: "bg-[#EAF9F0] text-[#159447]",
    dot: "bg-[#159447]",
    label: "Partner accepted",
  },

  not_yet_sent: {
    wrapper: "bg-[#F1F3F6] text-[#667085]",
    dot: "bg-[#667085]",
    label: "Not yet sent",
  },

  closed: {
    wrapper: "bg-[#EAF1FF] text-[#2952F3]",
    dot: "bg-[#2952F3]",
    label: "Closed",
  },

  draft: {
    wrapper: "bg-[#F1F3F6] text-[#667085]",
    dot: "bg-[#667085]",
    label: "Draft",
  },
};

export default function RfpTracker() {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchRFPs = async () => {
    try {
      setLoading(true);

      const response = await getRFPs();

      if (!response?.success) {
        throw new Error("Failed to fetch RFPs");
      }

      if (!Array.isArray(response?.data)) {
        console.error(
          "Expected response.data to be an array:",
          response?.data
        );

        throw new Error("Invalid RFP data format");
      }

      const formattedRfps = response.data.map((item) => ({
        id: item.id,

        title: item.project_vision || "Untitled Project",

        meta: [item.geography, item.budget]
          .filter(Boolean)
          .join(" • "),

        dateGenerated: item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-IN")
          : "-",

        partnersSuggested: item.ngo_matched_count ?? 0,

        rfpsSent: item.rfp_sent_count ?? 0,

        proposalsDue: item.due_date
          ? new Date(item.due_date).toLocaleDateString("en-IN")
          : "-",

        eoisReceived: item.eois_received_count ?? 0,

        status: item.status || "draft",
      }));

      setRfps(formattedRfps);
    } catch (error) {
      console.error("Error fetching RFPs:", error);
      setRfps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFPs();
  }, []);

  const openRFP = (id) => {
    navigate(`/rfptracker/${id}`);
  };

  return (
    <div className="w-full min-h-screen">
      <div className="w-full">

        {/* =========================
            DESKTOP TABLE
        ========================== */}
        <div className="hidden md:block mt-7 overflow-hidden rounded-[22px] border border-[#E2E6EC] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="w-[32%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Project
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Date Generated
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Partners Suggested
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    RFPs Sent
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Proposals Due
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    EOIs Received
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-[#64748B]"
                    >
                      Loading RFPs...
                    </td>
                  </tr>
                ) : rfps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-[#64748B]"
                    >
                      No RFPs found.
                    </td>
                  </tr>
                ) : (
                  rfps.map((rfp) => {
                    const status =
                      statusStyles[rfp.status] || statusStyles.draft;

                    return (
                      <tr
                        key={rfp.id}
                        onClick={() => openRFP(rfp.id)}
                        className="border-b border-[#E9EDF2] last:border-b-0 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                      >
                        {/* Project */}
                        <td className="px-4 py-5 align-middle">
                          <div className="max-w-[430px]">
                            <h3 className="text-[13.5px] font-semibold leading-5 text-[#071D3A]">
                              {rfp.title}
                            </h3>

                            <p className="mt-1 text-[12px] text-[#64748B]">
                              {rfp.meta || "-"}
                            </p>
                          </div>
                        </td>

                        {/* Date Generated */}
                        <td className="px-4 py-5 text-[13.5px] text-[#071D3A]">
                          {rfp.dateGenerated}
                        </td>

                        {/* Partners Suggested */}
                        <td className="px-4 py-5 text-[13.5px] text-[#071D3A]">
                          {rfp.partnersSuggested}
                        </td>

                        {/* RFPs Sent */}
                        <td className="px-4 py-5 text-[13.5px] text-[#071D3A]">
                          {rfp.rfpsSent}
                        </td>

                        {/* Proposals Due */}
                        <td className="px-4 py-5 text-[13.5px] text-[#071D3A]">
                          {rfp.proposalsDue}
                        </td>

                        {/* EOIs Received */}
                        <td className="px-4 py-5 text-[13.5px] font-medium text-[#2952F3]">
                          {rfp.eoisReceived}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] px-3 py-2 text-[11px] font-medium ${status.wrapper}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${status.dot}`}
                            />

                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================
            MOBILE CARDS
        ========================== */}
        <div className="md:hidden mt-5 space-y-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#E2E6EC] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
              Loading RFPs...
            </div>
          ) : rfps.length === 0 ? (
            <div className="rounded-[18px] border border-[#E2E6EC] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
              No RFPs found.
            </div>
          ) : (
            rfps.map((rfp) => {
              const status =
                statusStyles[rfp.status] || statusStyles.draft;

              return (
                <div
                  key={rfp.id}
                  onClick={() => openRFP(rfp.id)}
                  className="
                    w-full
                    rounded-[18px]
                    border
                    border-[#E2E6EC]
                    bg-white
                    p-4
                    shadow-sm
                    cursor-pointer
                    active:scale-[0.99]
                    hover:border-[#D4DAE3]
                    transition-all
                  "
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold leading-5 text-[#071D3A] break-words">
                        {rfp.title}
                      </h3>

                      {rfp.meta && (
                        <p className="mt-1 text-[12px] leading-5 text-[#64748B]">
                          {rfp.meta}
                        </p>
                      )}
                    </div>

                    {/* STATUS */}
                    <span
                      className={`
                        inline-flex
                        shrink-0
                        items-center
                        gap-1.5
                        rounded-[8px]
                        px-2.5
                        py-1.5
                        text-[10px]
                        font-medium
                        ${status.wrapper}
                      `}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                      />

                      {status.label}
                    </span>
                  </div>

                  {/* DIVIDER */}
                  <div className="my-4 border-t border-[#EEF1F4]" />

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <MobileDetail
                      label="Date Generated"
                      value={rfp.dateGenerated}
                    />

                    <MobileDetail
                      label="Proposals Due"
                      value={rfp.proposalsDue}
                    />

                    <MobileDetail
                      label="Partners Suggested"
                      value={rfp.partnersSuggested}
                    />

                    <MobileDetail
                      label="RFPs Sent"
                      value={rfp.rfpsSent}
                    />

                    <MobileDetail
                      label="EOIs Received"
                      value={rfp.eoisReceived}
                      valueClass="text-[#2952F3] font-semibold"
                    />
                  </div>

                  {/* VIEW */}
                  <div className="mt-4 pt-3 border-t border-[#EEF1F4]">
                    <p className="text-[12px] font-medium text-[#2952F3]">
                      View RFP details →
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MobileDetail({
  label,
  value,
  valueClass = "text-[#071D3A]",
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
        {label}
      </p>

      <p
        className={`mt-1 text-[13px] leading-5 ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

