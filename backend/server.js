const express = require("express");
const cors = require("cors");
require("dotenv").config(); 


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const ornamentRoutes = require("./routes/ornament.routes");
const karatRoutes = require("./routes/karat.routes");
const goldRateRoutes = require("./routes/goldRate.routes");
const loanRoutes = require("./routes/loan.routes");
const userRoutes = require("./routes/user.routes");
const utilityRoutes = require("./routes/utility.routes");
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/ornaments", ornamentRoutes);
app.use("/api/karats", karatRoutes);
app.use("/api/gold-rates", goldRateRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/users", userRoutes); 
app.use("/api", utilityRoutes); 

app.listen(PORT, () => {
  console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});