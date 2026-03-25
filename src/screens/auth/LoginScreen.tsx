import { useNavigate } from "react-router-dom";
import { useState } from "react";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center font-sans px-4">


      <div className="w-[100px] h-[100px] rounded-full bg-[#7dd3fc] flex items-center justify-center text-4xl mb-[16px]">
        🐻
      </div>

      <p className="text-[11px] tracking-[2px] text-gray-400 mb-6">
        INTERNSHIP PORTAL
      </p>

      <p className="text-sm text-gray-500 mb-2">
        Enter your registered email
      </p>

      {/* Input box */}
      <div className="flex items-center w-full max-w-[360px] border-[2px] border-[#3b82f6] rounded-[12px] bg-white overflow-hidden">

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 px-4 py-3 text-sm outline-none"
        />

        <button className="px-4 text-[#3b82f6] text-xl">
          →
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6 w-full max-w-[360px]">
        <div className="flex-1 h-[1px] bg-gray-300" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="flex-1 h-[1px] bg-gray-300" />
      </div>

      <p
        onClick={() => navigate("/")}
        className="text-sm text-gray-500 cursor-pointer mb-2"
      >
        ← Back to Home
      </p>

      <p className="text-sm text-gray-500">
        Don't have an account?{" "}
        <span
          onClick={() => navigate("/register")}
          className="text-blue-600 cursor-pointer"
        >
          Register Now
        </span>
      </p>
    </div>
  );
};

export default LoginScreen;