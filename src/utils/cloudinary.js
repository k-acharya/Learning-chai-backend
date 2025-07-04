import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'; //its file system and this comes with node.js for read, write, remove, sinc, open, close....

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async(localFilePath, resourceType = "auto") => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            timeout: 120000 // ✅ [5] 2-minute timeout for large uploads        
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        // Check file exists before deleting
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        } //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}