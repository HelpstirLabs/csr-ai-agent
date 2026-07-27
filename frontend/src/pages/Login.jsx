import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../hooks/useAuth";
import { userOTPResend, userOTPVerification } from "../services/api/user";
// import {
//   userOTPVerification,
//   resendOTP,
// } from "../services/api/user";

export default function Login() {
    const navigate = useNavigate();
    const { login: authLogin, loginOTPVerification, firstLogin } = useAuth();

    const [phone, setPhone] = useState("+91");
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState("");
    const [showOtpScreen, setShowOtpScreen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePhoneChange = (e) => {
        let value = e.target.value;

        if (!value.startsWith("+91")) {
            value = "+91" + value.replace(/\+91\s?/g, "");
        }

        const digits = value.replace(/\D/g, "");

        if (digits.length > 12) return;

        setPhone(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            console.log("Submitting phone number:", phone);

            const response = await authLogin(phone);
            console.log("Login response:", response);

            if (response.status === 200 ||
                response.status === 201 ||
                response.success === true) {
                toast.success("OTP sent successfully", {
                    position: "top-right",
                    autoClose: 2500,
                    pauseOnHover: false,
                });

                setUserId(response.data.user_id);
                setShowOtpScreen(true);
            } else {
                toast.error(
                    response.data.message || "Failed to send OTP", {
                    position: "top-right",
                    autoClose: 2500,
                    pauseOnHover: false,
                }
                );
            }
        } catch (error) {
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            if (!otp.trim()) {
                toast.error("Please enter OTP");
                return;
            }

            const response = await loginOTPVerification(
                userId,
                otp
            );

            console.log("otp", response)

            if (response.data.token) {
                toast.success("OTP verified successfully", {
                    position: "top-right",
                    autoClose: 2500,
                    pauseOnHover: false,
                });

                console.log(firstLogin)


                if (firstLogin === 0) {
                    navigate("/welcome");
                } else {
                    navigate("/design");
                }
            }
        } catch (error) {
            console.error(error);

        }
    };

    const handleResendOtp = async () => {
        try {
            const response = await userOTPResend(userId);

            if (response.success) {
                toast.success("OTP resent successfully");
            } else {
                toast.error(
                    response.message || "Failed to resend OTP"
                );
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to resend OTP");
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2453FF] via-[#1636B7] to-[#081B72] text-white relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-xm"></div>
                <div className="absolute -bottom-24 left-40 w-72 h-72 bg-white/5 rounded-full blur-xm"></div>

                <div className="flex flex-col h-full w-full p-14">
                    <div>
                        <h1 className="font-heading text-[22px] font-extrabold tracking-[-0.02em] leading-none">
                            <span className="text-[#FFFFFFB3]">
                                HELP
                            </span>
                            <span className="text-white">
                                STiR
                            </span>
                        </h1>

                        <p className="text-[11px] text-[#FFFFFF99] mt-2 tracking-wide">
                            CSR Intelligence Platform
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-lg">
                        <p className="uppercase text-[11px] tracking-[0.15em] text-[#FFFFFF99] font-semibold mb-5 mt-10">
                            For CSR leaders & grant-makers
                        </p>

                        <h2 className="font-heading text-[36px] font-bold tracking-[-0.04em] leading-[1.1]">
                            Deploy your CSR with
                            <br />
                            confidence and
                            <br />
                            intelligence.
                        </h2>

                        <p className="mt-5 text-[16px] leading-7 text-white/80 max-w-xl">
                            AI-designed projects, vetted NGO
                            partners, milestone-linked disbursal,
                            and board-ready impact reports — all in
                            one connected workspace.
                        </p>

                        <div className="border-t border-white/20 mt-14 pt-10 flex gap-16">
                            <div>
                                <h3 className="font-heading text-[28px] font-bold">
                                    ₹4.2 Cr
                                </h3>
                                <p className="text-blue-200 mt-2 text-[11px]">
                                    Deployed this FY
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-[28px] font-bold">
                                    300+
                                </h3>
                                <p className="text-blue-200 mt-2 text-[11px]">
                                    Verified NGOs
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-[28px] font-bold">
                                    28
                                </h3>
                                <p className="text-blue-200 mt-2 text-[11px]">
                                    Districts active
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-[11px] text-[#FFFFFF99]">
                        helpstir.in • Built in India • UNESCO
                        ethical AI signatory
                    </div>
                </div>
            </div>


            {/* Right Side */}
            <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#2453FF] via-[#1636B7] to-[#081B72] md:bg-none md:bg-white flex items-center justify-center px-6 sm:px-8 lg:px-12 py-10 lg:py-0">
                <div className="w-full max-w-lg">

                    {/* Mobile Logo */}
                    <div className="mb-12 block md:hidden">
                        <h1 className="font-heading text-[22px] font-extrabold tracking-[-0.02em] leading-none">
                            <span className="text-[#FFFFFFB3]">HELP</span>
                            <span className="text-white">STiR</span>
                        </h1>

                        <p className="text-[11px] text-[#FFFFFF99] mt-2 tracking-wide">
                            CSR Intelligence Platform
                        </p>
                    </div>

                    {/* Create Account */}
                    <div className="mb-8 text-center md:text-left">
                        <p className="text-white/80 md:text-gray-500 text-sm">
                            New to HELPSTIR?{" "}
                            <button
                                onClick={() => (window.location.href = "/register")}
                                className="font-semibold text-white md:text-blue-600 hover:underline"
                            >
                                Create account
                            </button>
                        </p>
                    </div>

                    {/* Heading */}
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white md:text-[#081240] mb-3 text-center md:text-left">
                        Welcome to HELPSTIR
                    </h1>

                    <p className="text-white/80 md:text-gray-600 text-sm lg:text-base mb-8 text-center md:text-left">
                        Sign in to access your CSR workspace.
                    </p>
                    {!showOtpScreen ? (
                        <>
                            {/* Mobile Number */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-white md:text-gray-700 mb-3">
                                    Mobile Number
                                </label>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="+91 98xxxxxx21"
                                    className="w-full h-14 px-4 rounded-xl border border-white/20 md:border-gray-300 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <p className="text-xs text-white/70 md:text-gray-500 mb-8">
                                We'll send you a one-time password
                            </p>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-14 rounded-xl bg-[#2754FF] hover:bg-[#1844f0] text-white font-semibold flex items-center justify-center gap-3 transition"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                                <ArrowRight size={18} />
                            </button>
                        </>
                    ) : (
                        <div className="space-y-5">

                            {/* OTP */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase text-white md:text-gray-700 mb-3">
                                    Enter OTP
                                </label>

                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value.replace(/\D/g, ""))
                                    }
                                    maxLength={6}
                                    placeholder="000000"
                                    className="w-full h-14 bg-white border border-gray-300 rounded-xl px-4 text-center text-lg sm:text-xl tracking-[4px] sm:tracking-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <p className="text-xs text-white/70 md:text-gray-500 mt-2">
                                    OTP has been sent to {phone}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                className="w-full h-14 bg-[#2754FF] hover:bg-[#1844f0] text-white font-semibold rounded-xl transition"
                            >
                                Verify OTP
                            </button>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="w-full h-14 border border-white/20 md:border-gray-300 bg-white md:bg-transparent text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}

                    {/* Security Badge */}
                    <div className="mt-12 flex justify-center md:justify-start">
                        <div className="px-5 py-2 rounded-full bg-white/10 md:bg-[#F7F7F9] backdrop-blur-sm text-white/80 md:text-gray-500 text-xs">
                            🔒 256-bit encryption · ISO 27001
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

