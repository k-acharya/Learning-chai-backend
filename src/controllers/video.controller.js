import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from 'fs';


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //1. Initialize Aggregation Pipeline
    const pipeline = [];

    //2. If the user typed a query=travel, this matches all video documents where title contains "travel" (case-insensitive).
    if (query) {
        pipeline.push({
            $match: {
                title: { $regex: query, $options: "i" }
            }
        });
    }

    //3. This lets you fetch only videos posted by a specific user, if a userId is passed in query.
    if (userId && isValidObjectId(userId)) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    //4. Add Pagination and Sorting
    pipeline.push(
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        },
        //5. Join with User Collection (Populate owner)
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        //6. Select Only Needed Fields
                {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                isPublished: 1,
                owner: { username: "$owner.username", avatar: "$owner.avatar" }
            }
        }
    );
    //7. Run the Pipeline
    const videos = await Video.aggregate(pipeline);

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!(title || description)) {
      throw new ApiError(400, "Title and description are required");
    }
  
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!(videoLocalPath || thumbnailLocalPath)) {
      throw new ApiError(400, "Video and thumbnail are required");
    }
    
    // Log file size before uploading (Optional but helpful)
    const videoStat = fs.statSync(videoLocalPath);
    console.log(" Video file size (MB):", (videoStat.size / (1024 * 1024)).toFixed(2));


    const videoUpload = await uploadOnCloudinary(videoLocalPath,"video");
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath,"image");

      // Log full Cloudinary response
    console.log(" Video Cloudinary Response:", videoUpload);
    console.log(" Thumbnail Cloudinary Response:", thumbnailUpload);

    // Check for Cloudinary upload failures separately
    if (!videoUpload?.url) {
      console.error(" Video upload failed");
      throw new ApiError(500, "Video upload to Cloudinary failed");
    }

    if (!thumbnailUpload?.url) {
      console.error(" Thumbnail upload failed");
      throw new ApiError(500, "Thumbnail upload to Cloudinary failed");
    }
    const durationInSeconds = Math.floor(videoUpload.duration || 0); // optional

    const video = await Video.create({
      title,
      description,
      videoFile: videoUpload.url,
      thumbnail: thumbnailUpload.url,
      duration: durationInSeconds,
      owner: req.user._id,
    })

    return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: { username: "$owner.username", avatar: "$owner.avatar" }
            }
        }
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (req.files?.thumbnail?.[0]?.path) {
        const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
        if (thumbnailUpload?.url) {
            updateData.thumbnail = thumbnailUpload.url;
        }
    }

    const updatedVideo = await Video.findOneAndUpdate(
        { _id: videoId, owner: req.user._id },
        { $set: updateData },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const deleted = await Video.findOneAndDelete({ _id: videoId, owner: req.user._id });

    if (!deleted) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });

    if (!video) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
