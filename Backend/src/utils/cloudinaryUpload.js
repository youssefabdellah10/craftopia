const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadBuffer = (buffer,options) => {
    return new Promise((resolve,reject) => {
        const stream = cloudinary.uploader.upload_stream(options,(error,result) => {
            if(error) {
                reject(error);
            }else{
                resolve(result);
            }
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

const deleteImagesByPublicIds = async (artistUserId, imageUrls) => {
    try {
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return { success: true, message: 'No images to delete' };
        }

        const publicIds = imageUrls
            .map(url => {
                try {
                    const filename = url.split('/').pop().split('.')[0];
                    return `artists/${artistUserId}/products/${filename}`;
                } catch (error) {
                    console.error('Error processing URL:', url, error);
                    return null;
                }
            })
            .filter(Boolean);

        if (publicIds.length === 0) {
            return { success: true, message: 'No valid public IDs found' };
        }
        const deletePromises = publicIds.map(publicId => 
            cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
        );

        const results = await Promise.all(deletePromises);
        
        return { 
            success: true, 
            message: `${results.length} images processed for deletion`,
            results 
        };
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { uploadBuffer, deleteImagesByPublicIds };