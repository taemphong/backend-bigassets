import { pool } from "../db.js";
import { mssqlPool } from '../db.js';
import axios from "axios";

export class CustomerBorrowService {

  // แยกพิกัดจาก map_url แบบสั้นของ Google
  async extractLatLngFromMapUrl(map_url) {
    try {
      const response = await axios.get(map_url, {
        maxRedirects: 0,
        validateStatus: status => status >= 300 && status < 400
      });

      const redirectUrl = response.headers.location;
      if (!redirectUrl) throw new Error("ไม่พบ redirect");

      const match = redirectUrl.match(/@([-.\d]+),([-.\d]+)/);
      if (!match) throw new Error("ไม่พบพิกัดในลิงก์");

      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
        full_url: redirectUrl
      };
    } catch (err) {
      console.error(" แยกพิกัดล้มเหลว:", err.message);
      return null;
    }
  }

  // สร้างคำขอส่งยืมให้ลูกค้า
  async createBorrowRequest({
    customer_id,
    asset_id,
    expected_return_date,
    notes,
    map_url,
    location_description
  }) {
    // สร้าง borrow_customer_code รันแบบเลขลำดับ
    const year = new Date().getFullYear();
    const [countRow] = await pool.query(`
      SELECT COUNT(*) AS count FROM customer_borrow_request WHERE YEAR(created_at) = ?
    `, [year]);
    const count = countRow[0].count + 1;
    const padded = String(count).padStart(5, '0');
    const borrow_customer_code = `CBR-${year}-${padded}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. เพิ่มคำขอยืม
      const [insertBorrow] = await conn.query(
        `INSERT INTO customer_borrow_request (
          borrow_customer_code, customer_id, asset_id, expected_return_date, status, notes
        ) VALUES (?, ?, ?, ?, 'รออนุมัติส่งมอบ', ?)`,
        [borrow_customer_code, customer_id, asset_id, expected_return_date, notes]
      );

      const customer_borrowrequest_id = insertBorrow.insertId;

      // 2. แยกพิกัดจาก map_url
      const coords = await this.extractLatLngFromMapUrl(map_url);
      if (!coords) throw new Error("แปลงพิกัดล้มเหลว");

      const { latitude, longitude, full_url } = coords;

      // 3. บันทึกตำแหน่ง
      await conn.query(
        `INSERT INTO asset_tracking (
          asset_id, customer_borrowrequest_id, map_url, latitude, longitude, location_description
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [asset_id, customer_borrowrequest_id, full_url, latitude, longitude, location_description || ' ']
      );

      await conn.query(
  `UPDATE assets SET status_id = (
           SELECT status_id FROM status WHERE status_name = 'รออนุมัติยืม' LIMIT 1
         ) WHERE asset_id = ?`,
  [asset_id]
);

      await conn.commit();

      return {
        customer_borrowrequest_id,
        borrow_customer_code,
        latitude,
        longitude
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  
  async getcustomer() {
  const sql = `
    SELECT MemberName, MemberLastName, MemberMobile
    FROM [dbo].[Master_Member]
  `;
  const result = await mssqlPool.request().query(sql);
  return result.recordset;
}

}