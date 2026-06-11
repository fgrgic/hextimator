---
"hextimator": patch
---

Fix `-f json` double-encoding in the CLI. With the default `--theme both`, the `light` and `dark` values were emitted as escaped JSON strings nested inside JSON, breaking `jq` pipelines. The CLI now emits a single, correctly-encoded JSON document with `light`/`dark` as real objects.
