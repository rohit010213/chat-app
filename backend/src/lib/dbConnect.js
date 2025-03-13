import mongoose from "mongoose";

export const connectDB = async () => {
     try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongodb connection is successfull");
     } catch (error) {
        console.log(error);
     }
}