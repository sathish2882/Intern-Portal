import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { removeToken, removeUserType } from "../../utils/authCookies";
import { logoutApi } from "../../services/authApi";

const user = {
  name: "Sathish",
  email: "sathish19222978sk@gmail.com",
};

interface AdminPortalShellProps {
  title: string
  children: ReactNode
}

const NAV_ITEMS = [
  { to: "/admin/portals", label: "Portals" },
  { to: "/admin/user-dashboard", label: "User Dashboard" },
  { to: "/admin/attendance-dashboard", label: "Attendance Dashboard" },
  { to: "/admin/exam-dashboard", label: "Exam Dashboard" },
];

const AdminPortalShell = ({
  title,
  children,
}: AdminPortalShellProps) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      removeToken();
      removeUserType();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-[#111827]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.name ?? "Admin"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email ?? "admin@example.com"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-xl border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-colors text-sm font-semibold"
            >
              <span className="flex h-5 w-[72px] items-center justify-center">
                {loggingOut ? <div className="loader-btn scale-[0.7]" /> : "Sign Out"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
        <nav className="flex flex-wrap gap-2 mb-6">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-sky-500 text-yellow-400"
                    : "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
};

export default AdminPortalShell;
