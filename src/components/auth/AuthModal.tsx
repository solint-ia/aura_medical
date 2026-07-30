"use client";

import { useState } from "react";
import { Lock, Mail, MapPin, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCpfOrCnpj, validateCpfOrCnpj } from "@/lib/validators";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, initialTab = "login", onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCpfCnpj, setLoginCpfCnpj] = useState("");

  // Registration form state
  const [regCpfCnpj, setRegCpfCnpj] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Address fields in registration
  const [regCep, setRegCep] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regComplement, setRegComplement] = useState("");
  const [regNeighborhood, setRegNeighborhood] = useState("");
  const [regCity, setRegCity] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  if (!isOpen) return null;

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
      }
    } catch {
      // Ignorar erro silenciosamente
    } finally {
      setCepLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginEmail.trim() && !loginCpfCnpj.trim()) {
      setErrorMsg("Informe seu E-mail ou CPF/CNPJ para entrar.");
      return;
    }

    setLoading(true);
    const result = await login(loginEmail, loginCpfCnpj);
    setLoading(false);

    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.error || "Credenciais não encontradas.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!regCpfCnpj || !regFirstName || !regLastName || !regEmail || !regPhone) {
      setErrorMsg("Preencha todos os campos obrigatórios (*).");
      return;
    }

    if (!validateCpfOrCnpj(regCpfCnpj)) {
      setErrorMsg("CPF ou CNPJ inválido. Digite um documento válido.");
      return;
    }

    if (!regCep || !regStreet || !regNumber || !regNeighborhood || !regCity) {
      setErrorMsg("Preencha o endereço completo de cadastro.");
      return;
    }

    setLoading(true);
    const result = await register(
      {
        cpfCnpj: regCpfCnpj,
        firstName: regFirstName,
        lastName: regLastName,
        birthDate: regBirthDate,
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
      }
    );
    setLoading(false);

    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.error || "Erro ao realizar cadastro.");
    }
  };

  const inputClass = "w-full rounded-lg border border-content/18 bg-canvas dark:bg-card px-3.5 py-2.5 text-sm text-content outline-none focus:border-[#C59D3F]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-content/12 bg-card p-6 shadow-2xl transition-all my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-content/60 hover:bg-content/10 hover:text-content"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
            <User className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-content">
            Área do Profissional
          </h2>
          <p className="text-xs text-content/70 mt-1 font-mono">
            Acesse seus pedidos, acompanhe entregas e gerencie seus dados.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="mb-6 flex border-b border-content/12 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg("");
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
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 font-bold uppercase transition-colors border-b-2 ${
              tab === "register"
                ? "border-[#C59D3F] text-[#C59D3F]"
                : "border-transparent text-content/60 hover:text-content"
            }`}
          >
            Cadastrar Novo Profissional
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 font-mono text-xs font-semibold text-red-500 border border-red-500/20">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                E-mail Cadastrado *
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="doutora.maria@exemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                />
                <Mail className="absolute right-3 top-3 h-4 w-4 text-content/40" />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                Ou CPF / CNPJ
              </label>
              <input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={loginCpfCnpj}
                onChange={(e) => setLoginCpfCnpj(formatCpfOrCnpj(e.target.value))}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#C59D3F] py-3.5 font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
            >
              {loading ? "Entrando..." : "Entrar na Conta →"}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTRATION FORM */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              1. Dados do Profissional
            </h3>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                CPF ou CNPJ *
              </label>
              <input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={regCpfCnpj}
                onChange={(e) => setRegCpfCnpj(formatCpfOrCnpj(e.target.value))}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Nome *
                </label>
                <input
                  type="text"
                  placeholder="Maria"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  placeholder="Silva"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                E-mail Profissional *
              </label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider pt-2 border-t border-content/10">
              2. Endereço Principal da Clínica / Consultório
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  CEP *
                </label>
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  value={regCep}
                  onChange={(e) => {
                    setRegCep(e.target.value);
                    handleViaCep(e.target.value);
                  }}
                  className={inputClass}
                />
                {cepLoading && <span className="font-mono text-[10px] text-[#C59D3F]">Buscando CEP...</span>}
              </div>

              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Número *
                </label>
                <input
                  type="text"
                  placeholder="1000"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                Logradouro / Rua *
              </label>
              <input
                type="text"
                placeholder="Av. Paulista"
                value={regStreet}
                onChange={(e) => setRegStreet(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Sala 402"
                  value={regComplement}
                  onChange={(e) => setRegComplement(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                  Bairro *
                </label>
                <input
                  type="text"
                  placeholder="Bela Vista"
                  value={regNeighborhood}
                  onChange={(e) => setRegNeighborhood(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                Cidade / UF *
              </label>
              <input
                type="text"
                placeholder="São Paulo - SP"
                value={regCity}
                onChange={(e) => setRegCity(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#C59D3F] py-3.5 font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
            >
              {loading ? "Cadastrando..." : "Concluir Cadastro & Acessar →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
