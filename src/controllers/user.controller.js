import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //get users detailes from frontend/or from postman...and what are the details we take from user we had already created on model
    //validation - not empty
    // check if user already exists: check from username, email
    // check files like :check for images, check for avatar
    // upload them to cloudinary, check avatar upload hua ki nai
    // cloudinary se image wapas agai ha merepas
    // create user object- bcz when we send data to mongodb its nosql..therefore we make objecct//: create entry in db
    // remove password and refresh token field from response: jo chize user ko dunga unmese ye hata dia
    // check for user creation- null response aya ha ki sachme user create ho gaya ha
    // return res or error 
    console.log("====== MULTER FILES ======");
    console.log("req.files:", req.files);
    console.log("====== BODY ======");
    console.log("req.body:", req.body);


    const {fullName, email, username, password} = req.body
    console.log("email", email);
    
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }
    const existedUser= await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or user name already exist");
    }

    //like express give use req.body ... routes ke andar jake middleware add kia ha jo hume access deta ha file ke lia  
    //and multer req ke andar aur access deta ha jese- (req.files?)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
       throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
       throw new ApiError(400, "Avatar upload failed");
    }


    //for coverImage uplod: we checked here- request file had came or not, properly array has camed or not,if its array have then it should have length
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   

    //now entry on data base
    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

export {
    registerUser,
}