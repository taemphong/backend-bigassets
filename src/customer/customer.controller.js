import { CustomerBorrowService } from "./customer.service.js";

const customerBorrowService = new CustomerBorrowService();

export const createBorrowRequest = async (req, res) => {
  try {
    const {
      customer_id,
      asset_id,
      expected_return_date,
      notes,
      map_url,
      location_description
    } = req.body;

    if (!customer_id || !asset_id || !map_url) {
      return res.status(400).json({ status: "error", message: "ข้อมูลไม่ครบ" });
    }

    const result = await customerBorrowService.createBorrowRequest({
      customer_id,
      asset_id,
      expected_return_date,
      notes,
      map_url,
      location_description
    });

    res.json({ status: "success", message: "ส่งคำขอยืมสำเร็จ", data: result });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
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