import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

//  Toggle subscription (Subscribe/Unsubscribe) to a channel
router.route("/toggle/:channelId").post(toggleSubscription);

//  Get subscribers of a channel (viewer list)
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

//  Get all channels a user has subscribed to
router.route("/channels/:subscriberId").get(getSubscribedChannels);


export default router