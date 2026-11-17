const router = require("express").Router();
const { Conversation, Order } = require("../models");
const { askClaude } = require("../ai");
const { sendText } = require("../whatsapp");

// Meta verification
router.get("/", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) return res.send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

const seen = new Set(); // Meta kabhi kabhi same message dobara bhejta hai

router.post("/", async (req, res) => {
  res.sendStatus(200); // turant 200

  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || seen.has(msg.id)) return;
    seen.add(msg.id);
    if (seen.size > 1000) seen.clear();

    const phone = msg.from;
    if (msg.type !== "text") {
      return sendText(phone, "Abhi main sirf text message samajh sakta hoon. Kripya likh kar bataiye 🙏");
    }
    const text = msg.text.body;

    const conv = (await Conversation.findOne({ phone })) || new Conversation({ phone });
    conv.messages.push({ role: "user", content: text });

    // Handoff mode: bot chup, owner dekh raha hai
    if (conv.handoff) return void (await conv.save());

    const history = conv.messages.slice(0, -1);
    const ai = await askClaude(history, text);

    if (ai.order?.items?.length && ai.order.address) {
      const total = ai.order.items.reduce((sum, it) => {
        const p = ai.products.find(x => x.name.toLowerCase() === it.name.toLowerCase());
        return sum + (p ? p.price * it.qty : 0);
      }, 0);
      const order = await Order.create({ phone, items: ai.order.items, address: ai.order.address, total });
      if (process.env.OWNER_PHONE)
        sendText(process.env.OWNER_PHONE, `🛒 Naya order #${order._id.toString().slice(-5)} from ${phone}\nTotal: Rs ${total}`).catch(() => {});
    }

    if (ai.handoff) {
      conv.handoff = true;
      if (process.env.OWNER_PHONE)
        sendText(process.env.OWNER_PHONE, `⚠️ ${phone} ko aapki zaroorat hai: "${text}"`).catch(() => {});
    }

    conv.messages.push({ role: "assistant", content: ai.reply });
    await conv.save();
    await sendText(phone, ai.reply);
  } catch (e) {
    console.error("Webhook error:", e.response?.data || e.message);
  }
});

module.exports = router;
