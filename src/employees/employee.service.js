import { pool } from "../db.js"

export class EmployeeService {

    async getAllEmployees() {
    const sql = `
      SELECT e.employee_id, e.first_name, e.last_name, e.phone, e.position,
             d.department_name,
             e.created_at, e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      ORDER BY e.employee_id ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async getAllEmployeesMaintenance() {
    const sql = `
      SELECT e.employee_id, e.first_name, e.last_name, e.phone, e.position,
           d.department_name,
           e.created_at, e.updated_at
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE d.department_name = 'ซ่อมบำรุง'
    ORDER BY e.employee_id ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }


   async addEmployee({ first_name, last_name, phone, position, department_id }) {
    const sql = `
      INSERT INTO employees (first_name, last_name, phone, position, department_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [first_name, last_name, phone, position, department_id]);
    return result;
  }
  
  async getAllDepartments() {
    const sql = `
      SELECT department_id, department_name
      FROM departments
      ORDER BY department_id ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }
  
}