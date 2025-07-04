import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        user: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, {}, "Video unliked"));
    }

    const like = await Like.create({
        video: videoId,
        user: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201, like, "Video liked"));

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        user: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, {}, "Comment unliked"));
    }

    const like = await Like.create({
        comment: commentId,
        user: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201, like, "Comment liked"));
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        user: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked"));
    }

    const like = await Like.create({
        tweet: tweetId,
        user: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201, like, "Tweet liked"));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likes = await Like.find({ user: req.user._id, video: { $exists: true } })
        .populate("video");

    const likedVideos = likes.map((like) => like.video);

    return res
    .status(200).json( new ApiResponse(200, likedVideos, "Liked videos fetched"))  
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}