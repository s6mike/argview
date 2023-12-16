// Save maps in blob store
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";
import { generateMapHash } from "./shared_functions.ts";

export default async (_req: Request, _context: Context) => {
  const upload_timestamp = new Date().toISOString();
  let json_string, map_data, original_root_node_title, map_title, map_id, original_upload_time;

  try {
  if (_req.method === 'POST') {
    json_string = await _req.text(); // Get the raw request body
  } else {
    const params = new URL(_req.url).searchParams,
      param_data = params.get("json_string");
    // map_id = params.get('map_id'),
    // json_url = params.get('json_url'),
    // map_id = params.get('map_id'),
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

      // Remove superfluous data
      map_data.theme = undefined;
      map_data.attr.theme = undefined;
      map_data.title = undefined;
    } catch (error) {
      console.error('Error parsing JSON, error: ' + error);
      return Response.error(); // Unparseable JSON
    }
  } else {
    console.error('No json_string provided in request.');
    return Response.error(); // No json_string provided
  }

  map_id = map_data.map_id;
  if (!map_id) {
    console.log('Calculating hash');
    original_root_node_title = map_data && map_data.original_root_node_title;

    if (original_root_node_title) {
      map_title = original_root_node_title;
    } else {
      console.log('Looking for root_node_title.'); // Is this ever needed? Shouldn't original_title always be written in?
      map_title = (map_data && map_data.ideas[1] && map_data.ideas[1].title) || 'default title';
      map_data.original_root_node_title = map_title; // Adds original_root_node_title to map
    }

    map_id = generateMapHash(map_title);
    map_data.map_id = map_id;
    // console.log('map_id: ' + map_id);
  }

  original_upload_time = map_data.original_upload_time;
  if (!original_upload_time) {
    original_upload_time = upload_timestamp;
    map_data.original_upload_time = original_upload_time;
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
