import { NavLink } from "react-router";
import AccountMenu from "./accountMenu";

const navItems = [
    { to: "/", label: "Home" },
    { to: "/results", label: "Explore" },
    { to: "/feed", label: "Feed" },
    { to: "/scrapbooks", label: "Scrapbook" },
    { to: "/about", label: "About" },
];

export default function Header() {
    return (
        <header className="flex items-center justify-between gap-x-4 py-4 px-6 w-full max-w-6xl mx-auto flex-wrap bg-bone text-brand">
            <NavLink to="/" className="text-2xl sm:text-3xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                Wander
            </NavLink>
            <nav aria-label="Primary" className="order-3 w-full sm:order-2 sm:w-auto">
                <ul className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-medium">
                    {navItems.map(({ to, label }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                end={to === "/"}
                                className={({ isActive }) =>
                                    `inline-flex items-center rounded-full px-4 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                                        isActive
                                            ? "bg-brand text-bone"
                                            : "hover:bg-brand/10"
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="order-2 sm:order-3">
                <AccountMenu />
            </div>
        </header>
    );
}
