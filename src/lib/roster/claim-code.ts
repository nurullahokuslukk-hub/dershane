import { randomInt } from "node:crypto";

// Karışması kolay karakterler (0/O, 1/I) çıkarıldı — kod insan tarafından
// elle girilecek (bkz. /claim ekranı).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateClaimCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
