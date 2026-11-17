const Anthropic = require("@anthropic-ai/sdk");
const { Product } = require("./models");
const client = new Anthropic(); // ANTHROPIC_API_KEY env se leta hai

async function askClaude(history, userText) {
  const products = await Product.find({ inStock: true });
  const catalog = products.map(p => `- ${p.name}: Rs ${p.price}/${p.unit}`).join("\n") || "(catalog khaali hai)";

  const system = `Tum "${process.env.SHOP_NAME}" ke WhatsApp assistant ho.
Customer ki bhasha (Hindi/English/Hinglish) mein chhota, polite jawab do.
Sirf neeche wale catalog ke items aur prices use karo. Kuch alag poochhe ya complaint ho to handoff=true karo.
Order tab confirm karo jab items, quantity aur delivery address teeno mil jayein; tab tak jo missing hai wo poochho.

CATALOG:
${catalog}

HAMESHA sirf valid JSON do, aur kuch nahi:
{"reply":"customer ko bhejne wala text","order":null ya {"items":[{"name":"","qty":0}],"address":""},"handoff":false}`;

  // Claude ko history user se shuru honi chahiye
  let msgs = history.slice(-10).map(m => ({ role: m.role, content: m.content }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  msgs.push({ role: "user", content: userText });

  const res = await client.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5",
    max_tokens: 600,
    system,
    messages: msgs,
  });

  const raw = res.content.filter(b => b.type === "text").map(b => b.text).join("");
  try {
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return { reply: json.reply || "Ek minute, main check karta hoon.", order: json.order || null, handoff: !!json.handoff, products };
  } catch {
    return { reply: raw, order: null, handoff: false, products }; // fallback
  }
}

module.exports = { askClaude };
