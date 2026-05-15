import "../src/assets/styles/global.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import Registro from "./pages/Registro";
import SimpleTextSinRegistrar from "./pages/SimpleText-sinRegistrar";
import SimpleText from "./pages/SimpleText";
import ForgotPassword from "./pages/forgotPassword";
import ChangePassword from "./pages/changePassword";
import AdminPanel from "./pages/admin/AdminPanel";

import RegistrarLayout from "./layout/RegistrarLayout";
import RegistradoLayout from "./layout/RegistradoLayout";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen flex flex-col">
      <Routes>
       {/* Pantallas con NavbarUnregister */}
        <Route element={<RegistrarLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/simplify" element={<SimpleTextSinRegistrar/>} />
          <Route path="/changePassword" element={<ChangePassword />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/admin" element={<AdminPanel />} />

        </Route>

        {/* Pantallas con NavbarRegister */}
        <Route element={<RegistradoLayout />}>
          <Route path="/simplifyText" element={<SimpleText/>} />
        </Route>

      </Routes>
      
        

    </div>
  </BrowserRouter>
);

export default App;
