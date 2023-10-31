#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# aliases
alias ai='app_install'

# Replace echo with this where not piping output
app_install() { # ai ./yq https://github.com/mikefarah/yq/releases/download/v4.30.8/yq_linux_amd64
  app_path="$1"
  app_url="$2"
  mkdir -p "$(dirname "$app_path")"
  wget -qO "$app_path" "$app_url"
  chmod +x "$app_path"
}

export -f app_install
