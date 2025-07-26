import { Router } from 'express';
import * as borrowRequestController from './borrow_request.controller.js';

const router = Router();

router.post('/addborrow', borrowRequestController.addBorrow);
router.post('/employeeborrowrequests', borrowRequestController.getMyBorrowRequests);
router.post('/adminborrowrequests', borrowRequestController.getAllBorrowRequests);
router.post('/approveBorrow', borrowRequestController.approveBorrow);
router.post('/requestReturn', borrowRequestController.requestReturn);
router.post('/adminapproveReturn', borrowRequestController.approveReturn);
router.post('/admingetreturnrequest', borrowRequestController.getPendingReturnRequests);

export default router;