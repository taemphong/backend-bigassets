import { pool } from "../db.js";
import { mssqlPool } from "../db.js";
import axios from "axios";

export class CustomerBorrowService {
  async extractLatLngFromMapUrl(mapUrl) {
    if (!mapUrl) return null;

    let resolvedUrl = mapUrl;

    if (mapUrl.includes("goo.gl")) {
      try {
        const response = await axios.get(mapUrl, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 300 && status < 400,
        });

        resolvedUrl = response.headers.location;
      } catch (error) {
        console.error(
          "ไม่สามารถ redirect ลิงก์ maps.app.goo.gl ได้:",
          error.message
        );
        return null;
      }
    }

    const match = resolvedUrl.match(/@([-.\d]+),([-.\d]+)/);
    if (!match) return null;

    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
      resolvedUrl,
    };
  }

  async customercreateWithUpload(data) {
    const {
      customer_id,
      asset_id,
      map_url,
      manual_address,
      slip_url,
      customer_id_card,

      expected_deposit_amount,
      initial_deposit_paid,
      initial_deposit_method,
      initial_deposit_date,
    } = data;

    const coords = await this.extractLatLngFromMapUrl(map_url);

    const insertSQL = `
    INSERT INTO customer_borrow_request (
      customer_id,
      asset_id,
      map_url,
      latitude,
      longitude,
      manual_address,
      status,
      slip_url,
      customer_id_card,
      expected_deposit_amount,
      initial_deposit_paid,
      initial_deposit_method,
      initial_deposit_date
    )
    VALUES (?, ?, ?, ?, ?, ?, 'รออนุมัติ', ?, ?, ?, ?, ?, ?)
  `;

    const [result] = await pool.query(insertSQL, [
      customer_id,
      asset_id,
      map_url,
      coords?.latitude || null,
      coords?.longitude || null,
      manual_address,
      slip_url,
      customer_id_card,
      expected_deposit_amount || 0,
      initial_deposit_paid || 0,
      initial_deposit_method || null,
      initial_deposit_date || null,
    ]);

    // อัปเดตสถานะทรัพย์สิน
    const updateStatusSQL = `
    UPDATE assets
    SET status_id = (
      SELECT status_id FROM status WHERE status_name = 'รออนุมัติยืม'
    )
    WHERE asset_id = ?
  `;
    await pool.query(updateStatusSQL, [asset_id]);

    return result.insertId;
  }

  async getlocation() {
    const sql = `
    SELECT 
      c.latitude, 
      c.longitude, 
      c.map_url, 
      c.manual_address,
      c.asset_id,
      a.asset_name
    FROM customer_borrow_request c
    LEFT JOIN assets a ON c.asset_id = a.asset_id
    WHERE c.status = 'จัดส่งแล้ว'
  `;
    const [result] = await pool.query(sql);
    return result;
  }

  async getcustomer() {
    const sql = `
      SELECT MemberName, MemberLastName, MemberMobile
      FROM [dbo].[Master_Member]
    `;
    const result = await mssqlPool.request().query(sql);
    return result.recordset;
  }

  async getPendingRequestsForAdmin() {
    const sql = `
     SELECT 
      cbr.customerborrow_request_id,
      cbr.asset_id,
      a.asset_code,
      a.asset_name,
      cbr.status,
      c.customer_firstname,
      c.customer_lastname
    FROM customer_borrow_request cbr
    LEFT JOIN assets a ON cbr.asset_id = a.asset_id
    LEFT JOIN customers c ON cbr.customer_id = c.customer_id
    WHERE cbr.status = 'รออนุมัติ'
    ORDER BY cbr.customerborrow_request_id DESC
  `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async addCustomer({
    customer_firstname,
    customer_lastname,
    customer_phone,
    customer_address,
    customer_district,
    customer_province,
    customer_zipcode,
  }) {
    const sql = `
    INSERT INTO customers (
      customer_firstname,
      customer_lastname,
      customer_phone,
      customer_address,
      customer_district,
      customer_province,
      customer_zipcode
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    const [result] = await pool.query(sql, [
      customer_firstname,
      customer_lastname,
      customer_phone,
      customer_address,
      customer_district,
      customer_province,
      customer_zipcode,
    ]);

    return { customer_id: result.insertId };
  }

  async getAllCustomers() {
    const sql = `
      SELECT 
        customer_id,
        customer_firstname,
        customer_lastname,
        customer_phone,
        customer_address,
        customer_district,
        customer_province,
        customer_zipcode,
        created_at,
        updated_at
      FROM customers
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async approveBorrowRequest(customerborrow_request_id) {
    // 1. ดึง asset_id จากคำขอ
    const [[{ asset_id }]] = await pool.query(
      `SELECT asset_id FROM customer_borrow_request WHERE customerborrow_request_id = ?`,
      [customerborrow_request_id]
    );

    // 2. อัปเดตสถานะใน customer_borrow_request
    await pool.query(
      `UPDATE customer_borrow_request SET status = 'อนุมัติแล้ว' WHERE customerborrow_request_id = ?`,
      [customerborrow_request_id]
    );

    // 3. อัปเดต status_id ของทรัพย์สินเป็น 'ถูกยืม'
    await pool.query(
      `UPDATE assets SET status_id = (
        SELECT status_id FROM status WHERE status_name = 'เตรียมจัดส่งให้ลูกค้า'
      ) WHERE asset_id = ?`,
      [asset_id]
    );
  }

  async itemBorrowcustomer() {
    const sql = `
    SELECT 
      cbr.customerborrow_request_id,
      cbr.asset_id,
      a.asset_code,
      a.asset_name,
      a.warranty_expire,
      c.customer_id,
      c.customer_firstname,
      c.customer_lastname,
      cbr.map_url,
      cbr.manual_address,
      cbr.slip_url,
      cbr.customer_id_card,
      cbr.status
    FROM customer_borrow_request cbr
    LEFT JOIN assets a ON cbr.asset_id = a.asset_id
    LEFT JOIN customers c ON cbr.customer_id = c.customer_id
    WHERE cbr.status IN ('จัดส่งแล้ว', 'ดำเนินการซ่อม')
    ORDER BY cbr.customerborrow_request_id DESC
  `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async itemWaitingForDelivery() {
    const sql = `
    SELECT 
      cbr.customerborrow_request_id,
      cbr.asset_id,
      a.asset_code,
      a.asset_name,
      c.customer_id,
      c.customer_firstname,
      c.customer_lastname,
      cbr.map_url,
      cbr.manual_address,
      cbr.slip_url,
      cbr.customer_id_card,
      cbr.status,
      cbr.expected_deposit_amount,
      cbr.initial_deposit_paid,
      cbr.initial_deposit_date,
      cbr.initial_deposit_method
    FROM customer_borrow_request cbr
    LEFT JOIN assets a ON cbr.asset_id = a.asset_id
    LEFT JOIN customers c ON cbr.customer_id = c.customer_id
    WHERE cbr.status = 'อนุมัติแล้ว'
    ORDER BY cbr.customerborrow_request_id DESC
  `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async reportRepair(data) {
    const {
      customerborrow_request_id,
      repair_report_date,
      repair_note,
      appointment_date,
      parts_cost,
      service_fee,
      total_cost,
      repair_status,
    } = data;

    // INSERT การแจ้งซ่อม
    const insertSql = `
    INSERT INTO customer_borrow_repairs (
      customerborrow_request_id,
      repair_report_date,
      repair_note,
      appointment_date,
      parts_cost,
      service_fee,
      total_cost,
      repair_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const [insertResult] = await pool.query(insertSql, [
      customerborrow_request_id,
      repair_report_date,
      repair_note,
      appointment_date,
      parts_cost,
      service_fee,
      total_cost,
      repair_status,
    ]);

    // UPDATE สถานะ customer_borrow_request
    const updateSql = `
    UPDATE customer_borrow_request
    SET status = 'ดำเนินการซ่อม'
    WHERE customerborrow_request_id = ?
  `;
    await pool.query(updateSql, [customerborrow_request_id]);

    return { repair_id: insertResult.insertId };
  }

  async getRepairInProgress() {
    const sql = `SELECT 
      r.repair_id,
      r.customerborrow_request_id,
      r.repair_report_date,
      r.repair_note,
      r.appointment_date,
      r.parts_cost,
      r.service_fee,
      r.total_cost,
      r.repair_status,
      a.asset_code,
      a.asset_name,
      cbr.manual_address,
      c.customer_id,
      c.customer_firstname,
      c.customer_lastname
    FROM customer_borrow_repairs r
    JOIN customer_borrow_request cbr ON r.customerborrow_request_id = cbr.customerborrow_request_id
    JOIN assets a ON cbr.asset_id = a.asset_id
    JOIN customers c ON cbr.customer_id = c.customer_id
    WHERE r.repair_status = 'รอดำเนินการ'
    ORDER BY r.repair_report_date DESC`;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async updateRemainingDepositAmountService(customerborrow_request_id, remaining_deposit_amount, slip_url) {
  const sql = `
    UPDATE customer_borrow_request
    SET remaining_deposit_amount = ?, slip_url2 = ?
    WHERE customerborrow_request_id = ?
  `;

  const [rows] = await pool.query(sql, [
    remaining_deposit_amount,  
    slip_url,                  
    customerborrow_request_id  
  ]);

  return rows;
}

async updateDeliveryInfoService(
  customerborrow_request_id,
  rental_contract_url,
  warranty_detail,
  asset_specification,
  asset_id
) {
  // 1) อัปเดตข้อมูลใน customer_borrow_request
  const updateRequestSQL = `
    UPDATE customer_borrow_request
    SET 
      rental_contract_url = ?,
      warranty_detail = ?,
      asset_specification = ?,
      status = 'จัดส่งแล้ว'
    WHERE customerborrow_request_id = ?
  `;

  await pool.query(updateRequestSQL, [
    rental_contract_url,
    warranty_detail,
    asset_specification,
    customerborrow_request_id,
  ]);

  // 2) อัปเดตสถานะทรัพย์สินในตาราง assets
  const updateAssetSQL = `
    UPDATE assets 
    SET status_id = (
      SELECT status_id FROM status WHERE status_name = 'ส่งให้ลูกค้ายืม' LIMIT 1
    )
    WHERE asset_id = ?
  `;

  const [result] = await pool.query(updateAssetSQL, [asset_id]);
  return result;
}

}
