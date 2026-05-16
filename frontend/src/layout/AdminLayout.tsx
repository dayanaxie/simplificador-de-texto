import { Outlet } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const AdminLayout = () => {
  return (
    <>
      <NavbarAdmin />
      <Outlet />
    </>
  );
};

export default AdminLayout;
