import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import CBCApp from "./CBCApp.jsx";
import KBLandingPage from "./pages/KBLandingPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<KBLandingPage />} />
        <Route path="/ui-kb/*" element={<App basePath="/ui-kb" />} />
        <Route path="/cbc-kb/*" element={<CBCApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
