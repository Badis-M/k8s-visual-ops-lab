import { Outlet } from "react-router";
import { Navbar } from "./Navbar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}
