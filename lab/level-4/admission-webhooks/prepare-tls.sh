#!/usr/bin/env bash
set -euo pipefail
umask 077

namespace=${1:?Usage: bash prepare-tls.sh LAB_NAMESPACE EMPTY_DIRECTORY}
directory=${2:?Supply an existing empty private directory}
case "$namespace" in
  lab-admission|lab-conversion) ;;
  *) printf 'Refusing an unexpected namespace\n' >&2; exit 1 ;;
esac
test -d "$directory"
if [[ -n $(ls -A "$directory") ]]; then
  printf 'Refusing to overwrite a nonempty certificate directory\n' >&2
  exit 1
fi

openssl req -x509 -newkey rsa:2048 -nodes -days 2 \
  -keyout "$directory/ca.key" -out "$directory/ca.crt" \
  -subj /CN=lab-webhook-ca \
  -addext 'basicConstraints=critical,CA:TRUE' \
  -addext 'keyUsage=critical,keyCertSign,cRLSign'
openssl req -new -newkey rsa:2048 -nodes \
  -keyout "$directory/tls.key" -out "$directory/server.csr" \
  -subj "/CN=webhook.$namespace.svc"
printf 'subjectAltName=DNS:webhook.%s.svc\nextendedKeyUsage=serverAuth\nbasicConstraints=CA:FALSE\n' \
  "$namespace" > "$directory/server.ext"
openssl x509 -req -days 2 -in "$directory/server.csr" \
  -CA "$directory/ca.crt" -CAkey "$directory/ca.key" -CAcreateserial \
  -out "$directory/tls.crt" -extfile "$directory/server.ext"
openssl verify -CAfile "$directory/ca.crt" \
  -verify_hostname "webhook.$namespace.svc" "$directory/tls.crt"
openssl base64 -A -in "$directory/ca.crt" > "$directory/ca-bundle.txt"
printf 'Lab certificates prepared in the private directory; do not commit it.\n'
