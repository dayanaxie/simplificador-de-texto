import "../src/assets/styles/global.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import Registro from "./pages/Registro";
import SimpleTextSinRegistrar from "./pages/SimpleText-sinRegistrar";

import RegistrarLayout from "./layout/RegistrarLayout";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen flex flex-col">
      <Routes>
       {/* Pantallas con NavbarUnregister */}
        <Route element={<RegistrarLayout />}>
          <Route path="/" element={<Login />} />
          {/* <Route path="/panel" element={<Placeholder title="Panel de simplificación" />} /> */}
          <Route path="/forgot-password" element={<Placeholder title="Recuperar contraseña" />} />
          <Route path="/simplify" element={<SimpleTextSinRegistrar/>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/register" element={<Registro />} />

        </Route>

        {/* Pantallas con NavbarRegister */}

      </Routes>
      
        

    </div>
  </BrowserRouter>
);

export default App;
