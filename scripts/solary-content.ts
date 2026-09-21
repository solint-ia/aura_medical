/**
 * Conteúdo do Solary AOX FPS 60, nas duas versões.
 *
 * A versão com cor já existia no catálogo e recebe o conteúdo completo; a
 * versão sem cor nasce como produto próprio, com a sua foto e com a variação
 * de preço que hoje está pendurada no produto com cor.
 *
 * Sem argumento faz simulação; com `--apply` grava.
 *
 *   npx tsx --env-file=.env scripts/solary-content.ts
 *   npx tsx --env-file=.env scripts/solary-content.ts --apply
 */
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

const COM_COR_SLUG = "solary-aox-fps-60";
const SEM_COR_SLUG = "solary-aox-fps-60-sem-cor";
const SEM_COR_SKU = "solary-aox-fps-60-sem-cor";
const COM_COR_SKU = "solary-aox-fps-60-com-cor";

const EYEBROW = "Protetor solar facial de amplo espectro";
const PRESENTATION = "Bisnaga de 40 g";
const SUMMARY =
  "Fotoprotetor multiespectral com FPS 60 e UVA 47, proteção contra luz visível, luz azul e infravermelho, e Phloretin antioxidante contra o fotoenvelhecimento.";

const DESCRICAO = [
  "O novo lançamento da La Cutanée, Solary AOX FPS 60, traz uma nova geração em fotoproteção: alto e amplo espectro, com FPS/UVB 60 e UVA 47, além de proteção contra luz visível, luz azul e infravermelho, comprovada por testes de eficácia.",
  "O filtro solar é altamente seguro. A fórmula foi desenvolvida sem ingredientes com potencial tóxico para a saúde humana ou para o ecossistema.",
  "Além da proteção contra todo o espectro solar, a fórmula contém Phloretin, um potente antioxidante que previne a formação de radicais livres e a peroxidação lipídica, evitando o fotoenvelhecimento da pele. Também é indicado para quem tem manchas causadas pelo sol, ajudando a prevenir e a combater o melasma. Sem fragrância e com toque seco. Vegano e cruelty free.",
].join("\n\n");

const BENEFICIOS = [
  "Amplo espectro de proteção solar: UVA-I, UVA-II, UVB, luz visível/azul e infravermelho",
  "Alta proteção FPS 60 e alta proteção UVA 47",
  "Protege e combate as manchas",
  "Auxilia no clareamento da pele",
  "Ação antioxidante: previne a formação de radicais livres e a peroxidação lipídica, evitando o fotoenvelhecimento",
  "Ação anti-idade",
  "Seguro para a saúde: sem substâncias que possam se bioacumular no organismo",
  "Não prejudicial ao meio ambiente, em especial ao meio aquático",
  "Melhora a firmeza e a elasticidade da pele",
];

const MODO_DE_USAR = [
  "Utilizar diariamente, mesmo em dias nublados ou com chuva. Aplique abundantemente sobre a pele 30 minutos antes da exposição ao sol: quantidade menor que a indicada reduz muito o nível de proteção.",
  "Reaplique sempre após sudorese intensa, ao nadar ou se banhar, ao se secar com a toalha e durante a exposição ao sol.",
].join("\n\n");

const SEGURANCA = [
  "Dermatologicamente testado e hipoalergênico",
  "Avaliação dermatológica do potencial de fototoxicidade e fotossensibilização (FTT — IPC.2020.1078)",
  "Avaliação dermatológica da irritabilidade dérmica primária, acumulada e sensibilização (HRIPT — IPC.2020.1078)",
  "Não testado em animais",
];

const VOLUNTARIOS = [
  "94% gostaram do produto",
  "94% afirmaram que o produto auxilia contra manchas e clareia",
  "81% afirmaram que o produto é eficaz contra rugas",
  "84% afirmaram que o produto auxilia na prevenção do envelhecimento",
  "80% afirmaram que o produto tem efeito matte",
  "94% aprovaram o produto",
];

