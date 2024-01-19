import { Routes, Route } from "react-router-dom"
import Games from "./pages/Games"
import GamesV2 from "./pages/GamesV2"

function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<Games />} />
        <Route path="/v2" element={<GamesV2 />} />
      </Routes>
    </div>
  )
}

export default App