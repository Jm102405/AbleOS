import "./index.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { setupPwaUpdates } from "./lib/pwa";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}

// Keeps the installed home-screen app current without a manual reinstall.
setupPwaUpdates();