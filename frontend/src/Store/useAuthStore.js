import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdateProfile: false,
  isVerifyingOtp: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // Check authentication status
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
      console.log("After checkAuth", { authUser: get().authUser });
    }
  },

  // ✅ FIXED: OTP verification (email is now handled via HTTP-only cookie)
  verifyOtp: async (otp) => {
    set({ isVerifyingOtp: true });

    try {
      const res = await axiosInstance.post("/auth/verify-otp", { otp }); // ✅ No need to send email

      set({ authUser: res.data });

      get().connectSocket();

      toast.success("Email verified successfully! 🚀");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
      return false;
    } finally {
      set({ isVerifyingOtp: false });
    }
  },

  resendOtp: async () => {
    try {
      const res = await axiosInstance.post("/auth/resend-otp"); // ✅ No need to send email from frontend
  
      console.log("New OTP sent ");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
      return false;
    }
  },
  

  // Signup function
  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success("Account Created! Verify your email.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Login function
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Logout function
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logout Successfully");

      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // Update profile function
  updateProfile: async (data) => {
    set({ isUpdateProfile: true });

    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdateProfile: false });
    }
  },

  // Connect socket
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  // Disconnect socket
  disconnectSocket: () => {
    const { socket } = get();

    if (socket && socket.connected) {
      console.log("⚠️ [Frontend] Disconnecting socket...");
      socket.disconnect();
      set({ socket: null });
    } else {
      console.log("ℹ️ [Frontend] No active socket to disconnect.");
    }
  },
}));
