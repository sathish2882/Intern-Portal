import { useNavigate } from "react-router-dom";
import { WelcomeImg } from "../../utils/Images";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center font-sans">

      <div className="flex flex-col items-center text-center px-8 max-w-[400px]">

        {/* Logo */}
        <img
          src={WelcomeImg}
          alt="logo"
          className="w-[88px] h-[88px] rounded-[18px] object-contain mb-[22px]"
        />

        <p className="text-[11px] tracking-[2.5px] uppercase text-[#1e3a8a] font-semibold mb-[10px]">
          INTERNSHIP PORTAL
        </p>

        <h1 className="font-serif text-[28px] font-bold text-[#0f172a] mb-1 leading-[1.25]">
          Welcome to M-Guru
        </h1>

        <p className="text-[14px] text-[#64748b] mb-[36px]">
          by <span className="text-[#4c1d95] font-semibold">Velava Foundation</span>
        </p>

        <div className="w-[48px] h-[2px] bg-gradient-to-r from-[#1e3a8a] to-[#4c1d95] rounded mb-[28px]" />

        <p className="text-[13px] text-[#1e3a8a] font-medium mb-[20px]">
          Sign in to your account
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-[260px] py-[15px] bg-gradient-to-br from-[#1e3a8a] to-[#4c1d95] text-white text-[14px] font-semibold uppercase tracking-[1.2px] rounded-[8px] shadow-[0_4px_18px_rgba(30,58,138,0.28)] hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(30,58,138,0.38)] transition"
        >
          SIGN IN
        </button>

        <p className="text-[13px] text-[#64748b] mt-[20px]">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-[#1e3a8a] font-semibold cursor-pointer"
          >
            Register Now
          </span>
        </p>
      </div>

      <footer className="absolute bottom-[24px] text-[11px] text-[#94a3b8]">
        © 2026 M-GURU — Velava Foundation. All Rights Reserved.
      </footer>
    </div>
  );
};

export default WelcomeScreen;