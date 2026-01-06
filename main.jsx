import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ConversionKVAdmin from "./ConversionKVAdmin.jsx";

// Force dark mode tokens to apply everywhere
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConversionKVAdmin />
  </React.StrictMode>
);
