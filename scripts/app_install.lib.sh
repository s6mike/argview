#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# aliases
alias ai='app_install'

app_install() { # ai ./yq https://github.com/mikefarah/yq/releases/download/v4.30.8/yq_linux_amd64
  download_dir="${1:-.}"
  app_url="$2"
  wget -qP "$download_dir" "$app_url"
  filename=${app_url##*/}
  app_path="$download_dir/$filename"

  case "$filename" in
  *.tar.gz)
    # app_unzip "$app_path" "${app_path%.*.*}"
    # tar -zxf "$app_path"
    # app_path="${app_path%.*}"
    ;;
  *)
    chmod 744 "$app_path"
    ;;
  esac

  echo "$app_path"
}

app_unzip() {
  file_path="$1"
  app_path="$2"
  target_dir=$(dirname "$file_path")

  tar -zxf "$file_path" --directory "$target_dir"
  chmod 744 "$app_path"
}

export -f app_install app_unzip
