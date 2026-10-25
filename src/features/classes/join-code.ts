import { randomInt } from "node:crypto";

/**
 * Class join codes.
 *
 * Codes are 8 characters from an alphabet with no look-alike characters
 * (no I/L/1, O/0), stored normalized without a dash ("K7QPM3XA") and shown to
 * people with a dash in the middle ("K7QP-M3XA"). 31^8 ≈ 850 billion
 * combinations, so guessing a live code isn't practical.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Accepts what a person typed ("k7qp-m3xa ", "K7QPM3XA") and returns the stored form. */
export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "K7QPM3XA" → "K7QP-M3XA" */
export function formatJoinCode(code: string): string {
  return code.length === LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}
