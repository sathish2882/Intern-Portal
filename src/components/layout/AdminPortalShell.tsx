import { ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { removeToken, removeUserType } from "../../utils/authCookies";
import { getMeApi, logoutApi } from "../../services/authApi";
import { CurrentUserProfile } from "../../types";
import { capitalizeName } from "../../utils/formatName";
import welcomeLogoDark from '../../assets/images/png/welcome-dark.png'


const FALLBACK_USER = {
  name: "Admin",
  email: "",
};

interface AdminPortalShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  hideNav?: boolean;
}

const AdminPortalShell = ({ children }: AdminPortalShellProps) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await getMeApi();
        if (mounted) {
          setProfile(response.data);
        }
      } catch (error: any) {
        console.error("Failed to load profile:", error);
        toast.error(error?.response?.data?.detail || "Failed to load profile");
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

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
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast.error(error?.response?.data?.detail || "Logout failed");
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
            <NavLink
              to="/admin/portals"
              className="mt-1 flex items-center text-[28px] font-extrabold tracking-[-0.02em] lg:text-[32px] hover:text-blue-400 transition-colors"
              style={{ textDecoration: "none" }}
            >
              <span className="inline-flex items-center w-[55px] h-[60px] justify-center rounded-lg bg-text overflow-hidden">
                <img
                  src={welcomeLogoDark}
                  alt="Admin Logo"
                  className="w-full object-cover"
                />
              </span>
              <span>Admin</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex min-w-[200px] items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 min-h-[52px]">
              {loadingProfile ? (
                <div className="flex w-full items-center justify-center">
                  <div className="loader-btn loader-btn-sm" />
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center text-xs font-bold text-white-600 flex-shrink-0 shadow-[0_0_6px_#3dba78]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email || "admin@example.com"}
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-xl border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-colors text-sm font-semibold"
            >
              <span className="flex h-5 w-[72px] items-center justify-center">
                {loggingOut ? (
                  <div className="loader-btn loader-btn-sm" />
                ) : (
                  "Sign Out"
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">{children}</div>
    </div>
  );
};

export default AdminPortalShell;
