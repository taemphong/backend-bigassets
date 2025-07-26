import { AssetService } from "./asset.service.js";

import dayjs from "dayjs";

export const addassettype = async (req, res) => {
  const { company_code, type_prefix, type_name } = req.body;

  if (!company_code || !type_prefix || !type_name) {
    return res.status(400).json({
      status: "error",
      message: "กรุณาระบุ company_code, type_prefix และ type_name",
    });
  }

  try {
    const { result, type_code } = await new AssetService().addAssetType(
      company_code, type_prefix, type_name
    );

    if (result.affectedRows > 0) {
      res.status(201).json({
        status: "success",
        message: "เพิ่มประเภททรัพย์สินสำเร็จ",
        type_code
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "เพิ่มประเภททรัพย์สินไม่สำเร็จ"
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาด",
      cause: err.message
    });
  }
};

export const GetAllType = async (req, res) => {
  try {
    const result = await new AssetService().getallassettype();
    if (result.length > 0) {
      res.status(200).json({
        status: "success",
        code: 1,
        message: "ดึงข้อมูลสินทรัพย์สำเร็จ",
        result,
      });
    } else {
      res.status(404).json({
        status: "error",
        code: 0,
        message: "ไม่พบข้อมูลสินทรัพย์",
        result: [],
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      code: 0,
      message: "Internal server error",
      cause: err.message,
      result: null,
    });
  }
};

export const addAsset = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ status: 'error', message: 'กรุณาแนบไฟล์รูปภาพ' });

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

      // เพิ่มฟิลด์ vehicle_assets ที่อาจจะมาด้วย
      license_plate,
      engine_no,
      chassis_no,
      registered_date,
      tax_due_date,
      insurance_due_date,
      insurance_provider,
      insurance_policy_no,
      notes,
    } = req.body;

  
    const assetService = new AssetService();

    const { asset_id, asset_code, qr_code_url } = await assetService.createAsset(
      {
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
        // สำหรับ vehicle_assets
        license_plate,
        engine_no,
        chassis_no,
        registered_date,
        tax_due_date,
        insurance_due_date,
        insurance_provider,
        insurance_policy_no,
        notes,
      },
      req.file.path
    );

    return res.status(201).json({
      status: 'success',
      message: 'เพิ่มทรัพย์สินสำเร็จ',
      data: { asset_id, asset_code, qr_code_url },
    });
  } catch (error) {
    console.error('เพิ่มทรัพย์สินล้มเหลว:', error);
    return res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาด',
      error: error.message,
    });
  }
};

export const getAllAssets = async (req, res) => {
  try {
    const result = await new AssetService().getAssets();

    const formatted = result.map((asset) => ({
      ...asset,
      purchase_date: asset.purchase_date ? dayjs(asset.purchase_date).format('DD/MM/YYYY') : null,
      warranty_expire: asset.warranty_expire ? dayjs(asset.warranty_expire).format('DD/MM/YYYY') : null,
      created_at: dayjs(asset.created_at).format('DD/MM/YYYY HH:mm'),
      updated_at: dayjs(asset.updated_at).format('DD/MM/YYYY HH:mm'),
    }));

    res.status(200).json({
      status: "success",
      result: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      cause: error.message,
    });
  }
};

export const getAllStatus = async (req, res) => {
  try {
    const result = await new AssetService().getAllStatus();
    res.status(200).json({
      status: "success",
      message: "ดึงข้อมูล status สำเร็จ",
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาด",
      cause: error.message
    });
  }
};

export const calculateDepreciation = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const { salvage_percent, manual_salvage_value, depreciation_method, useful_life } = req.body;

    if (!depreciation_method || !useful_life) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ useful_life และ depreciation_method' });
    }

    const result = await new AssetService().calculateDepreciation(asset_id, {
      salvage_percent,
      manual_salvage_value,
      depreciation_method,
      useful_life
    });

    return res.status(200).json({
      status: 'success',
      message: 'คำนวณสำเร็จ',
      data: result
    });

  } catch (error) {
    console.error('คำนวณเสื่อมราคาล้มเหลว:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};