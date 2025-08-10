
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const customerImages = upload.fields([
  { name: "customer_image", maxCount: 1 },
  { name: "proof_image", maxCount: 1 },
]);

const loanImages = upload.any();

module.exports = {
  customerImages,
  loanImages,
};