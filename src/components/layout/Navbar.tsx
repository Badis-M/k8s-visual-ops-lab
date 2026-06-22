import { NavLink } from "react-router";

const links = [
  { to: "/k8s-basics", label: "K8s Fundamentals" },
  { to: "/prerequisites", label: "Prerequisites" },
  { to: "/lab", label: "Lab" },
  { to: "/source-files", label: "Source files" },
];

export function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        Learning Kubernetes
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