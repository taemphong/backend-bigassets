import { LocationService } from "./location.service.js";

export const addLocation = async (req, res) => {
  const {  location_name, location_type, address } = req.body;


  try {
    const result = await new LocationService().addLocation({  location_name, location_type, address });

    if (result.affectedRows > 0) {
      res.status(201).json({
        status: "success",
        code: 1,
        message: "เพิ่ม location สำเร็จ",
        location_id: result.insertId
      });
    } else {
      res.status(500).json({
        status: "error",
        code: 0,
        message: "ไม่สามารถเพิ่ม location ได้",
        result: null
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      code: 0,
      message: "Internal server error",
      cause: err.message,
      result: null
    });
  }
};

export const getAllLocations = async (req, res) => {
  try {
    const result = await new LocationService().getAllLocations();

    res.status(200).json({
      status: "success",
      code: 1,
      message: "ดึงข้อมูล location สำเร็จ",
      result
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      code: 0,
      message: "เกิดข้อผิดพลาด",
      cause: err.message
    });
  }
};