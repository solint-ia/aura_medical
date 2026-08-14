import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  FileCheck2,
  Stethoscope,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Cpu,
  Truck,
  Sparkles,
  Scale,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { COMPANY_CNPJ, CONTACT_EMAIL, WHATSAPP_NUMBER_DISPLAY, WHATSAPP_URL, ADVERSE_EVENT_CONTACT } from "@/data/site";

export const metadata: Metadata = {
  title: "Termos de Uso · Aura Regenera",
  description:
    "Termos e Condições de Uso da plataforma Aura Regenera. Informações sobre credenciamento profissional, aquisição de bioregenerativos recombinantes e diretrizes de uso.",
};

const SECTIONS = [
  { id: "sobre", title: "1. Sobre a Aura Regenera" },
  { id: "publico-alvo", title: "2. Destinação Exclusiva a Profissionais da Saúde" },
  { id: "aceitacao", title: "3. Aceitação dos Termos" },
  { id: "cadastro", title: "4. Cadastro, Credenciamento e Segurança" },
  { id: "utilizacao", title: "5. Utilização dos Serviços e da Plataforma" },
  { id: "informacoes-medicas", title: "6. Natureza das Informações Científicas e Limitação Médica" },
  { id: "pedidos-logistica", title: "7. Aquisição de Produtos, Preços e Logística" },
  { id: "farmacovigilancia", title: "8. Farmacovigilância e Eventos Adversos" },
  { id: "ia-automacao", title: "9. Inteligência Artificial e Automações" },
  { id: "integracoes", title: "10. Sistemas Automatizados e Integrações" },
  { id: "comunicacao", title: "11. Canais de Mensageria e Comunicação" },
  { id: "dados-inseridos", title: "12. Dados Inseridos pelo Usuário" },
  { id: "propriedade-intelectual", title: "13. Propriedade Intelectual" },
  { id: "licenca", title: "14. Licença de Uso do Conteúdo" },
  { id: "condicoes-comerciais", title: "15. Condições Comerciais e Pagamentos" },
  { id: "disponibilidade", title: "16. Disponibilidade dos Serviços" },
  { id: "atualizacoes", title: "17. Atualizações e Alterações da Plataforma" },
  { id: "suporte", title: "18. Suporte Técnico e Científico" },
  { id: "responsabilidades", title: "19. Responsabilidades do Usuário" },
  { id: "limitacao", title: "20. Limitação de Responsabilidade" },
  { id: "suspensao", title: "21. Suspensão ou Encerramento do Acesso" },
  { id: "privacidade", title: "22. Privacidade e Proteção de Dados (LGPD)" },
  { id: "legislacao-foro", title: "23. Legislação Aplicável e Contato" },
];

