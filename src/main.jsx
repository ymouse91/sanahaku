import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("serviceWorker.js")
      .then((reg) => console.log("Service Worker rekisteröity:", reg))
      .catch((err) => console.error("Service Worker epäonnistui:", err));
  });
}
