import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body;
    const file = req.file;

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    let imageUrl = "";
    if (file) {
        console.log("Uploading file at path:", file.path);
        const uploadedImage = await uploadOnCloudinary(file.path);
        console.log("Cloudinary upload response:", uploadedImage);
        if (!uploadedImage || !uploadedImage.url) {
            throw new ApiError(500, "Tweet image upload failed");
        }
        imageUrl = uploadedImage.url;
    }

    const tweet = await Tweet.create({
        content,
        image: imageUrl,
        owner: req.user._id,
    });

    return res
    .status(201)
    .json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    );

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const tweets = await Tweet.find({ owner: req.user._id })
        .populate("owner", "username fullname avatar")
        .sort({ createdAt: -1 });

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "User tweets fetched")
    );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params;
    const { content } = req.body;
    const file = req.file;

    let imageUrl;
    if (file) {
        const uploadedImage = await uploadOnCloudinary(file.path, "tweets");
        if (!uploadedImage || !uploadedImage.url) {
            throw new ApiError(500, "Tweet image upload failed");
        }
        imageUrl = uploadedImage.url;
    }

    const updateFields = { content };
    if (imageUrl) updateFields.image = imageUrl;

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id,
        },
        { $set: updateFields },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    });

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}