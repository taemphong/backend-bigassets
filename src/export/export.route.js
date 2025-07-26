import express from 'express';
import { exportQRCodesToPDF } from '../export/export.controller.js';
const router = express.Router();

router.get('/exportqrcode', exportQRCodesToPDF);

export default router;
