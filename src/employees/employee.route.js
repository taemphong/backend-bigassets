import { Router } from 'express';
import * as employeeController from './employee.controller.js'

const router = Router();

router.post('/getAllEmployees', employeeController.getAllEmployees)
router.post('/addemployee', employeeController.addEmployee)
router.post('/getAllEmployeesMaintenance', employeeController.getAllEmployeesMaintenance);
router.post('/getAllDepartments', employeeController.getAllDepartments);

export default router;