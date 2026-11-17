const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const Product = model("Product", new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: "piece" },
  inStock: { type: Boolean, default: true },
}));

const Conversation = model("Conversation", new Schema({
  phone: { type: String, unique: true, index: true },
  handoff: { type: Boolean, default: false },
  messages: [{ role: String, content: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true }));

const Order = model("Order", new Schema({
  phone: String,
  items: [{ name: String, qty: Number }],
  address: String,
  total: Number,
  status: { type: String, enum: ["new", "confirmed", "delivered", "cancelled"], default: "new" },
}, { timestamps: true }));

module.exports = { Product, Conversation, Order };