export default function TermosDeUsoPage() {
  return (
    <AccreditationProvider>
      <div className="min-h-screen bg-[#0D1B2A] text-[#F6F3EC]">
        <SiteHeader />

        <main className="relative overflow-hidden pb-24">
          {/* Ambient Lighting & Glow Orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -z-0 h-[600px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-30"
          >
            <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-[#C59D3F]/25" />
            <div className="absolute top-20 right-1/4 h-[450px] w-[450px] rounded-full bg-[#162A3D]" />
          </div>

          <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,4vw,56px)] pt-8 md:pt-12">
            {/* Breadcrumbs */}
            <nav aria-label="Navegação estrutural" className="mb-8">
              <ol className="flex items-center gap-2 font-mono text-xs text-[#F6F3EC]/60">
                <li>
                  <Link href="/" className="transition-colors hover:text-[#C59D3F]">
                    Home
                  </Link>
                </li>
                <li>
                  <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                </li>
                <li className="font-semibold text-[#C59D3F]">
                  Termos de Uso
                </li>
              </ol>
            </nav>

            {/* Header Hero */}
            <div className="mb-12 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/10 px-4 py-1.5 font-mono text-xs font-semibold tracking-widest text-[#C59D3F] uppercase backdrop-blur-sm">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Condições Gerais · Credenciamento Profissional</span>
                <span className="h-1 w-1 rounded-full bg-[#C59D3F]" />
                <span>Vigente</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Termos de Uso
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#F6F3EC]/80 leading-relaxed">
                Bem-vindo à <strong className="text-white font-semibold">Aura Regenera</strong>. Estes Termos de Uso estabelecem as regras, condições e diretrizes aplicáveis ao acesso e utilização do nosso site, catálogo digital, plataforma de credenciamento e pedidos de bioregenerativos recombinantes.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-[#F6F3EC]/60 border-t border-white/10 pt-4">
                <span>Última atualização: <strong className="text-[#C59D3F]">14 de agosto de 2026</strong></span>
                <span>·</span>
                <span>CNPJ: <strong className="text-white">{COMPANY_CNPJ}</strong></span>
              </div>
            </div>

            {/* Destaques Rápidos / Pillars */}
            <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Uso Profissional Exclusivo</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Aquisição de produtos e protocolos restritos a profissionais de saúde legalmente habilitados.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Garantia & Rastreabilidade</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Insumos biotecnológicos originais com rigoroso controle de lote, conservação e transporte.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <Scale className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Autonomia Clínica</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Conteúdos científicos orientativos que não substituem o diagnóstico e a conduta soberana do profissional.
                </p>
              </div>
            </div>

            {/* Layout com Sumário Lateral e Conteúdo */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              {/* Sidebar: Índice */}
              <aside className="lg:col-span-4">
                <div className="sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#12283C]/70 p-6 backdrop-blur-md scrollbar-thin">
                  <p className="font-mono text-xs font-semibold tracking-wider text-[#C59D3F] uppercase mb-4">
                    Índice dos Termos
                  </p>
                  <nav aria-label="Seções dos termos de uso" className="space-y-1 text-xs">
                    {SECTIONS.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="block rounded-lg px-3 py-1.5 text-[#F6F3EC]/75 transition-colors hover:bg-white/[0.06] hover:text-[#C59D3F]"
                      >
                        {sec.title}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="text-xs text-[#F6F3EC]/60 mb-2">Precisa de assessoria?</p>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#C59D3F] hover:underline"
                    >
                      WhatsApp: {WHATSAPP_NUMBER_DISPLAY}
                    </a>
                  </div>
                </div>
              </aside>

              {/* Corpo Principal dos Termos */}
              <article className="space-y-12 text-[#F6F3EC]/85 lg:col-span-8 leading-relaxed">
                {/* Introdução e Declaração */}
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Estes <strong>Termos de Uso</strong> regulam o acesso aos conteúdos, catálogo técnico, área restrita de credenciamento, cotações, solicitações comerciais e pedidos de bioregenerativos recombinantes da linha <strong className="text-white">pbserum Plus (Slim+, Smooth+, Drain+)</strong> e produtos correlatos distribuídos pela <strong>Aura Regenera</strong> (CNPJ {COMPANY_CNPJ}).
                  </p>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed">
                    Ao acessar, navegar ou efetuar cadastros em nosso site, o usuário declara ter lido, compreendido e concordado integralmente com as condições dispostas nestes Termos e na nossa{" "}
                    <Link href="/politica-de-privacidade" className="text-[#C59D3F] underline underline-offset-4 hover:opacity-80">
                      Política de Privacidade
                    </Link>. Caso não concorde com qualquer disposição, solicitamos que não prossiga com a utilização da plataforma.
                  </p>
                </section>

                {/* Seção 1 */}
                <section id="sobre" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      01
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Sobre a Aura Regenera
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera atua na distribuição, representação comercial, suporte técnico-científico e disseminação de protocolos clínicos baseados em biotecnologia recombinante de última geração, especialmente desenvolvidos para regeneração tecidual, remodelagem da matriz extracelular (MEC), combate à flacidez, celulite, fibroses, cicatrizes e gordura localizada.
                  </p>
                </section>

                {/* Seção 2 */}
                <section id="publico-alvo" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      02
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Destinação Exclusiva a Profissionais da Saúde Habilitados
                    </h2>
                  </div>
                  <div className="rounded-xl border border-[#C59D3F]/30 bg-[#C59D3F]/10 p-5 text-sm sm:text-base text-white">
                    <p className="flex items-center gap-2 font-bold text-[#C59D3F] mb-2">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      Aviso Regulatório Importante
                    </p>
                    <p className="leading-relaxed">
                      A aquisição comercial de bioregenerativos recombinantes e a aplicação prática dos protocolos clínicos apresentados neste site são <strong className="text-[#C59D3F]">estritamente reservadas a profissionais de saúde devidamente habilitados</strong> e registrados em seus respectivos conselhos de classe profissionais no Brasil (CRM, CRBM, CRO, CRF e demais categorias legalmente autorizadas pelos órgãos competentes).
                    </p>
                  </div>
                  <p className="text-sm sm:text-base">
                    O usuário declara e garante, sob as penas da lei, que todas as informações de inscrição profissional fornecidas no ato de credenciamento ou compra são autênticas e vigentes. A Aura Regenera reserva-se o direito de exigir comprovação documental de registro profissional a qualquer momento.
                  </p>
                </section>

                {/* Seção 3 */}
                <section id="aceitacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      03
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Aceitação dos Termos
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Ao utilizar a plataforma, realizar credenciamento, solicitar orçamentos ou efetivar pedidos, o usuário manifesta sua aceitação plena e sem reservas a estes Termos de Uso. Quando a utilização for realizada em nome de uma pessoa jurídica (clínica, consultório ou hospital), o usuário declara possuir plenos poderes para vinculá-la legalmente.
                  </p>
                </section>

                {/* Seção 4 */}
                <section id="cadastro" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      04
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Cadastro, Credenciamento e Segurança da Conta
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Determinadas áreas do site (como acesso a tabelas de valores profissionais, compras online e materiais científicos exclusivos) exigem cadastro prévio e verificação de credencial:
                  </p>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span>O usuário é responsável por manter suas informações cadastrais exatas, completas e atualizadas;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span>O login e a senha de acesso são de uso pessoal e intransferível, cabendo ao usuário a guarda sigilosa de suas credenciais;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span>Em caso de suspeita de uso não autorizado ou quebra de segurança de sua conta, o usuário deverá comunicar a Aura Regenera imediatamente.</span>
                    </li>
                  </ul>
                </section>

                {/* Seção 5 */}
                <section id="utilizacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      05
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Utilização dos Serviços e da Plataforma
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A plataforma deve ser utilizada de acordo com a boa-fé, as normas éticas e a legislação vigente. É expressamente vedado ao usuário:
                  </p>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">✕</span>
                      <span>Fornecer dados falsos, utilizar registros de terceiros ou fraudar credenciamentos profissionais;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">✕</span>
                      <span>Tentar acessar áreas restritas do sistema, bancos de dados ou servidores sem autorização;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">✕</span>
                      <span>Realizar engenharia reversa, raspagem de dados (scraping) não autorizada ou cópia não licenciada de conteúdos;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">✕</span>
                      <span>Disseminar malwares, vírus ou qualquer código malicioso capaz de afetar a estabilidade da plataforma.</span>
                    </li>
                  </ul>
                </section>

                {/* Seção 6 */}
                <section id="informacoes-medicas" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      06
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Natureza das Informações Científicas e Limitação Médica
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    As informações técnicas, descrições de enzimas, protocolos de aplicação (Slim+, Smooth+, Drain+), tabelas de diluição e fotografias de casos clínicos disponibilizados no site têm <strong className="text-white">caráter estritamente orientativo, educacional e científico</strong>.
                  </p>
                  <p className="text-sm sm:text-base">
                    Esses conteúdos não configuram consulta médica, diagnóstico ou prescrição automatizada para pacientes individuais. Cabe exclusivamente ao profissional assistente a realização de anamnese detalhada, indicação clínica, obtenção de Termo de Consentimento Livre e Esclarecido (TCLE) de seu paciente, aplicação correta do produto e acompanhamento do tratamento.
                  </p>
                </section>

                {/* Seção 7 */}
                <section id="pedidos-logistica" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      07
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Aquisição de Produtos, Preços e Logística
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Os pedidos realizados na plataforma estão sujeitos à confirmação de pagamento, disponibilidade de estoque e validação do cadastro profissional.
                  </p>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Conservação e Transporte:</strong> Nossos bioregenerativos recombinantes liofilizados são expedidos em embalagens adequadas, acompanhados de nota fiscal e lote rastreável;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Conferência no Recebimento:</strong> O profissional ou responsável clínico deve conferir a integridade da embalagem, lacres e prazo de validade no momento da entrega;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Armazenamento Adequado:</strong> O cliente é responsável por armazenar os produtos estritamente conforme as instruções da bula e rótulo do fabricante.</span>
                    </li>
                  </ul>
                </section>

                {/* Seção 8 */}
                <section id="farmacovigilancia" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      08
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Farmacovigilância e Reporte de Eventos Adversos
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Em conformidade com as normas sanitárias e o compromisso com a segurança do paciente, mantemos canais diretos para comunicação técnica e reporte de intercorrências ou suspeitas de eventos adversos relacionados ao uso dos produtos:
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs sm:text-sm">
                    <p className="font-semibold text-white mb-1">Canal de Farmacovigilância & Tecnovigilância pbserum:</p>
                    <p className="text-[#F6F3EC]/80">E-mail: <a href={`mailto:${ADVERSE_EVENT_CONTACT.email}`} className="text-[#C59D3F] font-mono hover:underline">{ADVERSE_EVENT_CONTACT.email}</a></p>
                    <p className="text-[#F6F3EC]/80 mt-1">Suporte Técnico Aura Regenera: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#C59D3F] font-mono hover:underline">{CONTACT_EMAIL}</a></p>
                  </div>
                </section>

                {/* Seção 9 */}
                <section id="ia-automacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      09
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Inteligência Artificial e Automações
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Determinados recursos de suporte, navegação guiada e atendimento em nosso site podem empregar modelos de inteligência artificial para otimização de respostas. O usuário reconhece que essas ferramentas possuem finalidade de facilitação e triagem, devendo as informações técnicas de aplicação e dosagens ser sempre validadas nas literaturas oficiais e bulas disponibilizadas.
                  </p>
                </section>

                {/* Seção 10 */}
                <section id="integracoes" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      10
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Sistemas Automatizados e Integrações
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Nossos serviços podem integrar-se a plataformas de pagamento, cálculo de frete logístico, emissores de documentos fiscais e serviços de nuvem de terceiros. A Aura Regenera trabalha continuamente para manter a melhor estabilidade operacional, resguardando eventuais indisponibilidades pontuais decorrentes desses provedores externos.
                  </p>
                </section>

                {/* Seção 11 */}
                <section id="comunicacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      11
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Canais de Mensageria e Comunicação
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O atendimento ao cliente pode ser realizado por canais digitais como WhatsApp oficial ({WHATSAPP_NUMBER_DISPLAY}) e e-mail. Ao utilizar esses canais, o usuário concorda em manter uma comunicação respeitosa, profissional e alinhada com as normas de conduta vigentes.
                  </p>
                </section>

                {/* Seção 12 */}
                <section id="dados-inseridos" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      12
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Dados Inseridos pelo Usuário
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O usuário garante que possui a legitimidade legal para inserir todos os dados submetidos à plataforma, incluindo dados de faturamento de sua clínica, registros profissionais e endereços de entrega.
                  </p>
                </section>

                {/* Seção 13 */}
                <section id="propriedade-intelectual" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      13
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Propriedade Intelectual
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Todos os direitos sobre logotipos, marcas (Aura Regenera, pbserum Plus, Slim+, Smooth+, Drain+), layout do site, gráficos, bancos de dados, textos técnicos, fotografias autorizadas de casos clínicos e códigos-fonte pertencem à Aura Regenera ou aos seus respectivos licenciantes e parceiros biotecnológicos internacionais. É vedada a reprodução, cópia, publicação ou exploração comercial sem autorização expressa e por escrito.
                  </p>
                </section>

                {/* Seção 14 */}
                <section id="licenca" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      14
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Licença de Uso do Conteúdo
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera concede aos profissionais credenciados uma licença limitada, não exclusiva e revogável para consulta dos materiais técnico-científicos exclusivamente para seu aprimoramento e suporte à sua atuação clínica.
                  </p>
                </section>

                {/* Seção 15 */}
                <section id="condicoes-comerciais" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      15
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Condições Comerciais e Pagamentos
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Os preços praticados, condições de parcelamento, eventuais descontos por volume e prazos de entrega são apresentados na área de cotação ou no fluxo de checkout da plataforma. Pedidos estão sujeitos a confirmação de liquidação bancária e aprovação de crédito pelas instituições financeiras.
                  </p>
                </section>

                {/* Seção 16 */}
                <section id="disponibilidade" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      16
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Disponibilidade dos Serviços
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Buscamos manter o site em funcionamento ininterrupto, 24 horas por dia. Contudo, indisponibilidades temporárias poderão ocorrer por razões de manutenções preventivas, atualizações de segurança ou oscilações na rede mundial de computadores.
                  </p>
                </section>

                {/* Seção 17 */}
                <section id="atualizacoes" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      17
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Atualizações e Alterações da Plataforma
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera poderá modificar, adicionar ou descontinuar funcionalidades, produtos do catálogo ou recursos da plataforma a qualquer momento para melhoria contínua e atendimento a requisitos de mercado e regulação sanitária.
                  </p>
                </section>

                {/* Seção 18 */}
                <section id="suporte" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      18
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Suporte Técnico e Científico
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Disponibilizamos assessoria técnico-científica aos profissionais credenciados para esclarecimento de dúvidas sobre composição das enzimas, mecanismos de ação, processos de reconstituição e combinações de protocolos, pelos nossos canais oficiais de atendimento em horário comercial.
                  </p>
                </section>

                {/* Seção 19 */}
                <section id="responsabilidades" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      19
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Responsabilidades do Usuário
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O usuário é responsável pela legalidade de sua atuação clínica, pelo sigilo das informações de seus pacientes e pela correta aplicação das técnicas e produtos nos termos de sua habilitação profissional e das boas práticas de saúde.
                  </p>
                </section>

                {/* Seção 20 */}
                <section id="limitacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      20
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Limitação de Responsabilidade
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera não responde por danos resultantes do uso indevido dos produtos por indivíduos não habilitados, aplicação em desconformidade com as orientações técnicas, armazenamento impróprio após o recebimento ou decisões clínicas autônomas tomadas pelo profissional de saúde.
                  </p>
                </section>

                {/* Seção 21 */}
                <section id="suspensao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      21
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Suspensão ou Encerramento do Acesso
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera poderá suspender ou cancelar o credenciamento de qualquer usuário em caso de suspeita de fraude, utilização indevida de dados profissionais, inadimplemento reiterado ou violação grave destes Termos de Uso.
                  </p>
                </section>

                {/* Seção 22 */}
                <section id="privacidade" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      22
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Privacidade e Proteção de Dados (LGPD)
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O tratamento de dados pessoais no âmbito de nossos serviços obedece rigorosamente à Lei nº 13.709/2018 (LGPD). Para mais detalhes sobre a coleta, armazenamento e exercício de seus direitos de titular, consulte nossa{" "}
                    <Link href="/politica-de-privacidade" className="text-[#C59D3F] font-semibold underline underline-offset-4 hover:opacity-80">
                      Política de Privacidade
                    </Link>.
                  </p>
                </section>

                {/* Seção 23 - Legislação e Contato */}
                <section id="legislacao-foro" className="scroll-mt-28">
                  <div className="rounded-2xl border border-[#C59D3F]/30 bg-gradient-to-br from-[#12283C] to-[#0B1D2C] p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F] text-[#0D1B2A]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          Legislação Aplicável, Foro e Atendimento Oficial
                        </h2>
                        <p className="text-xs text-[#F6F3EC]/70">
                          Aura Regenera · CNPJ {COMPANY_CNPJ}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-[#F6F3EC]/85 leading-relaxed mb-6">
                      Estes Termos de Uso são regidos e interpretados em conformidade com a legislação da República Federativa do Brasil. Para dirimir eventuais controvérsias oriundas destes termos, fica eleito o Foro da Comarca de Aracaju/SE, com renúncia a qualquer outro, por mais privilegiado que seja.
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs sm:text-sm">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[#C59D3F] font-mono text-xs uppercase block mb-1">E-mail de Atendimento</span>
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="font-semibold text-white hover:text-[#C59D3F] transition-colors"
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[#C59D3F] font-mono text-xs uppercase block mb-1">WhatsApp Comercial & Suporte</span>
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-[#C59D3F] transition-colors"
                        >
                          {WHATSAPP_NUMBER_DISPLAY}
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#F6F3EC]/60">
                      <span>Aura Regenera · Bioregenerativos Recombinantes</span>
                      <span>Aracaju · SE · Brasil</span>
                    </div>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </AccreditationProvider>
  );
}
