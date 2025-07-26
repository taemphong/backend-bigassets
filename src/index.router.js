import { Router } from 'express';
import loginRoute from './login/login.route.js'
import assetRoute from './asset/asset.route.js'
import exportRoute from './export/export.route.js'
import locationRoute from './location/location.route.js'
import employeeRoute from './employees/employee.route.js'
import borrowRequestRoute from './borrow_request/borrow_request.route.js';
import maintenanceRoute from './maintenance/maintenance.route.js';
import customerRoute from './customer/customer.route.js';

const router = Router();

router.use('/login', loginRoute)
router.use('/asset', assetRoute)
router.use('/export', exportRoute)
router.use('/location', locationRoute)
router.use('/employee', employeeRoute)
router.use('/borrow_request', borrowRequestRoute);
router.use('/maintenance', maintenanceRoute);
router.use('/customer', customerRoute);

export default router;