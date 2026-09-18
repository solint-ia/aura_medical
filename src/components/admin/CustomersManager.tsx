"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Search, ShieldCheck, Trash2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";
import { formatCep, formatCpfOrCnpj, formatPhone } from "@/lib/validators";
import { inputClass } from "./AdminUi";
import { Modal } from "./OrdersManager";

interface AdminUserAddress {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
}

interface AdminUser {
  id: string;
  cpfCnpj: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  address: AdminUserAddress | null;
}

export function CustomersManager() {
  const { authToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState("");

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }),
    [authToken],
  );

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?query=${encodeURIComponent(query)}`, { headers });
      const data = await response.json();
      if (data.users) setUsers(data.users);
    } catch {
      setMessage("Falha ao carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, [authToken, headers, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setFormError("");
    const response = await fetch("/api/admin/users", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: editing.id,
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
        phone: editing.phone,
        cpfCnpj: editing.cpfCnpj,
        role: editing.role,
      }),
    });
    const data = await response.json();
    if (!data.success) return setFormError(data.error ?? "Falha ao salvar o cliente.");
    setUsers((current) => current.map((user) => (user.id === editing.id ? editing : user)));
    setEditing(null);
    setMessage("Cliente atualizado.");
  }

  async function removeUser(user: AdminUser) {
    const response = await fetch(`/api/admin/users?id=${user.id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    const data = await response.json();
    if (!data.success) return setMessage(data.error ?? "Falha ao excluir o cliente.");
    setUsers((current) => current.filter((entry) => entry.id !== user.id));
    setDeleting(null);
    setMessage("Cliente excluído.");
  }

  return (
    <section>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-[.18em] text-accent uppercase">Operação</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Clientes</h1>
        <p className="mt-2 text-sm text-content/60">{users.length} cadastro(s)</p>
      </div>

      <label className="relative mb-6 block max-w-xl">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, e-mail ou CPF/CNPJ…"
          className={`${inputClass} pl-9`}
        />
      </label>

      {message ? (
        <p role="status" className="mb-4 rounded-xl bg-raised p-3 text-sm">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-content/55">Carregando…</p>
      ) : users.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <article key={user.id} className="rounded-[24px] border border-content/10 bg-card p-5 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-raised">
                    <User className="h-5 w-5 text-content/50" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="truncate text-sm text-content/60">{user.email}</p>
                    <p className="font-mono text-xs text-content/50">
                      {formatCpfOrCnpj(user.cpfCnpj)} · {formatPhone(user.phone)}
                    </p>
                  </div>
                </div>
                {user.role === "ADMIN" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 font-mono text-[10px] font-semibold text-accent uppercase">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                ) : null}
              </header>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-content/10 py-3 text-sm">
                <div>
                  <dt className="font-mono text-[10px] tracking-wider text-content/50 uppercase">Pedidos</dt>
                  <dd className="font-semibold">{user.totalOrders}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] tracking-wider text-content/50 uppercase">Total gasto</dt>
                  <dd className="font-semibold">{formatBRL(user.totalSpent)}</dd>
                </div>
              </dl>

              {user.address ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-content/65">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-content/35" />
                  {user.address.street}, {user.address.number}
                  {user.address.complement ? ` ${user.address.complement}` : ""} — {user.address.neighborhood},{" "}
                  {user.address.city}/{user.address.uf} · CEP {formatCep(user.address.cep)}
                </p>
              ) : (
                <p className="mt-3 text-sm text-content/45">Sem endereço cadastrado.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing({ ...user });
                    setFormError("");
                  }}
                  className="rounded-full bg-action px-4 py-2 text-xs font-semibold text-action-fg"
                >
                  Editar cadastro
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(user)}
                  className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[24px] border border-dashed border-content/15 py-16 text-center text-sm text-content/55">
          Nenhum cliente encontrado.
        </p>
      )}

      {editing ? (
        <Modal title="Editar cadastro" onClose={() => setEditing(null)}>
          <form onSubmit={saveUser} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Nome</span>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  value={editing.firstName}
                  onChange={(event) => setEditing({ ...editing, firstName: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Sobrenome</span>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  value={editing.lastName}
                  onChange={(event) => setEditing({ ...editing, lastName: event.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">E-mail</span>
              <input
                type="email"
                className={`mt-1.5 ${inputClass}`}
                value={editing.email}
                onChange={(event) => setEditing({ ...editing, email: event.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Telefone</span>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  value={formatPhone(editing.phone)}
                  onChange={(event) => setEditing({ ...editing, phone: event.target.value.replace(/\D/g, "") })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">CPF/CNPJ</span>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  value={formatCpfOrCnpj(editing.cpfCnpj)}
                  onChange={(event) => setEditing({ ...editing, cpfCnpj: event.target.value.replace(/\D/g, "") })}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Permissão</span>
              <select
                className={`mt-1.5 ${inputClass}`}
                value={editing.role}
                onChange={(event) => setEditing({ ...editing, role: event.target.value })}
              >
                <option value="USER">Cliente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>

            {formError ? (
              <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                {formError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">
                Cancelar
              </button>
              <button type="submit" className="rounded-full bg-action px-5 py-2 text-sm font-semibold text-action-fg">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal title={`Excluir ${deleting.firstName} ${deleting.lastName}?`} onClose={() => setDeleting(null)}>
          <p className="text-sm text-content/65">
            O cadastro e os pedidos vinculados a ele são removidos. Essa ação não pode ser desfeita.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void removeUser(deleting)}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Excluir
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
