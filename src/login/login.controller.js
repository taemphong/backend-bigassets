import { UserService } from "./login.service.js";
import jwt from "jsonwebtoken";
import config from "../config.js";

export const loginuser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await new UserService().loginUser(username, password);
    if (!result.length) {
      return res.status(401).json({ status: 'error', message: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' });
    }

    const user = result[0];

    const payload = {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role_name,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      position: user.position,
      department_id: user.department_id,
      department_name: user.department_name,
      employee_created_at: user.employee_created_at,
      employee_updated_at: user.employee_updated_at,
      user_created_at: user.user_created_at,
      user_updated_at: user.user_updated_at,
    };

    const accessToken = jwt.sign(
      payload,
      config.jwt.secret,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    res.status(200).json({
      status: 'success',
      code: 1,
      message: 'เข้าสู่ระบบสำเร็จ',
      result: {
        ...payload
      },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Login failed', cause: error.message });
  }
};


export const addUser = async (req, res) => {
  try {
    const { username, password, role_id, employee_id } = req.body;

    const result = await new UserService().addUser({ username, password, role_id, employee_id });

    res.status(201).json({
      status: 'success',
      message: 'เพิ่มผู้ใช้งานสำเร็จ',
      insertId: result.insertId,
    });
  } catch (error) {
    console.error('เพิ่มผู้ใช้งานล้มเหลว:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const result = await new UserService().getAllRoles();
    res.json({ status: 'success', result });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลบทบาทได้' });
  }

};