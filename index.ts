import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import friendsRouter from "./friends.js";
import highlightsRouter from "./highlights.js";
import messagesRouter from "./messages.js";
import socialRouter from "./social.js";
import chatbotRouter from "./chatbot.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(friendsRouter);
router.use(highlightsRouter);
router.use(messagesRouter);
router.use(socialRouter);
router.use(chatbotRouter);

export default router;
