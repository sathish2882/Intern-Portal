import { useNavigate } from "react-router-dom";
import { WelcomeImg } from "../../utils/Images";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] 
    flex flex-col items-center justify-center font-body px-4">

      <div className="flex flex-col items-center text-center max-w-[420px] w-full">

        {/* LOGO */}
        <div className="w-[110px] h-[110px] rounded-[22px] bg-white 
          flex items-center justify-center shadow-md mb-6">
          <img
            src={WelcomeImg}
            alt="logo"
            className="w-[70px] h-[70px] object-contain"
          />
        </div>

        {/* LABEL */}
        <p className="text-[11px] tracking-[3px] uppercase text-[#1e3a8a] font-semibold mb-3">
          INTERNSHIP PORTAL
        </p>

        {/* TITLE */}
        <h1 className="font-heading text-[30px] font-bold text-[#0f172a] mb-2 leading-[1.3]">
          Welcome to M-Guru
        </h1>

        {/* SUBTITLE */}
        <p className="text-[14px] text-[#64748b] mb-8">
          by{" "}
          <span className="text-[#4c1d95] font-semibold">
            Velava Foundation
          </span>
        </p>

        {/* DIVIDER */}
        <div className="w-[60px] h-[2px] bg-gradient-to-r from-[#1e3a8a] to-[#4c1d95] rounded mb-8" />

        {/* TEXT */}
        <p className="text-[14px] text-[#1e3a8a] font-medium mb-5">
          Sign in to your account
        </p>

        {/* BUTTON */}
        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-[280px] py-[16px] 
          bg-gradient-to-br from-[#1e3a8a] to-[#4c1d95]
          text-white text-[14px] font-semibold uppercase tracking-[1.5px]
          rounded-[12px]
          shadow-[0_6px_20px_rgba(30,58,138,0.25)]
          hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(30,58,138,0.35)]
          active:scale-[0.97]
          transition duration-200"
        >
          SIGN IN
        </button>

      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-[24px] text-[11px] text-[#94a3b8] font-body text-center px-4">
        © 2026 M-GURU — Velava Foundation. All Rights Reserved.
      </footer>
    </div>
  );
};

export default WelcomeScreen;