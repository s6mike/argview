#!/bin/bash

directory="mapjs/public/output/mapjs-json"

for file in "$directory"/*.json; do
  filename=$(basename "$file")
  desired_field=$(jq -r '.theme' "$file")
  echo "$filename: $desired_field" >>extracted_fields.txt
  # echo "$desired_field" >>extracted_fields.txt # Storing extracted fields in a file
done
