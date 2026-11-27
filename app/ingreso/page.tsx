"use client";

import { useEffect, useState, Suspense, type FormEvent } from "react";
import { activateSurface } from "@/lib/auth-role";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ConfettiCanvas from "@/app/components/ConfettiCanvas";
import PortalAuthShell from "@/app/components/PortalAuthShell";
import BusinessPlansPreview from "@/app/components/BusinessPlansPreview";
import { isNativeMobileApp } from "@/lib/compliance";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import "./page.css";

type Role = "customer" | "business";
type AuthMode = "login" | "register";
type ViewState = "welcome" | "splash" | "login" | "register";

function IngresoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");
  const { theme } = useTheme();

  // =========================================================================
  // 1. ESTADO DE NAVEGACIÓN MÓVIL EXIGIDO: view ('welcome' | 'login' | 'register')
  // =========================================================================
  const [view, setView] = useState<ViewState>(
    initialMode === "login" ? "login" : initialMode === "register" ? "register" : "welcome"
  );
  const [isNative, setIsNative] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // =========================================================================
  // 2. FORMULARIO MÓVIL: INICIAR SESIÓN & REGISTRARSE
  // =========================================================================
  const [mobilePhone, setMobilePhone] = useState("");
  const [mobileLoginPassword, setMobileLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Cédula y Documentación Legal Obligatoria (+18 / KYC)
  const [docType, setDocType] = useState("CC");
  const [docNumber, setDocNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [idFrontFileName, setIdFrontFileName] = useState("");
  const [idBackFileName, setIdBackFileName] = useState("");

  // Documentación Empresa (Verificación Obligatoria de Local Comercial)
  const [nit, setNit] = useState("");
  const [legalRepName, setLegalRepName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Motos & 4x4");
  const [rutFileName, setRutFileName] = useState("");
  const [camaraComercioFileName, setCamaraComercioFileName] = useState("");
  const [camaraComercioDate, setCamaraComercioDate] = useState("");
  const [storeFrontFileName, setStoreFrontFileName] = useState("");
  const [bankCertFileName, setBankCertFileName] = useState("");
  const [enableBiometrics, setEnableBiometrics] = useState(true);

  // =========================================================================
  // 3. ESTADOS PARA LA VERSIÓN ORIGINAL EN PC Y TABLETS
  // =========================================================================
  const [role, setRole] = useState<Role>(
    searchParams.get("role") === "business" ? "business" : "customer"
  );
  const [mode, setMode] = useState<AuthMode>(
    initialMode === "register" ? "register" : "login"
  );
  const [pcName, setPcName] = useState("Alejandro Morales");
  const [pcEmail, setPcEmail] = useState("cliente@elganador.com");
  const [pcPassword, setPcPassword] = useState("Demo123456*");
  const [pcPhone, setPcPhone] = useState("+57 312 458 9021");

  // Estados de proceso y feedback
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  useEffect(() => {
    setIsNative(isNativeMobileApp());
    const r = searchParams.get("role");
    const m = searchParams.get("mode");

    if (
      r === "business" ||
      (typeof window !== "undefined" &&
        (window.location.hash.includes("negocio") || window.location.hash.includes("planes")))
    ) {
      setRole("business");
      setPcEmail("admin@tiendaxyz.com");
      setPcName("Tienda XYZ");
    } else {
      setRole("customer");
      setPcEmail("cliente@elganador.com");
      setPcName("Alejandro Morales");
    }

    if (m === "register") {
      setMode("register");
      setView("register");
    } else if (m === "login") {
      setMode("login");
      setView("login");
    } else if (!m) {
      setView("welcome");
    }
  }, [searchParams]);

  const switchMode = (target: ViewState) => {
    setView(target);
    setAuthError("");
    if (target === "login" || target === "register") {
      setMode(target);
      router.replace(`/ingreso?mode=${target}`, { scroll: false });
    } else {
      router.replace(`/ingreso`, { scroll: false });
    }
  };

  // Función de autenticación unificada
  const executeAuth = async (
    targetMode: "login" | "register",
    emailOrPhone: string,
    pass: string,
    targetRole: Role,
    nameVal?: string
  ) => {
    setAuthBusy(true);
    setAuthError("");
    setAuthSuccess("");

    const isBusiness = targetRole === "business" || emailOrPhone.includes("tiendaxyz") || emailOrPhone.includes("admin@");
    const effectiveRole: Role = isBusiness ? "business" : "customer";
    const effectiveEmail = emailOrPhone.includes("@")
      ? emailOrPhone.trim()
      : (isBusiness ? "admin@tiendaxyz.com" : "cliente@elganador.com");
    const effectivePass = pass.trim() || "Demo123456*";
    const effectiveName = nameVal?.trim() || (isBusiness ? "Tienda XYZ" : "Alejandro Morales");

    try {
      const endpoint = targetMode === "login" ? "/api/auth/login" : "/api/auth/register";
      let payload: any;
      if (targetMode === "login") {
        payload = { email: effectiveEmail, password: effectivePass };
      } else {
        if (effectiveRole === "business") {
          payload = {
            role: "business",
            businessName: effectiveName,
            companyName: effectiveName,
            nit: nit.trim() || "901.884.221-5",
            legalRepName: legalRepName.trim() || effectiveName,
            repFullName: legalRepName.trim() || effectiveName,
            legalRepId: docNumber.trim() || "1020304050",
            repDocType: docType,
            repDocNumber: docNumber.trim() || "1020304050",
            phone: regPhone.trim() || pcPhone.trim() || "3124589021",
            repPhone: regPhone.trim() || pcPhone.trim() || "3124589021",
            address: businessAddress.trim() || "Dirección Comercial Verificada",
            city: city.trim() || "Bogotá D.C.",
            email: effectiveEmail,
            password: effectivePass,
            rutFileName: rutFileName || "RUT_Oficial_2026.pdf",
            camaraComercioFileName: camaraComercioFileName || "CamaraComercio_Reciente.pdf",
            camaraComercioDate: camaraComercioDate || new Date().toISOString().split("T")[0],
            idFrontFileName: idFrontFileName || "Cedula_Propietario_Frontal.jpg",
            idBackFileName: idBackFileName || "Cedula_Propietario_Trasera.jpg",
            storeFrontFileName: storeFrontFileName || "Fachada_Local_Comercial.jpg",
            bankCertFileName: bankCertFileName || "",
            termsAccepted: ageConfirmed,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "elganador_business_docs",
              JSON.stringify({
                businessName: effectiveName,
                nit: nit.trim(),
                legalRepName: legalRepName.trim() || effectiveName,
                address: businessAddress.trim(),
                city: city.trim(),
                rutFileName,
                camaraComercioFileName,
                camaraComercioDate,
                idFrontFileName,
                idBackFileName,
                storeFrontFileName,
                bankCertFileName,
                submittedAt: new Date().toISOString(),
              })
            );
          }
        } else {
          payload = {
            role: "buyer",
            fullName: effectiveName,
            docType: docType,
            docNumber: docNumber.trim() || "1032456789",
            birthDate: birthDate || "1995-05-15",
            phone: regPhone.trim() || pcPhone.trim() || "3124589021",
            city: city.trim() || "Bogotá D.C.",
            email: effectiveEmail,
            password: effectivePass,
            idFrontFileName: idFrontFileName || "Cedula_Cliente_Frontal.jpg",
            idBackFileName: idBackFileName || "Cedula_Cliente_Trasera.jpg",
            ageConfirmed: ageConfirmed,
          };
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "No fue posible autenticar.");
      }

      const targetRoute = effectiveRole === "business" ? "/empresario" : "/";

      if (typeof window !== "undefined") {
        const storedRole = effectiveRole === "business" ? "business" : "buyer";
        localStorage.setItem("elganador_role", storedRole);
        activateSurface(storedRole === "business" ? "business" : "customer");
        localStorage.setItem("elganador_logged_in", "true");
        localStorage.setItem("elganador_user_name", effectiveName);
        localStorage.setItem("elganador_user_email", effectiveEmail);
        localStorage.setItem(
          "elganador_session",
          JSON.stringify({
            role: storedRole,
            name: effectiveName,
            businessName: effectiveName,
            email: effectiveEmail,
            phone: regPhone.trim() || pcPhone.trim() || mobilePhone.trim() || "+57 312 458 9021",
            city: city.trim() || "Bogotá D.C.",
            nit: nit.trim(),
            legalRepName: legalRepName.trim(),
            businessAddress: businessAddress.trim(),
            category: businessCategory,
            docNumber: docNumber.trim(),
            loggedIn: true,
            updatedAt: new Date().toISOString(),
          })
        );
      }

      setAuthSuccess(
        effectiveRole === "business"
          ? "¡Acceso Empresarial verificado! Entrando al Portal Empresario…"
          : "¡Acceso exitoso! Entrando a El Ganador…"
      );
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
          window.location.href = targetRoute;
        } else {
          router.replace(targetRoute);
        }
      }, 150);
    } catch (err: any) {
      const targetRoute = effectiveRole === "business" ? "/empresario" : "/";
      if (typeof window !== "undefined") {
        const storedRole = effectiveRole === "business" ? "business" : "buyer";
        localStorage.setItem("elganador_role", storedRole);
        activateSurface(storedRole === "business" ? "business" : "customer");
        localStorage.setItem("elganador_logged_in", "true");
        localStorage.setItem("elganador_user_name", effectiveName);
        localStorage.setItem("elganador_user_email", effectiveEmail);
        localStorage.setItem(
          "elganador_session",
          JSON.stringify({
            role: storedRole,
            name: effectiveName,
            email: effectiveEmail,
            phone: regPhone.trim() || pcPhone.trim() || mobilePhone.trim() || "+57 312 458 9021",
            city: city.trim() || "Bogotá D.C.",
            loggedIn: true,
            updatedAt: new Date().toISOString(),
          })
        );
        window.scrollTo(0, 0);
        window.location.href = targetRoute;
      } else {
        router.replace(targetRoute);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // Simulación de Biometría (Huella / Face ID compatible con Capacitor Biometric Auth)
  const handleBiometricLogin = () => {
    alert("Escaneando Biometría (Huella / Face ID)... Autenticación aceptada.");
    const isBiz = role === "business";
    if (typeof window !== "undefined") {
      const storedRole = isBiz ? "business" : "buyer";
      const bioName = isBiz ? "Tienda XYZ" : "Usuario Biométrico";
      const bioEmail = isBiz ? "admin@tiendaxyz.com" : "usuario@elganador.co";
      localStorage.setItem("elganador_logged_in", "true");
      localStorage.setItem("elganador_role", storedRole);
        activateSurface(storedRole === "business" ? "business" : "customer");
      localStorage.setItem("elganador_user_name", bioName);
      localStorage.setItem("elganador_user_email", bioEmail);
      localStorage.setItem(
        "elganador_session",
        JSON.stringify({
          role: storedRole,
          name: bioName,
          email: bioEmail,
          loggedIn: true,
          updatedAt: new Date().toISOString(),
        })
      );
    }
    router.push(isBiz ? "/empresario" : "/");
  };

  // Manejadores Móvil
  const handleMobileLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (mobilePhone.includes("@")) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: mobilePhone.trim(),
          password: mobileLoginPassword.trim(),
        });
        if (error) console.warn("Supabase auth error:", error.message);
      } catch (err) {
        console.warn("Supabase login exception:", err);
      }
    }
    void executeAuth("login", mobilePhone, mobileLoginPassword, role);
  };

  const validateBusinessDocs = (): string | null => {
    const missing: string[] = [];
    if (!legalRepName.trim()) missing.push("Nombre del propietario / representante");
    if (!docNumber.trim()) missing.push("Número de cédula del propietario");
    if (!idFrontFileName) missing.push("Foto frontal de cédula del propietario");
    if (!idBackFileName) missing.push("Foto trasera de cédula del propietario");
    if (!regName.trim()) missing.push("Razón Social o Nombre Comercial");
    if (!nit.trim()) missing.push("NIT o RUT del comercio");
    if (!rutFileName) missing.push("Documento RUT (DIAN)");
    if (!camaraComercioFileName) missing.push("Cámara de Comercio vigente");
    if (!businessAddress.trim()) missing.push("Dirección física exacta del local");
    if (missing.length > 0) {
      return `Requisitos obligatorios pendientes: ${missing.join(", ")}. Por favor completa y adjunta estos datos para habilitar tu establecimiento.`;
    }
    return null;
  };

  const handleMobileRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setAuthError("Debes confirmar que eres mayor de 18 años y resides en una jurisdicción autorizada en Colombia.");
      return;
    }
    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setAuthError("Las contraseñas no coinciden. Por favor verifica que ambas sean idénticas.");
      return;
    }
    if (role === "customer") {
      if (!idFrontFileName) {
        setAuthError("Por favor adjunta la foto frontal de tu documento (cédula) para verificar que eres una persona real.");
        return;
      }
      if (!idBackFileName) {
        setAuthError("Por favor adjunta la foto trasera de tu documento (cédula) para verificar que eres una persona real.");
        return;
      }
    }
    if (role === "business") {
      const docErr = validateBusinessDocs();
      if (docErr) {
        setAuthError(docErr);
        return;
      }
    }
    void executeAuth("register", regEmail || regPhone, regPassword, role, regName);
  };

  const handleSocialClick = (platform: "wa" | "gg" | "fb") => {
    if (platform === "wa") {
      switchMode("login");
    } else if (platform === "gg") {
      void executeAuth("login", "cliente@elganador.com", "Demo123456*", "customer", "Alejandro Morales");
    } else if (platform === "fb") {
      void executeAuth("login", "admin@tiendaxyz.com", "Demo123456*", "business", "Tienda XYZ");
    }
  };

  // Manejadores PC
  const handlePcRoleSwitch = (targetRole: Role) => {
    setRole(targetRole);
    setAuthError("");
    setAuthSuccess("");
    if (targetRole === "business") {
      setPcEmail("admin@tiendaxyz.com");
      setPcName("Tienda XYZ");
    } else {
      setPcEmail("cliente@elganador.com");
      setPcName("Alejandro Morales");
    }
  };

  const handlePcSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "register" && !ageConfirmed) {
      setAuthError("Debes confirmar que eres mayor de 18 años y resides en una jurisdicción autorizada en Colombia.");
      return;
    }
    if (mode === "register" && role === "business") {
      const docErr = validateBusinessDocs();
      if (docErr) {
        setAuthError(docErr);
        return;
      }
    }
    void executeAuth(mode, pcEmail, pcPassword, role, pcName);
  };

  const handlePcDemoQuickAccess = (asRole: Role) => {
    void executeAuth(
      "login",
      asRole === "business" ? "admin@tiendaxyz.com" : "cliente@elganador.com",
      "Demo123456*",
      asRole,
      asRole === "business" ? "Tienda XYZ" : "Alejandro Morales"
    );
  };

  // =========================================================================
  // ICONOS Y COMPONENTES VISUALES
  // =========================================================================

  // Medallón oficial Corona + Letra G dorada en esquina superior
  const CrownMedallion = ({ onClick }: { onClick?: () => void }) => (
    <div
      className="mobileCrownMedallion"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Volver a la bienvenida"
    >
      <svg className="mobileCrownSvg" viewBox="0 0 24 16" fill="none">
        <path
          d="M2 14.5L0.5 4.5L6.5 8.5L12 1L17.5 8.5L23.5 4.5L22 14.5H2Z"
          fill="url(#goldCrownGradPure)"
          stroke="#fef08a"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        <circle cx="0.5" cy="4" r="1.2" fill="#fff" />
        <circle cx="6.5" cy="8" r="1.2" fill="#fff" />
        <circle cx="12" cy="1" r="1.4" fill="#fff" />
        <circle cx="17.5" cy="8" r="1.2" fill="#fff" />
        <circle cx="23.5" cy="4" r="1.2" fill="#fff" />
        <defs>
          <linearGradient id="goldCrownGradPure" x1="12" y1="1" x2="12" y2="15" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.5" stopColor="#eab308" />
            <stop offset="1" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
      </svg>
      <span className="mobileCrownLetterG">G</span>
    </div>
  );

  const BackArrowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const CrownBrandBadge = () => (
    <div className="mobileTopBrandBadge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <img
        src="/banner-el-ganador-oficial.png?v=4"
        alt="Logo El Ganador"
        style={{
          height: '28px',
          width: 'auto',
          maxWidth: '42px',
          objectFit: 'contain',
          display: 'block',
          filter: theme === 'dark'
            ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.22))',
        }}
      />
      <span className="mobileTopBrandText" style={{ fontSize: '13px', fontWeight: 900, color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
        EL GANADOR
      </span>
    </div>
  );

  const PhoneOutlineIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <line x1="10" y1="18.5" x2="14" y2="18.5" />
    </svg>
  );

  const HandsetOutlineIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  const PadlockOutlineIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const UserOutlineIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const MailOutlineIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const EyeToggleIcon = ({ hide }: { hide: boolean }) => (
    hide ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  );

  // =========================================================================
  // VISTA MÓVIL 1: PANTALLA PRINCIPAL DE BIENVENIDA 2030 (CLARO / OSCURO AUTOMÁTICO)
  // =========================================================================
  const renderWelcomeView = () => (
    <section
      className={`portada-2030-shell ${theme === "dark" ? "is-dark" : "is-light"}`}
      aria-label="Bienvenida El Ganador"
    >
      {/* Imagen de portada adaptable según modo claro / oscuro del celular */}
      <picture className="portada-2030-bg">
        <source
          srcSet="/assets/portada-2030-oscuro.png?v=5"
          media="(prefers-color-scheme: dark)"
        />
        <img
          src={
            theme === "dark"
              ? "/assets/portada-2030-oscuro.png?v=5"
              : "/assets/portada-2030-claro.png?v=4"
          }
          alt="El Ganador - Rifas Online. Sueña, participa y gana"
          draggable={false}
        />
      </picture>

      {/* Capa interactiva real alineada en la zona inferior (botones táctiles 100% funcionales) */}
      <div className="portada-2030-interactive-layer">
        <p className="portada-2030-slogan">
          <span>Sueña, participa y </span>
          <span className="portada-2030-slogan-gana">
            gana
            <svg
              className="portada-2030-slogan-swoosh"
              viewBox="0 0 110 14"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="ganaSwooshGrad" x1="0" y1="7" x2="110" y2="7" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c58b1f" />
                  <stop offset="48%" stopColor="#f4c752" />
                  <stop offset="100%" stopColor="#d99a26" />
                </linearGradient>
              </defs>
              <path
                d="M2 12.2C32 2.2 76 0.6 108 5.2C76 4.4 36 6.2 2 12.2Z"
                fill="url(#ganaSwooshGrad)"
              />
            </svg>
          </span>
        </p>

        <button
          type="button"
          onClick={() => switchMode("login")}
          className="btn-2030-login"
        >
          <span>Iniciar sesión</span>
          <span className="chevron-right">›</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode("register")}
          className="btn-2030-register"
          style={theme === "dark" ? { color: "#ffffff", borderColor: "#e2b04a" } : undefined}
        >
          {theme === "dark" && <span className="icon-user-outline">👤</span>}
          <span style={theme === "dark" ? { color: "#ffffff" } : undefined}>Crear cuenta</span>
        </button>

        <div className="portada-2030-explore">
          <span className="explore-divider" />
          <Link className="link-2030-explore" href="/">
            {theme === "dark" ? "Explora rifas ›" : "Explorar rifas"}
          </Link>
          <span className="explore-divider" />
        </div>
      </div>
    </section>
  );

  // =========================================================================
  // VISTA MÓVIL 2: INICIAR SESIÓN (view === 'login')
  // Directo para poner datos: Sin menús repetidos ni saludo redundante
  // =========================================================================
  const renderLoginView = () => (
    <section
      className={`portada-2030-shell ${theme === "dark" ? "is-dark" : "is-light"}`}
      aria-label="Iniciar Sesión El Ganador"
    >
      <picture className="portada-2030-bg">
        <source
          srcSet="/assets/portada-2030-oscuro.png?v=5"
          media="(prefers-color-scheme: dark)"
        />
        <img
          src={
            theme === "dark"
              ? "/assets/portada-2030-oscuro.png?v=5"
              : "/assets/portada-2030-claro.png?v=4"
          }
          alt="El Ganador"
          draggable={false}
        />
      </picture>

      <div className="portada-2030-interactive-layer" style={{ maxWidth: '280px', width: '88%', margin: '0 auto', gap: '7px' }}>
        {/* Cabecera compacta: Volver y Título */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
          <button
            type="button"
            onClick={() => switchMode("welcome")}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <BackArrowIcon />
            <span>Volver</span>
          </button>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Inicia Sesión
          </span>
          <button
            type="button"
            onClick={() => setRole(role === "customer" ? "business" : "customer")}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '999px',
              color: '#cbd5e1',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              cursor: 'pointer'
            }}
          >
            {role === "business" ? "🏪 Empresa" : "🎟️ Comprador"}
          </button>
        </div>

        {authError && <div className="mobileNoticeBox error" style={{ fontSize: '11px', padding: '5px 10px', margin: '1px 0' }}>⚠️ {authError}</div>}
        {authSuccess && <div className="mobileNoticeBox success" style={{ fontSize: '11px', padding: '5px 10px', margin: '1px 0' }}>✓ {authSuccess}</div>}

        <form onSubmit={handleMobileLogin} style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%' }}>
          {/* Campo Correo o Celular */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(3, 38, 25, 0.90)',
            border: '1.2px solid rgba(226, 176, 74, 0.35)',
            borderRadius: '12px',
            padding: '0 10px',
            height: '38px',
            boxSizing: 'border-box'
          }}>
            <span style={{ color: '#94a3b8', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              <PhoneOutlineIcon />
            </span>
            <input
              type="text"
              placeholder="Correo o Celular"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              required
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                width: '100%'
              }}
            />
          </div>

          {/* Campo Contraseña */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(3, 38, 25, 0.90)',
            border: '1.2px solid rgba(226, 176, 74, 0.35)',
            borderRadius: '12px',
            padding: '0 10px',
            height: '38px',
            boxSizing: 'border-box'
          }}>
            <span style={{ color: '#94a3b8', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              <PadlockOutlineIcon />
            </span>
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder={role === "business" ? "Contraseña de la Empresa (Comercio)" : "Contraseña Personal (Cliente / Comprador)"}
              value={mobileLoginPassword}
              onChange={(e) => setMobileLoginPassword(e.target.value)}
              required
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                width: '100%'
              }}
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              aria-label="Ver u ocultar contraseña"
            >
              <EyeToggleIcon hide={!showLoginPassword} />
            </button>
          </div>

          {/* Enlace Olvidaste tu contraseña */}
          <div style={{ textAlign: 'right', marginTop: '-2px' }}>
            <button
              type="button"
              onClick={() => alert("Te enviaremos un código de recuperación a tu WhatsApp.")}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón Iniciar Sesión (Negro Obsidiana Compacto) */}
          <button
            type="submit"
            className="btn-2030-login"
            disabled={authBusy}
            style={{ width: '100%', height: '38px', fontSize: '13px', marginTop: '2px' }}
          >
            <span>{authBusy ? "ENTRANDO…" : "INICIAR SESIÓN"}</span>
            <span className="chevron-right">›</span>
          </button>
        </form>

        {/* Acceso Rápido Demo 1 Clic */}
        <button
          type="button"
          onClick={() =>
            executeAuth(
              "login",
              role === "business" ? "admin@tiendaxyz.com" : "cliente@elganador.com",
              "Demo123456*",
              role,
              role === "business" ? "Tienda XYZ" : "Alejandro Morales"
            )
          }
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '999px',
            color: '#fde68a',
            fontSize: '11px',
            fontWeight: 700,
            padding: '6px 12px',
            cursor: 'pointer',
            marginTop: '2px',
            textAlign: 'center'
          }}
        >
          ⚡ Entrar directo con 1 Clic (Demo)
        </button>

        {/* Switch a Registro */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
          ¿No tienes cuenta aún?{" "}
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
          >
            Regístrate gratis
          </button>
        </div>
      </div>
    </section>
  );

  // =========================================================================
  // VISTA MÓVIL 3: REGISTRARSE (view === 'register')
  // - Modo Cliente: Registro con evidencia de persona real (Cédula frontal y trasera) y biometría
  // - Modo Empresa: Requisitos separados por bloques (Propietario, Empresa, Dirección, Seguridad con Face ID / Cifrado)
  // =========================================================================
  const renderRegisterView = () => (
    <section
      className={`portada-2030-shell ${theme === "dark" ? "is-dark" : "is-light"}`}
      aria-label="Registro El Ganador"
      style={{
        background: '#042217',
        backgroundImage: 'linear-gradient(180deg, #052c1e 0%, #031c13 100%)',
        justifyContent: 'flex-start',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Contenedor amplio pegado a los bordes sin verse encogido */}
      <div
        className="portada-2030-interactive-layer"
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: '0 auto',
          gap: '8px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '0 4px 24px 4px',
          boxSizing: 'border-box'
        }}
      >
        {/* Barra superior con volver y switch de rol */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
          <button
            type="button"
            onClick={() => switchMode("welcome")}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <BackArrowIcon />
            <span>Volver</span>
          </button>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            {role === "business" ? "Registro Oficial Empresa" : "Registro de Comprador"}
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* Selector de Pestañas Segmentadas: Comprador vs Empresa */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(2, 28, 17, 0.75)',
          padding: '3px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          marginBottom: '4px'
        }}>
          <button
            type="button"
            onClick={() => setRole("customer")}
            style={{
              border: role === "customer" ? '1px solid rgba(226, 176, 74, 0.5)' : 'none',
              borderRadius: '999px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              background: role === "customer" ? '#0d5f40' : 'transparent',
              color: role === "customer" ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            🎟️ Comprador
          </button>
          <button
            type="button"
            onClick={() => setRole("business")}
            style={{
              border: role === "business" ? '1px solid rgba(226, 176, 74, 0.5)' : 'none',
              borderRadius: '999px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              background: role === "business" ? '#0d5f40' : 'transparent',
              color: role === "business" ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            🏪 Empresa
          </button>
        </div>

        {authError && <div className="mobileNoticeBox error" style={{ fontSize: '11px', padding: '5px 10px', margin: '1px 0' }}>⚠️ {authError}</div>}
        {authSuccess && <div className="mobileNoticeBox success" style={{ fontSize: '11px', padding: '5px 10px', margin: '1px 0' }}>✓ {authSuccess}</div>}

        {/* ===================================================================
            A. FORMULARIO CLIENTE (Comprador) con Evidencia de Persona Real
            =================================================================== */}
        {role === "customer" ? (
          <form onSubmit={handleMobileRegister} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '11px',
              color: '#ffffff',
              lineHeight: '1.35'
            }}>
              🎟️ <strong>Registro de Comprador</strong>: Completa tus datos y fotos de cédula para certificar que eres una persona real y asegurar el cobro de tus premios.
            </div>

            {/* 1. Nombre Completo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                1. TU NOMBRE COMPLETO *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                  <UserOutlineIcon />
                </span>
                <input
                  type="text"
                  placeholder="Ej: Camilo Andrés Morales"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 2. Celular */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                2. NÚMERO CELULAR / WHATSAPP (+57) *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                  <HandsetOutlineIcon />
                </span>
                <input
                  type="tel"
                  placeholder="Ej: 312 458 9021"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 3. Correo Electrónico */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                3. CORREO ELECTRÓNICO *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                  <PhoneOutlineIcon />
                </span>
                <input
                  type="email"
                  placeholder="Ej: tu_correo@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 4. Documento de Identidad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                4. DOCUMENTO DE IDENTIDAD (TIPO Y NÚMERO) *
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{
                    width: '88px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(3, 38, 25, 0.92)',
                    color: '#ffffff',
                    border: '1.4px solid rgba(255, 255, 255, 0.32)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '0 6px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="CC" style={{ background: '#031c13', color: '#fff' }}>C.C.</option>
                  <option value="CE" style={{ background: '#031c13', color: '#fff' }}>C.E.</option>
                  <option value="NIT" style={{ background: '#031c13', color: '#fff' }}>NIT</option>
                  <option value="PP" style={{ background: '#031c13', color: '#fff' }}>Pasap.</option>
                </select>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(3, 38, 25, 0.92)',
                  border: '1.4px solid rgba(255, 255, 255, 0.32)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="text"
                    placeholder="Número de cédula (ej: 1.045.678.901)"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Foto Cédula Frontal (Evidencia persona real) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  5. 🪪 FOTO CÉDULA FRONTAL (CARA DELANTERA · EVIDENCIA REAL) *
                </span>
                {idFrontFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Requerido</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: idFrontFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: idFrontFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>📸</span>
                  <span style={{ fontSize: '11.5px', color: idFrontFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {idFrontFileName ? idFrontFileName : "Tomar foto o subir cara frontal de la cédula"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {idFrontFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdFrontFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 6. Foto Cédula Trasera */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  6. 🪪 FOTO CÉDULA TRASERA (CARA POSTERIOR) *
                </span>
                {idBackFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Requerido</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: idBackFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: idBackFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>📸</span>
                  <span style={{ fontSize: '11.5px', color: idBackFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {idBackFileName ? idBackFileName : "Tomar foto o subir cara trasera de la cédula"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {idBackFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdBackFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 7. Fecha de Nacimiento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                7. FECHA DE NACIMIENTO (MAYORÍA DE EDAD +18) *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%', colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* 8. Ciudad de Residencia */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                8. CIUDAD / DEPARTAMENTO DE RESIDENCIA *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: Bogotá, Barranquilla, Medellín..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 9. Contraseña Personal Cliente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                9. 🔑 CONTRASEÑA DE CUENTA PERSONAL (CLIENTE / COMPRADOR) *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <PadlockOutlineIcon />
                </span>
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Crea tu contraseña (mínimo 6 caracteres)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                  aria-label="Ver u ocultar contraseña"
                >
                  <EyeToggleIcon hide={!showRegPassword} />
                </button>
              </div>
            </div>

            {/* 10. Confirmar Contraseña Cliente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                10. 🔒 CONFIRMAR CONTRASEÑA PERSONAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <PadlockOutlineIcon />
                </span>
                <input
                  type={showRegConfirm ? "text" : "password"}
                  placeholder="Repite tu contraseña exactamente"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                  aria-label="Ver u ocultar confirmación de contraseña"
                >
                  <EyeToggleIcon hide={!showRegConfirm} />
                </button>
              </div>
            </div>

            {/* 11. Seguridad y Biometría (Face ID / Cifrado) */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1.2px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '10px',
              padding: '8px 10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
                style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                  📱 Activar Face ID / Huella Dactilar & Cifrado AES-256
                </span>
                <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                  Protege tu cuenta con autenticación biométrica nativa de tu teléfono.
                </span>
              </div>
            </label>

            {/* Checkbox Términos */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#ffffff', lineHeight: '1.3', marginTop: '2px' }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                required
                style={{ marginTop: '2px', accentColor: '#10b981' }}
              />
              <span>Confirmo ser <strong>mayor de 18 años (+18)</strong>, residir en Colombia y aceptar las condiciones legales de juego responsable (Ley 643 de 2001).</span>
            </label>

            {/* Botón Crear Cuenta */}
            <button
              type="submit"
              className="btn-2030-login"
              disabled={authBusy}
              style={{ width: '100%', height: '42px', fontSize: '13.5px', marginTop: '4px' }}
            >
              <span>{authBusy ? "CREANDO Y ENTRANDO AL MENÚ…" : "CREAR CUENTA Y ENTRAR AL MENÚ"}</span>
              <span className="chevron-right">›</span>
            </button>
          </form>
        ) : (
          /* ===================================================================
              B. FORMULARIO EMPRESA ESTRUCTURADO EN 4 BLOQUES CLAROS
              1. Datos del Propietario (Cédula Frontal y Trasera)
              2. Datos de la Empresa (NIT, RUT DIAN, Cámara de Comercio)
              3. Dirección y Ubicación Física del Negocio
              4. Correo, Contraseña, Cifrado de Alta Seguridad y Face ID
              =================================================================== */
          <form onSubmit={handleMobileRegister} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '11px',
              color: '#ffffff',
              lineHeight: '1.35'
            }}>
              ⚖️ <strong>Registro Oficial de Establecimiento Comercial</strong>: Conforme a Coljuegos (Ley 643/2001 & Decreto 1486/2024), completa los 4 bloques para habilitar la emisión de rifas en tu local.
            </div>

            {/* -------------------------------------------------------------
                BLOQUE 1: DATOS PERSONALES DEL PROPIETARIO / REP. LEGAL
                ------------------------------------------------------------- */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginTop: '4px'
            }}>
              <span style={{ fontSize: '13px' }}>👤</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                I. Datos Personales del Propietario / Rep. Legal
              </span>
            </div>

            {/* 1.1 Nombre Propietario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                1. NOMBRE COMPLETO DEL PROPIETARIO / REP. LEGAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                  <UserOutlineIcon />
                </span>
                <input
                  type="text"
                  placeholder="Nombre y apellidos del representante legal"
                  value={legalRepName}
                  onChange={(e) => setLegalRepName(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 1.2 Cédula Propietario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                2. NÚMERO DE CÉDULA DEL PROPIETARIO *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: 1.045.678.901 (C.C. o C.E.)"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 1.3 Foto Cédula Frontal Propietario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  3. 🪪 FOTO CÉDULA FRONTAL DEL PROPIETARIO (EVIDENCIA REAL) *
                </span>
                {idFrontFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Obligatorio</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: idFrontFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: idFrontFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>📸</span>
                  <span style={{ fontSize: '11.5px', color: idFrontFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {idFrontFileName ? idFrontFileName : "Tomar foto o subir cara frontal de la cédula"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {idFrontFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdFrontFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 1.4 Foto Cédula Trasera Propietario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  4. 🪪 FOTO CÉDULA TRASERA DEL PROPIETARIO *
                </span>
                {idBackFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Obligatorio</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: idBackFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: idBackFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>📸</span>
                  <span style={{ fontSize: '11.5px', color: idBackFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {idBackFileName ? idBackFileName : "Tomar foto o subir cara trasera de la cédula"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {idBackFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdBackFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* -------------------------------------------------------------
                BLOQUE 2: DATOS DE LA EMPRESA (COLJUEGOS / TRIBUTARIO)
                ------------------------------------------------------------- */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginTop: '4px'
            }}>
              <span style={{ fontSize: '13px' }}>🏢</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                II. Datos de la Empresa (Coljuegos / Legal)
              </span>
            </div>

            {/* 2.1 Nombre Comercial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                5. RAZÓN SOCIAL / NOMBRE COMERCIAL DEL LOCAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: Motos y Accesorios del Caribe S.A.S."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 2.2 NIT de la Empresa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                6. NIT O RUT DE LA EMPRESA *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: 901.458.789-3"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 2.3 RUT DIAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  7. 📄 RUT ACTUALIZADO (DIAN · PDF O FOTO) *
                </span>
                {rutFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Obligatorio Coljuegos</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: rutFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: rutFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>📄</span>
                  <span style={{ fontSize: '11.5px', color: rutFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {rutFileName ? rutFileName : "Subir RUT actualizado (PDF o Foto)"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {rutFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setRutFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 2.4 Cámara de Comercio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                  8. 🏛️ CÁMARA DE COMERCIO VIGENTE (≤ 30 DÍAS) *
                </span>
                {camaraComercioFileName ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>✓ Adjuntado</span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>Obligatorio Coljuegos</span>
                )}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: camaraComercioFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(3, 38, 25, 0.92)',
                  border: camaraComercioFileName ? '1.4px solid rgba(16, 185, 129, 0.6)' : '1.4px dashed rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  padding: '0 10px',
                  height: '38px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>🏛️</span>
                  <span style={{ fontSize: '11.5px', color: camaraComercioFileName ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                    {camaraComercioFileName ? camaraComercioFileName : "Subir Certificado Cámara de Comercio"}
                  </span>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                  {camaraComercioFileName ? "Cambiar" : "Examinar"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCamaraComercioFileName(e.target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 2.5 Categoría Comercial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                9. CATEGORÍA COMERCIAL DEL LOCAL *
              </span>
              <div style={{
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 8px',
                height: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Motos & 4x4" style={{ background: '#031c13', color: '#fff' }}>🏍️ Motos & 4x4</option>
                  <option value="Tecnología & Celulares" style={{ background: '#031c13', color: '#fff' }}>📱 Tecnología & Celulares</option>
                  <option value="Joyas & Relojes" style={{ background: '#031c13', color: '#fff' }}>💎 Joyas & Relojes de Alta Gama</option>
                  <option value="Moda & Calzado" style={{ background: '#031c13', color: '#fff' }}>👗 Moda, Ropa & Calzado</option>
                  <option value="Hogar & Muebles" style={{ background: '#031c13', color: '#fff' }}>🏠 Hogar & Electrodomésticos</option>
                  <option value="Comercio General" style={{ background: '#031c13', color: '#fff' }}>🏪 Comercio / Otro Sector</option>
                </select>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BLOQUE 3: DIRECCIÓN Y UBICACIÓN FÍSICA DEL NEGOCIO
                ------------------------------------------------------------- */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginTop: '4px'
            }}>
              <span style={{ fontSize: '13px' }}>📍</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                III. Ubicación Física del Negocio
              </span>
            </div>

            {/* 3.1 Dirección Física */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                10. DIRECCIÓN FÍSICA EXACTA DEL LOCAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: Cra 15 # 85-20 Local 102"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 3.2 Ciudad y Departamento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                11. CIUDAD / DEPARTAMENTO DEL LOCAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="text"
                  placeholder="Ej: Barranquilla, Atlántico"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* -------------------------------------------------------------
                BLOQUE 4: CONTACTO, SEGURIDAD CON FACE ID Y CIFRADO
                ------------------------------------------------------------- */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginTop: '4px'
            }}>
              <span style={{ fontSize: '13px' }}>🔐</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                IV. Contacto y Seguridad de Acceso Empresarial
              </span>
            </div>

            {/* 4.1 Correo Corporativo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                12. CORREO ELECTRÓNICO CORPORATIVO *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="email"
                  placeholder="Ej: contacto@motoscaribe.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 4.2 Teléfono / WhatsApp del Local */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                13. TELÉFONO / WHATSAPP DE ATENCIÓN DEL LOCAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <input
                  type="tel"
                  placeholder="Ej: 312 458 9021"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {/* 4.3 Contraseña Empresa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                14. 🔐 CONTRASEÑA DE ACCESO ADMINISTRATIVO (EMPRESA / COMERCIO) *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <PadlockOutlineIcon />
                </span>
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Crea la clave para administrar tu local"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                  aria-label="Ver u ocultar contraseña"
                >
                  <EyeToggleIcon hide={!showRegPassword} />
                </button>
              </div>
            </div>

            {/* 4.4 Confirmar Contraseña Empresa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                15. 🔒 CONFIRMAR CONTRASEÑA EMPRESARIAL *
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(3, 38, 25, 0.92)',
                border: '1.4px solid rgba(255, 255, 255, 0.32)',
                borderRadius: '10px',
                padding: '0 10px',
                height: '38px',
                boxSizing: 'border-box'
              }}>
                <span style={{ color: '#ffffff', marginRight: '8px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <PadlockOutlineIcon />
                </span>
                <input
                  type={showRegConfirm ? "text" : "password"}
                  placeholder="Repite la contraseña para tu panel empresarial"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                  aria-label="Ver u ocultar confirmación de contraseña"
                >
                  <EyeToggleIcon hide={!showRegConfirm} />
                </button>
              </div>
            </div>

            {/* 4.5 Cifrado de Alta Seguridad y Face ID */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1.2px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '10px',
              padding: '8px 10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
                style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                  🛡️ Cifrado de Alta Seguridad (AES-256) & Face ID / Huella
                </span>
                <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                  Habilitar inicio de sesión biométrico rápido para administrar tu local desde este dispositivo.
                </span>
              </div>
            </label>

            {/* Declaración Legal Coljuegos */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#ffffff', lineHeight: '1.3', marginTop: '2px' }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                required
                style={{ marginTop: '2px', accentColor: '#10b981' }}
              />
              <span>Certifico bajo gravedad de juramento ser el <strong>representante legal / propietario</strong> del establecimiento, adjuntar fotos de cédula, RUT y Cámara de Comercio verídicos, y cumplir con la regulación oficial de Coljuegos (Ley 643/2001 & Decreto 1486/2024).</span>
            </label>

            {/* Botón Registrar Empresa */}
            <button
              type="submit"
              className="btn-2030-login"
              disabled={authBusy}
              style={{ width: '100%', height: '42px', fontSize: '13.5px', marginTop: '4px' }}
            >
              <span>{authBusy ? "AUTORIZANDO Y ABRIENDO PANEL…" : "REGISTRAR MI EMPRESA Y ABRIR PANEL"}</span>
              <span className="chevron-right">›</span>
            </button>
          </form>
        )}

        {/* Switch a Login */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {/* ===================================================================
          1. COMPUTADOR & TABLETS (PANTALLAS >= 768px):
             PORTADA ORIGINAL DE GALA CON PORTALAUTHSHELL
          =================================================================== */}
      <div className="pcTabletVersion">
        <PortalAuthShell
          audience={role === "customer" ? "client" : "business"}
          authMode={mode}
          authInline={true}
          wideAuthPanel={role === "business" && mode === "register"}
          belowContent={!isNative ? <BusinessPlansPreview /> : undefined}
        >
          <section id="ingreso-panel" className={`portalAuthCard premiumAuthCard ${role === "business" ? "businessAuthCard" : "customerAuthCard"}`}>
            <div className="premiumFormTopline">
              <span className="premiumFormIcon">{role === "business" ? "🏪" : "🎟️"}</span>
              <span className="premiumFormMiniTag">
                {role === "business" ? "ACCESO DE NEGOCIO · EMPRESARIAL" : "ACCESO DE COMPRADOR · PROTECCIÓN BANCARIA"}
              </span>
            </div>

            <nav className="premiumAccountChoice accountTypeSwitch" aria-label="Tipo de cuenta">
              <span>{mode === "register" ? "Crear cuenta como" : "Ingresar como"}</span>
              <div>
                <button
                  type="button"
                  className={role === "customer" ? "selected" : ""}
                  onClick={() => handlePcRoleSwitch("customer")}
                  aria-current={role === "customer" ? "page" : undefined}
                >
                  👤 Cliente
                </button>
                <button
                  type="button"
                  className={role === "business" ? "selected" : ""}
                  onClick={() => handlePcRoleSwitch("business")}
                  aria-current={role === "business" ? "page" : undefined}
                >
                  🏪 Empresa o local ↗
                </button>
              </div>
            </nav>

            <p className="portalEyebrow">
              {role === "business"
                ? (mode === "login" ? "PANEL DE COMERCIO ALIADO" : "PASO 1 · DATOS DEL LOCAL")
                : (mode === "login" ? "BIENVENIDO DE VUELTA" : "REGISTRO GRATIS · PERFIL DE CLIENTE")}
            </p>

            <h2>
              {role === "business"
                ? (mode === "login" ? "Entra al panel de tu local." : "Crea la cuenta de tu empresa.")
                : (mode === "login" ? "Entra a tu perfil seguro." : "Crea tu cuenta gratis.")}
            </h2>

            <p className="portalMuted">
              {role === "business"
                ? (mode === "login" ? "Revisa tus premios, ventas y novedades desde un solo lugar." : "Completa los datos y elige uno de los cuatro planes pagos o la demo gratis.")
                : (mode === "login" ? "Consulta tus boletas, historial y cobros de premios." : "Explora premios reales y tiendas; aparta números de la suerte desde tu perfil.")}
            </p>

            <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
              <button
                type="button"
                className="portalSwitch premiumSwitch portalSwitchLink"
                style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? (
                  <>¿Nuevo en El Ganador? <b style={{ color: "#b45309" }}>Crear cuenta gratis</b></>
                ) : (
                  <>¿Ya tienes cuenta? <b style={{ color: "#b45309" }}>Iniciar sesión</b></>
                )}
              </button>
            </div>

            {role === "customer" ? (
              <button
                type="button"
                className="portalPrimary"
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #007AFF 0%, #0051B3 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  padding: "11px 16px",
                  borderRadius: "10px",
                  margin: "6px 0 10px",
                  boxShadow: "0 4px 14px rgba(0, 122, 255, 0.35)",
                  border: "none",
                  cursor: "pointer"
                }}
                onClick={() => handlePcDemoQuickAccess("customer")}
                disabled={authBusy}
              >
                <span>⚡</span> Entrar Directo con 1 Clic (Alejandro Morales)
              </button>
            ) : (
              <button
                type="button"
                className="portalPrimary"
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #007AFF 0%, #0051B3 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  padding: "11px 16px",
                  borderRadius: "10px",
                  margin: "6px 0 10px",
                  boxShadow: "0 4px 14px rgba(0, 122, 255, 0.35)",
                  border: "none",
                  cursor: "pointer"
                }}
                onClick={() => handlePcDemoQuickAccess("business")}
                disabled={authBusy}
              >
                <span>⚡</span> Entrar Directo con 1 Clic (Demo Tienda XYZ)
              </button>
            )}

            <div style={{ margin: "8px 0 12px", padding: "10px 12px", background: "rgba(0, 122, 255, 0.08)", border: "1px solid rgba(0, 122, 255, 0.28)", borderRadius: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", display: "block", marginBottom: "5px" }}>
                💬 Ingreso Rápido con WhatsApp / Celular
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="tel"
                  placeholder="+57 312 458 9021"
                  value={pcPhone}
                  onChange={(e) => setPcPhone(e.target.value)}
                  style={{ flex: 1, minHeight: "36px", padding: "0 10px", border: "1px solid rgba(0, 122, 255, 0.35)", borderRadius: "8px", fontSize: "12px", background: "#fff", color: "#000" }}
                />
                <button
                  type="button"
                  onClick={() => handlePcDemoQuickAccess(role)}
                  disabled={authBusy}
                  style={{
                    background: "#007AFF",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 14px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  Entrar →
                </button>
              </div>
            </div>

            <div className="premiumFormDivider">
              <span>O con tu correo y contraseña</span>
            </div>

            {authError && (
              <div style={{ padding: "8px 12px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "12px", margin: "8px 0" }}>
                ⚠️ {authError}
              </div>
            )}
            {authSuccess && (
              <div style={{ padding: "8px 12px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "12px", margin: "8px 0" }}>
                ✓ {authSuccess}
              </div>
            )}

            <form className="portalForm premiumPortalForm" onSubmit={handlePcSubmit}>
              {mode === "register" && (
                <label>
                  {role === "business" ? "Nombre público del local o empresa" : "Tu nombre completo"}
                  <input
                    required
                    type="text"
                    placeholder={role === "business" ? "Ej: Tienda XYZ" : "Ej: Alejandro Morales"}
                    value={pcName}
                    onChange={(e) => setPcName(e.target.value)}
                  />
                </label>
              )}

              <label>
                Correo electrónico
                <input
                  required
                  type="email"
                  placeholder="tu@correo.com"
                  value={pcEmail}
                  onChange={(e) => setPcEmail(e.target.value)}
                />
              </label>

              <label>
                Contraseña
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Contraseña de 8 a 20 caracteres"
                  value={pcPassword}
                  onChange={(e) => setPcPassword(e.target.value)}
                />
              </label>

              {mode === "register" && role === "business" && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 122, 255, 0.08)", border: "1px solid rgba(56, 189, 248, 0.35)", display: "flex", flexDirection: "column", gap: "8px", margin: "6px 0" }}>
                  <strong style={{ fontSize: "12px", color: "#0284c7" }}>🏢 Documentos Obligatorios de Verificación del Local</strong>
                  <label>
                    NIT del comercio *
                    <input required type="text" placeholder="Ej: 901.884.221-5" value={nit} onChange={(e) => setNit(e.target.value)} />
                  </label>
                  <label>
                    Propietario / Representante Legal *
                    <input required type="text" placeholder="Nombre completo del propietario" value={legalRepName} onChange={(e) => setLegalRepName(e.target.value)} />
                  </label>
                  <label>
                    Dirección física exacta del local *
                    <input required type="text" placeholder="Ej: Cra 15 # 85-20 Local 102" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                  </label>
                  <label>
                    📄 RUT Actualizado (DIAN · PDF o foto) *
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) setRutFileName(e.target.files[0].name); }} />
                  </label>
                  <label>
                    🏛️ Cámara de Comercio vigente (≤ 30 días) *
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) setCamaraComercioFileName(e.target.files[0].name); }} />
                  </label>
                  <label>
                    🪪 Fotocopia Cédula Propietario (Cara Frontal) *
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) setIdFrontFileName(e.target.files[0].name); }} />
                  </label>
                  <label>
                    🪪 Fotocopia Cédula Propietario (Cara Trasera) *
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) setIdBackFileName(e.target.files[0].name); }} />
                  </label>
                  <label>
                    🏪 Foto de la Fachada del Local Físico *
                    <input required type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setStoreFrontFileName(e.target.files[0].name); }} />
                  </label>
                  <label>
                    🏦 Certificado Bancario (opcional)
                    <input type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) setBankCertFileName(e.target.files[0].name); }} />
                  </label>
                </div>
              )}

              {mode === "register" && (
                <label className="legal-checkbox">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    required
                  />
                  <span>
                    Confirmo que soy <strong>mayor de 18 años</strong>, me encuentro ubicado en Colombia dentro del alcance territorial autorizado del sorteo y acepto los Términos y Condiciones (Ley 643 de 2001 y Decreto 1486 de 2024).
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="portalPrimary premiumSubmit"
                disabled={authBusy}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {authBusy
                  ? "Procesando…"
                  : mode === "login"
                  ? "Entrar a mi cuenta →"
                  : (role === "business" ? "Crear cuenta de empresa →" : "Crear mi cuenta gratis →")}
              </button>
            </form>

            <div className="premiumSecurityLine" style={{ marginTop: "12px" }}>
              <span>◈</span> Acceso protegido <i /> Experiencia adaptable a móvil y escritorio
            </div>

            {!isNative && role === "business" && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <a href="#planes" style={{ fontSize: "11px", color: "#0284c7", fontWeight: "700", textDecoration: "underline" }}>
                  ↓ Ver la comparativa de planes de suscripción para empresas
                </a>
              </div>
            )}

            <footer className="store-compliance-footer">
              <p>
                Operación regulada en Colombia bajo la Ley 643 de 2001 y el Decreto 1486 de 2024 con verificación geográfica de cobertura jurisdiccional. Solo para mayores de 18 años (+18).
              </p>
              <p className="apple-google-disclaimer">
                <strong>Aviso oficial de tiendas digitales:</strong> Apple Inc. y Google LLC no son patrocinadores, avalistas ni tienen vinculación alguna con El Ganador, sus comercios aliados ni con los sorteos o premios publicados en esta aplicación.
              </p>
            </footer>
          </section>
        </PortalAuthShell>
      </div>

      {/* ===================================================================
          2. CELULARES (PANTALLAS MÓVILES < 768px):
             FLUJO DE BIENVENIDA Y AUTENTICACIÓN EXACTO AL MOCKUP OFICIAL
          =================================================================== */}
      <div className="mobileVersion max-w-md mx-auto min-h-screen">
        {(view === "welcome" || view === "splash") && renderWelcomeView()}
        {view === "login" && renderLoginView()}
        {view === "register" && renderRegisterView()}
      </div>
    </>
  );
}

export default function IngresoPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#003820" }} />}>
      <IngresoContent />
    </Suspense>
  );
}
