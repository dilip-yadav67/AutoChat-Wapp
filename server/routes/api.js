const router = require("express").Router();
const { Product, Conversation, Order } = require("../models");

router.use((req, res, next) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) return res.sendStatus(401);
  next();
});

router.get("/orders", async (_, res) => res.json(await Order.find().sort("-createdAt").limit(100)));
router.patch("/orders/:id", async (req, res) =>
  res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })));

router.get("/conversations", async (_, res) => res.json(await Conversation.find().sort("-updatedAt").limit(50)));
router.patch("/conversations/:id/resume", async (req, res) =>
  res.json(await Conversation.findByIdAndUpdate(req.params.id, { handoff: false }, { new: true })));

router.get("/products", async (_, res) => res.json(await Product.find()));
router.post("/products", async (req, res) => res.json(await Product.create(req.body)));
router.patch("/products/:id", async (req, res) =>
  res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete("/products/:id", async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.sendStatus(204); });

module.exports = router;
