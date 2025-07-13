import axios from "axios";

export function sendPhoneVerificationOTP(to: number | string, otp: number | string) {
  const url = `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: String(to),
    type: "template",
    template: {
      name: "phone_verification",
      language: { code: "en_US" },
      components: [{ type: "body", parameters: [{ type: "text", text: String(otp) }] }],
    },
  };

  return axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}
