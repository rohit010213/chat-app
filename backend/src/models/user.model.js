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
     password : {
        type : String,
        required : [true, 'Password is required'],
        minlength : 6,
     },
     profilePic : {
        type : String,
        deafult : "",
     }
},{
    timestamps : true
 })

export const User = mongoose.model("Users",userSchema); // model("User") or anything when we create a another model 

                                                        //mongoose want the first capital uppercase