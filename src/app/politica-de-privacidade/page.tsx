import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Shield,
  Lock,
  FileText,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  UserCheck,
  Globe,
  Share2,
  HelpCircle,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { COMPANY_CNPJ, CONTACT_EMAIL, WHATSAPP_NUMBER_DISPLAY, WHATSAPP_URL } from "@/data/site";

export const metadata: Metadata = {
  title: "Política de Privacidade · Aura Regenera",
  description:
    "Conheça a Política de Privacidade da Aura Regenera. Saiba como tratamos, protegemos e garantimos a segurança dos seus dados pessoais em conformidade com a LGPD.",
};

const SECTIONS = [
  { id: "coleta", title: "1. Dados que podemos coletar" },
  { id: "utilizacao", title: "2. Como utilizamos os dados" },
  { id: "ia-automacao", title: "3. Inteligência Artificial e automação" },
  { id: "compartilhamento", title: "4. Compartilhamento de informações" },
  { id: "seguranca", title: "5. Armazenamento e segurança dos dados" },
  { id: "cookies", title: "6. Cookies e tecnologias semelhantes" },
  { id: "terceiros", title: "7. Ferramentas de terceiros" },
  { id: "direitos", title: "8. Direitos do titular (LGPD)" },
  { id: "comunicacoes", title: "9. Comunicações e informativos" },
  { id: "casos-clinicos", title: "10. Dados e casos clínicos" },
  { id: "transferencia", title: "11. Transferência e processamento de dados" },
  { id: "menores", title: "12. Menores de idade" },
  { id: "responsabilidades", title: "13. Responsabilidades do usuário" },
  { id: "alteracoes", title: "14. Alterações desta Política" },
  { id: "contato", title: "15. Contato e Encarregado de Dados" },
];

