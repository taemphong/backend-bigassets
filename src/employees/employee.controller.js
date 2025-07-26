import { EmployeeService } from "./employee.service.js";

const service = new EmployeeService();

export const getAllEmployees = async (req, res) => {
  try {
    const result = await service.getAllEmployees();
    res.status(200).json({
      status: "success",
      message: "ดึงข้อมูลพนักงานสำเร็จ",
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาด",
      cause: error.message
    });
  }
};


export const getAllEmployeesMaintenance = async (req, res) => {
  try {
    const result = await service.getAllEmployeesMaintenance();
    res.status(200).json({
      status: "success",
      message: "ดึงข้อมูลพนักงานสำเร็จ",
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาด",
      cause: error.message
    });
  }
};

export const addEmployee = async (req, res) => {
  const { first_name, last_name, phone, position, department_id } = req.body;

  if (!first_name || !last_name || !position || !department_id) {
    return res.status(400).json({
      status: "error",
      message: "กรุณากรอกข้อมูลให้ครบ (first_name, last_name, position, department_id)",
    });
  }

  try {
    const result = await new EmployeeService().addEmployee({
      first_name,
      last_name,
      phone,
      position,
      department_id,
    });

    if (result.affectedRows > 0) {
      res.status(201).json({
        status: "success",
        message: "เพิ่มพนักงานสำเร็จ",
        employee_id: result.insertId,
        result
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "เพิ่มพนักงานไม่สำเร็จ",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      cause: err.message,
    });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const result = await new EmployeeService().getAllDepartments();
    res.json({ status: 'success', result });
  } catch (error) {
    console.error(' ดึงแผนกล้มเหลว:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงแผนก' });
  }
};