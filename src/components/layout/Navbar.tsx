import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/prerequisites", label: "Prerequisites" },
  { to: "/lab", label: "Lab" },
  { to: "/source-files", label: "Source files" },
];

export function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        K8s Visual Ops Lab
      </NavLink>

      <nav aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
