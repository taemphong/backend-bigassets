import { Router } from "express";
import * as maintenanceController from "./maintenance.controller.js";

const router = Router();

router.post('/reportMaintenance', maintenanceController.reportMaintenanceController);
router.post('/getTechnicianMaintenanceList', maintenanceController.getTechnicianMaintenanceList);

export default router;