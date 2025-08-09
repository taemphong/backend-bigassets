import { pool } from "../db.js";
import { generateQR } from "../utils/qrcode.js";

export class AssetService {

  async addAssetType(company_code, type_prefix, type_name) {
    const countSql = `
    SELECT COUNT(*) as count
    FROM asset_types
    WHERE company_code = ? AND type_prefix = ?
  `;
    const [[countRow]] = await pool.query(countSql, [
      company_code,
      type_prefix,
    ]);

    const nextNumber = String(countRow.count + 1).padStart(3, "0");
    const type_code = `${company_code}-${type_prefix}-${nextNumber}`;

    const insertSql = `
    INSERT INTO asset_types (company_code, type_code, type_prefix, type_name)
    VALUES (?, ?, ?, ?)
  `;
    const [result] = await pool.query(insertSql, [
      company_code,
      type_code,
      type_prefix,
      type_name,
    ]);

    return { result, type_code };
  }

  async createAsset(data, image_path) {
  const {
    asset_name,
    type_id,
    brand,
    model,
    employee_id,
    location_id,
    zone,
    room_zone,
    use_zone,
    purchase_date,
    warranty_expire,
    purchase_price,
    useful_life,
    status_id,

    // สำหรับ vehicle_assets เพิ่มฟิลด์เหล่านี้ใน form ด้วย
    license_plate,
    engine_no,
    chassis_no,
    registered_date,
    tax_due_date,
    insurance_due_date,
    insurance_provider,
    insurance_policy_no,
    notes,
  } = data;

  // ดึงข้อมูลประเภท
  const [[typeRow]] = await pool.query(
    `SELECT company_code, type_prefix, type_name FROM asset_types WHERE type_id = ?`,
    [type_id]
  );
  const { company_code, type_prefix, type_name } = typeRow;

  // สร้าง asset_code แบบ auto
  const [[maxRow]] = await pool.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(asset_code, '-', -1) AS UNSIGNED)) AS max_no
     FROM assets a JOIN asset_types t ON a.type_id = t.type_id
     WHERE t.company_code = ? AND t.type_prefix = ?`,
    [company_code, type_prefix]
  );
  const nextNumber = String((maxRow.max_no || 0) + 1).padStart(3, "0");
  const asset_code = `${company_code}-${type_prefix}-${nextNumber}`;

  // เพิ่ม asset
  const [result] = await pool.query(
    `INSERT INTO assets (
      asset_code, asset_name, type_id, brand, model, employee_id, location_id,zone,room_zone, use_zone,
      purchase_date, warranty_expire, purchase_price, useful_life, salvage_value,
      depreciation_method, status_id, image_url, annual_depreciation, net_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset_code,
      asset_name,
      type_id,
      brand,
      model,
      employee_id,
      location_id,
      zone,
      room_zone,
      use_zone,
      purchase_date,
      warranty_expire,
      purchase_price,
      useful_life || null,
      null,
      null,
      status_id,
      image_path,
      null,
      null,
    ]
  );

  const asset_id = result.insertId;

  // ✅ เพิ่ม vehicle_assets ถ้าเป็นประเภทรถ
  if (["ทรัพย์สินประเภทรถ"].includes(type_name)) {
    await pool.query(
      `INSERT INTO vehicle_assets (
        asset_id, license_plate, engine_no, chassis_no, registered_date,
        tax_due_date, insurance_due_date, insurance_provider, insurance_policy_no, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_id,
        license_plate,
        engine_no,
        chassis_no,
        registered_date,
        tax_due_date,
        insurance_due_date,
        insurance_provider,
        insurance_policy_no,
        notes,
      ]
    );
  }

  // สร้าง QR code
  const qr_code_url = await generateQR(asset_id);
  await pool.query(`UPDATE assets SET qr_code_url = ? WHERE asset_id = ?`, [
    qr_code_url,
    asset_id,
  ]);

  return {
    asset_id,
    asset_code,
    company_code,
    type_prefix,
    type_name,
    qr_code_url,
  };
}

  async getAssets() {
  const sql = `
    SELECT 
      a.asset_id,
      a.asset_code,
      a.asset_name,
      a.brand,
      a.model,
      a.image_url,
      a.qr_code_url,
      a.purchase_date,
      a.warranty_expire,
      a.purchase_price,
      a.useful_life,
      a.salvage_value,
      a.depreciation_method,
      a.annual_depreciation,
      a.net_value,
      a.created_at,
      a.updated_at,
      e.first_name AS employee_first_name,
      e.last_name AS employee_last_name,
      l.location_name,
      l.location_type,
      s.status_name,
      t.type_name,

      -- ข้อมูลผู้เบิกล่าสุด
      br.employee_id AS borrower_id,
      be.first_name AS borrower_firstname,
      be.last_name AS borrower_lastname,
      br.request_date AS borrow_date,
      br.expected_return_date AS expected_return_date,

      -- ข้อมูล vehicle_assets เพิ่มเติม
      va.vehicle_id,
      va.license_plate,
      va.engine_no,
      va.chassis_no,
      va.registered_date,
      va.tax_due_date,
      va.insurance_due_date,
      va.insurance_provider,
      va.insurance_policy_no,
      va.notes AS vehicle_notes

      
    FROM assets a
    LEFT JOIN asset_types t ON a.type_id = t.type_id
    LEFT JOIN employees e ON a.employee_id = e.employee_id
    LEFT JOIN locations l ON a.location_id = l.location_id
    LEFT JOIN status s ON a.status_id = s.status_id

    -- JOIN คำขอเบิกล่าสุดที่สถานะยัง "อนุมัติ" และยัง "ไม่คืน"
    LEFT JOIN (
      SELECT br1.*
      FROM borrow_requests br1
      INNER JOIN (
        SELECT asset_id, MAX(borrow_request_id) AS latest_borrow
        FROM borrow_requests
        WHERE status = 'อนุมัติ' AND return_status = 'ยังไม่คืน'
        GROUP BY asset_id
      ) latest ON br1.asset_id = latest.asset_id AND br1.borrow_request_id = latest.latest_borrow
    ) br ON br.asset_id = a.asset_id

    LEFT JOIN employees be ON br.employee_id = be.employee_id

    -- JOIN vehicle_assets ถ้ามี (เฉพาะทรัพย์สินที่เป็นยานพาหนะ)
    LEFT JOIN vehicle_assets va ON a.asset_id = va.asset_id

    ORDER BY a.asset_id DESC;
  `;

  const [result] = await pool.query(sql);
  return result;
}

  async getAllStatus() {
    const [rows] = await pool.query(
      `SELECT * FROM status ORDER BY status_id ASC`
    );
    return rows;
  }

  async calculateDepreciation(
    asset_id,
    { salvage_percent, manual_salvage_value, depreciation_method, useful_life }
  ) {
    const [[asset]] = await pool.query(
      `SELECT purchase_price FROM assets WHERE asset_id = ?`,
      [asset_id]
    );
    if (!asset) throw new Error("ไม่พบทรัพย์สิน");

    const { purchase_price } = asset;

    let salvage_value = manual_salvage_value
      ? parseFloat(manual_salvage_value)
      : parseFloat((purchase_price * (salvage_percent / 100)).toFixed(2));

    const annual_depreciation = parseFloat(
      ((purchase_price - salvage_value) / useful_life).toFixed(2)
    );

    const annual_depreciation_list = [];
    let remaining_value = purchase_price;

    for (let year = 1; year <= useful_life; year++) {
      let depreciation = annual_depreciation;

      if (year === useful_life) {
        // ปีสุดท้ายคงเหลือ = salvage_value
        depreciation = parseFloat((remaining_value - salvage_value).toFixed(2));
        remaining_value = salvage_value;
      } else {
        remaining_value = parseFloat(
          (remaining_value - depreciation).toFixed(2)
        );
      }

      annual_depreciation_list.push({
        year,
        depreciation,
        remaining_value,
      });
    }

    // update summary ปีแรก
    await pool.query(
      `
    UPDATE assets SET useful_life = ?, salvage_value = ?, depreciation_method = ?, 
    annual_depreciation = ?, net_value = ? WHERE asset_id = ?`,
      [
        useful_life,
        salvage_value,
        depreciation_method,
        annual_depreciation,
        annual_depreciation_list[0].remaining_value,
        asset_id,
      ]
    );

    return {
      annual_depreciation_list,
      salvage_value,
    };
  }

  async getallassettype() {
    const sql = `
      SELECT 
        type_id,
        company_code,
        type_code,
        type_prefix,
        type_name,
        created_at,
        updated_at
      FROM asset_types
      ORDER BY type_id DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }
}
