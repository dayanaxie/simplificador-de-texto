import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Registro from "./pages/Registro";
import SimpleTextSinRegistrar from "./pages/SimpleText-sinRegistrar";
import SimpleText from "./pages/SimpleText";
import ForgotPassword from "./pages/forgotPassword";
import ChangePassword from "./pages/changePassword";
import AdminPanel from "./pages/admin/AdminPanel";
import EstadisticasPersonales from "./pages/EstadisticasPersonales";
import RegistrarLayout from "./layout/RegistrarLayout";
import RegistradoLayout from "./layout/RegistradoLayout";
import AdmiLayout from "./layout/AdminLayout";
import Perfil from "./pages/Perfil";
import DiccionarioPersonal from "./pages/DiccionarioPersonal";

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

        </Route>

        {/* Pantallas con NavbarRegister */}
        <Route element={<RegistradoLayout />}>
          <Route path="/simplifyText" element={<SimpleText/>} />
          <Route path="/profile" element={<Perfil/>} />|  
          <Route path="/personal-statistics" element={<EstadisticasPersonales/>} />
          <Route path="/personal-dictionary" element={<DiccionarioPersonal/>} />
        </Route>

        {/* Pantallas con AdminLayout */}
        <Route element={<AdmiLayout />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

      </Routes>
      
        

    </div>
  </BrowserRouter>
);

export default App;
