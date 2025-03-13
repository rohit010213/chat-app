import jwt from "jsonwebtoken";

export const generatejwttoken = (userId,res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn : "7d",
    })
       res.cookie("jwt",token,{
        maxAge : 7 * 24 *60 * 60 *1000,
        httpOnly : true, // prevent xss attactk and cross site attack
        sameSite : "strict", //prvent from CRSF attack
        secure : process.env.NODE_ENV !== "development"
       })

       return token;
}