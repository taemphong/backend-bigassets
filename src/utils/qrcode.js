import QRCode from 'qrcode';

export const generateQR = async (asset_id) => {
    const qrData = `asset:${asset_id}`;
    const qr_code_base64 = await QRCode.toDataURL(qrData, {
        type: 'image/png', 
        errorCorrectionLevel: 'H',
        width: 300 // กำหนดความชัดเจน
    });
    return qr_code_base64;
};