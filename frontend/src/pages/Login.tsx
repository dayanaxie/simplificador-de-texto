import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const EyeOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-700"
  >
    <g clipPath="url(#clip0_252_994)">
      <path
        d="M11.96 11.9598C10.8204 12.8285 9.4327 13.3097 7.99996 13.3332C3.33329 13.3332 0.666626 7.99984 0.666626 7.99984C1.49589 6.45443 2.64605 5.10424 4.03996 4.03984M6.59996 2.8265C7.05885 2.71909 7.52867 2.6654 7.99996 2.6665C12.6666 2.6665 15.3333 7.99984 15.3333 7.99984C14.9286 8.75691 14.446 9.46966 13.8933 10.1265M9.41329 9.41317C9.23019 9.60967 9.00939 9.76727 8.76406 9.87659C8.51873 9.9859 8.25389 10.0447 7.98535 10.0494C7.71681 10.0542 7.45007 10.0048 7.20103 9.90416C6.952 9.80357 6.72577 9.65386 6.53586 9.46394C6.34594 9.27402 6.19622 9.0478 6.09563 8.79876C5.99504 8.54973 5.94564 8.28298 5.95038 8.01444C5.95512 7.7459 6.0139 7.48107 6.12321 7.23574C6.23252 6.9904 6.39013 6.7696 6.58663 6.5865M0.666626 0.666504L15.3333 15.3332"
        stroke="#1E1E1E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_252_994">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z"
      stroke="#1E1E1E"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
      stroke="#1E1E1E"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const navigate = useNavigate();

  const RUTA_ADMIN = "/admin";
  const RUTA_USUARIO = "/simplifyText";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMensaje("");

    if (!email.trim() || !password.trim()) {
      setErrorMensaje("Ingrese el correo y la contraseña.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        password_hash,
        is_active,
        user_roles (
          roles (
            id,
            name
          )
        )
      `)
      .eq("email", email.trim())
      .eq("password_hash", password)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMensaje("Ocurrió un error al iniciar sesión.");
      return;
    }

    if (!data) {
      setErrorMensaje("Correo o contraseña incorrectos.");
      return;
    }

    if (!data.is_active) {
      setErrorMensaje("Su cuenta está inactiva. Contacte al administrador.");
      return;
    }

    const usuario = data as any;
    const rol = usuario.user_roles?.[0]?.roles?.name || "Usuario";

    localStorage.setItem(
      "usuario",
      JSON.stringify({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: rol,
      })
    );

    if (rol === "Administrador") {
      navigate(RUTA_ADMIN);
    } else {
      navigate(RUTA_USUARIO);
    }
  };

  return (
    <div className="min-h-[calc(100vh-90px)] bg-[#F5F5F5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[845px] bg-white border border-[#E0E0E0] px-12 sm:px-24 py-16">
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <h1 className="font-lexend font-semibold text-3xl sm:text-[32px] text-black leading-[150%] mb-8 text-center">
            Iniciar Sesión
          </h1>

          <div className="w-full max-w-[346px] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo@gmail.com"
                className="w-full px-4 py-3 border border-[#D9D9D9] bg-white font-inter font-normal text-base text-[#1E1E1E] placeholder:text-[#1E1E1E]/60 outline-none focus:border-[#002855] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
              >
                Contraseña
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full h-[40px] pl-4 pr-12 border border-[#D9D9D9] bg-white rounded-lg font-inter font-normal text-base text-[#1E1E1E] placeholder:text-[#1E1E1E]/60 outline-none focus:border-[#002855] transition-colors"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            {errorMensaje && (
              <p className="text-sm text-red-700 font-inter">
                {errorMensaje}
              </p>
            )}

            <div className="-mt-2">
              <Link
                to="/forgotPassword"
                className="font-inter font-medium text-base text-[#002855] hover:underline"
              >
                Olvidé mi contraseña
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-[230px] h-[41px] bg-[#002855] text-white font-lexend font-semibold text-xl leading-[150%] text-center flex items-center justify-center hover:bg-[#002855]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="mt-8">
            <Link
              to="/register"
              className="font-inter font-medium text-base text-[#002855] hover:underline"
            >
              No tienes una cuenta?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}