import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RishiCockpit } from "./pages/RajCockpit";
import { DaneCockpit } from "./pages/DaneCockpit";
import { JeremiahCockpit } from "./pages/JeremiahCockpit";
import { ColtonCockpit } from "./pages/ColtonCockpit";
import { ZoCockpit } from "./pages/ZoCockpit";
import { KarenCockpit } from "./pages/KarenCockpit";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/raj" element={<RishiCockpit />} />
        <Route path="/dane" element={<DaneCockpit />} />
        <Route path="/jeremiah" element={<JeremiahCockpit />} />
        <Route path="/colton" element={<ColtonCockpit />} />
        <Route path="/zo" element={<ZoCockpit />} />
        <Route path="/karen" element={<KarenCockpit />} />
        <Route path="/" element={<Navigate to="/raj" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
