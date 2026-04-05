import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import { removeToken, removeUserType } from "../../utils/authCookies";
import { getMeApi, logoutApi } from "../../services/authApi";
import { MdOutlineMenu } from "react-icons/md";

import { CurrentUserProfile } from "../../types";
import { capitalizeName } from "../../utils/formatName";
import welcomeLogo from "../../assets/images/jpg/welcome-logo.jpg";
import { FiCode, FiMonitor, FiMessageSquare } from "react-icons/fi";
import Profile from "../../assets/images/png/profile.png";

const FALLBACK_USER = {
  name: "Mentor",
  email: "",
};

const NAV_ITEMS = [
  {
    to: "/mentor/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: "/mentor/technical",
    label: "Technical",
    icon: <FiCode />,
  },
  {
    to: "/mentor/presentation",
    label: "Presentation",
    icon: <FiMonitor />,
  },
  {
    to: "/mentor/softskills",
    label: "Soft Skills",
    icon: <FiMessageSquare />,
  },
];

const MentorLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await getMeApi();
        if (mounted) {
          setProfile(res.data);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Failed to load profile");
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const user = useMemo(() => {
    if (!profile) return FALLBACK_USER;
    return {
      name: capitalizeName(profile.username || FALLBACK_USER.name),
      email: profile.email || FALLBACK_USER.email,
    };
  }, [profile]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logoutApi();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Logout failed");
    } finally {
      removeToken();
      removeUserType();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const compact = isMobile ? false : collapsed;

    return (
      <>
        <div className="px-3 py-5 border-b border-gray-100">
          <NavLink
            to="/mentor/dashboard"
            onClick={() => setMobileOpen(false)}
            title="Mentor Portal"
            className={`flex items-center gap-2 ${compact ? "justify-center" : "px-1"}`}
          >
            <span className="inline-flex items-center w-[52px] h-[52px] justify-center rounded-xl bg-slate-100 overflow-hidden shadow-sm">
              <img
                src={welcomeLogo}
                alt="Mentor Logo"
                className="w-7 h-9 rounded"
              />
            </span>
            {!compact && (
              <div className="min-w-0">
                <p className="font-syne font-extrabold text-xl text-navy leading-tight">
                  M-Guru
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Mentor
                </p>
              </div>
            )}
          </NavLink>
        </div>

        <nav className="flex-1 p-2.5 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/mentor/dashboard"}
              onClick={() => setMobileOpen(false)}
              title={compact ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-xl transition-all duration-200 ${
                  compact ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-2.5"
                } ${
                  isActive
                    ? "text-white bg-blue shadow-[0_6px_16px_rgba(29,110,222,0.24)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-navy"
                }`
              }
            >
              <span
                className={`w-5 text-center ${compact ? "text-[17px]" : "text-base"}`}
              >
                {item.icon}
              </span>
              {!compact && (
                <span className="text-sm font-semibold truncate">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          <div
            className={`rounded-xl border border-gray-200 bg-slate-50 ${
              compact ? "p-2.5 flex justify-center" : "px-3 py-2.5"
            }`}
          >
            {loadingProfile ? (
              <div className="loader-btn loader-btn-sm" />
            ) : compact ? (
              <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={compact ? "Sign Out" : undefined}
            className={`w-full rounded-xl text-sm font-semibold transition-all ${
              compact
                ? "px-2 py-2.5 flex items-center justify-center text-red-700 bg-red-50 hover:bg-red-100"
                : "px-3 py-2.5 flex items-center gap-2.5 text-red-700 bg-red-50 hover:bg-red-100"
            }`}
          >
            {loggingOut ? (
              <div className="loader-btn loader-btn-sm" />
            ) : (
              <>
                <svg
                  width="15"
                  height="15"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                {!compact && <span>Sign Out</span>}
              </>
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex bg-white font-jakarta text-navy">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`hidden lg:flex flex-col h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? "w-[86px]" : "w-[250px]"
        }`}
      >
        <SidebarContent />
      </aside>

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[270px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobile />
      </aside>

      <div className="flex-1 min-w-0">
        <nav className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar"
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-gray-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <MdOutlineMenu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer">
              <img src={Profile} alt="Mentor" className="w-10 h-10 rounded" />
            </div>
          </div>
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MentorLayout;
