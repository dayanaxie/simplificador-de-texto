import { Outlet } from "react-router-dom";
import NavbarUnregister from "../components/NavbarUnregister";

const UnregisterLayout = () => {
  return (
    <>
      <NavbarUnregister />
      <Outlet />
    </>
  );
};

export default UnregisterLayout;