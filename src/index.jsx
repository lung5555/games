import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GamesTable from "./pages/GamesTable"
import GamesGrid from "./pages/GamesGrid"
import PageNotFound from "./pages/PageNotFound"

ReactDOM.render(
  <Router>
    <Routes>
      <Route exact path="/" element={<GamesGrid />} />
      <Route path="/v1" element={<GamesTable />} />
      <Route path="/v2" element={<GamesGrid />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </Router>,

  document.getElementById("root")
);