export default function PoliticaPrivacidadePage() {
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
                  Política de Privacidade
                </li>
              </ol>
            </nav>

            {/* Header Hero */}
            <div className="mb-12 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/10 px-4 py-1.5 font-mono text-xs font-semibold tracking-widest text-[#C59D3F] uppercase backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
                <span>LGPD · Lei nº 13.709/2018</span>
                <span className="h-1 w-1 rounded-full bg-[#C59D3F]" />
                <span>Documento Oficial</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Política de Privacidade
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#F6F3EC]/80 leading-relaxed">
                A <strong className="text-white font-semibold">Aura Regenera</strong> valoriza a privacidade, a segurança e a proteção dos dados pessoais de seus clientes, profissionais da saúde credenciados, parceiros e visitantes.
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
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Sigilo & Segurança</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Criptografia de ponta a ponta e controle estrito no armazenamento de cadastros e pedidos.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <Share2 className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Zero Comercialização</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Não vendemos nem repassamos seus dados cadastrais ou comerciais para terceiros.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Direitos Garantidos</h2>
                <p className="mt-1.5 text-xs text-[#F6F3EC]/70 leading-relaxed">
                  Acesso rápido, correção, portabilidade e revogação de consentimento a qualquer momento.
                </p>
              </div>
            </div>

            {/* Layout com Sumário Lateral e Conteúdo */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              {/* Sidebar: Índice */}
              <aside className="lg:col-span-4">
                <div className="sticky top-28 rounded-2xl border border-white/10 bg-[#12283C]/70 p-6 backdrop-blur-md">
                  <p className="font-mono text-xs font-semibold tracking-wider text-[#C59D3F] uppercase mb-4">
                    Índice do Documento
                  </p>
                  <nav aria-label="Seções da política" className="space-y-1 text-xs">
                    {SECTIONS.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="block rounded-lg px-3 py-2 text-[#F6F3EC]/75 transition-colors hover:bg-white/[0.06] hover:text-[#C59D3F]"
                      >
                        {sec.title}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="text-xs text-[#F6F3EC]/60 mb-2">Dúvidas sobre privacidade?</p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#C59D3F] hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
              </aside>

              {/* Corpo Principal da Política */}
              <article className="space-y-12 text-[#F6F3EC]/85 lg:col-span-8 leading-relaxed">
                {/* Introdução */}
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Esta <strong>Política de Privacidade</strong> tem como objetivo explicar, de forma clara, transparente e acessível, como a <strong>Aura Regenera</strong> coleta, utiliza, armazena, compartilha e protege as informações pessoais durante a utilização de nosso website, catálogo digital de bioregenerativos recombinantes, plataforma de credenciamento profissional, sistema de pedidos, formulários e canais de atendimento digital.
                  </p>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed">
                    O tratamento de dados pessoais realizado pela Aura Regenera observa rigorosamente a legislação brasileira aplicável, especialmente a <strong className="text-white">Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018)</strong>, bem como as diretrizes regulatórias e sanitárias pertinentes ao setor de saúde e estética médica.
                  </p>
                </section>

                {/* Seção 1 */}
                <section id="coleta" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      01
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Dados que podemos coletar
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Dependendo de como você interage com a Aura Regenera (como visitante, profissional de saúde em processo de credenciamento ou cliente regular), poderemos coletar as seguintes categorias de dados:
                  </p>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Dados cadastrais e de identificação:</strong> Nome completo, CPF, e-mail e número de telefone/WhatsApp;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Dados profissionais e de credenciamento:</strong> Registro profissional em conselho de classe (CRM, CRBM, CRO, CRF ou correlatos), especialidade clínica, nome da clínica ou consultório e CNPJ profissional;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Dados de entrega e faturamento:</strong> Endereço comercial/clínico completo para envio dos bioregenerativos recombinantes e informações fiscais para emissão de Nota Fiscal;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Informações fornecidas voluntariamente:</strong> Mensagens enviadas via WhatsApp, solicitações de suporte sobre protocolos clínicos (ex.: Slim+, Smooth+, Drain+), dúvidas técnicas e histórico de pedidos;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Dados técnicos de navegação:</strong> Endereço IP, tipo de dispositivo, navegador utilizado, páginas e protocolos consultados e registros de data/hora de acesso;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span><strong>Cookies e identificadores:</strong> Informações de preferências de sessão e métricas de usabilidade para aprimoramento contínuo da plataforma.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-[#F6F3EC]/70 italic">
                    * Solicitamos apenas os dados estritamente necessários para atender finalidades legítimas, comerciais e regulatórias da nossa operação.
                  </p>
                </section>

                {/* Seção 2 */}
                <section id="utilizacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      02
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Como utilizamos os dados
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    As informações coletadas são utilizadas com bases legais bem definidas (execução de contrato, cumprimento de obrigação legal, legítimo interesse ou consentimento), com os seguintes objetivos:
                  </p>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-sm">
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Validação de Credenciamento</strong>
                      Confirmar a habilitação técnico-profissional para compra e aplicação de bioregenerativos recombinantes.
                    </li>
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Processamento de Pedidos</strong>
                      Viabilizar compras, emitir notas fiscais e coordenar a logística de entrega com transporte climatizado/adequado.
                    </li>
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Suporte Técnico-Científico</strong>
                      Prestar assessoria especializada sobre protocolos, composição enzimática, reconstituição e diluição.
                    </li>
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Obrigações Regulatórias</strong>
                      Atender às exigências de rastreabilidade de produtos de saúde e farmacovigilância.
                    </li>
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Atendimento & Comunicação</strong>
                      Responder solicitações por WhatsApp, e-mail ou telefone informados pelo usuário.
                    </li>
                    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <strong className="text-white block mb-1">Prevenção a Fraudes</strong>
                      Garantir a segurança dos pagamentos, autenticação de contas e proteção contra acessos indevidos.
                    </li>
                  </ul>
                </section>

                {/* Seção 3 */}
                <section id="ia-automacao" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      03
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Inteligência Artificial e automação
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera utiliza soluções tecnológicas baseadas em inteligência artificial e automação para agilizar a triagem de credenciamento, qualificação inicial de contatos, assistência na navegação de protocolos e otimização do atendimento ao cliente.
                  </p>
                  <div className="rounded-xl border border-[#C59D3F]/20 bg-[#C59D3F]/5 p-4 text-sm text-[#F6F3EC]/90">
                    <p className="flex items-center gap-2 font-semibold text-[#C59D3F] mb-1">
                      <Cpu className="h-4 w-4 shrink-0" />
                      Uso Ético e Limites da IA
                    </p>
                    <p>
                      Sistemas automatizados e assistentes virtuais têm função exclusivamente informativa e de suporte operacional. Eles não realizam prescrições médicas e não substituem o discernimento clínico do profissional de saúde assistente.
                    </p>
                  </div>
                </section>

                {/* Seção 4 */}
                <section id="compartilhamento" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      04
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Compartilhamento de informações
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    <strong className="text-white">A Aura Regenera não comercializa nem aluga dados pessoais sob nenhuma hipótese.</strong> O compartilhamento ocorre apenas quando estritamente necessário para a prestação dos serviços contratados ou cumprimento de dever legal:
                  </p>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Operadores logísticos e transportadoras:</strong> Para viabilizar a entrega física dos bioregenerativos no endereço clínico cadastrado;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Processadores de pagamento e instituições financeiras:</strong> Para faturamento, cobrança e prevenção a fraudes;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Provedores de infraestrutura e hospedagem:</strong> Servidores em nuvem com altos padrões de segurança para armazenamento de banco de dados;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Farmacovigilância e parceiros biotecnológicos (ex.: Proteos Biotech / pbserum):</strong> Em casos de reporte formal de eventos adversos para cumprimento das normas de vigilância sanitária;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C59D3F] font-bold">•</span>
                      <span><strong>Autoridades públicas e ordens judiciais:</strong> Quando houver determinação legal ou solicitação válida de autoridade competente.</span>
                    </li>
                  </ul>
                </section>

                {/* Seção 5 */}
                <section id="seguranca" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      05
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Armazenamento e segurança dos dados
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Adotamos medidas técnicas, organizacionais e administrativas para proteger os dados contra acessos não autorizados, perda, destruição, alteração ou vazamento. Isso inclui certificados SSL/TLS, criptografia de dados em repouso e em trânsito, controle de privilégios de acesso e monitoramento contínuo.
                  </p>
                  <p className="text-sm sm:text-base">
                    Os dados são retidos pelo tempo necessário para atingir as finalidades para as quais foram coletados, respeitando os prazos mínimos de guarda exigidos pela legislação fiscal, sanitária e civil brasileira.
                  </p>
                </section>

                {/* Seção 6 */}
                <section id="cookies" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      06
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Cookies e tecnologias semelhantes
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Nosso site utiliza cookies e identificadores de navegação com a finalidade de garantir o funcionamento adequado da plataforma, autenticação de sessão no carrinho/área do cliente, salvar preferências e analisar estatísticas anônimas de tráfego.
                  </p>
                  <p className="text-sm sm:text-base">
                    O usuário pode configurar seu navegador para bloquear ou alertar sobre cookies, contudo, o bloqueio de cookies essenciais poderá prejudicar o funcionamento correto de compras e credenciamento no site.
                  </p>
                </section>

                {/* Seção 7 */}
                <section id="terceiros" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      07
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Ferramentas de terceiros
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Nosso site pode conter links e integrações com plataformas externas (por exemplo, WhatsApp, canais de fabricantes parceiros ou serviços analíticos). Ao clicar em links externos, o usuário estará sujeito às políticas de privacidade de tais serviços terceiros, sobre as quais a Aura Regenera não possui controle direto.
                  </p>
                </section>

                {/* Seção 8 */}
                <section id="direitos" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      08
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Direitos do titular de dados (LGPD)
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Nos termos do artigo 18 da Lei nº 13.709/2018 (LGPD), você, na qualidade de titular dos dados pessoais, pode exercer a qualquer momento os seguintes direitos:
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs sm:text-sm">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Confirmação & Acesso</strong>
                      Confirmar a existência de tratamento e solicitar cópia dos seus dados cadastrais.
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Correção</strong>
                      Solicitar a alteração de dados incompletos, inexatos ou desatualizados.
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Anonimização ou Eliminação</strong>
                      Solicitar exclusão de dados desnecessários ou tratados com consentimento prévio.
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Portabilidade</strong>
                      Solicitar transferência dos dados cadastrais para outro fornecedor de serviços.
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Informação sobre Compartilhamento</strong>
                      Saber com quais entidades públicas e privadas seus dados foram compartilhados.
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <strong className="text-white block">Revogação do Consentimento</strong>
                      Retirar o consentimento para recebimento de informativos e comunicações de marketing.
                    </div>
                  </div>
                  <p className="text-xs text-[#F6F3EC]/70">
                    Para exercer qualquer um destes direitos, basta enviar uma mensagem ao nosso Encarregado de Dados pelo e-mail: <strong className="text-[#C59D3F]">{CONTACT_EMAIL}</strong>.
                  </p>
                </section>

                {/* Seção 9 */}
                <section id="comunicacoes" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      09
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Comunicações e informativos técnico-científicos
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    A Aura Regenera poderá enviar comunicações contendo artigos científicos, lançamentos de novos protocolos, novidades de biotecnologia e atualizações comerciais aos profissionais cadastrados. O usuário poderá optar por interromper o recebimento de mensagens promocionais a qualquer momento por meio do link de descadastro nas mensagens ou solicitando via WhatsApp/e-mail.
                  </p>
                  <p className="text-xs text-[#F6F3EC]/70">
                    O cancelamento de marketing não afeta o envio de comunicados operacionais indispensáveis, tais como rastreio de encomendas, faturas e avisos de segurança.
                  </p>
                </section>

                {/* Seção 10 */}
                <section id="casos-clinicos" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      10
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Dados, imagens e casos clínicos
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    As fotografias de antes e depois e os relatórios de casos clínicos divulgados no site têm finalidade estritamente técnico-científica e informativa para a comunidade médica e profissional. Todos os casos clínicos exibidos contam com as devidas autorizações éticas de uso de imagem ou passaram por processos de anonimização conforme as resoluções dos conselhos de classe da saúde e da LGPD.
                  </p>
                </section>

                {/* Seção 11 */}
                <section id="transferencia" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      11
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Transferência e processamento internacional de dados
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Determinados fornecedores de infraestrutura tecnológica (como servidores de nuvem, banco de dados e APIs de segurança) podem possuir instalações localizadas fora do Brasil. Nesses casos, garantimos que a transferência internacional observe os níveis adequados de proteção de dados exigidos pela legislação brasileira.
                  </p>
                </section>

                {/* Seção 12 */}
                <section id="menores" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      12
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Menores de idade
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O site e os serviços da Aura Regenera são estritamente direcionados a profissionais da área da saúde e indivíduos legalmente capazes maiores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes.
                  </p>
                </section>

                {/* Seção 13 */}
                <section id="responsabilidades" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      13
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Responsabilidades do usuário
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    O usuário compromete-se a fornecer dados verídicos e autênticos, especialmente quanto ao registro em seu respectivo conselho de classe, e a manter suas credenciais de login e senha em sigilo absoluto, não as compartilhando com terceiros.
                  </p>
                </section>

                {/* Seção 14 */}
                <section id="alteracoes" className="scroll-mt-28 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      14
                    </span>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Alterações desta Política
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base">
                    Esta Política de Privacidade pode ser atualizada periodicamente para refletir evoluções legislativas, melhorias operacionais ou lançamentos de novos produtos e serviços. A versão mais recente estará sempre disponível nesta página, com indicação expressa da data de atualização.
                  </p>
                </section>

                {/* Seção 15 - Contato DPO */}
                <section id="contato" className="scroll-mt-28">
                  <div className="rounded-2xl border border-[#C59D3F]/30 bg-gradient-to-br from-[#12283C] to-[#0B1D2C] p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59D3F] text-[#0D1B2A]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          Canal de Atendimento e Encarregado (DPO)
                        </h2>
                        <p className="text-xs text-[#F6F3EC]/70">
                          Aura Regenera · Tratamento de Dados & Conformidade LGPD
                        </p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-[#F6F3EC]/85 leading-relaxed mb-6">
                      Para exercer seus direitos de titular, solicitar esclarecimentos ou relatar qualquer dúvida a respeito do tratamento de dados pessoais, entre em contato conosco pelos canais oficiais:
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs sm:text-sm">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[#C59D3F] font-mono text-xs uppercase block mb-1">E-mail do DPO / Privacidade</span>
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="font-semibold text-white hover:text-[#C59D3F] transition-colors"
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[#C59D3F] font-mono text-xs uppercase block mb-1">WhatsApp de Atendimento</span>
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
                      <span>CNPJ: {COMPANY_CNPJ}</span>
                      <span>Aracaju · Sergipe · Brasil</span>
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
