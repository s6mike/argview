// Get maps from blob store

import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";
import { generateMapHash } from "./shared_functions.ts";

export default async (_req: Request, _context: Context) => {
  // QUESTION: can I standardise this across functions?
  const store_mapjs = getStore({
    name: "mapjs",
  }); 
  const params = new URL(_req.url).searchParams,
    original_root_node_title = params.get("ornt"),
    map_id = params.get("map_id") || (original_root_node_title && generateMapHash(original_root_node_title));
  let blob;

  if (map_id) {
    try {
      blob = await store_mapjs.getWithMetadata(map_id, { type: 'json' });
    } catch (error) {
      console.error('Failed to retrieve map ' + map_id + ' with error: ' + error)
      return Response.error();
    }
    const map_data = blob && blob.data;
    if (map_data) {
      map_data.map_id = map_id;
      console.log('Retrieved map: ' + map_id);
      return Response.json(map_data);
    } else {
      console.error('Failed to retrieve map: ' + map_id);
      return undefined;
    }
  } else {
    console.error('No map id.');
    return undefined;
  };
};
