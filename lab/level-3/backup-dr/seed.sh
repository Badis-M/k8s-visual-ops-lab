#!/bin/sh
set -eu

# Refuse to overwrite data if this exercise is resumed in a populated volume.
if [ -e /data/orders.csv ]; then
  printf 'Refusing to overwrite existing orders.csv\n' >&2
  exit 1
fi
printf 'order_id,amount\nA001,12\nA002,18\n' > /data/orders.csv
sync
