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
    accent: "border-sky-400/20 bg-red-500/10",
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {PORTALS.map((portal) => (
          <button
            key={portal.route}
            onClick={() => navigate(portal.route)}
            className={`text-left rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:bg-white/10 ${portal.accent}`}
          >
            {portal.icon}

            <p className="text-lg font-bold mb-2">{portal.title}</p>
          </button>
        ))}
      </div>
    </AdminPortalShell>
  );
};

export default AdminPortalSelector;
