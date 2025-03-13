import express from "express";
import {sideBarUser,getMessageUser,sendMessage} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users",protectRoute,sideBarUser);
router.get("/:id",protectRoute,getMessageUser);
router.post("/send/:id",protectRoute,sendMessage)


export default router;