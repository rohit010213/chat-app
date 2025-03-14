import { generatejwttoken } from "../utils/authtoken.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Function to send OTP
const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Registration",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });
};

// 📌 SIGNUP - Store OTP & Set Cookie (DO NOT store email in frontend)
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
      if (!fullName || !email || !password) {
          return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      let user = await User.findOne({ email });

      if (user && user.password) {
          return res.status(400).json({ message: "Email already exists" });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      if (!user) {
          user = new User({
              fullName,
              email,
              tempPassword: password, // Temporarily store password
              otp,
              otpExpires,
          });
      } else {
          user.tempPassword = password;
          user.otp = otp;
          user.otpExpires = otpExpires;
      }

      await user.save();

      // Send OTP email
      await sendOtp(email, otp);

      // Store email in HTTP-only session cookie
      res.cookie("otpSession", email, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 5 * 60 * 1000, // 5 minutes
      });

      res.status(200).json({ message: "OTP sent. Verify to complete signup." });
  } catch (error) {
      console.log("Signup error:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};




// 📌 VERIFY OTP - Save user permanently after verification
export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.cookies.otpSession; // Retrieve email from cookie

  if (!email) {
      return res.status(400).json({ message: "Session expired. Please sign up again." });
  }

  try {
      const user = await User.findOne({ email });

      if (!user || !user.otp || user.otpExpires < Date.now()) {
          return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      if (user.otp !== otp) {
          return res.status(400).json({ message: "Incorrect OTP" });
      }

      if (!user.tempPassword) {
          return res.status(500).json({ message: "Temporary password is missing" });
      }

      const hashedPassword = await bcrypt.hash(user.tempPassword, 10);

      user.password = hashedPassword;
      user.tempPassword = undefined; // Remove temp password
      user.otp = undefined;
      user.otpExpires = undefined;
      user.isVerified = true;

      await user.save();

      // Clear the session cookie after successful verification
      res.clearCookie("otpSession");

      generatejwttoken(user._id, res);

      res.status(200).json({
          message: "Signup successful",
          user: { _id: user._id, email: user.email, isVerified: user.isVerified },
      });
  } catch (error) {
      console.log("OTP verification error:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};

// 📌 RESEND OTP - Generate a new OTP and send it
export const resendOtp = async (req, res) => {
  const email = req.cookies.otpSession; // ✅ Get email from HTTP-only cookie

  if (!email) {
    return res.status(400).json({ message: "Session expired. Please sign up again." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ Ensure otpSentAt exists
    if (!user.otpSentAt) {
      user.otpSentAt = new Date(0); // Default to a long time ago
    }

    const now = Date.now();
    const lastOtpSent = new Date(user.otpSentAt).getTime();
    const cooldown = 30 * 1000; // 30 seconds in milliseconds

    if (now - lastOtpSent < cooldown) {
      const remainingTime = Math.ceil((cooldown - (now - lastOtpSent)) / 1000);
      return res.status(400).json({ message: `Wait ${remainingTime} seconds before requesting a new OTP` });
    }

    // ✅ Generate a new OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();
    user.otp = newOtp;
    user.otpExpires = new Date(now + 5 * 60 * 1000); // OTP valid for 5 minutes
    user.otpSentAt = new Date(); // ✅ Update the timestamp

    await user.save();

    await sendOtp(email, newOtp); // ✅ Send new OTP

    res.status(200).json({ message: "New OTP sent successfully!" });
  } catch (error) {
    console.log("Resend OTP error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};








// 📌 LOGIN - Allow login only if user is verified
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(400).json({ message: "User does not exist" });
      }

      if (!user.isVerified) {
          return res.status(400).json({ message: "Please verify your email before logging in" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(400).json({ message: "Incorrect password" });
      }

      generatejwttoken(user._id, res);

      res.status(200).json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
      });
  } catch (error) {
      console.log("Login error:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};




// 📌 LOGOUT - Clears JWT token from cookies
export const logout = async (req, res) => {
  try {
      res.cookie("jwt", "", { maxAge: 0 });
      res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
      console.log("Logout error:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};


// 📌 UPDATE PROFILE - Uploads image to Cloudinary and updates profile picture
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Profile update error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 📌 CHECK AUTH - Returns user details if authenticated
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Check auth error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
