import { pool } from '../db.js';

export class UserService {

  async loginUser(username, password) {
    const sql = `
      SELECT
  u.user_id,
  u.username,
  u.role_id,
  r.role_name,
  e.employee_id,
  e.first_name,
  e.last_name,
  e.phone,
  e.position,
  e.department_id,
  d.department_name,
  u.created_at,
  u.updated_at
FROM users AS u
LEFT JOIN roles AS r ON u.role_id = r.role_id
LEFT JOIN employees AS e ON u.employee_id = e.employee_id
LEFT JOIN departments AS d ON e.department_id = d.department_id
WHERE u.username = ? AND u.password = ?
    `;
    const [result] = await pool.query(sql, [username, password]);
    return result;
  }

  
  async addUser({ username, password, role_id, employee_id }) {
    const sql = `
      INSERT INTO users (username, password, role_id, employee_id)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [username, password, role_id, employee_id]);
    return result;
  }

  async getAllRoles() {
    const sql = `
      SELECT role_id, role_name
      FROM roles
      ORDER BY role_id ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

}