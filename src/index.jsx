import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GamesTable from "./pages/GamesTable"
import GamesGrid from "./pages/GamesGrid"
import GamesGridV2 from "./pages/GamesGridV2"
import PageNotFound from "./pages/PageNotFound"

ReactDOM.render(
  <Router>
    <Routes>
      <Route exact path="/" element={<GamesGridV2 />} />
      <Route path="/v1" element={<GamesTable />} />
      <Route path="/v2" element={<GamesGridV2 />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </Router>,

  document.getElementById("root")
);
