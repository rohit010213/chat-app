import Navbar from "./Components/Navbar.jsx";
import HomePage from "./Pages/HomePage.jsx";
import SignUpPage from "./Pages/SignUpPage.jsx";
import OtpVerificationPage from "./Pages/OtpVerificationPage.jsx"; 
import LoginPage from "./Pages/LoginPage.jsx";
import SettingPage from "./Pages/SettingPage.jsx";
import ProfilePage from "./Pages/ProfilePage.jsx";
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './Store/useAuthStore.js';
import { useThemeStore } from './Store/useThemeStore.js';
import { useEffect } from 'react';
import { Loader } from "lucide-react";
import {Toaster} from "react-hot-toast";


function App() {

const{authUser,checkAuth,isCheckingAuth,onlineUsers} = useAuthStore();
const{theme} = useThemeStore();

useEffect(()=>{
  checkAuth();
},[checkAuth]);

console.log({ onlineUsers });

console.log("App authUser state", {authUser});


if(isCheckingAuth && !authUser) return (
  <div className='flex items-center justify-center h-screen'>
    <Loader className="size-10 animate-spin" />
  </div>
)

  return (
     <div data-theme={theme} >
      <Navbar />
       <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login"  />} />
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path='/login' element={!authUser ? <LoginPage /> :<Navigate to="/" />} />
        <Route path='/settings' element={<SettingPage />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} /> 
       </Routes>

       <Toaster />
   

     </div>
  )
}

export default App
