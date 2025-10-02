const axios = require("axios");
const { logger } = require("../config/logger");

const otpStore = {};

exports.sendOtp = async (req, res) => {
  const { phone, name } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ message: "Phone number and customer name are required." });
  }

  const mobileNumber = `91${phone.slice(-10)}`;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
  otpStore[mobileNumber] = {
    otp: otp,
    expires: Date.now() + 5 * 60 * 1000,
  };
  const encodedName = encodeURIComponent(name);
  logger.info(`[OTP] Generated OTP ${otp} for ${encodedName} (${mobileNumber}).`);
  res.status(200).json({ message: "OTP sent successfully." });
  //const msg91ApiUrl = `https://api.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${mobileNumber}&authkey=${process.env.MSG91_AUTH_KEY}&otp=${otp}&name=${encodedName}`;

  // try {
  //   const response = await axios.get(msg91ApiUrl);

  //   if (response.data.type === 'success') {
  //     logger.info(`[OTP] Successfully sent OTP to ${encodedName} (${mobileNumber}) via MSG91.`);
  //     res.status(200).json({ message: "OTP sent successfully." });
  //   } else {
  //     throw new Error(response.data.message || 'MSG91 API error');
  //   }
  // } catch (error) {
  //   logger.error(`[OTP] Failed to send OTP to ${mobileNumber}: ${error.message}`);
  //   res.status(500).json({ message: "Failed to send OTP." });
  // }
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone number and OTP are required." });
  }

  const mobileNumber = `91${phone.slice(-10)}`;
  const storedOtpData = otpStore[mobileNumber];

  if (!storedOtpData) {
    logger.warn(`[OTP] Verification failed for ${mobileNumber}: No OTP found.`);
    return res.status(400).json({ message: "Invalid or expired OTP. Please try again." });
  }

  if (Date.now() > storedOtpData.expires) {
    logger.warn(`[OTP] Verification failed for ${mobileNumber}: OTP expired.`);
    delete otpStore[mobileNumber]; 
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  if (storedOtpData.otp !== otp) {
    logger.warn(`[OTP] Verification failed for ${mobileNumber}: Incorrect OTP.`);
    return res.status(400).json({ message: "Incorrect OTP entered." });
  }

  delete otpStore[mobileNumber];
  logger.info(`[OTP] Successfully verified OTP for ${mobileNumber}.`);
  res.status(200).json({ message: "OTP verified successfully." });
};
