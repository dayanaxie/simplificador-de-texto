import "../src/assets/styles/global.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavbarUnregister from "./components/NavbarUnregister";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen flex flex-col">
      <NavbarUnregister />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/panel" element={<Placeholder title="Panel de simplificación" />} />
        <Route path="/forgot-password" element={<Placeholder title="Recuperar contraseña" />} />
        <Route path="/register" element={<Placeholder title="Crear cuenta" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </BrowserRouter>
);

export default App;
