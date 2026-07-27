import React from "react";
import { Info } from "lucide-react";

const rfps = [
  {
    id: 1,
    title: "Project Ujjwal — Education, Ajmer",
    meta: "Sent to 2 NGOs · 5 days ago · ₹40L · Education",
    status: "1 of 2 responded",
    statusColor: "bg-orange-100 text-orange-700",
    extra: "7 days remaining",
    extraColor: "bg-indigo-100 text-indigo-600",
    action: "View responses",
    actionStyle:
      "border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
  {
    id: 2,
    title: "Project Saksham — Women skilling, Pune",
    meta: "Sent to 3 NGOs · 12 days ago · ₹28L · Women empowerment",
    status: "3 of 3 responded",
    statusColor: "bg-emerald-100 text-emerald-700",
    action: "Select partner",
    actionStyle:
      "bg-blue-600 text-white hover:bg-blue-700",
  },
  {
    id: 3,
    title: "Project Drishti — Disability inclusion, Delhi",
    meta: "Sent to 1 NGO · 2 days ago · ₹18L · Disability",
    status: "Awaiting response",
    statusColor: "bg-slate-100 text-slate-600",
    action: "Follow up",
    actionStyle:
      "border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
];

export default function RfpTracker() {
  return (
    <div className="w-full min-h-screen">
      <div className="w-full">
        {/* RFP Card */}
        <div className="mt-5 overflow-hidden rounded-[24px] border border-gray-200 bg-white">
          <div className="p-5">
            <h2 className="font-heading mb-2 text-[13px] font-semibold text-slate-900">
              Open RFPs (3)
            </h2>

            <div className="divide-y divide-gray-200">
              {rfps.map((rfp) => (
                <div
                  key={rfp.id}
                  className="flex items-start justify-between py-5"
                >
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-900">
                      {rfp.title}
                    </h3>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {rfp.meta}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[12px] font-medium ${rfp.statusColor}`}
                      >
                        {rfp.status}
                      </span>

                      {rfp.extra && (
                        <span
                          className={`rounded-full px-3 py-1 text-[12px] font-medium ${rfp.extraColor}`}
                        >
                          {rfp.extra}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${rfp.actionStyle}`}
                  >
                    {rfp.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />

            <div>
              <h4 className="text-[14px] font-semibold text-blue-700">
                Platform fee notice
              </h4>

              <p className="mt-2 text-[13px] leading-6 text-slate-700">
                A facilitation fee of 3–10% applies to every project
                executed through HELPSTiR. This covers platform
                operations, monitoring & evaluation infrastructure,
                due diligence, compliance checks, and escrow
                processing. The fee is deducted before fund
                disbursement to the NGO partner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}