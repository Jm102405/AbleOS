import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider";
import { ProtectedRoute, HomeRedirect } from "./components/ProtectedRoute";
import { UpdateBanner } from "./components/UpdateBanner";
import { Login } from "./pages/Login";
import { RajCockpit } from "./pages/RajCockpit";
import { DaneCockpit } from "./pages/DaneCockpit";
import { JeremiahCockpit } from "./pages/JeremiahCockpit";
import { ColtonCockpit } from "./pages/ColtonCockpit";
import { ZoCockpit } from "./pages/ZoCockpit";
import { KarenCockpit } from "./pages/KarenCockpit";
import { RexCockpit } from "./pages/RexCockpit";
import { ElleryCockpit } from "./pages/ElleryCockpit";
import { CorneliusCockpit } from "./pages/CorneliusCockpit";
import { PipelineBoard } from "./pages/PipelineBoard";

export function App() {
  return (
    <AuthProvider>
      <UpdateBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/raj"
            element={
              <ProtectedRoute cockpit="raj">
                <RajCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dane"
            element={
              <ProtectedRoute cockpit="dane">
                <DaneCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jeremiah"
            element={
              <ProtectedRoute cockpit="jeremiah">
                <JeremiahCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/colton"
            element={
              <ProtectedRoute cockpit="colton">
                <ColtonCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/zo"
            element={
              <ProtectedRoute cockpit="zo">
                <ZoCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/karen"
            element={
              <ProtectedRoute cockpit="karen">
                <KarenCockpit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rex"
            element={
              <ProtectedRoute cockpit="rex">
                <RexCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/raj/pipeline"
            element={
              <ProtectedRoute cockpit="raj">
                <PipelineBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ellery"
            element={
              <ProtectedRoute cockpit="ellery">
                <ElleryCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cornelius"
            element={
              <ProtectedRoute cockpit="cornelius">
                <CorneliusCockpit />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
