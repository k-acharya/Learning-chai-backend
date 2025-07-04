import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

     const userId = req.user._id;

     // Total Videos
     const totalVideos = await Video.countDocuments({ owner: userId });
   
     // Total Views
     const viewResult = await Video.aggregate([
        {
             $match: 
               { 
                 owner: new mongoose.Types.ObjectId(userId) 
               } 
        },
        {
             $group:
              { 
                _id: null, totalViews:
                             { $sum: "$views" } 
              } 
        }

     ]);
     const totalViews = viewResult[0]?.totalViews || 0;
   
     // Total Likes on Videos
     const videoLikesCount = await Like.countDocuments({
       video: { $ne: null },
       likedBy: userId
     });

     // Total Subscribers
     const totalSubscribers = await Subscription.countDocuments({
       channel: userId
     });
   
     const stats = {
       totalVideos,
       totalViews,
       totalLikes: videoLikesCount,
       totalSubscribers
     };
   
     return res
     .status(200)
     .json(
       new ApiResponse(200, stats, "Channel stats fetched successfully")
     );
  
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user._id;
  
    const videos = await Video.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate("owner", "username fullname avatar");
  
    return res
    .status(200)
    .json(
      new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }