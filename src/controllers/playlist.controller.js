import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
     //TODO: create playlist
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required.")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
     //TODO: get user playlists

    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID.")
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos", "title thumbnail duration")

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
   
})

const getPlaylistById = asyncHandler(async (req, res) => {
      //TODO: get playlist by id

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration")
        .populate("owner", "username fullname avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
  
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    //add videos to playlist 
    
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid IDs.")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this playlist.")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already in playlist.")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
     // TODO: remove video from playlist

    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid IDs.")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this playlist.")
    }

    playlist.videos = playlist.videos.filter(
        (v) => v.toString() !== videoId
    )
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
        // TODO: delete playlist

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.")
    }

    const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or unauthorized.")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
        //TODO: update playlist

    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this playlist.")
    }

    if (name) playlist.name = name
    if (description) playlist.description = description

    await playlist.save()

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}