import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "antd";
import { useAppDispatch } from "../../redux/hooks";
import { AuthUser } from "../../types";

const OtpScreen = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const email = state?.email ?? "";

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const formatNameFromEmail = (value: string) => {
    const localPart = value.split("@")[0] || "user";
    return localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const handleVerify = () => {
    const isAdmin = email.toLowerCase().includes("admin");
    const mockUser: AuthUser = {
      id: String(Date.now()),
      name: formatNameFromEmail(email) || (isAdmin ? "Admin User" : "Portal User"),
      email,
      user_type: isAdmin ? "admin" : "user",
      token: `mock-token-${Date.now()}`,
    };

    navigate(isAdmin ? "/admin/portals" : "/user/dashboard", { replace: true });
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    alert("OTP Resent (Mock)");
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-blue-50 to-indigo-100 px-4 font-body"
    >
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl">
            🔐
          </div>
        </div>

        <h2 className="text-xl font-heading font-semibold text-center mb-2 text-gray-800">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the 6-digit code sent to <br />
          <span className="text-blue-600 font-medium">{email}</span>
        </p>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          placeholder="••••••"
          className="w-full border border-gray-300 
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          outline-none p-3 rounded-xl text-center tracking-[8px] text-lg mb-5 
          transition font-body"
        />

        <Button
          type="primary"
          block
          size="large"
          onClick={handleVerify}
          disabled={otp.trim().length !== 6}
          className="!h-[48px] !rounded-xl !font-medium !text-sm !mb-3"
        >
          Verify OTP
        </Button>

        {!canResend ? (
          <p className="text-center text-sm text-gray-500">
            Resend OTP in{" "}
            <span className="font-semibold text-gray-700">
              {formatTime(timer)}
            </span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="w-full text-blue-600 font-medium hover:underline transition"
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
};

export default OtpScreen;
