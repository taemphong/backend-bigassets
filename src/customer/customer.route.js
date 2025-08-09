import { Router  } from "express";
import * as customerController from './customer.controller.js';
import { upload } from "../middlewares/uploads.js";

const router = Router();

router.post(
  '/createBorrowcustomerRequest',
  upload.fields([
    { name: 'slip', maxCount: 1 },
    { name: 'idcard', maxCount: 1 }
  ]),
  customerController.customercreateBorrowWithUpload 
);

router.get('/getLocation', customerController.getCustomerLocations);
router.get('/getRequestcustomerborrow', customerController.getPendingBorrowRequests);
router.get('/getCustomerList', customerController.getCustomerList);
router.post('/addcustomer', customerController.addCustomer);
router.get('/getcustomer', customerController.getCustomers);
router.post('/approveCustomerBorrowRequest', customerController.approveBorrowRequest);
router.get('/getitemcustomerborrow', customerController.getApprovedBorrowedAssets);
router.post('/reportRepair', customerController.reportRepair);
router.get('/getRepairInProgress', customerController.getRepairProgress);
router.get('/getwaitingfprdelivery', customerController.getWaitingForDelivery);
router.post('/updateRemainingDepositAmount', upload.single('slip'), customerController.updateRemainingDepositAmount);
router.post(
  '/updateDeliveryInfo',
  upload.single('rental_contract_file'), 
  customerController.updateDeliveryInfo
);

export default router;