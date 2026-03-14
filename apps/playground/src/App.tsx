import { hextimate } from "hextimator";
import { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("#3a86ff");
  let result = "";
  try {
    result = JSON.stringify(hextimate(input), null, 2);
  } catch (error) {
    result = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <>
      <h1>hextimator playground</h1>
      <div className='card'>
        <label>
          input:{" "}
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        {input && <pre>{result}</pre>}
      </div>
    </>
  );
}

export default App;
