import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const links = user
    ? [{ to: "/", label: "Home" }, { to: "/dashboard", label: "Dashboard" }]
    : [{ to: "/", label: "Home" }];
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight">ShopAssist</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <Button size="sm" variant="ghost" onClick={async () => { await signOut(); navigate("/"); }} className="rounded-full">
              <LogOut className="mr-1 h-4 w-4" />Sign out
            </Button>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;