const ENSAIOS = [
  "Análise físico-química: determinação de teor (TEOR — IPC.2020.1078)",
  "Determinação do fator de proteção solar, proteção imediata (FPSISOST-PI — IPC.2020.1078)",
  "Determinação do fator de proteção solar FPS-UVB (FPSISOST — IPC.2020.1078)",
  "Avaliação do fator de proteção UVA in vitro (UVA — IPC.2020.1078)",
  "Estudo in vitro de proteção à luz azul e visível (NV.32.02)",
  "Estudo in vitro de proteção ao infravermelho (NV.32.02)",
];

const LIVRE_DE = [
  "Octocrylene",
  "Benzofenonas: dihydroxybenzophenone, tetrahydroxybenzophenone, 2-hydroxy-4-methoxybenzophenone, 2-hydroxy-4-methoxybenzophenone-5-sulfonic acid e butyl methoxydibenzoylmethane (avobenzona)",
  "Metoxicinamatos: octyl methoxycinnamate e isopentyl-4-methoxycinnamate",
  "Derivados de cânfora: 4-methylbenzylidene camphor e 3-benzylidene camphor",
  "PABA: 2-ethylhexyl 4-dimethylaminobenzoate e 4-aminobenzoic acid",
  "Fenoxietanol",
  "Homosalate",
  "Parabenos",
];

const INCI_BASE =
  "Aqua, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Tris-Biphenyl Triazine, Decyl Glucoside, Butylene Glycol, Disodium Phosphate, Xanthan Gum, Methylene Bis-Benzotriazolyl Tetramethylbutylphenol, Propylene Glycol, Cetearyl Alcohol, Ethylhexyl Salicylate, Coco-caprylate, Dibutyl Adipate, Cyclopentasiloxane, Dimethicone/Vinyl Dimethicone Crosspolymer, Trimethylsiloxyphenyl Dimethicone, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Glyceryl Stearate, Dicaprylyl Carbonate, Glycerin, Isododecane, Aluminum Starch Octenylsuccinate, Trimethylsiloxysilicate, Ethylhexyl Triazone, Disodium Cetearyl Sulfosuccinate, Benzyl Alcohol, Glyceryl Caprylate, Glyceryl Undecylenate, BHT, Disodium EDTA, Steareth-21, Dextrin, Phloretin, Polysorbate 20, Tocopherol, Dehydroacetic Acid, Benzoic Acid";

const sections = (comCor: boolean) => [
  { title: "Descrição", body: DESCRICAO, items: [], sortOrder: 0 },
  { title: "Benefícios", body: null, items: BENEFICIOS, sortOrder: 1 },
  { title: "Modo de usar", body: MODO_DE_USAR, items: [], sortOrder: 2 },
  { title: "Testes clínicos de segurança", body: null, items: SEGURANCA, sortOrder: 3 },
  {
    title: "Eficácia comprovada com voluntários",
    body: "Avaliação da apreciabilidade cosmética e da aceitabilidade dermatológica (ACD, AC — IPC.2020.1078). Conclusão dos voluntários:",
    items: VOLUNTARIOS,
    sortOrder: 4,
  },
  { title: "Ensaios de eficácia", body: null, items: ENSAIOS, sortOrder: 5 },
  { title: "Livre de", body: null, items: LIVRE_DE, sortOrder: 6 },
  {
    title: "Composição",
    body: comCor ? `${INCI_BASE}, CI 77491, CI 77492, CI 77499.` : `${INCI_BASE}.`,
    items: [],
    sortOrder: 7,
  },
];

