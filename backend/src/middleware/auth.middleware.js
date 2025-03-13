import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protectRoute =async (req,res,next)=>{
   try {
    // console.log("Cookies in request:", req.cookies); 
    const token = req.cookies.jwt;
    
    if(!token){
      return  res.status(401).json({message : "Unauthorized token"});
    }

    const decodedtoken = jwt.verify(token,process.env.JWT_SECRET);

    if(!decodedtoken){
      return  res.status(401).json({message : "Invalid token"});
    }

    const user = await User.findById(decodedtoken.userId).lean().select("-password");

    if(!user){
        return res.status(404).json({message : "user not found"});
    }

    req.user = user

    next();


   } catch (error) {
    console.log("Error in authmiddleware:", error.message, error.stack);
    return res.status(500).json({message : "authmiddleware error"});
   }
}