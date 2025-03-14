import mongoose, { Types } from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema({
     fullName : {
        type : String,
        required : true,
     },
     email : {
        type : String,
        required : true,
        unique : true,
     },
     
     tempPassword: { 
      type: String 
   },

     password : {
        type : String,
        required : function() { return this.isVerified; },
        minlength : 6,
     },
     profilePic : {
        type : String,
        default : "",
     },
     otp: { 
      type: String
    }, 

     otpExpires: { 
      type: Date 
   }, 
   
   otpSentAt: {
       type: Date, 
       default: Date.now 
      },

   isVerified: { 
      type: Boolean, 
      default: false,
    },
     
},{
    timestamps : true
 })



export const User = mongoose.model("Users",userSchema); // model("User") or anything when we create a another model 

                                                        //mongoose want the first capital uppercase