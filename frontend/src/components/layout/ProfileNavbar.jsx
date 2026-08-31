import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileNavbar() {

    const navigate = useNavigate()
    const { profileStrength } = useAuth()

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-white border-b flex items-center justify-between px-8 py-3">
            {/* Logo */}
            <div>
                <Link
                    to="/design"
                    className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-90 sm:gap-3">
                    <img
                        src="/logo.svg"
                        alt="HELPSTiR Logo"
                        className="h-9 w-auto sm:h-12"
                    />

                    <img
                        src="/helpstir-image.png"
                        alt="HELPSTiR"
                        className="h-3.5 w-auto sm:h-5"
                    />
                </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-6">
                {profileStrength > 35 ? (
                    <button onClick={() => navigate("/design")} className="text-gray-500 font-medium hover:text-gray-700">
                        Go back →
                    </button>
                ) : (
                    <button onClick={() => navigate("/design")} className="text-gray-500 font-medium hover:text-gray-700">
                        Skip and explore →
                    </button>
                )}


                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    RK
                </div>
            </div>
        </header>
    );
}