import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL of the uploaded image from Cloudinary
        default: ""   // optional, in case the tweet has no image
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref:"User",
        required: true
    }
},{
    timestamps: true
})

export const Tweet = mongoose.model("Tweet", tweetSchema)