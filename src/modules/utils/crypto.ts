import cryptojs from "crypto-js";

export function hashSha256Utf8B64(m: string): string {
  return cryptojs.SHA256(m).toString(cryptojs.enc.Base64);
}
