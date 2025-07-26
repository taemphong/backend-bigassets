import { pool } from "../db.js";

export class BorrowRequestService {
  async createBorrowRequest(data) {
    const { employee_id, asset_id, expected_return_date, notes } = data;
    const borrow_code = `BR-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // เพิ่มใบเบิก
      const sqlBorrow = `
                INSERT INTO borrow_requests 
                (borrow_code, employee_id, asset_id, expected_return_date, notes, status, return_status)
                VALUES (?, ?, ?, ?, ?, 'รออนุมัติ', 'ยังไม่คืน')
            `;
      const [result] = await connection.query(sqlBorrow, [
        borrow_code,
        employee_id,
        asset_id,
        expected_return_date,
        notes,
      ]);

      // อัปเดต status_id ของสินทรัพย์
      const sqlUpdateAsset = `
                UPDATE assets SET status_id = 6 WHERE asset_id = ?
            `;
      await connection.query(sqlUpdateAsset, [asset_id]);

      await connection.commit();

      return {
        borrow_request_id: result.insertId,
        borrow_code,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getBorrowByEmployee(employee_id, onlyRejected = false) {
    let sql = `
    SELECT 
      br.*, 
      a.asset_code, 
      a.asset_name
    FROM borrow_requests br
    JOIN assets a ON br.asset_id = a.asset_id
    WHERE br.employee_id = ?
  `;

    if (onlyRejected) {
      sql += ` AND br.reject_reason IS NOT NULL`;
    }

    sql += ` ORDER BY br.request_date DESC`;

    const [rows] = await pool.query(sql, [employee_id]);
    return rows;
  }

  async AdmingetAllBorrowRequests() {
    const sql = `
        SELECT br.*, a.asset_code, a.asset_name, e.first_name, e.last_name
        FROM borrow_requests br
        JOIN assets a ON br.asset_id = a.asset_id
        JOIN employees e ON br.employee_id = e.employee_id
        WHERE br.status = 'รออนุมัติ'
        ORDER BY br.request_date DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async approveBorrow(borrow_request_id, asset_id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `
            UPDATE borrow_requests
            SET status = 'อนุมัติ',
                approve_date = NOW()
            WHERE borrow_request_id = ?
        `,
        [borrow_request_id]
      );

      await connection.query(
        `
            UPDATE assets
            SET status_id = (
        SELECT status_id FROM status WHERE status_name = 'ถูกเบิกออก' LIMIT 1
      )
            WHERE asset_id = ?
        `,
        [asset_id]
      );

      await connection.commit();

      return { borrow_request_id, asset_id, status: "อนุมัติ" };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async return_borrow(borrow_request_id) {
    const sql = `
    UPDATE borrow_requests
    SET status = 'รออนุมัติคืน',
        updated_at = NOW()
    WHERE borrow_request_id = ?
  `;
    const [result] = await pool.query(sql, [borrow_request_id]);
    return result;
  }

  async approve_return(borrow_request_id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // อัปเดตสถานะใน borrow_requests
      await connection.query(
        `
        UPDATE borrow_requests
        SET status = 'คืนแล้ว',
            return_status = 'คืนแล้ว',
            return_date = CURDATE(),
            confirm_return_date = NOW(),
            updated_at = NOW()
        WHERE borrow_request_id = ?
        `,
        [borrow_request_id]
      );

      // อัปเดตสถานะสินทรัพย์ให้กลับไปใช้งานปกติ
      await connection.query(
        `
        UPDATE assets
        SET status_id = (SELECT status_id FROM status WHERE status_name = 'ใช้งานปกติ')
        WHERE asset_id = (
          SELECT asset_id FROM borrow_requests WHERE borrow_request_id = ?
        )
        `,
        [borrow_request_id]
      );

      await connection.commit();
      return { borrow_request_id };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getPendingReturnRequests() {
    const sql = `
    SELECT br.*, a.asset_name, a.asset_code, e.first_name, e.last_name
    FROM borrow_requests br
    JOIN assets a ON br.asset_id = a.asset_id
    JOIN employees e ON br.employee_id = e.employee_id
    WHERE br.status = 'รออนุมัติคืน'
    ORDER BY br.request_date DESC
  `;
    const [rows] = await pool.query(sql);
    return rows;
  }

 

}
