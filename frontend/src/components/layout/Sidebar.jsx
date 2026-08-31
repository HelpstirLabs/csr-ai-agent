import {
  LayoutGrid,
  Star,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Sidebar({
  collapsed,
  setCollapsed,
}) {
  const navigate = useNavigate();


  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 800);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r z-50 transition-all duration-300 ${collapsed ? "w-20" : "w-60"
        }`}
    >
      <div className="flex flex-col h-full">

        <div
          className={`h-14 border-b px-4 flex items-center ${collapsed
            ? "justify-center"
            : "justify-between"
            }`}
        >
          {!collapsed && (
            <Link
              to="/design"
              className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-90 sm:gap-3">
              <img
                src="/logo.svg"
                alt="HELPSTiR Logo"
                className="h-7 w-auto sm:h-10"
              />

              <img
                src="/helpstir-image.png"
                alt="HELPSTiR"
                className="h-3.5 w-auto sm:h-5"
              />
            </Link>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-[#2952F3]"
          >
            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 py-6">
          {!collapsed && (
            <p className="px-6 mb-4 text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
              Workspace
            </p>
          )}

          <div className="px-3 space-y-1">

            <MenuItem
              path="/design"
              icon={<Star size={18} />}
              text="Design a Project"
              collapsed={collapsed}
            />

            <MenuItem
              path="/rfptracker"
              icon={<MessageSquare size={18} />}
              text="RFP Tracker"
              collapsed={collapsed}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function MenuItem({
  path,
  icon,
  text,
  badge,
  collapsed,
}) {
  return (
    <NavLink
      to={path}
      title={collapsed ? text : ""}
      className={({ isActive }) =>
        `w-full flex items-center ${collapsed
          ? "justify-center"
          : "justify-between"
        } px-4 py-3 rounded-xl transition-all duration-200 ${isActive
          ? "bg-[#EEF3FF] text-[#2952F3]"
          : "text-[#4A4A6A] hover:bg-gray-100"
        }`
      }
    >
      <div className="flex items-center gap-3">
        {icon}

        {!collapsed && (
          <span className="text-[14px] font-medium">
            {text}
          </span>
        )}
      </div>

      {!collapsed && badge && (
        <span className="flex items-center justify-center w-5 h-5 text-[11px] font-semibold text-white bg-blue-600 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}