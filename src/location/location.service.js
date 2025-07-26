import { pool } from "../db.js"

export class LocationService {

    async addLocation({ location_name, location_type, address }) {
    const sql = `
      INSERT INTO locations ( location_name, location_type, address)
      VALUES (?, ?, ? )
    `;
    const [result] = await pool.query(sql, [ location_name, location_type, address]);
    return result;
  }

  async getAllLocations() {
    const sql = `SELECT * FROM locations ORDER BY location_name ASC`;
    const [result] = await pool.query(sql);
    return result;
  }
  
}