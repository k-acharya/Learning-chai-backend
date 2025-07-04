import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const result = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        { 
            $sort: { 
                createdAt: -1 
            }
        }
    ]).facet({
        metadata: [{ $count: "total" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }]
    });

    const comments = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        }, "Video comments fetched")
    );

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }
    const { content} = req.body;
    const { videoId } = req.params;  // get from params now

    if (!(content || videoId)) {
        throw new ApiError(400, "Content and video ID are required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId,
         owner: req.user._id 
        },
        { 
            $set: { 
                content
            } 
        },
        { new: true }
    );
    
    if (!comment) {
        throw new ApiError(404, "Comment not found or unauthorized");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(404, "comment not found or unothorized")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}