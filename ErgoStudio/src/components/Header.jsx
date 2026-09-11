import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Armchair, Moon, Sun, User, LogOut, Settings } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";

export default function Header({ onOpenProfile }) {
  const { user, logout } = useAuth();
  const { lowPower, toggle } = useTheme();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2" data-testid="app-brand">
          <div className="h-9 w-9 rounded-xl bg-sage flex items-center justify-center">
            <Armchair className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-foreground hidden sm:inline">
            ErgoStudy
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            data-testid="low-power-toggle"
            className="rounded-full gap-2 border-border"
          >
            {lowPower ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="hidden sm:inline">{lowPower ? "Bajo consumo" : "Modo normal"}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="user-menu-trigger"
                className="rounded-full bg-sage-light text-sage-dark hover:bg-sage-border/50"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.name || user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenProfile} data-testid="menu-profile">
                <Settings className="h-4 w-4 mr-2" /> Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={busy}
                data-testid="menu-logout"
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
