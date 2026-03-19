import type { HextimateResult } from "hextimator";
import { hextimate } from "hextimator";
import { useState } from "react";
import "./App.css";

function ColorGrid({ tokens }: { tokens: Record<string, string> }) {
  return (
    <div className='color-grid'>
      {Object.entries(tokens).map(([name, value]) => (
        <div key={name} className='color-row'>
          <div className='color-swatch' style={{ background: value }} />
          <span className='color-name'>{name}</span>
          <code className='color-value'>{value}</code>
        </div>
      ))}
    </div>
  );
}

function PalettePreview({ result }: { result: HextimateResult }) {
  return (
    <div className='palette-preview'>
      {(["light", "dark"] as const).map((mode) => {
        const tokens = result[mode];
        if (typeof tokens === "string" || tokens === null) return null;
        return (
          <section key={mode} className={`palette-section palette-${mode}`}>
            <h2>{mode}</h2>
            <ColorGrid tokens={tokens as Record<string, string>} />
          </section>
        );
      })}
    </div>
  );
}

function App() {
  const [input, setInput] = useState("#3a86ff");
  let result: HextimateResult | null = null;
  let error = "";

  try {
    result = hextimate(input, {
      preferredBaseColors: {
        dark: "#FF54DA",
        light: "#FF54DA",
      },
      neutralColorsMaxChroma: 0.01,
      themeLightness: 0.1
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <>
      <h1>hextimator playground</h1>
      <div className='card'>
        <label>
          <input
            type='color'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </label>
      </div>
      {error && <p className='error'>{error}</p>}
      {result && <PalettePreview result={result} />}
    </>
  );
}

export default App;
