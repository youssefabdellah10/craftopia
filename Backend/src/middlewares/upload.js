const multer = require('multer');
const path = require('path');


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|webm|mov|obj|fbx|gltf|glb|dae|3ds|ply|stl|x3d/;
  
  
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  const mimetype = filetypes.test(file.mimetype) || 
                   file.mimetype === 'model/gltf+json' ||
                   file.mimetype === 'model/gltf-binary' ||
                   file.mimetype === 'model/obj' ||
                   file.mimetype === 'model/fbx' ||
                   file.mimetype === 'model/x3d+xml' ||
                   file.mimetype === 'application/octet-stream'; 
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images, videos, and 3D files only!'));
  }
};


const limits = {
  fileSize: 50 * 1024 * 1024,
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload;