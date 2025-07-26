import { Router } from 'express';
import * as assetController from './asset.controller.js'
import { upload } from '../utils/upload.js';

const router = Router();

router.post('/addassettype', assetController.addassettype);
router.post('/gettype', assetController.GetAllType)
router.post('/addassets', upload.single('image'), assetController.addAsset)
router.post('/getasset', assetController.getAllAssets);
router.post('/getstatus', assetController.getAllStatus)
router.post('/calculate-depreciation/:asset_id', assetController.calculateDepreciation)

export default router;