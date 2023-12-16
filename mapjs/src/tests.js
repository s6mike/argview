global.fetch = require('node-fetch');
// global.PATH_FILE_CONFIG_MAPJS = '../config/config-mapjs.yaml';
const { loadJson } = require('./core/util/mapjs-utilities.js'),

  // module.exports = {
  test_loadJson = async function () {
    'use strict';

    const map_id = 'mapjson_50d858e098',
      request_url = 'http://localhost:9002/gm?map_id=' + map_id,
      actual_json = await loadJson(request_url),
      expected_json_string = '{"map_id":"mapjson_50d858e098","formatVersion":3,"id":"root","ideas":{"1":{"id":1,"title":"example","attr":{}}},"attr":{},"title":""}',
      actual_json_string = JSON.stringify(actual_json);

    // console.log(actual_json_string);
    // console.log(expected_json_string);
    return actual_json_string === expected_json_string;
  };

test_loadJson()
  .then(result => {
    'use strict';
    console.log(result);
  })
  .catch(err => {
    'use strict';
    console.log(err);
  });
