import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";

// Mint the anonymous identity cookie with ONE request before any feature fires parallel API calls
// (otherwise each parallel first-visit request could create a different user). Render regardless of outcome.
const ready = fetch("/api/me", { credentials: "include" }).catch(() => null);
ready.finally(() => createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>));
