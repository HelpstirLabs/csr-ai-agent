import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Welcome() {

    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-6">
            <div className="w-full max-w-2xl text-center">
                {/* Success Icon */}
                <div className="flex justify-center mb-10">
                    <div className="w-24 h-24 rounded-full bg-[#DDEBE8] flex items-center justify-center">
                        <span className="text-[#00A97D] text-5xl font-bold">
                            ✓
                        </span>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="font-heading text-[32px] font-bold text-[#081240] tracking-tight mb-6">
                    You're in, {user}!
                </h1>

                {/* Description */}
                <p className="text-[#4A5578] text-[14px] leading-relaxed max-w-3xl mx-auto">
                    Your account is ready. Let's design your first AI-powered CSR
                    project — it takes under 2 minutes.
                </p>

                {/* CTA Button */}
                <div className="mt-12">
                    <button onClick={() => navigate("/design")} className="bg-[#2952FF] hover:bg-[#1D46F5] text-white font-semibold text-[14px] px-16 py-3 rounded-xl inline-flex items-center gap-3 transition-all duration-200 shadow-sm">
                        Design your first project
                        <ArrowRight size={22} />
                    </button>
                </div>

                {/* Secondary Link */}
                <div className="mt-5">
                    <p className="text-[12px] text-[#8A90A8]">
                        Or{" "}
                        <button onClick={() => navigate("/profile")} className="text-[#2952FF] font-medium hover:underline">
                            add a few details about yourself
                        </button>{" "}
                        — takes 90 seconds
                    </p>
                </div>
            </div>
        </div>
    );
}