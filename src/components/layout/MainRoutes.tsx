import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

const Index = React.lazy(() => import("@/pages/Index"));
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