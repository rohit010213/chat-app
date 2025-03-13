import { User } from "../models/user.model.js";
import {Message} from "../models/message.model.js"
import cloudinary from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const sideBarUser = async(req,res)=>{
   try {
     const loggedInUser = req.user._id;
     const filterUsers = await User.find({_id : {$ne:loggedInUser}}).select("-password");
 
    return res.status(201).json(filterUsers);

   } catch (error) {
      console.log("Error in sidebarmessage", error.message);
     return res.status(500).json({message : "Internal server error"})
   }
}

export const getMessageUser = async(req,res)=>{
    try {
        const{id : userToChatId} = req.params;
        const myId = req.user._id;

        const message = await Message.find({
            $or: [
            {senderId : myId , receiverId : userToChatId},
            {senderId : userToChatId , receiverId : myId},
            ],
        });

      return res.status(201).json(message);

    } catch (error) {
        console.log("Error in getMessageUser",error.message);
       return res.status(500).json({message : "Internal server message error"});
    }
}

export const sendMessage = async(req,res)=>{
    try {

        const{text,image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;

        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
             senderId,
             receiverId,
             text,
             image : imageUrl,
        });

        await newMessage.save();


const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage",error.message);
        return res.status(500).json({message : "Internal server message error"});
    }
}