"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, User, X } from "lucide-react";
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

  const [tab, setTab] = useState<"login" | "register">("login");
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [generalError, setGeneralError] = useState("");
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
  const [cepLoading, setCepLoading] = useState(false);

  // If already logged in, redirect to customer area
  if (user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <User className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-content mb-2">
          Você já está conectado
        </h1>
        <p className="text-sm text-content/75 mb-6">
          Conectado como <strong className="text-content">{user.firstName} {user.lastName}</strong> ({user.email}).
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/minha-conta"
            className="rounded-xl bg-[#C59D3F] px-6 py-3 font-bold text-xs text-[#0D1B2A] hover:bg-[#d4ac4c]"
          >
            Acessar Minha Área →
          </Link>
          <Link
            href="/checkout"
            className="rounded-xl border border-content/20 bg-canvas px-6 py-3 font-bold text-xs text-content hover:bg-content/5"
          >
            Ir para o Checkout
          </Link>
        </div>
      </div>
    );
  }

  const handleViaCep = async (cepValue: string) => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRegStreet(data.logradouro || "");
        setRegNeighborhood(data.bairro || "");
        setRegCity(data.localidade ? `${data.localidade} - ${data.uf}` : "");
        setFieldErrors((prev) => ({ ...prev, cep: "", street: "", neighborhood: "", city: "" }));
      }
    } catch {
      // Ignorar erro
    } finally {
      setCepLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
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
      router.push("/minha-conta");
    } else {
      setGeneralError(result.error || "Credenciais inválidas.");
    }
  };

  // Step 1 Validation before proceeding to Step 2
  const handleNextToAddressStep = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
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

  // Step 2 Submission (Address + Full Registration)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    const newErrors: Record<string, string> = {};

    const cepDigits = regCep.replace(/\D/g, "");
    if (!regCep.trim()) {
      newErrors.cep = "CEP é obrigatório.";
    } else if (cepDigits.length !== 8) {
      newErrors.cep = "CEP deve possuir 8 dígitos.";
    }

    if (!regStreet.trim()) newErrors.street = "Rua é obrigatória.";
    if (!regNumber.trim()) newErrors.number = "Número é obrigatório.";
    if (!regNeighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
    if (!regCity.trim()) newErrors.city = "Cidade e UF são obrigatórias.";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    const result = await register(
      {
        cpfCnpj: regCpfCnpj,
        firstName: regFirstName,
        lastName: regLastName,
        // REMOVER DATA DE NASCIMENTO SE FOR CNPJ
        birthDate: docType === "cnpj" ? "" : regBirthDate,
        email: regEmail.toLowerCase().trim(),
        phone: regPhone,
      },
      {
        cep: regCep,
        street: regStreet,
        number: regNumber,
        complement: regComplement,
        neighborhood: regNeighborhood,
        city: regCity,
        uf: regCity.includes("-") ? regCity.split("-")[1].trim() : "SE",
      },
      regPassword
    );
    setLoading(false);

    if (result.success) {
      router.push("/minha-conta");
    } else if (result.errors) {
      setFieldErrors(result.errors);
      if (result.errors.email || result.errors.cpfCnpj || result.errors.password) {
        setRegStep(1);
      }
    } else {
      setGeneralError(result.error || "Erro ao realizar cadastro.");
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-xs transition-colors outline-none ${
      hasError
        ? "border-red-500 bg-red-500/5 text-red-900 dark:text-red-200 focus:border-red-600"
        : "border-content/18 bg-canvas dark:bg-card text-content focus:border-[#C59D3F]"
    }`;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-content/12 bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center">
          <Image
            src="/logos/logo-vertical-3.png"
            alt="Aura Regenera"
            width={120}
            height={120}
            className="h-16 w-auto object-contain mx-auto mb-2"
          />
          <h1 className="font-display text-2xl font-bold text-content">
            Minha Área
          </h1>
          <p className="text-xs text-content/70 font-mono mt-0.5">
            Acesse seus pedidos, acompanhe entregas e gerencie seus dados.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-content/12 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setGeneralError("");
              setFieldErrors({});
            }}
            className={`flex-1 py-2.5 font-bold uppercase transition-colors border-b-2 ${
              tab === "login"
                ? "border-[#C59D3F] text-[#C59D3F]"
                : "border-transparent text-content/60 hover:text-content"
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setRegStep(1);
              setGeneralError("");
              setFieldErrors({});
            }}
            className={`flex-1 py-2.5 font-bold uppercase transition-colors border-b-2 ${
              tab === "register"
                ? "border-[#C59D3F] text-[#C59D3F]"
                : "border-transparent text-content/60 hover:text-content"
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {generalError && (
          <div className="rounded-lg bg-red-500/10 p-3 font-mono text-xs font-semibold text-red-500 border border-red-500/20">
            ⚠️ {generalError}
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
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
                <User className="absolute right-3 top-3 h-4 w-4 text-content/40" />
              </div>
              {fieldErrors.loginEmailOrCpf && (
                <p className="mt-1 font-mono text-[11px] text-red-500">{fieldErrors.loginEmailOrCpf}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                Senha *
              </label>
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
                <Lock className="absolute right-3 top-3 h-4 w-4 text-content/40" />
              </div>
              {fieldErrors.loginPassword && (
                <p className="mt-1 font-mono text-[11px] text-red-500">{fieldErrors.loginPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#C59D3F] py-3 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99] mt-2"
            >
              {loading ? "Entrando..." : "Entrar na Conta →"}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === "register" && (
          <div>
            {/* Step Tracker */}
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] border-b border-content/10 pb-2 uppercase">
              <span className={`font-bold ${regStep === 1 ? "text-[#C59D3F]" : "text-content/50"}`}>
                1. Dados & Acesso
              </span>
              <span className="text-content/30">➔</span>
              <span className={`font-bold ${regStep === 2 ? "text-[#C59D3F]" : "text-content/50"}`}>
                2. Endereço de Entrega
              </span>
            </div>

            {/* STEP 1: PERSONAL DATA & PASSWORD */}
            {regStep === 1 && (
              <form onSubmit={handleNextToAddressStep} className="space-y-3">
                {/* NOME E SOBRENOME NO INÍCIO */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Nome *
                    </label>
                    <input
                      type="text"
                      placeholder="Maria"
                      value={regFirstName}
                      onChange={(e) => {
                        setRegFirstName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                      }}
                      className={inputClass(!!fieldErrors.firstName)}
                    />
                    {fieldErrors.firstName && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Sobrenome *
                    </label>
                    <input
                      type="text"
                      placeholder="Silva"
                      value={regLastName}
                      onChange={(e) => {
                        setRegLastName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                      }}
                      className={inputClass(!!fieldErrors.lastName)}
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* DOCUMENT TYPE SELECTOR (CPF VS CNPJ) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-mono text-[10px] uppercase text-content/70">
                      Tipo de Documento *
                    </label>
                    <div className="flex gap-1 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setDocType("cpf");
                          setRegCpfCnpj("");
                          setFieldErrors((prev) => ({ ...prev, cpfCnpj: "" }));
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          docType === "cpf"
                            ? "bg-[#C59D3F] text-[#0D1B2A]"
                            : "bg-content/10 text-content/60 hover:text-content"
                        }`}
                      >
                        CPF (Pessoa Física)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDocType("cnpj");
                          setRegCpfCnpj("");
                          setFieldErrors((prev) => ({ ...prev, cpfCnpj: "" }));
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          docType === "cnpj"
                            ? "bg-[#C59D3F] text-[#0D1B2A]"
                            : "bg-content/10 text-content/60 hover:text-content"
                        }`}
                      >
                        CNPJ (Empresa)
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    maxLength={docType === "cpf" ? 14 : 18}
                    value={regCpfCnpj}
                    onChange={(e) => {
                      const formatted = docType === "cpf" ? formatCpf(e.target.value) : formatCnpj(e.target.value);
                      setRegCpfCnpj(formatted);
                      setFieldErrors((prev) => ({ ...prev, cpfCnpj: "" }));
                    }}
                    className={inputClass(!!fieldErrors.cpfCnpj)}
                  />
                  {fieldErrors.cpfCnpj && (
                    <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.cpfCnpj}</p>
                  )}
                </div>

                <div className={`grid ${docType === "cpf" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                  {/* DATA DE NASCIMENTO: APENAS SE FOR CPF (REMOVIDO SE FOR CNPJ) */}
                  {docType === "cpf" && (
                    <div>
                      <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={regBirthDate}
                        onChange={(e) => setRegBirthDate(e.target.value)}
                        className={inputClass()}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(formatPhone(e.target.value));
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      className={inputClass(!!fieldErrors.phone)}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                    E-mail *
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
                    <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Senha * (mín. 6 chars)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={inputClass(!!fieldErrors.password)}
                    />
                    {fieldErrors.password && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Confirmar Senha *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      className={inputClass(!!fieldErrors.confirmPassword)}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#C59D3F] py-3 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99] mt-2"
                >
                  Continuar →
                </button>
              </form>
            )}

            {/* STEP 2: ADDRESS */}
            {regStep === 2 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      CEP *
                    </label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      maxLength={9}
                      value={regCep}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value);
                        setRegCep(formatted);
                        handleViaCep(formatted);
                        setFieldErrors((prev) => ({ ...prev, cep: "" }));
                      }}
                      className={inputClass(!!fieldErrors.cep)}
                    />
                    {cepLoading && <span className="font-mono text-[9px] text-[#C59D3F]">Buscando CEP...</span>}
                    {fieldErrors.cep && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.cep}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Número *
                    </label>
                    <input
                      type="text"
                      placeholder="1000"
                      value={regNumber}
                      onChange={(e) => {
                        setRegNumber(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, number: "" }));
                      }}
                      className={inputClass(!!fieldErrors.number)}
                    />
                    {fieldErrors.number && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                    Logradouro / Rua *
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Paulista"
                    value={regStreet}
                    onChange={(e) => {
                      setRegStreet(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    className={inputClass(!!fieldErrors.street)}
                  />
                  {fieldErrors.street && (
                    <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Complemento
                    </label>
                    <input
                      type="text"
                      placeholder="Apto 42"
                      value={regComplement}
                      onChange={(e) => setRegComplement(e.target.value)}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      placeholder="Bela Vista"
                      value={regNeighborhood}
                      onChange={(e) => {
                        setRegNeighborhood(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, neighborhood: "" }));
                      }}
                      className={inputClass(!!fieldErrors.neighborhood)}
                    />
                    {fieldErrors.neighborhood && (
                      <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.neighborhood}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-mono text-[10px] uppercase text-content/70">
                    Cidade / UF *
                  </label>
                  <input
                    type="text"
                    placeholder="São Paulo - SP"
                    value={regCity}
                    onChange={(e) => {
                      setRegCity(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, city: "" }));
                    }}
                    className={inputClass(!!fieldErrors.city)}
                  />
                  {fieldErrors.city && (
                    <p className="mt-0.5 font-mono text-[10px] text-red-500">{fieldErrors.city}</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="w-1/3 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 rounded-xl bg-[#C59D3F] py-2.5 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
                  >
                    {loading ? "Cadastrando..." : "Concluir Cadastro & Acessar →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
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
