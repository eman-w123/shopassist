import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

export default Layout;