import { createSign } from "crypto";

type ServiceAccount = { client_email: string; private_key: string };

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

async function accessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${b64url(signature)}`,
  });
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("no Google access token");
  return data.access_token;
}

export async function appendSaleRow(row: (string | number)[]) {
  const sheetId = process.env.SALES_SHEET_ID;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!sheetId || !raw) return false;
  try {
    const token = await accessToken(JSON.parse(raw) as ServiceAccount);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sales!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ values: [row] }),
      }
    );
    return res.ok;
  } catch (error) {
    console.error("sheet append failed", error);
    return false;
  }
}
