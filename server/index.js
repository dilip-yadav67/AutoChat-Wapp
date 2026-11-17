require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/webhook", require("./routes/webhook"));
app.use("/api", require("./routes/api"));

mongoose.connect(process.env.MONGO_URI).then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server chal raha hai: http://localhost:${port}`));
}).catch(e => { console.error("Mongo error:", e.message); process.exit(1); });
