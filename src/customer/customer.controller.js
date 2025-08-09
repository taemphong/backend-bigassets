import { CustomerBorrowService } from "./customer.service.js";
import dayjs from 'dayjs';
import 'dayjs/locale/th.js';
import localeData from 'dayjs/plugin/localeData.js';

dayjs.extend(localeData);
dayjs.locale('th');

const customerBorrowService = new CustomerBorrowService();

export const customercreateBorrowWithUpload = async (req, res) => {
  try {
    const {
      customer_id,
      asset_id,
      map_url,
      manual_address,
      expected_deposit_amount,
      initial_deposit_paid,
      initial_deposit_method,
      initial_deposit_date
    } = req.body;

    const slip_url = req.files?.slip?.[0]?.path || null;
    const customer_id_card = req.files?.idcard?.[0]?.path || null;

    const borrow_request_id = await customerBorrowService.customercreateWithUpload({
      customer_id,
      asset_id,
      map_url,
      manual_address,
      slip_url,
      customer_id_card,
      expected_deposit_amount,
      initial_deposit_paid,
      initial_deposit_method,
      initial_deposit_date
    });

    res.status(201).json({
      status: 'success',
      message: 'สร้างคำขอยืมพร้อมข้อมูลเงินมัดจำเรียบร้อย',
      borrow_request_id
    });
  } catch (error) {
    console.error('createBorrowWithUpload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถสร้างคำขอยืมได้',
      error_detail: error.message
    });
  }
};

export const getCustomerLocations = async (req, res) => {
  try {
    const [rows] = await customerBorrowService.getlocation();

    // ตรวจสอบว่าข้อมูลเป็น object เดียว → แปลงให้เป็น array
    const data = Array.isArray(rows) ? rows : [rows];

    res.status(200).json({
      status: "success",
      data: data, 
    });
  } catch (error) {
    console.error("getCustomerLocations error:", error);
    res.status(500).json({
      status: "error",
      message: "ไม่สามารถดึงข้อมูลพิกัดได้",
      error: error.message,
    });
  }
};


export const getPendingBorrowRequests = async (req, res) => {
  try {
    const rows = await customerBorrowService.getPendingRequestsForAdmin();
    res.status(200).json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("getPendingBorrowRequests error:", error);
    res.status(500).json({
      status: "error",
      message: "ไม่สามารถดึงคำขอยืมลูกค้าได้",
      error: error.message,
    });
  }
};


export const getCustomerList = async (req, res) => {
  try {
    const customers = await customerBorrowService.getcustomer();
    res.status(200).json({ status: 'success', data: customers });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const {
      customer_firstname,
      customer_lastname,
      customer_phone,
      customer_address,
      customer_district,
      customer_province,
      customer_zipcode,
    } = req.body;

    const result = await customerBorrowService.addCustomer({
      customer_firstname,
      customer_lastname,
      customer_phone,
      customer_address,
      customer_district,
      customer_province,
      customer_zipcode,
    });

    res.status(201).json({
      status: "success",
      message: "เพิ่มลูกค้าเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Add customer error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการเพิ่มลูกค้า",
      error_detail: error.message,
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await customerBorrowService.getAllCustomers();
    res.status(200).json({
      status: "success",
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า",
      error_detail: error.message,
    });
  }
};

export const approveBorrowRequest = async (req, res) => {
  try {
    const { customerborrow_request_id } = req.body;

    await customerBorrowService.approveBorrowRequest(customerborrow_request_id);

    res.status(200).json({
      status: "success",
      message: "อนุมัติคำขอยืมเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("approveBorrowRequest error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการอนุมัติคำขอ",
      error_detail: error.message,
    });
  }
};

export const getApprovedBorrowedAssets = async (req, res) => {
  try {
    const result = await customerBorrowService.itemBorrowcustomer();

    // ✅ แปลง warranty_expire เป็นภาษาไทย แล้วแทนที่ของเดิม
    const formattedResult = result.map(item => {
      return {
        ...item,
        warranty_expire: item.warranty_expire
          ? dayjs(item.warranty_expire).format(' D MMMM YYYY')
          : null,
      };
    });

    res.status(200).json({ status: 'success', data: formattedResult });

  } catch (error) {
    console.error("getApprovedBorrowedAssets error:", error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลการยืมของลูกค้าได้',
      error_detail: error.message
    });
  }
};
export const reportRepair = async (req, res) => {
  try {
    const {
      customerborrow_request_id,
      repair_report_date,
      repair_note,
      appointment_date,
      parts_cost,
      service_fee,
      repair_status
    } = req.body;

    const total_cost = parseFloat(parts_cost) + parseFloat(service_fee);

    const result = await customerBorrowService.reportRepair({
      customerborrow_request_id,
      repair_report_date,
      repair_note,
      appointment_date,
      parts_cost,
      service_fee,
      total_cost,
      repair_status
    });

    res.status(200).json({
      status: 'success',
      message: 'บันทึกการแจ้งซ่อมสำเร็จ',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกข้อมูลการซ่อมได้',
      error: error.message
    });
  }
};

export const getRepairProgress = async (req, res) => {
  try {
    const data = await customerBorrowService.getRepairInProgress();
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงรายการซ่อมที่เสร็จแล้วได้',
      error_detail: error.message
    });
  }
};

export const getWaitingForDelivery = async (req, res) => {
  try {
    const data = await customerBorrowService.itemWaitingForDelivery();

    const formatted = data.map(item => ({
      ...item,
      initial_deposit_date: item.initial_deposit_date
        ? dayjs(item.initial_deposit_date).format('D MMM YYYY') // 5 ส.ค. 2025
        : null
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    console.error('Error in getWaitingForDelivery:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลรายการรอจัดส่งได้',
      error_detail: error.message
    });
  }
};

export const updateRemainingDepositAmount = async (req, res) => {
  try {
    const { customerborrow_request_id, remaining_deposit_amount } = req.body;
    const slipFile = req.file;

    // กำหนด path สลิป
    const slip_url = `/uploads2/slip/${slipFile.filename}`;

    // เรียก service
    const result = await customerBorrowService.updateRemainingDepositAmountService(
      customerborrow_request_id,
      remaining_deposit_amount,
      slip_url
    );

    return res.json({
      status: 'success',
      message: 'อัปเดตยอดคงเหลือและแนบสลิปรอบ 2 สำเร็จ',
      slip_url,
      result
    });

  } catch (err) {
    console.error('Update error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในระบบ',
      error: err.message
    });
  }
};

export const updateDeliveryInfo = async (req, res) => {
  try {
    const {
      customerborrow_request_id,
      warranty_detail,
      asset_specification,
      asset_id,
    } = req.body;

    // เก็บ path เต็มของไฟล์ (relative path)
    const rental_contract_url = req.file
      ? `uploads2/contracts/${req.file.filename}`
      : null;

    await customerBorrowService.updateDeliveryInfoService(
      customerborrow_request_id,
      rental_contract_url,
      warranty_detail,
      asset_specification,
      asset_id
    );

    return res.status(200).json({
      status: "success",
      message: "อัปเดตข้อมูลจัดส่งและเอกสารเรียบร้อยแล้ว",
      filePath: rental_contract_url,
    });
  } catch (error) {
    console.error("❌ updateDeliveryInfo error:", error);
    return res.status(500).json({
      status: "error",
      message: "ไม่สามารถอัปเดตข้อมูลได้",
      error: error.message,
    });
  }
};