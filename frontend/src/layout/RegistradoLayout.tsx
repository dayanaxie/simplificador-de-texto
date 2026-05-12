import { Outlet } from "react-router-dom";
import NavbarRegister from "../components/NavbarRegister";


const RegisterLayout = () => {
  return (
    <>
      <NavbarRegister />

      <Outlet />
    </>
  );
};

export default RegisterLayout;