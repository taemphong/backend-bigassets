import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads2/others';
    if (file.fieldname === 'slip') folder = 'uploads2/slip';
    else if (file.fieldname === 'idcard') folder = 'uploads2/idcard';
    else if (file.fieldname === 'rental_contract_file') folder = 'uploads2/contracts';

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); 
    const uniqueName = `${Date.now()}${ext}`;    
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });