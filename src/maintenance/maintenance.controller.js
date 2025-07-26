import { MaintenanceService } from "./maintenance.service.js";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import 'dayjs/locale/th.js';
import buddhistEra from 'dayjs/plugin/buddhistEra.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.locale('th');

export const reportMaintenanceController = async (req, res) => {
  try {
    const { asset_id, reporter_name, reporter_contact, assigned_to, issue_description } = req.body;

    if (!asset_id || !issue_description) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }

    const result = await new MaintenanceService().reportMaintenance({
      asset_id,
      reporter_name,
      reporter_contact,
      assigned_to,
      issue_description
    });

    res.status(200).json({
      status: 'success',
      message: 'แจ้งซ่อมเรียบร้อยแล้ว',
      data: result
    });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการแจ้งซ่อม:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      stack: err.stack
    });

    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการแจ้งซ่อม',
      error: {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlMessage: err.sqlMessage
      }
    });
  }
};

const formatThaiDate = (date) =>
  dayjs(date).tz('Asia/Bangkok').format('D MMMM BBBB เวลา HH:mm');

export const getTechnicianMaintenanceList = async (req, res) => {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ employee_id' });
    }

    const result = await new MaintenanceService().getRequestsByTechnician(employee_id);

    const formatted = result.map(item => ({
      ...item,
      request_date: item.request_date ? formatThaiDate(item.request_date) : null,
      assigned_date: item.assigned_date ? formatThaiDate(item.assigned_date) : null,
      completed_date: item.completed_date ? formatThaiDate(item.completed_date) : null,
    }));

    res.status(200).json({
      status: 'success',
      message: 'ดึงรายการแจ้งซ่อมของช่างสำเร็จ',
      data: formatted
    });
  } catch (err) {
    console.error('Error getTechnicianMaintenanceList:', err);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงรายการแจ้งซ่อม',
      error: err.message
    });
  }
};
