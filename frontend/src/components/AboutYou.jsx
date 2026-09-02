import React, { useEffect, useState } from "react";
import { handleProfileData, saveProfileData } from "../services/api/user";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

export default function AboutYou({ nextPage }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { userId, profileStrength, checkAuth } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    designation: "",
    linkedin: "",
    years_in_csr: "",
    industry: "",
    company_size: "",
    headquarters: "",
  });

  const fetchProfileData = async () => {
    try {
      const response = await handleProfileData(userId);

      if (response.success && response.user) {
        setFormData({
          name: response.user.name || "",
          email: response.user.email || "",
          phone: response.user.phone_number || "",
          company_name: response.user.company_name || "",
          designation: response.user.designation || "",
          linkedin: response.user.linkedin || "",
          years_in_csr: response.user.years_in_csr || "",
          industry: response.user.industry || "",
          company_size: response.user.company_size || "",
          headquarters: response.user.headquarters || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfileData();
      checkAuth()
    }
  }, [userId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await saveProfileData(
        userId,
        formData
      );

      if (response.success) {
        await checkAuth();
        nextPage();
      } else {
        toast.error(
          response.message || "Failed to save profile"
        );
      }

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };
  //   if (loading) {
  //     return (
  //       <div className="min-h-screen flex items-center justify-center">
  //         Loading profile...
  //       </div>
  //     );
  //   }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-20">
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Sidebar */}
        <div className="w-[300px] space-y-5">
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
              NGOs see stronger profiles first.
            </p>
          </div>

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

            <div className="bg-indigo-50 rounded-xl p-3 flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
                1
              </div>

              <div>
                <h4 className="font-medium text-indigo-600 text-[12px]">
                  About you
                </h4>

                <p className="text-[10px] text-gray-500">
                  Role & background
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full border flex items-center justify-center text-sm">
                2
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

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full border flex items-center justify-center text-sm">
                3
              </div>

              <div>
                <h4 className="font-medium text-[12px]">
                  Your goals
                </h4>

                <p className="text-[10px] text-gray-500">
                  What you're looking for
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
            <h4 className="font-semibold text-indigo-700 text-[12px] uppercase">
              What NGOs See About You
            </h4>

            <ul className="mt-4 space-y-2 text-[12px] text-gray-700">
              <li>✓ Your name and organisation</li>
              <li>✓ Industry and company size</li>
              <li className="text-gray-400">
                + CSR budget range
              </li>
              <li className="text-gray-400">
                + Focus areas
              </li>
              <li className="text-gray-400">
                + CSR track record
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-3xl border p-10">
          <h1 className="text-[24px] font-bold text-slate-900">
            Tell us about yourself
          </h1>

          <p className="text-gray-500 mt-3 text-[13px]">
            This helps us personalise your experience
            and match you with the right NGO partners.
          </p>

          {/* Role Section */}
          <div className="mt-8">
            <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
              Your Role
            </h3>

            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="FULL NAME *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ravi Kumar"
              />

              <Select
                label="DESIGNATION *"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                options={[
                  "Head of CSR",
                  "CSR Manager",
                  "Sustainability Lead",
                  "Foundation Director",
                  "VP / SVP CSR",
                  "Other",
                ]}
              />

              <Input
                label="WORK EMAIL *"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
              />

              <Input
                label="MOBILE *"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />

              <Input
                label="LINKEDIN PROFILE"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="linkedin.com/in/username"
              />

              <Select
                label="YEARS IN CSR / PHILANTHROPY"
                name="years_in_csr"
                value={formData.years_in_csr}
                onChange={handleChange}
                options={[
                  "Less than 2 years",
                  "2-5 years",
                  "5-10 years",
                  "10-15 years",
                  "15+ years",
                ]}
              />
            </div>
          </div>

          {/* Organisation */}
          <div className="mt-10">
            <h3 className="font-semibold text-[15px] border-b pb-3 mb-6">
              Your Organisation
            </h3>

            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="COMPANY NAME *"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Infosys Foundation"
              />

              <Select
                label="INDUSTRY"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                options={[
                  "IT / ITES",
                  "BFSI",
                  "Healthcare",
                  "Manufacturing",
                  "Retail",
                  "Telecom",
                  "Energy",
                  "Education",
                  "Other",
                ]}
              />

              <Select
                label="COMPANY SIZE"
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                options={[
                  "1-50",
                  "50-500",
                  "500-5000",
                  "5000-25000",
                  "25000+",
                ]}
              />

              <Select
                label="HEADQUARTERED IN"
                name="headquarters"
                value={formData.headquarters}
                onChange={handleChange}
                options={[
                  "Bengaluru",
                  "Mumbai",
                  "Delhi NCR",
                  "Hyderabad",
                  "Chennai",
                  "Pune",
                  "Kolkata",
                  "Other",
                ]}
              />
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <div className="mt-12 flex justify-end">
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
    </div>
  );
}