import { PrismaClient, MediaProvider, PublishStatus, Visibility, FaqScope } from "@prisma/client";

import { isSameCatalogImage, prepareCatalogImage } from "../scripts/catalog-media";
import { clinicalCasesData } from "../src/data/cases";
import { enzymesData, PRICE_PER_VIAL } from "../src/data/enzymes";
import { LA_CUTANEE_CATALOG } from "../src/data/la-cutanee";
import { LINES } from "../src/data/lines";
import { PROTOCOLS, protocolsData } from "../src/data/protocols";
import { SAFETY_NOTES } from "../src/data/safety";

const prisma = new PrismaClient();
const bucket = process.env.SUPABASE_CATALOG_BUCKET || "Catalogo";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function mediaAsset(localPath: string, alt: string) {
  const image = await prepareCatalogImage(localPath);
  const existing = (
    await prisma.mediaAsset.findMany({ where: { provider: MediaProvider.SUPABASE, bucket, path: { startsWith: `${image.pathStem}.` } } })
  ).find((asset) => isSameCatalogImage(asset.path, image));

  // Caminho e metadados publicados pertencem ao storage:migrate; o seed não aponta para um objeto ainda não enviado.
  if (existing) return prisma.mediaAsset.update({ where: { id: existing.id }, data: { alt } });
  return prisma.mediaAsset.create({
    data: { provider: MediaProvider.SUPABASE, bucket, path: image.objectPath, alt, width: image.width, height: image.height, mimeType: image.contentType, sizeBytes: image.body.byteLength, hasAlpha: image.hasAlpha },
  });
}

async function seedLines() {
  const values = [
    { ...LINES.pbserum, surfaceDark: "#1F1A12", accentDark: "#D8B657", inkDark: "#F7F5F0" },
    { ...LINES["la-cutanee"], surfaceDark: "#0F1D30", accentDark: "#8FB3E0", inkDark: "#F7F5F0" },
  ];
  const result = new Map<string, { id: string }>();
  for (const [index, line] of values.entries()) {
    const saved = await prisma.line.upsert({
      where: { slug: line.id },
      update: {
        name: line.name, descriptor: line.descriptor, tagline: line.tagline,
        surfaceLight: line.colors.surface, surfaceDark: line.surfaceDark,
        accentLight: line.colors.accent, accentDark: line.accentDark,
        inkLight: line.colors.foreground, inkDark: line.inkDark,
        mission: line.mission, vision: line.vision, values: line.values,
        differentials: line.differentials || [], commitments: line.seals || [],
        status: PublishStatus.PUBLISHED, sortOrder: index,
      },
      create: {
        slug: line.id, name: line.name, descriptor: line.descriptor, tagline: line.tagline,
        surfaceLight: line.colors.surface, surfaceDark: line.surfaceDark,
        accentLight: line.colors.accent, accentDark: line.accentDark,
        inkLight: line.colors.foreground, inkDark: line.inkDark,
        mission: line.mission, vision: line.vision, values: line.values,
        differentials: line.differentials || [], commitments: line.seals || [],
        status: PublishStatus.PUBLISHED, sortOrder: index,
      },
      select: { id: true },
    });
    result.set(line.id, saved);
  }
  return result;
}

