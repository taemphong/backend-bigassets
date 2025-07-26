import { pool } from "../db.js";

export class MaintenanceService {
  async reportMaintenance({
    asset_id,
    reporter_name,
    reporter_contact,
    issue_description,
    assigned_to
  }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. เพิ่มรายการแจ้งซ่อม
      const [insertResult] = await conn.query(
        `INSERT INTO maintenance_requests 
    (asset_id, reporter_name, reporter_contact, issue_description, assigned_to, status)
   VALUES (?, ?, ?, ?, ?, 'แจ้งซ่อม')`,
        [
          asset_id,
          reporter_name,
          reporter_contact,
          issue_description,
          assigned_to,
        ]
      );

      // 2. อัปเดตสถานะทรัพย์สินเป็น "แจ้งซ่อมบำรุง" (ดึง status_id จากตาราง status)
      await conn.query(
        `UPDATE assets 
         SET status_id = (
           SELECT status_id FROM status WHERE status_name = 'แจ้งซ่อมบำรุง' LIMIT 1
         )
         WHERE asset_id = ?`,
        [asset_id]
      );

      await conn.commit();
      return { maintenance_id: insertResult.insertId };
    } catch (error) {
      await conn.rollback();
      console.error(" Error in reportMaintenance:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getRequestsByTechnician(employee_id) {
    const [rows] = await pool.query(
      `SELECT mr.*, a.asset_code, a.asset_name
       FROM maintenance_requests mr
       JOIN assets a ON mr.asset_id = a.asset_id
       WHERE mr.assigned_to = ?
       ORDER BY mr.request_date DESC`,
      [employee_id]
    );
    return rows;
  }
  
}
