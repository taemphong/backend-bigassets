import { BorrowRequestService } from "./borrow_request.service.js";
import dayjs from "dayjs";
import "dayjs/locale/th.js";
import buddhistEra from "dayjs/plugin/buddhistEra.js";

dayjs.extend(buddhistEra);
dayjs.locale("th");

export const addBorrow = async (req, res) => {
  try {
    const borrowData = req.body;
    const { borrow_request_id, borrow_code } =
      await new BorrowRequestService().createBorrowRequest(borrowData);

    res.status(201).json({
      status: "success",
      message: "สร้างใบเบิกสำเร็จ",
      data: {
        borrow_request_id,
        borrow_code,
        status: "รออนุมัติ",
        return_status: "ยังไม่คืน",
      },
    });
  } catch (error) {
    console.error("Add Borrow Error:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });

    // สำหรับ Client ไม่ต้องส่ง SQL error ตรง ๆ
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดภายในระบบ ไม่สามารถสร้างใบเบิกได้",
    });
  }
};

export const getMyBorrowRequests = async (req, res) => {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาส่ง employee_id มาด้วย",
      });
    }

    const borrowRequests = await new BorrowRequestService().getBorrowByEmployee(
      employee_id
    );

    // แปลงวันที่ให้เป็น readable format
    const formattedRequests = borrowRequests.map((item) => {
      const isValidDate = (date) =>
        date &&
        date !== "0000-00-00" &&
        date !== "0000-00-00 00:00:00" &&
        dayjs(date).isValid() &&
        dayjs(date).year() > 1900; // กรอง 1899-11-30 หรือวัน fallback อื่น ๆ

      return {
        ...item,
        request_date: isValidDate(item.request_date)
          ? dayjs(item.request_date).format("YYYY-MM-DD HH:mm")
          : null,
        expected_return_date: isValidDate(item.expected_return_date)
          ? dayjs(item.expected_return_date).format("YYYY-MM-DD")
          : "ไม่กำหนด",
        return_date: isValidDate(item.return_date)
          ? dayjs(item.return_date).format("YYYY-MM-DD")
          : null,
        approve_date: isValidDate(item.approve_date)
          ? dayjs(item.approve_date).format("YYYY-MM-DD HH:mm")
          : null,
        confirm_return_date: isValidDate(item.confirm_return_date)
          ? dayjs(item.confirm_return_date).format("YYYY-MM-DD HH:mm")
          : null,
      };
    });

    res.status(200).json({
      status: "success",
      data: formattedRequests,
    });
  } catch (error) {
    console.error("getMyBorrowRequests error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });

    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      error_detail: error.sqlMessage || error.message,
    });
  }
};

export const getAllBorrowRequests = async (req, res) => {
  try {
    const borrowRequests = await new BorrowRequestService().AdmingetAllBorrowRequests();

    const isValidDate = (date) =>
      date &&
      date !== "0000-00-00" &&
      date !== "0000-00-00 00:00:00" &&
      dayjs(date).isValid() &&
      dayjs(date).year() > 1900;

    const formattedRequests = borrowRequests.map((item) => ({
      ...item,
      request_date: isValidDate(item.request_date)
        ? dayjs(item.request_date).format("YYYY-MM-DD HH:mm")
        : null,
      expected_return_date: isValidDate(item.expected_return_date)
        ? dayjs(item.expected_return_date).format("YYYY-MM-DD")
        : "ไม่กำหนด",
      return_date: isValidDate(item.return_date)
        ? dayjs(item.return_date).format("YYYY-MM-DD")
        : null,
      approve_date: isValidDate(item.approve_date)
        ? dayjs(item.approve_date).format("YYYY-MM-DD HH:mm")
        : null,
      confirm_return_date: isValidDate(item.confirm_return_date)
        ? dayjs(item.confirm_return_date).format("YYYY-MM-DD HH:mm")
        : null,
      employee_name: `${item.first_name} ${item.last_name}`,
    }));

    res.status(200).json({
      status: "success",
      data: formattedRequests,
    });
  } catch (error) {
    console.error("getAllBorrowRequests error:", {
      message: error.message,
      sqlMessage: error.sqlMessage,
    });
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลทั้งหมด",
      error_detail: error.sqlMessage || error.message,
    });
  }
};
export const approveBorrow = async (req, res) => {
  try {
    const { borrow_request_id, asset_id } = req.body;

    if (!borrow_request_id || !asset_id) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาส่ง borrow_request_id และ asset_id มาด้วย",
      });
    }

    const result = await new BorrowRequestService().approveBorrow(
      borrow_request_id,
      asset_id
    );

    res.status(200).json({
      status: "success",
      message: "อนุมัติคำขอเบิกสำเร็จ",
      result,
    });
  } catch (error) {
    console.error("approveBorrow error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการอนุมัติ",
      error_detail: error.sqlMessage || error.message,
    });
  }
};

export const requestReturn = async (req, res) => {
  const { borrow_request_id } = req.body;

  if (!borrow_request_id) {
    return res.status(400).json({
      status: "error",
      message: "กรุณาระบุ borrow_request_id",
    });
  }

  try {
    const result = await new BorrowRequestService().return_borrow(
      borrow_request_id
    );
    res.json({
      status: "success",
      message: "ส่งคำขอคืนสำเร็จ",
      result,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการส่งคำขอคืน",
    });
  }
};

export const approveReturn = async (req, res) => {
  const { borrow_request_id } = req.body;

  if (!borrow_request_id) {
    return res.status(400).json({
      status: "error",
      message: "กรุณาระบุ borrow_request_id",
    });
  }

  try {
    const result = await new BorrowRequestService().approve_return(
      borrow_request_id
    );
    res.json({
      status: "success",
      message: "อนุมัติการคืนสำเร็จ",
      result,
    });
  } catch (error) {
    console.error("Error Approving Return:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการอนุมัติคืน",
    });
  }
};

export const getPendingReturnRequests = async (req, res) => {
  try {
    const result = await new BorrowRequestService().getPendingReturnRequests();

    const formatDateTime = (date) =>
      date ? dayjs(date).format("D MMM BBBB เวลา HH:mm") : null;

    const formattedResult = result.map((row) => ({
      ...row,
      request_date: formatDateTime(row.request_date),
      expected_return_date: formatDateTime(row.expected_return_date),
      approve_date: formatDateTime(row.approve_date),
    }));

    res.json({
      status: "success",
      data: formattedResult,
    });
  } catch (error) {
    console.error("Error fetching pending returns:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในการดึงคำขอคืน",
    });
  }
};

