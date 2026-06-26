import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

function client() {
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");
  if (!verifySid) throw new Error("TWILIO_VERIFY_SID not configured");
  return twilio(accountSid, authToken);
}

export async function startVerification(phoneE164: string): Promise<void> {
  const c = client();
  await c.verify.v2.services(verifySid!).verifications.create({
    to: phoneE164,
    channel: "sms",
  });
}

export async function checkVerification(phoneE164: string, code: string): Promise<boolean> {
  const c = client();
  const check = await c.verify.v2.services(verifySid!).verificationChecks.create({
    to: phoneE164,
    code,
  });
  return check.status === "approved";
}
