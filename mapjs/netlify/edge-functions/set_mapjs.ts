// Save maps in blob store
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";
import { generateMapHash } from "./shared_functions.ts";

export default async (_req: Request, _context: Context) => {
  let json_string, map_data, original_root_node_title, map_title, map_id;

  try {
    if (_req.method === 'POST') {
      json_string = await _req.text(); // Get the raw request body
    } else {
      const params = new URL(_req.url).searchParams,
        param_data = params.get("json_string");
      original_root_node_title = params.get('original_root_node_title');
      if (param_data !== null) {
        json_string = decodeURIComponent(param_data);
      }
    }
    // QUESTION: Can I standardise this call across functions?
    const store_mapjs = getStore({
      name: "mapjs"
    });

    if (json_string) {
      try {
        map_data = JSON.parse(json_string);
      } catch (error) {
        console.error('Error parsing JSON, error: ' + error);
        return Response.error(); // Unparseable JSON
      }
    } else {
      console.error('No json_string provided in request.');
      return Response.error(); // No json_string provided
    };

    if (map_data) {
      map_id = map_data.map_id;
      if (!map_id) {
        original_root_node_title = map_data.original_root_node_title;

        if (original_root_node_title) {
          map_title = original_root_node_title;
        } else {
          map_title = (map_data.ideas[1] && map_data.ideas[1].title) || 'default title';
          map_data.original_root_node_title = map_title; // Adds original_root_node_title to map
        }

        map_id = await generateMapHash(map_title);
        map_data.map_id = map_id;
      }
    }

    try {
      // QUESTION: Write metadata too?
      await store_mapjs.setJSON(map_id, map_data);
      console.log('Saved map: ' + map_id);
    } catch (error) {
      console.error('Saving data for ' + map_id + ' failed, error: ' + error);
      return Response.error(); // Request failed
    }

    const response = {
      map_title: map_data.original_root_node_title,
      map_id: map_data.map_id,
      message: "'" + map_data.original_root_node_title + "' set in mapjs JSON store as hash: " + map_data.map_id
    };

    return new Response(JSON.stringify(response));
  } catch (error) {
    console.error('Request failed, error: ' + error);
    return Response.error(); // Request failed
  }
};
