import { Router } from 'express';
import * as loginController from './login.controller.js';
import { authenticate } from './auth.middleware.js';

const router = Router();

router.post('/loginaccount', loginController.loginuser)

router.get('/profile', authenticate, (req, res) => {
    res.status(200).json({
        status: 'success',
        user: req.user
    });
})

router.post('/adduser', loginController.addUser);
router.post('/getAllRoles', loginController.getAllRoles);

export default router;
