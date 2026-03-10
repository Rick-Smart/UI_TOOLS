import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import KBLandingPage from "./pages/KBLandingPage.jsx";

// Lazy-load each KB app so its data modules and search indexes are only built
// when the user actually navigates to that section, not at initial page load.
const App = lazy(() => import("./App.jsx"));
const CBCApp = lazy(() => import("./CBCApp.jsx"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Suspense>
        <Routes>
          <Route path="/" element={<KBLandingPage />} />
          <Route path="/ui-kb/*" element={<App basePath="/ui-kb" />} />
          <Route path="/cbc-kb/*" element={<CBCApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  </StrictMode>,
);
