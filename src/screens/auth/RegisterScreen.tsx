import { Link } from "react-router-dom";

const RegisterScreen = () => {
  return (
    <div className="min-h-screen py-10 relative bg-[#07070c] overflow-hidden flex items-center justify-center">

      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070c] via-[#0b0b14] to-[#14143a]" />

      {/* LEFT DARK FADE */}
      <div className="absolute left-0 top-0 w-[40%] h-full bg-[#07070c]" />

      {/* RIGHT PURPLE GLOW */}
      <div className="absolute right-[-120px] top-[-80px] w-[500px] h-[500px] bg-indigo-600/25 blur-[120px] rounded-full" />

      {/* BOTTOM SOFT GLOW */}
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-500/10 blur-[120px] rounded-full" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-[520px] rounded-[20px] px-10 py-9 
        bg-[#12121a]/80 backdrop-blur-xl
        border border-white/10
        shadow-[0_0_40px_rgba(108,99,255,0.15)]">

        {/* TITLE */}
        <h2 className="text-[24px] font-semibold text-white mb-1">
          Create Your <span className="text-[#7c73ff]">Account</span>
        </h2>

        <p className="text-[#8a8aa3] text-[13px] mb-7 leading-relaxed">
          Register to start your internship journey. A one-time password will be sent to your email.
        </p>

        {/* FORM */}
        <div className="space-y-5">

          {/* FIELD */}
          {[
            { label: "FULL NAME", placeholder: "e.g. Priya Sharma" },
            { label: "EMAIL ADDRESS", placeholder: "you@email.com" },
            { label: "PHONE NUMBER", placeholder: "+91 9876543210" },
          ].map((item, i) => (
            <div key={i}>
              <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
                {item.label}
              </label>
              <input
                placeholder={item.placeholder}
                className="w-full px-4 py-[13px] rounded-[12px]
                bg-[#1a1a25] border border-white/10
                text-white text-[14px]
                placeholder:text-[#6b6b85]
                focus:outline-none focus:border-[#7c73ff] focus:ring-1 focus:ring-[#7c73ff]"
              />
            </div>
          ))}

          {/* PASSWORD */}
          <div>
            <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
              CREATE PASSWORD
            </label>
            <input
              placeholder="Min. 8 characters"
              className="w-full px-4 py-[13px] rounded-[12px]
              bg-[#1a1a25] border border-white/10
              text-white text-[14px]
              placeholder:text-[#6b6b85]
              focus:outline-none focus:border-[#7c73ff]"
            />

            {/* STRENGTH LINE */}
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex-1 h-[2px] bg-white/10 rounded" />
              ))}
            </div>
          </div>

          {/* CONFIRM */}
          <div>
            <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
              CONFIRM PASSWORD
            </label>
            <input
              placeholder="Re-enter password"
              className="w-full px-4 py-[13px] rounded-[12px]
              bg-[#1a1a25] border border-white/10
              text-white text-[14px]
              placeholder:text-[#6b6b85]
              focus:outline-none focus:border-[#7c73ff]"
            />
          </div>

          {/* BUTTON */}
          <button className="w-full mt-2 py-[14px] rounded-[12px] text-white text-[14px] font-semibold
            bg-gradient-to-r from-[#7c73ff] to-[#9a94ff]
            shadow-[0_8px_30px_rgba(124,115,255,0.45)]
            hover:opacity-95 transition">
            Send OTP to Email →
          </button>

        </div>

        {/* FOOTER */}
        <p className="text-center text-[12px] text-[#8a8aa3] mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-[#7c73ff] cursor-pointer hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterScreen;