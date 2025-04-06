
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

// Ensure proper casing for imports
const Index = React.lazy(() => import("@/pages/index"));  // Changed from Index to index
const Settings = React.lazy(() => import("@/pages/Settings"));

export function MainRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/chat/:id" element={<Index />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
