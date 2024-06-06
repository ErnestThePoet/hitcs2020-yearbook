import cryptojs from "crypto-js";

export function hashSha256Utf8Hex(m: string): string {
  return cryptojs.SHA256(m).toString(cryptojs.enc.Hex);
}
