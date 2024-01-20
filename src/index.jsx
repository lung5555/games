import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Games from "./pages/Games"
import GamesV2 from "./pages/GamesV2"
import PageNotFound from "./pages/PageNotFound"

ReactDOM.render(
  <Router>
    <Routes>
      <Route exact path="/" element={<Games />} />
      <Route path="/v2" element={<GamesV2 />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </Router>,

  document.getElementById("root")
);
