// Utility functions used by more than 1 edge function
import crypto from "crypto";

// Function to generate a sha256 hash based on input data
export function generateShortHash(inputData: string): string {
  const hash = crypto.createHash('sha256'); // Using SHA-256 hashing algorithm
  hash.update(inputData);
  return hash.digest('hex'); // Return the hash value in hexadecimal format
}

// Function to generate a map hash based on map_title
export function generateMapHash(map_title: string): string {
  return 'mapjson_' + generateShortHash(map_title).substring(0, 10);
}

export default function gmh_online(map_title: string): string {
  return generateMapHash(map_title);
}

