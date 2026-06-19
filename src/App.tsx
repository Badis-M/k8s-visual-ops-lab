import { Route, Routes } from "react-router";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LabPage } from "./pages/LabPage";
import { PrerequisitesPage } from "./pages/PrerequisitesPage";
import { SourceFilesPage } from "./pages/SourceFilesPage";
import "./App.css";

export default function App() {
  const { pathname } = useLocation();

useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="prerequisites" element={<PrerequisitesPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="source-files" element={<SourceFilesPage />} />
      </Route>
    </Routes>
  );
}
