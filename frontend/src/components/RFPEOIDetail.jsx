import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getEOIDetails, submitAccept, submitDecline } from "../services/api/rfp";

export default function RFPEOIDetail() {

  const { projectId, ngomatchId } = useParams();

  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

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

    } catch (error) {
      console.error("Accept EOI error:", error);
      setError(
        error.message || "Failed to accept EOI"
      );
    } finally {
      setAccepting(false);
    }
  };


  const handleDecline = async () => {
    try {
      setDeclining(true);
      setError("");

      const response = await submitDecline(ngomatchId);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to decline EOI"
        );
      }

    } catch (error) {
      console.error("Decline EOI error:", error);
      setError(
        error.message || "Failed to decline EOI"
      );
    } finally {
      setDeclining(false);
    }
  };


  useEffect(() => {
    if (!projectId || !ngomatchId) {
      setError("Project ID or NGO Match ID is missing");
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
        console.error("EOI detail error:", error);
        setError(error.message || "Failed to fetch EOI details");
      } finally {
        setLoading(false);
      }
    };

    fetchEOIDetail();
  }, [projectId, ngomatchId]);

  const getEstablishedYear = (value) => {
    if (!value) return "NA";

    // Already a year
    if (/^\d{4}$/.test(String(value))) {
      return value;
    }

    // Extract year from datetime/string
    const match = String(value).match(/\b(18|19|20)\d{2}\b/);

    return match ? match[0] : "NA";
  };

  // if (loading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <p className="text-sm text-[#60748e]">
  //         Loading EOI details...
  //       </p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }
  const { ngo } = data;
  const programmes = data.programs || [];
  const organization = data.organization || []


  return (
    <div className="min-h-screen py-6 text-[#071b36]">
      <div className="mx-auto">

        <button
          onClick={() => navigate(`/rfptracker/${projectId}`)}
          type="button"
          className="mt-2 mb-6 rounded-[10px] border border-[#E2E6EC] bg-white px-3 py-1.5 text-[12px] font-medium text-[#071D3A] transition hover:bg-[#F8FAFC]"
        >
          ← Back
        </button>

        {/* NGO Header */}
        <section className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="mt-2 flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[5px] bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-[16px] font-bold text-white">
            {ngo.name?.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] underline font-bold text-[#3867ee]">
                {ngo.name}
              </h1>
            </div>

            <p className="mt-1.5 text-[13px] text-[#60748e]">
              Registered Society · {organization?.city || "NA"},{" "}
              {organization?.state || "NA"} · Established{" "}
              {getEstablishedYear(organization?.established)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {ngo.badges?.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md bg-[#ecf9f2] px-3 py-1.5 text-[12px] font-bold text-[#009447]">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Programmes */}
        <section className="rounded-[10px] border border-[#dfe4e9] bg-white px-5 py-3 shadow-[0_2px_4px_rgba(15,23,42,0.05)]">
          <h2 className="mb-4 text-[16px] font-bold text-[#071b36]">
            Programmes submitted for this project
          </h2>

          <div className="space-y-3">
            {programmes?.map((programme) => (
              <div
                key={programme.id}
                className="flex gap-3 rounded-[10px] border border-[#dfe4e9] px-3 py-2 sm:px-5">
                <div className="mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[#f2f4f7]">
                  <FileText
                    size={12}
                    strokeWidth={1.7}
                    className="text-[#263c57]"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold leading-5 text-[#061a34]">
                    {programme.title}
                  </h3>

                  <p className=" text-[12px] leading-6 text-[#60748e]">
                    {programme.geography_served?.length > 0
                      ? programme.geography_served
                        .map((location) =>
                          [
                            location.district,
                            location.state,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        )
                        .join(" · ")
                      : "Location not specified"}{" "}
                    · ₹
                    {programme.annual_budget_inr?.toLocaleString("en-IN") || "NA"}{" "}
                    · {programme.is_open === true ? "Active" : "Closed"}
                  </p>

                  {programme.description && (
                    <p className="text-[12px] leading-6 text-[#60748e]">
                      {programme.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Note From NGO */}
        <section className="mt-5 rounded-[10px] border border-[#dfe4e9] bg-white px-5 py-3.5 shadow-[0_2px_4px_rgba(15,23,42,0.05)] ">
          <h2 className="text-[16px] font-bold text-[#071b36]">
            Note from the NGO
          </h2>

          {ngo && (
            <>
              <p className="max-w-[1080px] text-[14px] leading-5 text-[#143a66]">
                {ngo.eoi_note}
              </p>

            </>
          )}
        </section>

        {/* EOI Actions */}
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
                    onClick={handleDecline}
                    disabled={declining}
                    className="rounded-[8px] border border-[#ffb8b8] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#ef1111] transition hover:bg-[#fff6f6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {declining ? "Declining..." : "Decline"}
                  </button>

                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                    className="rounded-[8px] bg-[#16a653] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(22,166,83,0.25)] transition hover:bg-[#119149] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accepting ? "Accepting..." : "Accept EOI"}
                  </button>
                </>
              )}

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}