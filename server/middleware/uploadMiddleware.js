const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for Multer
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads');
        // Ensure the uploads directory exists (important on Render / ephemeral filesystems)
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Note: mimetype for xlsx is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    const mimetype = file.mimetype.includes('excel') ||
        file.mimetype.includes('spreadsheet') ||
        file.mimetype.includes('csv') ||
        extname; // Fallback to extension check if mimetype is tricky

    if (extname) { // Rely on extension for now as mimetype can vary
        return cb(null, true);
    } else {
        cb(new Error('Only Excel/CSV files are allowed!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
