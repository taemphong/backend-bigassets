import { Router } from 'express';
import * as locationController from "./location.controller.js"

const router = Router();

router.post('/addlocation', locationController.addLocation);
router.post('/getlocation', locationController.getAllLocations)

export default router;