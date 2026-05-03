import argon2 from "argon2";

/**
 * Password hashing.
 *
 * argon2id with reasonable defaults — memory-hard, GPU-resistant, the modern
 * choice. If you ever migrate from another scheme, add a column for legacy
 * hashes and rehash on next login.
 */

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  // Sensible production defaults. Don't tune these without measuring on
  // Railway's dyno — increasing memoryCost too far makes login slow.
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // Malformed hash etc. — never reveal details to the caller.
    return false;
  }
}
