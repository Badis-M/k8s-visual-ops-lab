#!/bin/sh
set -eu

if [ "$(head -n 1 /data/orders.csv)" != 'order_id,amount' ]; then
  printf 'Verification failed: unexpected CSV header\n' >&2
  exit 1
fi
awk -F, '
  NR > 1 { count++; total += $2 }
  END {
    if (count != 2 || total != 30) {
      printf "Verification failed: %d orders, total %d\n", count, total > "/dev/stderr"
      exit 1
    }
    printf "Verified: %d orders, total %d\n", count, total
  }
' /data/orders.csv
