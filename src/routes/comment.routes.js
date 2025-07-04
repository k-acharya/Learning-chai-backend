import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


router
  .route("/video/:videoId")
  .get(getVideoComments)
  .post(addComment); // Add comment to a video

router
  .route("/:commentId")
  .delete(deleteComment)
  .patch(updateComment); // Update or delete a comment

export default router