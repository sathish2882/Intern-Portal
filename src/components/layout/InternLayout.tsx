import { useEffect, useMemo, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import { removeToken, removeUserType } from "../../utils/authCookies";
import { getMeApi, logoutApi } from "../../services/authApi";
import { userStatusApi } from "../../services/attendanceApi";
import { MdOutlineMenu } from "react-icons/md";

import { CurrentUserProfile } from "../../types";
import { capitalizeName } from "../../utils/formatName";
import welcomeLogo from "../../assets/images/jpg/welcome-logo.jpg";
import { IoTimeOutline } from "react-icons/io5";
import { FaTasks } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import Profile from "../../assets/images/png/profile.png";

const FALLBACK_USER = {
  name: "Intern",
  email: "",
};

const NAV_ITEMS = [
  {
    to: "/intern/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: "/intern/tasks",
    label: "Tasks",
    icon: <FaTasks />,
  },
  {
    to: "/intern/messages",
    label: "Messages",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    to: "/intern/calendar",
    label: "Calendar",
    icon: <IoTimeOutline />,
  },
  {
    to: "/intern/feedback",
    label: "Feedback",
    icon: <FiMessageSquare />,
  },
];

const InternLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<"IN" | "OUT">("OUT");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const lastPingRef = useRef(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("attendanceStatus");
    if (saved === "IN" || saved === "OUT") {
      setAttendanceStatus(saved);
    }
  }, []);

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
      localStorage.removeItem("attendanceStatus");
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleActivity = async () => {
      if (attendanceStatus !== "IN") return;

      const now = Date.now();

      if (now - lastPingRef.current > 5000) {
        lastPingRef.current = now;

        try {
          const response = await userStatusApi();
          const data = response?.data;

          if (data === "time_added") return;

          if (data === "time_out" && attendanceStatus === "IN") {
            setAttendanceStatus("OUT");
            localStorage.setItem("attendanceStatus", "OUT");
            window.dispatchEvent(new Event("attendanceUpdated"));
            toast.info("Auto checked-out due to inactivity");
          }
        } catch (err) {
          console.error("user_status failed", err);
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void handleActivity();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [attendanceStatus]);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const compact = isMobile ? false : collapsed;

    return (
      <>
        <div className="px-3 py-5 border-b border-gray-100 sticky top-0 bg-white z-50">
          <NavLink
            to="/intern/dashboard"
            onClick={() => setMobileOpen(false)}
            title="Intern Portal"
            className={`flex items-center gap-2 ${compact ? "justify-center" : "px-1"}`}
          >
            <span className="inline-flex items-center w-[52px] h-[52px] justify-center rounded-xl bg-slate-100 overflow-hidden shadow-sm">
              <img
                src={welcomeLogo}
                alt="Intern Logo"
                className="w-7 h-9 rounded"
              />
            </span>
            {!compact && (
              <div className="min-w-0">
                <p className="font-syne font-extrabold text-xl text-navy leading-tight">
                  M-Guru
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Intern</p>
              </div>
            )}
          </NavLink>
        </div>

        <nav className="flex-1 p-2.5 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/intern/dashboard"}
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

        <div className="p-3 border-t border-gray-100 space-y-2 bg-white">
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
        className={`hidden lg:flex flex-col sticky top-0 h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
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
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center justify-center p-1.5 rounded-xl hover:bg-sky/20 transition-colors cursor-pointer"
                aria-label="Open profile details"
              >
                <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-sm overflow-hidden">
                  <img
                    src={Profile}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-14 z-50 w-[320px] rounded-2xl border border-line bg-white shadow-xl overflow-hidden">
                  <div className="relative px-4 py-4 border-b border-line bg-gradient-to-r from-blue to-cyan-500 text-white overflow-hidden">
                    <span className="absolute -top-4 -right-6 w-20 h-20 rounded-full bg-white/15" />
                    <span className="absolute -bottom-6 -left-8 w-24 h-24 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl shadow-sm overflow-hidden">
                        <img
                          src={Profile}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-white/90 truncate">
                          {user.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-mist mb-1">Batch</p>
                      <p className="text-navy font-semibold">
                        {profile?.batch ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-mist mb-1">Phone</p>
                      <p className="text-navy font-semibold">
                        {profile?.phone || profile?.phno || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-mist mb-1">Tech Stack</p>
                      <p className="text-navy font-semibold">
                        {profile?.tech_stack || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

export default InternLayout;
