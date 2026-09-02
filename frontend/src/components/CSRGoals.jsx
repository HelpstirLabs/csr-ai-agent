import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchCSRGoalsData, saveProfileGoal } from "../services/api/csrmandate";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"

export default function CSRGoals(
  { previousPage }
) {

  const { profileStrength, userId, checkAuth } = useAuth();
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false);

  const goals = [
    "Verified NGO partners",
    "AI-designed projects",
    "Impact reports for board",
    "M&E tracking & disbursement",
    "Schedule VII compliance support",
    "Co-funding with peer CSRs",
    "End-to-end project execution",
  ];
  const [formData, setFormData] = useState({
    goals: [],
    past_csr_partner: "",
    deployment_urgency: "",
    decision_structure: "",
    approval_timeline: "",
    annual_commitments: "",
  });

  const toggleGoal = (goal) => {
    let updatedGoals;

    if (formData.goals.includes(goal)) {
      updatedGoals = formData.goals.filter((g) => g !== goal);
    } else {
      updatedGoals = [...formData.goals, goal];
    }

    setFormData((prev) => ({
      ...prev,
      goals: updatedGoals,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const response = await saveProfileGoal(
        userId,
        formData
      );

      if (response.success) {
        toast.success("Profile updated successfully", {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        });

        await checkAuth();

        navigate("/design");
      } else {
        toast.error(
          response.message ||
          "Failed to save profile"
        );
      }

    } catch (error) {
      console.error("Error saving profile:", error);

      toast.error(
        error.message ||
        "Failed to save profile"
      );

    } finally {
      setSaving(false);
    }
  };

  const fetchCSRGoals = async () => {
    try {
      const response = await fetchCSRGoalsData(userId);

      const csrData = response?.data?.data;

      if (response.success && csrData) {
        setFormData({
          past_csr_partner: csrData.past_csr_partner || "",

          deployment_urgency: csrData.deployment_urgency || "",

          decision_structure: csrData.decision_structure || "",

          goals: csrData.goals || [],

          approval_timeline: csrData.approval_timeline || "",

          annual_commitments: csrData.annual_commitments || ""
        });
      }
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    if (userId) {
      fetchCSRGoals();
      checkAuth()
    }
  }, [userId]);

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
              Excellent. You'll appear in priority NGO matches for your focus
              areas and geography.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
                ✓
              </div>

              <div>
                <h4 className="font-medium text-[12px]">
                  Account created
                </h4>

                <p className="text-[10px] text-gray-500">
                  Email & mobile verified
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
                ✓
              </div>

              <div>
                <h4 className="font-medium text-[12px]">
                  About you
                </h4>

                <p className="text-[10px] text-gray-500">
                  Role & background
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
                ✓
              </div>

              <div>
                <h4 className="font-medium text-[12px]">
                  About your CSR
                </h4>

                <p className="text-[10px] text-gray-500">
                  Budget & focus areas
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
                3
              </div>

              <div>
                <h4 className="font-medium text-indigo-600 text-[12px]">
                  Your goals
                </h4>

                <p className="text-[10px] text-gray-500">
                  Final step
                </p>
              </div>
            </div>
          </div>

          {/* Completion Benefits */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
            <h4 className="font-semibold text-indigo-700 text-[12px] uppercase">
              What completion unlocks
            </h4>

            <ul className="mt-4 space-y-2 text-[12px] text-gray-700">
              <li>✓ Priority NGO match ranking</li>
              <li>✓ Personalised project recommendations</li>
              <li>✓ Direct sales support for your CSR cycle</li>
              <li>✓ Featured in NGO partner directory</li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-3xl border p-10">
          <h1 className="text-[24px] font-bold text-slate-900">
            Your Goals
          </h1>

          <p className="text-gray-500 mt-3 text-[13px]">
            Help us understand what you need from HELPSTiR. These signals
            shape every recommendation we make.
          </p>

          {/* Section 1 */}
          <div className="mt-8">
            <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
              What are you looking for on HELPSTiR?
            </h3>

            <p className="text-gray-500 text-[12px] mb-5">
              Multi-select — choose all that apply
            </p>

            <div className="flex flex-wrap gap-3">
              <div className="flex flex-wrap gap-3">
                {goals.map((goal) => (
                  <button
                    type="button"
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-full border text-[12px] font-medium transition
      ${formData.goals.includes(goal)
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-300 text-gray-600 bg-white"
                      }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t my-10" />

          {/* Section 2 */}
          <div>
            <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
              Past CSR Partners (Optional)
            </h3>

            <p className="text-gray-500 text-[12px] mb-5">
              Helps us avoid duplicate recommendations and surface
              complementary NGOs.
            </p>

            <input
              type="text"
              name="past_csr_partner"
              value={formData.past_csr_partner}
              onChange={handleChange}
              placeholder="Pratham, Magic Bus, Akshaya Patra"
              className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t my-10" />

          {/* Section 3 */}
          <div>
            <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
              Deployment Urgency & Decision Style
            </h3>

            <p className="text-gray-500 text-[12px] mb-6">
              Determines our engagement model and recommendation strategy.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-2">
                  Deployment Urgency
                </label>

                <select
                  name="deployment_urgency"
                  value={formData.deployment_urgency}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select</option>
                  <option>This FY (3–6 months)</option>
                  <option>Immediately</option>
                  <option>Next FY</option>
                  <option>Exploring options</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-2">
                  Decision-Making Structure
                </label>

                <select
                  name="decision_structure"
                  value={formData.decision_structure}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select</option>
                  <option>CSR Committee Approval</option>
                  <option>Management Approval</option>
                  <option>Board Approval</option>
                  <option>Independent Decision</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-2">
                  Typical Approval Timeline
                </label>

                <select
                  name="approval_timeline"
                  value={formData.approval_timeline}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select</option>
                  <option>Within a month</option>
                  <option>1–3 months</option>
                  <option>3–6 months</option>
                  <option>More than 6 months</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-2">
                  Annual Project Commitments
                </label>

                <select
                  name="annual_commitments"
                  value={formData.annual_commitments}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select</option>
                  <option>3–6 projects</option>
                  <option>1–3 projects</option>
                  <option>6–10 projects</option>
                  <option>10+ projects</option>
                </select>
              </div>
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
              {saving ? "Saving..." : "Complete Profile →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}