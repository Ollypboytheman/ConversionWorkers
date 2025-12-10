import React from "react";
import ReactDOM from "react-dom/client";
import ConversionKVAdmin from "./src/ConversionKVAdmin.jsx";

// ✅ Tailwind CSS import – make sure this is the first import
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConversionKVAdmin />
  </React.StrictMode>
);
