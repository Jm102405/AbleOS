import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RishiCockpit } from "./pages/RajCockpit";
import { DaneCockpit } from "./pages/DaneCockpit";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/raj" element={<RishiCockpit />} />
        <Route path="/dane" element={<DaneCockpit />} />
        <Route path="/" element={<Navigate to="/raj" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
