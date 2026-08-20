import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MessageCircle, Plus, Search, Settings, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/user/Avatar";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { MessagesNavLink } from "@/components/layout/MessagesNavLink";

export function Navbar() {
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight text-textPrimary"
        >
          Thrifted
        </Link>

        <Link
          to="/search"
          className="ml-4 flex items-center gap-2 rounded px-3 py-2 text-sm text-textSecondary transition-colors hover:text-textPrimary sm:ml-6"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Kërko</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isLoading ? (
            <div className="flex size-9 items-center justify-center">
              <LoadingSpinner className="[&_svg]:size-4" />
            </div>
          ) : isLoggedIn ? (
            <>
              <Link
                to="/create-product"
                className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
              >
                <Plus className="size-4" aria-hidden="true" />
                Shit
              </Link>

              <MessagesNavLink />
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center rounded-full transition-opacity hover:opacity-80"
                  aria-label="Menuja e profilit"
                  aria-expanded={menuOpen}
                >
                  <Avatar
                    src={user?.profile_photo_url}
                    name={user?.full_name ?? user?.username}
                    size="md"
                  />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-cardHover">
                      <MenuLink to="/me" icon={<User className="size-4" />} onClick={() => setMenuOpen(false)}>
                        Profili im
                      </MenuLink>
                      <MenuLink
                        to="/create-product"
                        icon={<Plus className="size-4" />}
                        onClick={() => setMenuOpen(false)}
                      >
                        Shit një produkt
                      </MenuLink>
                      <MenuLink
                        to="/messages"
                        icon={<MessageCircle className="size-4" />}
                        onClick={() => setMenuOpen(false)}
                      >
                        Mesazhet
                      </MenuLink>
                      <MenuLink
                        to="/settings"
                        icon={<Settings className="size-4" />}
                        onClick={() => setMenuOpen(false)}
                      >
                        Konfigurimet
                      </MenuLink>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-background"
                      >
                        <LogOut className="size-4" />
                        Dil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded px-3 py-2 text-sm font-medium text-textPrimary transition-colors hover:bg-background"
              >
                Hyr
              </Link>
              <Link
                to="/register"
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
              >
                Regjistrohu
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-textPrimary transition-colors hover:bg-background"
    >
      {icon}
      {children}
    </Link>
  );
}
