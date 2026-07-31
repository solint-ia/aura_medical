"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, KeyRound, Lock, Mail, MapPin, RefreshCw, ShieldCheck, User } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import {
  formatCep,
  formatCpf,
  formatCnpj,
  formatPhone,
  validateCpf,
  validateCnpj,
} from "@/lib/validators";

function AuthPageContent() {
  const router = useRouter();
  const { user, login, register } = useAuth();

  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmailOrCpf, setLoginEmailOrCpf] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration Step 1 state (Personal Data & Password)
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regCpfCnpj, setRegCpfCnpj] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Registration Step 2 state (Address)
  const [regCep, setRegCep] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regComplement, setRegComplement] = useState("");
  const [regNeighborhood, setRegNeighborhood] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regUf, setRegUf] = useState("SE");
  const [cepLoading, setCepLoading] = useState(false);

  // OTP Verification state (Step 3)
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes = 600s
  const [resendingCode, setResendingCode] = useState(false);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotTimer, setForgotTimer] = useState(600); // 10 minutes = 600s
  const [resendingForgotCode, setResendingForgotCode] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // Timer countdown for OTP Registration (10 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (regStep === 3 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, otpTimer]);

  // Timer countdown for Forgot Password OTP (10 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tab === "forgot" && forgotStep === 2 && forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tab, forgotStep, forgotTimer]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Redirect if already logged in
  if (user) {
    if (user.role === "ADMIN" || user.email.toLowerCase() === "contato@auraregenera.com") {
      router.push("/admin");
    } else {
      router.push("/minha-conta");
    }
    return null;
  }

  // Handle Document Masking
  const handleCpfCnpjChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (docType === "cpf") {
      setRegCpfCnpj(formatCpf(clean));
    } else {
      setRegCpfCnpj(formatCnpj(clean));
    }
    setFieldErrors((prev) => ({ ...prev, cpfCnpj: "" }));
  };

  // Dynamic CEP Auto-fill via ViaCEP API
  const handleCepBlur = async () => {
    const clean = regCep.replace(/\D/g, "");
    if (clean.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRegStreet(data.logradouro || "");
        setRegNeighborhood(data.bairro || "");
        setRegCity(data.localidade || "");
        setRegUf(data.uf || "SE");
        setFieldErrors((prev) => ({ ...prev, cep: "" }));
      } else {
        setFieldErrors((prev) => ({ ...prev, cep: "CEP não encontrado." }));
      }
    } catch {
      // Ignore error
    } finally {
      setCepLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");
    const newErrors: Record<string, string> = {};

    if (!loginEmailOrCpf.trim()) {
      newErrors.loginEmailOrCpf = "Informe seu E-mail ou CPF/CNPJ.";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Informe sua senha para entrar.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    const result = await login(loginEmailOrCpf, loginPassword);
    setLoading(false);

    if (result.success) {
      if (
        result.user?.role === "ADMIN" ||
        result.user?.email.toLowerCase() === "contato@auraregenera.com" ||
        loginEmailOrCpf.toLowerCase().includes("contato@auraregenera.com")
      ) {
        router.push("/admin");
      } else {
        router.push("/minha-conta");
      }
    } else {
      setGeneralError(result.error || "Credenciais inválidas.");
    }
  };

  // Step 1 Validation before proceeding to Step 2
  const handleNextToAddressStep = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");
    const newErrors: Record<string, string> = {};

    if (!regFirstName.trim()) newErrors.firstName = "Nome é obrigatório.";
    if (!regLastName.trim()) newErrors.lastName = "Sobrenome é obrigatório.";

    const cleanDoc = regCpfCnpj.replace(/\D/g, "");
    if (!cleanDoc) {
      newErrors.cpfCnpj = docType === "cpf" ? "CPF é obrigatório." : "CNPJ é obrigatório.";
    } else if (docType === "cpf") {
      if (cleanDoc.length !== 11 || !validateCpf(cleanDoc)) {
        newErrors.cpfCnpj = "CPF inválido. Digite um CPF válido com 11 dígitos.";
      }
    } else if (docType === "cnpj") {
      if (cleanDoc.length !== 14 || !validateCnpj(cleanDoc)) {
        newErrors.cpfCnpj = "CNPJ inválido. Digite um CNPJ válido com 14 dígitos.";
      }
    }

    if (!regEmail.trim()) {
      newErrors.email = "E-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      newErrors.email = "E-mail com formato inválido.";
    }

    const phoneDigits = regPhone.replace(/\D/g, "");
    if (!regPhone.trim()) {
      newErrors.phone = "Telefone / WhatsApp é obrigatório.";
    } else if (phoneDigits.length < 10) {
      newErrors.phone = "Telefone deve conter no mínimo 10 dígitos com DDD.";
    }

    if (!regPassword) {
      newErrors.password = "Senha é obrigatória.";
    } else if (regPassword.length < 6) {
      newErrors.password = "A senha deve ter no mínimo 6 caracteres.";
    }

    if (!regConfirmPassword) {
      newErrors.confirmPassword = "Confirmação é obrigatória.";
    } else if (regPassword !== regConfirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }

    setFieldErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setRegStep(2);
    }
  };

  // Step 2 Submission (Create Account & Trigger Verification Email)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");
    const newErrors: Record<string, string> = {};

    const cepDigits = regCep.replace(/\D/g, "");
    if (!regCep.trim()) {
      newErrors.cep = "CEP é obrigatório.";
    } else if (cepDigits.length !== 8) {
      newErrors.cep = "CEP deve possuir 8 dígitos.";
    }

    if (!regStreet.trim()) newErrors.street = "Logradouro / Rua é obrigatório.";
    if (!regNumber.trim()) newErrors.number = "Número é obrigatório.";
    if (!regNeighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
    if (!regCity.trim()) newErrors.city = "Cidade é obrigatória.";
    if (!regUf.trim()) newErrors.uf = "Estado (UF) é obrigatório.";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);

    const profilePayload = {
      cpfCnpj: regCpfCnpj.replace(/\D/g, ""),
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      birthDate: docType === "cpf" ? regBirthDate : "",
      email: regEmail.toLowerCase().trim(),
      phone: regPhone.replace(/\D/g, ""),
    };

    const addressPayload = {
      cep: regCep.replace(/\D/g, ""),
      street: regStreet.trim(),
      number: regNumber.trim(),
      complement: regComplement.trim() || undefined,
      neighborhood: regNeighborhood.trim(),
      city: regCity.trim(),
      uf: regUf.toUpperCase().trim(),
      isDefault: true,
    };

    const result = await register(profilePayload, addressPayload, regPassword);

    if (result.success) {
      // Trigger Maileroo Email Verification
      try {
        await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: regEmail.toLowerCase().trim() }),
        });
      } catch (mailErr) {
        console.error("Erro ao enviar e-mail de verificação:", mailErr);
      }

      setLoading(false);
      setRegStep(3);
      setOtpTimer(600); // 10 minutes
      setSuccessMsg(`Enviamos um código de 6 dígitos para ${regEmail}. Insira-o abaixo para concluir o cadastro.`);
    } else if (result.errors) {
      setLoading(false);
      const formatted: Record<string, string> = {};
      if (result.errors.email) formatted.email = result.errors.email;
      if (result.errors.cpfCnpj) formatted.cpfCnpj = result.errors.cpfCnpj;
      if (result.errors.password) formatted.password = result.errors.password;
      setFieldErrors(formatted);
      if (result.errors.email || result.errors.cpfCnpj || result.errors.password) {
        setRegStep(1);
      }
    } else {
      setLoading(false);
      setGeneralError(result.error || "Erro ao realizar cadastro.");
    }
  };

  // Step 3 OTP Verification Submission
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");

    if (!otpCode.trim() || otpCode.replace(/\D/g, "").length !== 6) {
      setGeneralError("Digite o código de 6 dígitos enviado por e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          code: otpCode.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (
          data.user?.role === "ADMIN" ||
          data.user?.email.toLowerCase() === "contato@auraregenera.com" ||
          regEmail.toLowerCase().includes("contato@auraregenera.com")
        ) {
          router.push("/admin");
        } else {
          router.push("/minha-conta");
        }
      } else {
        setGeneralError(data.error || "Código de verificação incorreto ou expirado.");
      }
    } catch (err) {
      setLoading(false);
      setGeneralError("Erro ao comunicar com o servidor de verificação.");
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    setResendingCode(true);
    setGeneralError("");
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpTimer(600);
        setSuccessMsg(`Novo código de 6 dígitos reenviado para ${regEmail}.`);
      } else {
        setGeneralError(data.error || "Erro ao reenviar código.");
      }
    } catch {
      setGeneralError("Erro de conexão ao reenviar código.");
    } finally {
      setResendingCode(false);
    }
  };

  // Forgot Password Handlers
  const handleSendForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");

    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setGeneralError("Informe um e-mail válido cadastrado.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setForgotStep(2);
        setForgotTimer(600); // 10 minutes
        setSuccessMsg(`Código de recuperação de 6 dígitos enviado para ${forgotEmail}.`);
      } else {
        setGeneralError(data.error || "E-mail não encontrado.");
      }
    } catch {
      setLoading(false);
      setGeneralError("Erro de comunicação com o servidor.");
    }
  };

  // Step 2: Validate Code
  const handleVerifyForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");

    if (!forgotCode.trim() || forgotCode.replace(/\D/g, "").length !== 6) {
      setGeneralError("Digite o código de 6 dígitos recebido por e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.toLowerCase().trim(),
          code: forgotCode.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setForgotStep(3);
        setSuccessMsg("Código verificado com sucesso! Digite sua nova senha abaixo.");
      } else {
        setGeneralError(data.error || "Código de recuperação incorreto ou expirado.");
      }
    } catch {
      setLoading(false);
      setGeneralError("Erro de comunicação ao verificar código.");
    }
  };

  // Resend Forgot Password Code
  const handleResendForgotCode = async () => {
    setResendingForgotCode(true);
    setGeneralError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setForgotTimer(600); // Reset 10min timer
        setSuccessMsg(`Novo código de recuperação de 6 dígitos reenviado para ${forgotEmail}.`);
      } else {
        setGeneralError(data.error || "Erro ao reenviar código.");
      }
    } catch {
      setGeneralError("Erro de conexão ao reenviar código.");
    } finally {
      setResendingForgotCode(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setGeneralError("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setGeneralError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.toLowerCase().trim(),
          code: forgotCode.replace(/\D/g, ""),
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setTab("login");
        setForgotStep(1);
        setForgotCode("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setSuccessMsg("Senha redefinida com sucesso! Digite sua nova senha para entrar.");
      } else {
        setGeneralError(data.error || "Erro ao redefinir senha.");
      }
    } catch {
      setLoading(false);
      setGeneralError("Erro de comunicação ao redefinir senha.");
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none ${
      hasError
        ? "border-red-500 bg-red-500/5 text-red-900 dark:text-red-200 focus:border-red-600"
        : "border-content/18 bg-canvas dark:bg-card text-content focus:border-[#C59D3F]"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-[clamp(20px,4vw,56px)] py-12 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <Image
          src="/logos/logo-vertical-3.png"
          alt="Aura Regenera"
          width={280}
          height={280}
          className="h-32 sm:h-40 md:h-44 w-auto object-contain mx-auto drop-shadow-md"
        />
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-content">
          {tab === "login"
            ? "Acesse sua Conta Aura"
            : tab === "register"
              ? "Criar Nova Conta"
              : "Redefinir Senha"}
        </h1>
        <p className="text-sm text-content/75 font-mono max-w-md mx-auto">
          {tab === "forgot"
            ? "Recupere o acesso à sua conta utilizando seu e-mail cadastrado."
            : "Gerencie seus pedidos, dados cadastrais e acompanhe suas entregas com segurança."}
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-content/12 font-mono text-sm">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setGeneralError("");
            setSuccessMsg("");
            setFieldErrors({});
          }}
          className={`flex-1 py-3.5 font-bold uppercase transition-colors border-b-2 text-center ${
            tab === "login"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          🔑 Entrar na Conta
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("register");
            setRegStep(1);
            setGeneralError("");
            setSuccessMsg("");
            setFieldErrors({});
          }}
          className={`flex-1 py-3.5 font-bold uppercase transition-colors border-b-2 text-center ${
            tab === "register"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          ✨ Criar Nova Conta
        </button>
      </div>

      {generalError && (
        <div className="rounded-xl bg-red-500/10 p-4 font-mono text-xs font-semibold text-red-500 border border-red-500/20">
          ⚠️ {generalError}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-emerald-500/15 p-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ✓ {successMsg}
        </div>
      )}

      {/* TAB 1: FORMULÁRIO DE LOGIN */}
      {tab === "login" && (
        <form onSubmit={handleLoginSubmit} className="space-y-5 py-4">
          <div className="space-y-4 max-w-xl mx-auto">
            <div>
              <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                E-mail ou CPF / CNPJ *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="seuemail@exemplo.com ou 000.000.000-00"
                  value={loginEmailOrCpf}
                  onChange={(e) => {
                    setLoginEmailOrCpf(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, loginEmailOrCpf: "" }));
                  }}
                  className={inputClass(!!fieldErrors.loginEmailOrCpf)}
                />
                <User className="absolute right-3.5 top-3.5 h-4 w-4 text-content/40" />
              </div>
              {fieldErrors.loginEmailOrCpf && (
                <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.loginEmailOrCpf}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                <label className="uppercase text-content/80 font-semibold">Senha de Acesso *</label>
                <button
                  type="button"
                  onClick={() => {
                    setTab("forgot");
                    setForgotStep(1);
                    setGeneralError("");
                    setSuccessMsg("");
                  }}
                  className="text-[#C59D3F] hover:underline font-bold"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, loginPassword: "" }));
                  }}
                  className={inputClass(!!fieldErrors.loginPassword)}
                />
                <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-content/40" />
              </div>
              {fieldErrors.loginPassword && (
                <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.loginPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99] mt-2"
            >
              {loading ? "Entrando..." : "Entrar na Minha Conta →"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FORMULÁRIO DE CADASTRO */}
      {tab === "register" && (
        <div className="space-y-6 py-4">
          {/* Step Tracker Header */}
          <div className="flex items-center justify-between font-mono text-xs border-b border-content/10 pb-3 uppercase">
            <span className={`font-bold ${regStep === 1 ? "text-[#C59D3F]" : "text-content/50"}`}>
              1. Dados Pessoais & Acesso
            </span>
            <span className={`font-bold ${regStep === 2 ? "text-[#C59D3F]" : "text-content/50"}`}>
              2. Endereço Principal
            </span>
            <span className={`font-bold ${regStep === 3 ? "text-[#C59D3F]" : "text-content/50"}`}>
              3. Verificação por E-mail
            </span>
          </div>

          {/* STEP 1: DADOS PESSOAIS */}
          {regStep === 1 && (
            <form onSubmit={handleNextToAddressStep} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-content/80 font-semibold">
                  Tipo de Cadastro *
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 font-mono text-xs font-semibold text-content">
                    <input
                      type="radio"
                      name="docType"
                      checked={docType === "cpf"}
                      onChange={() => {
                        setDocType("cpf");
                        setRegCpfCnpj("");
                      }}
                      className="accent-[#C59D3F]"
                    />
                    <span>Pessoa Física (CPF)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 font-mono text-xs font-semibold text-content">
                    <input
                      type="radio"
                      name="docType"
                      checked={docType === "cnpj"}
                      onChange={() => {
                        setDocType("cnpj");
                        setRegCpfCnpj("");
                        setRegBirthDate("");
                      }}
                      className="accent-[#C59D3F]"
                    />
                    <span>Pessoa Jurídica (CNPJ)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    {docType === "cpf" ? "Nome *" : "Razão Social / Nome Fantasia *"}
                  </label>
                  <input
                    type="text"
                    placeholder={docType === "cpf" ? "Seu nome" : "Razão Social"}
                    value={regFirstName}
                    onChange={(e) => {
                      setRegFirstName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                    }}
                    className={inputClass(!!fieldErrors.firstName)}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    {docType === "cpf" ? "Sobrenome *" : "Responsável Técnico / Sobrenome *"}
                  </label>
                  <input
                    type="text"
                    placeholder="Sobrenome"
                    value={regLastName}
                    onChange={(e) => {
                      setRegLastName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                    }}
                    className={inputClass(!!fieldErrors.lastName)}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-4 ${docType === "cpf" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    {docType === "cpf" ? "CPF *" : "CNPJ *"}
                  </label>
                  <input
                    type="text"
                    placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    value={regCpfCnpj}
                    onChange={(e) => handleCpfCnpjChange(e.target.value)}
                    className={inputClass(!!fieldErrors.cpfCnpj)}
                  />
                  {fieldErrors.cpfCnpj && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.cpfCnpj}</p>
                  )}
                </div>

                {docType === "cpf" && (
                  <div>
                    <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                      Data de Nascimento (Opcional)
                    </label>
                    <input
                      type="date"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    E-mail Principal *
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={inputClass(!!fieldErrors.email)}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(formatPhone(e.target.value));
                      setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className={inputClass(!!fieldErrors.phone)}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Criar Senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={inputClass(!!fieldErrors.password)}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Repita sua senha"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    className={inputClass(!!fieldErrors.confirmPassword)}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99] mt-4"
              >
                Prosseguir para o Endereço →
              </button>
            </form>
          )}

          {/* STEP 2: ENDEREÇO DE ENTREGA */}
          {regStep === 2 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    CEP *
                  </label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={regCep}
                    onChange={(e) => {
                      setRegCep(formatCep(e.target.value));
                      setFieldErrors((prev) => ({ ...prev, cep: "" }));
                    }}
                    onBlur={handleCepBlur}
                    className={inputClass(!!fieldErrors.cep)}
                  />
                  {cepLoading && (
                    <p className="mt-1 font-mono text-[11px] text-[#C59D3F] animate-pulse">Buscando CEP...</p>
                  )}
                  {fieldErrors.cep && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.cep}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Logradouro / Rua *
                  </label>
                  <input
                    type="text"
                    placeholder="Av., Rua, Travessa..."
                    value={regStreet}
                    onChange={(e) => {
                      setRegStreet(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    className={inputClass(!!fieldErrors.street)}
                  />
                  {fieldErrors.street && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.street}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Número *
                  </label>
                  <input
                    type="text"
                    placeholder="123 ou S/N"
                    value={regNumber}
                    onChange={(e) => {
                      setRegNumber(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, number: "" }));
                    }}
                    className={inputClass(!!fieldErrors.number)}
                  />
                  {fieldErrors.number && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.number}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Complemento (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Apto, Sala, Bloco, Referência..."
                    value={regComplement}
                    onChange={(e) => setRegComplement(e.target.value)}
                    className={inputClass(false)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    placeholder="Seu bairro"
                    value={regNeighborhood}
                    onChange={(e) => {
                      setRegNeighborhood(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, neighborhood: "" }));
                    }}
                    className={inputClass(!!fieldErrors.neighborhood)}
                  />
                  {fieldErrors.neighborhood && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.neighborhood}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    placeholder="Sua cidade"
                    value={regCity}
                    onChange={(e) => {
                      setRegCity(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, city: "" }));
                    }}
                    className={inputClass(!!fieldErrors.city)}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SE, SP, RJ..."
                    value={regUf}
                    onChange={(e) => {
                      setRegUf(e.target.value.toUpperCase());
                      setFieldErrors((prev) => ({ ...prev, uf: "" }));
                    }}
                    className={inputClass(!!fieldErrors.uf)}
                  />
                  {fieldErrors.uf && (
                    <p className="mt-1 font-mono text-xs text-red-500">{fieldErrors.uf}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setRegStep(1)}
                  className="w-1/3 rounded-xl border border-content/20 py-3.5 font-mono text-xs font-semibold text-content hover:bg-content/5 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
                >
                  {loading ? "Enviando Código..." : "Finalizar Cadastro →"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP VERIFICATION CODE (10 MIN) */}
          {regStep === 3 && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6 max-w-md mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-content">
                  Digite o Código de 6 Dígitos
                </h3>
                <p className="text-xs text-content/70 font-mono">
                  Enviamos o código para <strong>{regEmail}</strong>. Ele expira em 10 minutos.
                </p>
              </div>

              <div>
                <label className="block text-center font-mono text-xs uppercase text-content/80 font-bold mb-2">
                  Código de Confirmação
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-2xl border-2 border-[#C59D3F] bg-canvas py-4 text-center font-mono text-3xl font-extrabold text-[#C59D3F] tracking-[12px] outline-none shadow-md"
                />
              </div>

              <div className="flex items-center justify-between font-mono text-xs text-content/70 border-t border-b border-content/10 py-3">
                <span>⏱ Expira em: <strong className="text-content">{formatTimer(otpTimer)}</strong></span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingCode}
                  className="text-[#C59D3F] hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendingCode ? "animate-spin" : ""}`} />
                  <span>{resendingCode ? "Enviando..." : "Reenviar Código"}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
              >
                {loading ? "Verificando..." : "Confirmar Código & Entrar →"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: FORGOT PASSWORD */}
      {tab === "forgot" && (
        <div className="space-y-6 max-w-xl mx-auto py-4">
          {forgotStep === 1 && (
            <form onSubmit={handleSendForgotCode} className="space-y-5">
              <div>
                <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                  E-mail Cadastrado *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputClass(false)}
                  />
                  <Mail className="absolute right-3.5 top-3.5 h-4 w-4 text-content/40" />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="w-1/3 rounded-xl border border-content/20 py-3.5 font-mono text-xs font-semibold text-content hover:bg-content/5 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
                >
                  {loading ? "Enviando..." : "Enviar Código de Recuperação →"}
                </button>
              </div>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={handleVerifyForgotCode} className="space-y-5 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-content">
                  Digite o Código de 6 Dígitos
                </h3>
                <p className="text-xs text-content/70 font-mono">
                  Enviamos o código para <strong>{forgotEmail}</strong>. Ele expira em 10 minutos.
                </p>
              </div>

              <div>
                <label className="block text-center font-mono text-xs uppercase text-content/80 font-bold mb-2">
                  Código de Recuperação
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-2xl border-2 border-[#C59D3F] bg-canvas py-3.5 text-center font-mono text-3xl font-extrabold text-[#C59D3F] tracking-[12px] outline-none shadow-md"
                />
              </div>

              <div className="flex items-center justify-between font-mono text-xs text-content/70 border-t border-b border-content/10 py-3">
                <span>⏱ Expira em: <strong className="text-content">{formatTimer(forgotTimer)}</strong></span>
                <button
                  type="button"
                  onClick={handleResendForgotCode}
                  disabled={resendingForgotCode}
                  className="text-[#C59D3F] hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendingForgotCode ? "animate-spin" : ""}`} />
                  <span>{resendingForgotCode ? "Enviando..." : "Reenviar Código"}</span>
                </button>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-1/3 rounded-xl border border-content/20 py-3.5 font-mono text-xs font-semibold text-content hover:bg-content/5 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
                >
                  {loading ? "Verificando..." : "Validar Código →"}
                </button>
              </div>
            </form>
          )}

          {forgotStep === 3 && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-content">
                  Cadastrar Nova Senha
                </h3>
                <p className="text-xs text-content/70 font-mono">
                  Código verificado! Digite sua nova senha de acesso para a conta ({forgotEmail}).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-mono text-xs uppercase text-content/80 font-semibold">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Repita a nova senha"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className={inputClass(false)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(2)}
                  className="w-1/3 rounded-xl border border-content/20 py-3.5 font-mono text-xs font-semibold text-content hover:bg-content/5 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 rounded-xl bg-[#C59D3F] py-3.5 font-bold text-sm text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
                >
                  {loading ? "Salvando..." : "Salvar Nova Senha →"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function EntrarPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas min-h-screen">
        <AuthPageContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
