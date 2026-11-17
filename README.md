# WhatsApp AI Auto-Responder (MERN)

## Setup
1. `cd server && npm install && cp .env.example .env` (values bharo) `&& npm run dev`
2. `cd client && npm install && npm run dev` (dashboard: http://localhost:5173)
3. `ngrok http 3000` -> Meta Developer Console > WhatsApp > Configuration mein
   Callback URL = `https://<ngrok-url>/webhook`, Verify token = .env wala VERIFY_TOKEN,
   aur "messages" field subscribe karo.
4. Dashboard mein Products tab se apna catalog daalo, phir test number se WhatsApp karo.

## Flow
Customer -> Meta webhook -> /webhook -> Claude (catalog + history) -> JSON {reply, order, handoff}
-> order MongoDB mein save -> reply WhatsApp par. Handoff par bot chup, owner ko alert.
