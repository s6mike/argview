// Utility functions used by more than 1 edge function
import { crypto } from "https://deno.land/std@0.210.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.210.0/encoding/hex.ts";

// Function to generate a sha256 hash based on input data
export async function generateHash(inputData: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256", // Using SHA-256 hashing algorithm
    new TextEncoder().encode(inputData),
  );

  return encodeHex(hash); // Return the hash value in hexadecimal format
}

// Function to generate a map hash based on map_title
export async function generateMapHash(map_title: string): Promise<string> {
  // TODO: Use env var for mapjson_
  const hash = await generateHash(map_title);

  return 'mapjson_' + hash.substring(0, 10);;
}

export default async function gmh_online(map_title: string): Promise<string> {
  const map_hash = await generateMapHash(map_title);
  return map_hash;
}

