import { useState } from 'react'
import { hextimate } from 'hextimator'
import './App.css'

function App() {
  const [hex, setHex] = useState('#3a86ff')
  const result = hextimate(hex)

  return (
    <>
      <h1>hextimator playground</h1>
      <div className="card">
        <label>
          Hex input:{' '}
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
          />
        </label>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </>
  )
}

export default App
