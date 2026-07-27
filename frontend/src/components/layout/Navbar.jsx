import React, { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar({ collapsed }) {
  const { user, role, company, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = () => {
    try {
      const response = logout();

      if (response.status === 200) {
        setOpen(false);
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-end px-8 transition-all duration-300 ${
        collapsed ? "left-20" : "left-60"
      }`}
    >
      <div
        className="relative"
        ref={dropdownRef}
      >
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {user
              ? user.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="text-left hidden sm:block">
            <h4 className="text-sm font-medium text-gray-900">
              {user || "User"}
            </h4>

            <p className="text-xs text-gray-500">
              {role} · {company}
            </p>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User size={16} />
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}