async function seedProducts(lines: Map<string, { id: string }>) {
  const products = new Map<string, { id: string }>();
  const pbLineId = lines.get("pbserum")!.id;
  const laLineId = lines.get("la-cutanee")!.id;

  const catProfissional = await prisma.category.upsert({
    where: { slug: "profissional" },
    update: { name: "Profissional", sortOrder: 0, lineId: pbLineId },
    create: { slug: "profissional", name: "Profissional", sortOrder: 0, lineId: pbLineId },
  });

  const catDomestico = await prisma.category.upsert({
    where: { slug: "domestico" },
    update: { name: "Doméstico", sortOrder: 1, lineId: laLineId },
    create: { slug: "domestico", name: "Doméstico", sortOrder: 1, lineId: laLineId },
  });

  for (const [index, enzyme] of enzymesData.entries()) {
    const localImage = `/frascos/${enzyme.slug.replace(/-plus$/, "")}.png`;
    const asset = await mediaAsset(localImage, `Ampola ${enzyme.name} Pbserum`);
    const product = await prisma.product.upsert({
      where: { slug: enzyme.slug },
      update: {
        lineId: pbLineId, categoryId: catProfissional.id, name: enzyme.name, eyebrow: "Bioregenerativo recombinante",
        collection: "Pbserum Plus", summary: enzyme.shortDescription, presentation: "Ampola individual liofilizada",
        highlights: [enzyme.activeIngredient, enzyme.indications[0]].slice(0, 2),
        specs: [{ label: "Ativo", value: enzyme.activeIngredient }, { label: "Origem", value: enzyme.origin }, { label: "Substrato-alvo", value: enzyme.targetSubstrate }],
        regulatoryName: enzyme.anvisaProduct, regulatoryNumber: enzyme.anvisaRegistration,
        status: PublishStatus.PUBLISHED, visibility: Visibility.PUBLIC, featured: true, featuredOrder: index, sortOrder: index, publishedAt: new Date(),
      },
      create: {
        lineId: pbLineId, categoryId: catProfissional.id, slug: enzyme.slug, name: enzyme.name, eyebrow: "Bioregenerativo recombinante",
        collection: "Pbserum Plus", summary: enzyme.shortDescription, presentation: "Ampola individual liofilizada",
        highlights: [enzyme.activeIngredient, enzyme.indications[0]].slice(0, 2),
        specs: [{ label: "Ativo", value: enzyme.activeIngredient }, { label: "Origem", value: enzyme.origin }, { label: "Substrato-alvo", value: enzyme.targetSubstrate }],
        regulatoryName: enzyme.anvisaProduct, regulatoryNumber: enzyme.anvisaRegistration,
        status: PublishStatus.PUBLISHED, visibility: Visibility.PUBLIC, featured: true, featuredOrder: index, sortOrder: index, publishedAt: new Date(),
      },
    });
    await prisma.productImage.upsert({ where: { productId_assetId: { productId: product.id, assetId: asset.id } }, update: { sortOrder: 0, caption: enzyme.name }, create: { productId: product.id, assetId: asset.id, caption: enzyme.name } });
    await prisma.productSection.deleteMany({ where: { productId: product.id } });
    await prisma.productSection.createMany({ data: [
      { productId: product.id, title: "Mecanismo de ação", body: enzyme.fullDescription, items: [], sortOrder: 0 },
      { productId: product.id, title: "Indicações", items: enzyme.indications, sortOrder: 1 },
      { productId: product.id, title: "Tecnologia", items: [enzyme.activeIngredient, enzyme.origin, `Substrato-alvo: ${enzyme.targetSubstrate}`], sortOrder: 2 },
    ] });
    const sku = await prisma.sku.upsert({
      where: { code: `enz-${enzyme.slug}` },
      update: { productId: product.id, protocolId: null, price: PRICE_PER_VIAL, imageId: asset.id, isActive: true },
      create: { code: `enz-${enzyme.slug}`, productId: product.id, price: PRICE_PER_VIAL, imageId: asset.id },
    });
    await prisma.skuAlias.upsert({ where: { alias: `enz-${enzyme.slug.replace(/-plus$/, "")}` }, update: { skuId: sku.id }, create: { alias: `enz-${enzyme.slug.replace(/-plus$/, "")}`, skuId: sku.id } });
    products.set(enzyme.slug, product);
  }

  for (const [index, item] of LA_CUTANEE_CATALOG.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: { lineId: laLineId, categoryId: catDomestico.id, name: item.name, eyebrow: item.category, collection: item.collection, summary: item.summary, presentation: item.presentation, highlights: item.tags.map((tag) => tag.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")).slice(0, 2), variantName: item.variantName, status: PublishStatus.PUBLISHED, visibility: Visibility.PUBLIC, featured: index < 3, featuredOrder: index < 3 ? index + 3 : null, sortOrder: index, publishedAt: new Date() },
      create: { slug: item.slug, lineId: laLineId, categoryId: catDomestico.id, name: item.name, eyebrow: item.category, collection: item.collection, summary: item.summary, presentation: item.presentation, highlights: item.tags.map((tag) => tag.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")).slice(0, 2), variantName: item.variantName, status: PublishStatus.PUBLISHED, visibility: Visibility.PUBLIC, featured: index < 3, featuredOrder: index < 3 ? index + 3 : null, sortOrder: index, publishedAt: new Date() },
    });
    await prisma.productSection.deleteMany({ where: { productId: product.id } });
    await prisma.productSection.createMany({ data: item.sections.map((section, sortOrder) => ({ productId: product.id, title: section.title, body: section.body, items: section.items || [], sortOrder })) });
    await prisma.pendingField.deleteMany({ where: { productId: product.id } });
    if (item.pending?.length) await prisma.pendingField.createMany({ data: item.pending.map((field) => ({ productId: product.id, label: field.label, isPublic: field.public })) });
    const primaryAsset = await mediaAsset(item.image, item.name);
    await prisma.productImage.upsert({ where: { productId_assetId: { productId: product.id, assetId: primaryAsset.id } }, update: { sortOrder: 0, caption: item.name }, create: { productId: product.id, assetId: primaryAsset.id, caption: item.name } });
    for (const [sortOrder, offer] of item.offers.entries()) {
      const offerAsset = offer.image ? await mediaAsset(offer.image, offer.label ? `${item.name} · ${offer.label}` : item.name) : primaryAsset;
      await prisma.sku.upsert({ where: { code: offer.id }, update: { productId: product.id, protocolId: null, label: offer.label, price: offer.price, imageId: offerAsset.id, isActive: true, sortOrder }, create: { code: offer.id, productId: product.id, label: offer.label, price: offer.price, imageId: offerAsset.id, sortOrder } });
    }
    products.set(item.slug, product);
  }

  // Remove categorias antigas que não sejam Profissional ou Doméstico
  await prisma.category.deleteMany({
    where: {
      slug: { notIn: ["profissional", "domestico"] },
    },
  });

  return products;
}

async function seedProtocols(lines: Map<string, { id: string }>, products: Map<string, { id: string }>) {
  const lineId = lines.get("pbserum")!.id;
  for (const [index, source] of PROTOCOLS.entries()) {
    const detail = protocolsData.find((item) => item.slug === source.id)!;
    const cover = await mediaAsset(detail.imagePath1, source.name);
    const mapping = await mediaAsset(detail.imagePath2, `Mapeamento do protocolo ${source.name}`);
    const visibility = source.hidden ? Visibility.INTERNAL : Visibility.PUBLIC;
    const protocol = await prisma.protocol.upsert({
      where: { slug: source.id },
      update: { lineId, name: source.name, introduction: detail.introduction, note: detail.note, indications: detail.expectedResults, sessions: detail.sessions, frequency: detail.frequency, reconstitution: detail.reconstitution, application: detail.application, marking: detail.marking, expectedResults: detail.expectedResults, coverImageId: cover.id, mappingImageId: mapping.id, status: PublishStatus.PUBLISHED, visibility, sortOrder: index },
      create: { slug: source.id, lineId, name: source.name, introduction: detail.introduction, note: detail.note, indications: detail.expectedResults, sessions: detail.sessions, frequency: detail.frequency, reconstitution: detail.reconstitution, application: detail.application, marking: detail.marking, expectedResults: detail.expectedResults, coverImageId: cover.id, mappingImageId: mapping.id, status: PublishStatus.PUBLISHED, visibility, sortOrder: index },
    });
    await prisma.protocolComponent.deleteMany({ where: { protocolId: protocol.id } });
    await prisma.protocolComponent.createMany({ data: source.composition.map((component, sortOrder) => ({ protocolId: protocol.id, productId: products.get(`${component.enzyme}-plus`)!.id, quantity: component.vials, role: detail.composition.find((entry) => entry.name.toLowerCase().includes(component.enzyme))?.description || "Componente do protocolo", sortOrder })) });
    await prisma.protocolImage.upsert({ where: { protocolId_assetId: { protocolId: protocol.id, assetId: cover.id } }, update: { caption: source.name, sortOrder: 0 }, create: { protocolId: protocol.id, assetId: cover.id, caption: source.name, sortOrder: 0 } });
    await prisma.sku.upsert({ where: { code: source.id }, update: { productId: null, protocolId: protocol.id, price: source.totalPrice, imageId: cover.id, isActive: true }, create: { code: source.id, protocolId: protocol.id, price: source.totalPrice, imageId: cover.id } });
  }
}

async function seedCasesAndContent(lines: Map<string, { id: string }>) {
  const lineId = lines.get("pbserum")!.id;
  for (const [sortOrder, source] of clinicalCasesData.entries()) {
    const before = await mediaAsset(source.beforeImage, `${source.categoryName}: antes`);
    const after = await mediaAsset(source.afterImage, `${source.categoryName}: depois`);
    const protocol = await prisma.protocol.findUnique({ where: { slug: source.categoryId }, select: { id: true } });
    const clinicalCase = await prisma.clinicalCase.upsert({
      where: { slug: source.id },
      update: { lineId, title: source.categoryName, professional: source.doctor, country: source.country, sessions: source.sessions, beforeImageId: before.id, afterImageId: after.id, imageRightsConfirmed: true, imageRightsNote: "Material do fabricante", status: protocol ? PublishStatus.PUBLISHED : PublishStatus.DRAFT, sortOrder },
      create: { slug: source.id, lineId, title: source.categoryName, professional: source.doctor, country: source.country, sessions: source.sessions, beforeImageId: before.id, afterImageId: after.id, imageRightsConfirmed: true, imageRightsNote: "Material do fabricante", status: protocol ? PublishStatus.PUBLISHED : PublishStatus.DRAFT, sortOrder },
    });
    await prisma.clinicalCaseProtocol.deleteMany({ where: { caseId: clinicalCase.id } });
    if (protocol) await prisma.clinicalCaseProtocol.create({ data: { caseId: clinicalCase.id, protocolId: protocol.id, sortOrder: 0 } });
    else console.warn(`Caso sem vínculo automático: ${source.id}`);
  }

  await prisma.safetyNote.deleteMany({ where: { lineId } });
  await prisma.safetyNote.createMany({ data: SAFETY_NOTES.map((note, sortOrder) => ({ lineId, label: note.label, body: note.body, isPublished: true, sortOrder })) });
  await prisma.faqItem.deleteMany({});
  const globalFaqs = [
    ["Quem pode comprar?", "O catálogo da Aura Regenera é exclusivo para profissionais e clínicas da área da saúde e estética (médicos, dermatologistas, biomédicos estetas, farmacêuticos e clínicas habilitadas). Para garantir a conformidade regulatória e a segurança técnica dos tratamentos biotecnológicos, o cadastro solicita a validação de CPF ou CNPJ com registro profissional ativo para a liberação de pedidos."],
    ["Como criar uma conta?", "Clique na opção 'Entrar' ou 'Fale Conosco' no menu superior, preencha os dados da sua clínica ou consultório e confirme o e-mail de ativação. Nossa equipe faz uma validação ágil do perfil profissional para liberar o seu acesso à tabela de valores e ao catálogo completo."],
    ["Quais são as formas de pagamento?", "Aceitamos cartão de crédito em até 10x (crédito e débito) e PIX com confirmação imediata. Todas as operações são processadas com criptografia de ponta a ponta via Mercado Pago para total segurança."],
    ["Existe pedido mínimo?", "Não há valor mínimo nem quantidade mínima para compra. Você tem total liberdade para adquirir desde uma única ampola ou frasco avulso para reposição rápida até grandes volumes para a rotina de protocolos da sua clínica."],
    ["Como funcionam frete e prazo?", "O frete e o prazo de entrega são calculados automaticamente pelo CEP informado no checkout, com transportadoras especializadas e opções de envio expresso. Assim que o pedido for despachado, você recebe o código de rastreamento completo por e-mail e WhatsApp para acompanhar até a entrega."],
    ["Como falar com a equipe?", "Nossa equipe de consultores científicos e suporte técnico atende diretamente pelo botão 'Fale Conosco' no menu, pelo WhatsApp oficial (79 9 9680-9911) ou pelo e-mail contato@auraregenera.com para orientações sobre protocolos, produtos, diluições e pedidos comerciais."],
  ];
  await prisma.faqItem.createMany({ data: globalFaqs.map(([question, answer], sortOrder) => ({ scope: FaqScope.GLOBAL, question, answer, isPublished: true, sortOrder })) });
  await prisma.faqItem.createMany({ data: [
    { scope: FaqScope.LINE, lineId, question: "Os produtos Pbserum possuem registro?", answer: "Os números dos processos ANVISA estão nas páginas de cada produto.", isPublished: true, sortOrder: 0 },
    { scope: FaqScope.LINE, lineId, question: "Onde encontro reconstituição e marcação?", answer: "Essas informações estão nas páginas dos protocolos clínicos Pbserum.", isPublished: true, sortOrder: 1 },
  ] });
  await prisma.contentBlock.upsert({ where: { key: "line.pbserum.science-links" }, update: { lineId, items: LINES.pbserum.links || [], isPublished: true }, create: { key: "line.pbserum.science-links", lineId, items: LINES.pbserum.links || [], isPublished: true } });
}

async function main() {
  const lines = await seedLines();
  const products = await seedProducts(lines);
  await seedProtocols(lines, products);
  await seedCasesAndContent(lines);
  const counts = await Promise.all([prisma.line.count(), prisma.product.count(), prisma.protocol.count(), prisma.sku.count(), prisma.skuAlias.count(), prisma.clinicalCase.count()]);
  console.log(`Seed concluído: ${counts[0]} linhas, ${counts[1]} produtos, ${counts[2]} protocolos, ${counts[3]} SKUs, ${counts[4]} aliases, ${counts[5]} casos.`);
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exit(1); });
