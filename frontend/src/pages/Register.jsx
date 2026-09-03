import { useState } from "react";
import { HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { userOTPResend, userOTPVerification, userRegister } from "../services/api/user";
import { toast } from "react-toastify";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "../utils/validation";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);


  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "phone") {
      // Allow only digits
      value = value.replace(/\D/g, "");

      // Remove leading zeros
      value = value.replace(/^0+/, "");

      // Limit to 10 digits
      value = value.slice(0, 10);
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegister = async () => {
    try {
      // Name Validation
      if (!formData.name.trim()) {
        toast.error("Full name is required");
        return;
      }

      // Email Validation
      if (!validateEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Phone Validation
      if (!validatePhone(formData.phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }

      // Company Name Validation
      if (!formData.company_name.trim()) {
        toast.error("Company name is required");
        return;
      }

      // Start loading only after validation
      setIsRegistering(true);

      const result = await userRegister(formData);

      if (
        result.status === 200 ||
        result.status === 201 ||
        result.success === true
      ) {
        toast.success("OTP sent successfully", {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        });

        setUserId(result.user_id);
        setShowOtpScreen(true);

        return;
      }

      if (result.status === 400) {
        toast.error("Account already exists.", {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        });

        return;
      }

      toast.error("Registration failed. Please try again.", {
        position: "top-right",
        autoClose: 2500,
        pauseOnHover: false,
      });

    } catch (error) {
      console.error("Registration Error:", error);

      toast.error(
        "An unexpected error occurred. Please try again.",
        {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        }
      );

    } finally {
      setIsRegistering(false);
    }
  };


  const handleVerifyOtp = async () => {
    try {
      if (!otp.trim()) {
        toast.error("Please enter OTP");
        return;
      }

      setIsVerifyingOtp(true);

      const result = await userOTPVerification(
        userId,
        otp
      );

      if (
        result.status === 200 ||
        result.success === true
      ) {
        toast.success("OTP verified successfully", {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        });

        navigate("/");
        return;
      }

      toast.error(
        result.message || "Invalid OTP. Please try again.",
        {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        }
      );

    } catch (error) {
      console.error("OTP Verification Error:", error);

      toast.error(
        error.message || "OTP verification failed.",
        {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        }
      );

    } finally {
      setIsVerifyingOtp(false);
    }
  };


  const handleResendOtp = async () => {
    if (!userId) {
      toast.error("User information is missing.");
      return;
    }

    try {
      setIsResendingOtp(true);
      const result = await userOTPResend(userId);

      if (result.status === 200 || result.success === true) {
        toast.success("OTP resent successfully", {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        });

        return;
      }

      throw new Error(
        result.message || "Failed to resend OTP"
      );

    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      toast.error(
        error.message || "Failed to resend OTP",
        {
          position: "top-right",
          autoClose: 2500,
          pauseOnHover: false,
        }
      );

    } finally {
      setIsResendingOtp(false);
    }
  };
  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2453FF] via-[#1636B7] to-[#081B72] text-white relative overflow-hidden">        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-xm"></div>
        <div className="absolute -bottom-24 left-40 w-72 h-72 bg-white/5 rounded-full blur-xm"></div>

        <div className="flex flex-col h-full w-full p-14">
          {/* Logo */}
          <div>
            <Link
              to="/design"
              className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-90 sm:gap-3">
              <img
                src="/footer-logo.png"
                alt="HELPSTiR Logo"
                className="h-9 w-auto sm:h-12"
              />

              <img
                src="/footer-image.png"
                alt="HELPSTiR"
                className="h-3.5 w-auto sm:h-5"
              />
            </Link>

            <p className="text-[11px] text-[#FFFFFF99] mt-2 tracking-wide">
              CSR Intelligence Platform
            </p>
          </div>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <p className="uppercase text-[11px] tracking-[0.2em] text-[#FFFFFF99] font-semibold mb-5">
              Start in 60 seconds
            </p>

            <h2 className="font-heading text-[42px] font-bold tracking-[-0.04em] leading-[1.1]">
              Join 200+ CSR leaders
              <br />
              building better impact,
              <br />
              faster.
            </h2>

            <p className="mt-5 text-[16px] leading-7 text-white/80 max-w-md">
              Create your free account and design your first AI-powered
              project today. No credit card needed.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Free to browse — pay only on project execution",
                "Access to 300+ verified NGOs across India",
                "AI-designed projects matched to your CSR mandate",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10">
                    <Check className="w-4 h-4 text-white" />
                  </div>

                  <span className="text-[14px] text-white/90">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-[13px] text-[#FFFFFF99]">
            helpstir.in &nbsp; • &nbsp; Built in India
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 bg-white flex justify-center items-center p-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-center sm:text-left text-sm text-gray-500 mb-6 sm:mb-10 gap-2">
            <div>
              Step{" "}
              <span className="text-black font-bold">
                {showOtpScreen ? "2 of 3" : "1 of 3"}
              </span>
            </div>

            <div>
              Already have an account?{" "}
              <a href="/" className="text-blue-600 font-medium">
                Sign in
              </a>
            </div>
          </div>

          <h2 className="font-heading text-[28px] font-bold text-gray-900 tracking-[-0.02em] leading-none">
            {showOtpScreen ? "Verify OTP" : "Create your account"}
          </h2>

          <p className="mt-4 text-gray-500 text-[14px]">
            {showOtpScreen
              ? "Enter the OTP sent to your mobile number."
              : "Just four quick details to get started. You can complete your profile later."}
          </p>

          {!showOtpScreen ? (
            <form
              className="mt-8 space-y-4 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
            >
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ravi Kumar"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ravi@abc.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* <p className="text-[11px] text-gray-400 mt-2">
                  We'll verify this via OTP
                </p> */}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-2">
                  Mobile Number
                </label>

                <div className="flex gap-3">
                  <div className="border border-gray-200 rounded-xl px-3 py-3 min-w-[100px] text-center">
                    IN +91
                  </div>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98xxxxxx21"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <p className="text-[11px] text-gray-400 mt-2">
                  Required for OTP and project notifications
                </p>
              </div>

              {/* Company */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-2">
                  Company / Organisation
                </label>

                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Infosys Foundation"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-[11px] text-gray-400 mt-2">
                  For HNI / family office: type "Personal" or your trust name
                </p>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600"
              >
                {isRegistering ? "Registering..." : "Continue →"}
              </button>

              <p className="text-[11px] text-center text-gray-500">
                By continuing, you agree to HELPSTIR's{" "}
                <a className="text-blue-600">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-blue-600">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          ) : (
            <div className="mt-8 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-2">
                  Enter OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-center text-xl tracking-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-[11px] text-gray-400 mt-2">
                  OTP has been sent to +91 {formData.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingOtp ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}