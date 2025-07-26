import { pool } from '../db.js';

export const getAssetsWithIds = async (ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT 
      asset_id,
      asset_code,
      asset_name,
      (SELECT type_name FROM asset_types WHERE type_id = a.type_id) AS type_name,
      qr_code_url
    FROM assets a
    WHERE asset_id IN (${placeholders})
  `;
  const [rows] = await pool.query(sql, ids);
  return rows;
};