async function main() {
  const comCor = await prisma.product.findUnique({ where: { slug: COM_COR_SLUG }, include: { skus: true, images: true } });
  if (!comCor) throw new Error(`Produto ${COM_COR_SLUG} não encontrado.`);

  const fotoComCor = await prisma.mediaAsset.findFirst({ where: { path: { contains: "solary-aox-fps-60-com-cor" } } });
  const fotoSemCor = await prisma.mediaAsset.findFirst({ where: { path: { contains: "solary-aox-fps-60-sem-cor" } } });
  if (!fotoComCor || !fotoSemCor) throw new Error("Fotos do Solary não encontradas no acervo.");

  const skuSemCor = comCor.skus.find((sku) => sku.code === SEM_COR_SKU);
  const skuComCor = comCor.skus.find((sku) => sku.code === COM_COR_SKU);
  const jaExiste = await prisma.product.findUnique({ where: { slug: SEM_COR_SLUG } });

  console.log("Com cor :", comCor.name, `| seções: ${await prisma.productSection.count({ where: { productId: comCor.id } })} → ${sections(true).length}`);
  console.log("        : foto", comCor.images.length ? "trocada para a versão com cor" : "adicionada");
  console.log("Sem cor :", jaExiste ? `produto ${SEM_COR_SLUG} já existe, será atualizado` : `criar produto ${SEM_COR_SLUG} (rascunho)`);
  console.log("        : variação", SEM_COR_SKU, skuSemCor ? `movida (R$ ${String(skuSemCor.price)})` : "não encontrada");
  if (!apply) {
    console.log("\nSimulação: nada foi gravado. Use --apply para valer.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    // --- versão com cor: conteúdo, foto certa e apenas a sua variação.
    await tx.productSection.deleteMany({ where: { productId: comCor.id } });
    await tx.product.update({
      where: { id: comCor.id },
      data: {
        eyebrow: EYEBROW,
        summary: SUMMARY,
        presentation: PRESENTATION,
        netContent: "40 g",
        highlights: ["FPS 60", "UVA 47"],
        variantName: "Tom",
        sections: { create: sections(true) },
      },
    });
    await tx.productImage.deleteMany({ where: { productId: comCor.id } });
    await tx.productImage.create({ data: { productId: comCor.id, assetId: fotoComCor.id, sortOrder: 0 } });
    if (skuComCor) await tx.sku.update({ where: { id: skuComCor.id }, data: { label: "Com cor", imageId: fotoComCor.id } });

    // --- versão sem cor: produto próprio, com a variação que estava no outro.
    const semCor = jaExiste
      ? await tx.product.update({
          where: { id: jaExiste.id },
          data: { eyebrow: EYEBROW, summary: SUMMARY, presentation: PRESENTATION, netContent: "40 g", highlights: ["FPS 60", "UVA 47"] },
        })
      : await tx.product.create({
          data: {
            lineId: comCor.lineId,
            categoryId: comCor.categoryId,
            slug: SEM_COR_SLUG,
            name: "Solary AOX FPS 60 (Protetor Solar) - Sem Cor",
            eyebrow: EYEBROW,
            collection: comCor.collection,
            summary: SUMMARY,
            presentation: PRESENTATION,
            netContent: "40 g",
            highlights: ["FPS 60", "UVA 47"],
            weightGrams: comCor.weightGrams,
            lengthCm: comCor.lengthCm,
            widthCm: comCor.widthCm,
            heightCm: comCor.heightCm,
            sortOrder: comCor.sortOrder + 1,
            visibility: comCor.visibility,
            status: "DRAFT",
          },
        });

    await tx.productSection.deleteMany({ where: { productId: semCor.id } });
    await tx.productSection.createMany({ data: sections(false).map((section) => ({ ...section, productId: semCor.id })) });
    await tx.productImage.deleteMany({ where: { productId: semCor.id } });
    await tx.productImage.create({ data: { productId: semCor.id, assetId: fotoSemCor.id, sortOrder: 0 } });

    if (skuSemCor) {
      await tx.sku.update({
        where: { id: skuSemCor.id },
        data: { productId: semCor.id, label: "Sem cor", imageId: fotoSemCor.id },
      });
    }
  });

  console.log("\nGravado.");
  await prisma.$disconnect();
}

void main();
