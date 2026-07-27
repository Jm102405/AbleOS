import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider";
import { ProtectedRoute, HomeRedirect } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { RishiCockpit } from "./pages/RajCockpit";
import { DaneCockpit } from "./pages/DaneCockpit";
import { JeremiahCockpit } from "./pages/JeremiahCockpit";
import { ColtonCockpit } from "./pages/ColtonCockpit";
import { ZoCockpit } from "./pages/ZoCockpit";
import { KarenCockpit } from "./pages/KarenCockpit";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/raj"
            element={
              <ProtectedRoute cockpit="raj">
                <RishiCockpit />
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

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
