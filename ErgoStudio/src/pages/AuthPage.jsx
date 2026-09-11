import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Armchair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { useAuth } from "../context/useAuth";
import { formatApiErrorDetail } from "../lib/api";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "demo@ergostudy.app", password: "Ergo#2026" });
  const [regData, setRegData] = useState({ name: "", email: "", password: "" });

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success("¡Bienvenido de nuevo!");
      navigate("/app");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regData.name, regData.email, regData.password);
      toast.success("Cuenta creada. ¡A estudiar mejor!");
      navigate("/app");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between bg-sage-dark p-12 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="auth-brand">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Armchair className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl text-white">ErgoStudy</span>
        </Link>
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            Menos molestias,
            <br />
            más concentración.
          </h2>
          <p className="mt-4 text-sage-light/70 max-w-sm">
            Registra tus sesiones, evalúa tu comodidad y descubre qué ajustes te ayudan a estudiar mejor.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1683836809739-c10a7be81028?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
          alt="Silla ergonómica"
          className="absolute inset-0 w-full h-full object-cover opacity-20 -z-0"
        />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-sage flex items-center justify-center">
              <Armchair className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-lg text-sage-dark">ErgoStudy</span>
          </Link>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h1 className="font-display text-2xl font-bold text-sage-dark mb-1">Bienvenido</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Usa la cuenta demo precargada o la tuya.
              </p>
              <form onSubmit={submitLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Correo</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    data-testid="login-email-input"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    data-testid="login-password-input"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-button"
                  className="w-full bg-sage hover:bg-sage-dark text-white rounded-full h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <h1 className="font-display text-2xl font-bold text-sage-dark mb-1">Crea tu cuenta</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Incluye sesiones de demostración para explorar el panel.
              </p>
              <form onSubmit={submitRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">Nombre</Label>
                  <Input
                    id="reg-name"
                    required
                    data-testid="register-name-input"
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Correo</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    data-testid="register-email-input"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Contraseña (mín. 6)</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    data-testid="register-password-input"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="register-submit-button"
                  className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
