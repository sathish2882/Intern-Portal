import { useNavigate } from "react-router-dom";
import AdminPortalShell from "../../components/layout/AdminPortalShell";
import {
  BankOutlined,
  TeamOutlined,
  ScheduleOutlined,
  AuditOutlined,
} from "@ant-design/icons";

const PORTALS = [
  {
    title: "Interview Dashboard",
    route: "/admin/interview-dashboard",
    accent: "border-amber-400/20 bg-amber-500/10",
    icon: (
      <AuditOutlined
        style={{ fontSize: 28, color: "#fbbf24", marginBottom: 12 }}
      />
    ),
  },

  {
    title: "User Dashboard",
    route: "/admin/user-dashboard",
    accent: "border-red-400/30 bg-red-500/10",
    icon: (
      <TeamOutlined
        style={{ fontSize: 28, color: "#f87171", marginBottom: 12 }}
      />
    ),
  },
  {
    title: "User Attendance Dashboard",
    route: "/admin/attendance-dashboard",
    accent: "border-emerald-400/20 bg-emerald-500/10",
    icon: (
      <ScheduleOutlined
        style={{ fontSize: 28, color: "#34d399", marginBottom: 12 }}
      />
    ),
  },
  {
    title: "Finance Dashboard",
    route: "/admin/payment/dashboard",
    accent: "border-fuchsia-400/20 bg-fuchsia-500/10",
    icon: (
      <BankOutlined
        style={{ fontSize: 28, color: "#e879f9", marginBottom: 12 }}
      />
    ),
  },
];

const AdminPortalSelector = () => {
  const navigate = useNavigate();

  return (
    <AdminPortalShell title="Admin Portal" hideNav>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
            Control Center
          </p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Choose An Admin Workspace
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200">
              <span className="text-lg font-bold">4</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PORTALS.map((portal) => (
          <button
            key={portal.route}
            onClick={() => navigate(portal.route)}
            className={`group relative flex min-h-[220px] flex-col items-start overflow-hidden rounded-[26px] border p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.24)] ${portal.accent}`}
          >
            <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/10 backdrop-blur-sm">
              {portal.icon}
            </div>

            <p className="mb-2 text-lg font-bold text-white">{portal.title}</p>

            <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-white">
              <span>Open Dashboard</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </div>
          </button>
        ))}
        </div>
      </div>
    </AdminPortalShell>
  );
};

export default AdminPortalSelector;
