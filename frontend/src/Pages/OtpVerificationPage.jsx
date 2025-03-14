import { useState } from "react";
import { useAuthStore } from "../Store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Mail, Key, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState("");
  const { verifyOtp, isVerifyingOtp, resendOtp } = useAuthStore();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error("OTP must be 6 digits");
    }
    const success = await verifyOtp(otp);
    if (success) navigate("/"); // Redirect after successful verification
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    const success = await resendOtp();
    setIsResending(false);
    if (success) {
      toast.success("New OTP sent successfully! 📩");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-gray-500">Enter the 6-digit OTP sent to your email.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">OTP Code</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="size-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingOtp}>
            {isVerifyingOtp ? <Loader2 className="size-5 animate-spin" /> : "Verify OTP"}
          </button>
        </form>

        {/* Resend OTP Button */}
        <button
          className="btn btn-outline w-full mt-4"
          disabled={isResending}
          onClick={handleResendOtp}
        >
          {isResending ? <Loader2 className="size-5 animate-spin" /> : <RotateCcw className="size-5" />}
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
