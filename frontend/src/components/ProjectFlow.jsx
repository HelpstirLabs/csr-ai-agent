import {
  Building2,
  Sparkles,
  ClipboardList,
  Inbox,
} from "lucide-react";

export default function ProjectFlow() {
  const steps = [
    {
      icon: "🏢",
      title: "NGO profiles",
      subtitle: "Credentials + programs",
    },
    {
      icon: "✦",
      title: "AI agent",
      subtitle: "Matches + designs",
    },
    {
      icon: "📋",
      title: "Project proposal",
      subtitle: "Full spec + M&E plan",
    },
    {
      icon: "📤",
      title: "RFP to NGOs",
      subtitle: "Via platform only",
    },
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">
      <div className="grid grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`relative flex flex-col items-center justify-center py-4 px-6 ${
              step.active ? "bg-[#F3F5FF]" : "bg-white"
            }`}>
            {/* Arrow */}
            {index !== steps.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-gray-400 text-2xl z-10">
                →
              </div>
            )}

            <div
              className={`mb-3 ${
                step.active
                  ? "text-blue-600"
                  : "text-gray-700"
              }`}
            >
              {step.icon}
            </div>

            <h3
              className={`font-semibold text-[12px] ${
                step.active
                  ? "text-blue-600"
                  : "text-gray-900"
              }`}
            >
              {step.title}
            </h3>

            <p className="text-[10px] text-gray-500 mt-1">
              {step.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}