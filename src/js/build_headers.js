const path_template_headers = '../headers/_headers_template',
  path_webpack_dist_tags = '../layouts/includes/webpack-dist-tags.html',
  path_headers_output = '../../mapjs/public/_headers',
  integrity_element = 'script-src-elem',
  re_integrity_attribute = /integrity="(sha[0-9]{3}-[A-Za-z0-9+/]+={0,3})"/g,
  fs = require('fs'),
  path = require('path'),
  resolved_path_webpack_dist_tags = path.resolve(__dirname, path_webpack_dist_tags),
  headersPath = path.resolve(__dirname, path_headers_output),
  resolved_template_headers = path.resolve(__dirname, path_template_headers);
// { execSync } = require('child_process');

// Run the webpack build command to generate the integrity hashes
// execSync('npx webpack --config webpack.config.js', { stdio: 'inherit' });
let integrityHashes = '', template_headers_content = '', output_string_policy = integrity_element;

// Read the generated integrity hashes from the webpack output file
try {
  const webpackOutput = fs.readFileSync(resolved_path_webpack_dist_tags, 'utf-8');
  integrityHashes = webpackOutput.matchAll(re_integrity_attribute);
} catch (error) {
  console.error("Can't find webpack output file: " + resolved_path_webpack_dist_tags);
}

// Generate output_string_policy
if (integrityHashes) {
  for (const hash of integrityHashes) {
    output_string_policy += ' \'' + hash[1] + '\'';
  }
  output_string_policy += ';';
}

// Read template_headers
try {
  template_headers_content = fs.readFileSync(resolved_template_headers, 'utf-8');
} catch (error) {
  console.error("Can't find headers template: " + resolved_template_headers);
}

// Replace ${script-src-elem} in template_headers with the generated output_string_policy
const re_string_template = '\\${' + integrity_element + '}', // matches e.g. ${script-src-elem}
  re_template_update = new RegExp(re_string_template, "g"),
  // output_headers_content = template_headers_content.replace(/\${${integrity_element}}/, output_string_policy);
  output_headers_content = template_headers_content.replace(re_template_update, output_string_policy);

fs.writeFileSync(headersPath, output_headers_content);
