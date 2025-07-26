import { Router  } from "express";
import * as customerController from './customer.controller.js';

const router = Router();

router.post('/createBorrowRequest', customerController.createBorrowRequest);
router.get('/getCustomerList', customerController.getCustomerList);

export default router;