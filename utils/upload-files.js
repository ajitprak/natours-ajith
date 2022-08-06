const multer = require('multer');
const sharp = require('sharp');

const AppError = require('./app-error');

// Good for security
const getExtension = (file) => {
    const type = file.mimetype.split('/')[1];
    switch (type) {
        case 'jpeg':
            return 'jpeg';
        case 'jpg':
            return 'jpg';
        case 'png':
            return 'png';
        case 'gif':
            return 'gif';
        default:
            return null;
        // return;
        // return new AppError('Please upload files of the following format "jpeg", "jpg", "png"', 400);
    }
};

const multerMemoryStorage = multer.memoryStorage();

const multierDiskStorage = (dest) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const extension = getExtension(file);
            if (extension) {
                cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
            } else {
                cb(new AppError('Please upload files of the following format "jpeg", "jpg", "png"', 400));
            }
        },
    });

const multierFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image') && getExtension(file)) {
        cb(null, true);
    } else {
        // cb(new AppError('Not an image! Please upload only images', 400), false);
        cb(new AppError('Please upload files of the following format "jpeg", "jpg", "png"', 400), false);
    }
};

// If no option is given the uploaded image will be stored in memory and not saved in disk
const uploadToDisk = (dest) => multer({ storage: multierDiskStorage(dest), fileFilter: multierFilter });

const uploadToMemory = () => multer({ storage: multerMemoryStorage, fileFilter: multierFilter });

// const resizeImageAndSave = async (req, dest) => {
const resizeImageAndSave = async (file, fileName, dest, width, height) => {
    const extension = getExtension(file);
    let image = sharp(file.buffer).resize(width, height).toFormat(extension);
    // we can find other file types to do the compression based on it
    if (extension === 'jpeg') {
        // 90 here is 90%
        image = image.jpeg({ quality: 90 });
    }
    image = image.toFile(`${dest}/${fileName}`);
    await image;
};

module.exports = {
    uploadToDisk,
    uploadToMemory,
    resizeImageAndSave,
    getExtension,
};
