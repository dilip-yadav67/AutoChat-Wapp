const axios = require("axios");

async function sendText(to, body) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, text: { body } },
    { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
  );
}

module.exports = { sendText };
