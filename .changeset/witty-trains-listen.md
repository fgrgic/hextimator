---
"hextimator": minor
---

`HextimateConfig` and `fromConfig()` — express a theme's inputs as a plain object instead of a method chain.

```ts
fromConfig({ color: "#3a86ff" });
fromConfig({
  color: "#3a86ff",
  presets: [{ tokens: [{ name: "surface.weak", value: "#123456" }] }],
});
```

Returns a builder, so chaining continues as usual. Presets were already serializable — the colour wasn't. Pairing them makes a whole theme a value you can store, diff, or share between programs.
