import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/i, "Use uma cor hexadecimal válida.");
const noEmoji = z.string().refine((value) => !/\p{Extended_Pictographic}/u.test(value), "Não use emoji neste campo.");
const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const visibility = z.enum(["PUBLIC", "INTERNAL"]);
const slug = (max: number) => z.string().min(2).max(max).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const galleryImageSchema = z.object({ assetId: z.string().uuid(), caption: z.string().max(240).nullish(), sortOrder: z.number().int().default(0) });
export const gallerySchema = z.array(galleryImageSchema).superRefine((images, context) => {
  const seen = new Set<string>();
  images.forEach((image, index) => {
    if (seen.has(image.assetId)) {
      context.addIssue({
        code: "custom",
        path: [index, "assetId"],
        message: "A mesma imagem não pode aparecer duas vezes na galeria.",
      });
    }
    seen.add(image.assetId);
  });
});
export const sectionSchema = z.object({ id: z.string().uuid().optional(), title: z.string().min(1).max(80), body: z.string().nullish(), items: z.array(z.string()).default([]), sortOrder: z.number().int().default(0) });
export const pendingFieldSchema = z.object({ id: z.string().uuid().optional(), label: z.string().min(1).max(120), isPublic: z.boolean().default(true), resolvedAt: z.coerce.date().nullish() });

export const lineSchema = z.object({
  slug: slug(80), name: z.string().min(2).max(120), descriptor: z.string().min(2).max(160), tagline: z.string().min(2),
  surfaceLight: hexColor, surfaceDark: hexColor, accentLight: hexColor, accentDark: hexColor, inkLight: hexColor, inkDark: hexColor,
  mission: z.string().nullish(), vision: z.string().nullish(), values: z.string().nullish(), differentials: z.array(z.string()).default([]), commitments: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0), status: status.default("DRAFT"),
  media: z.array(z.object({ assetId: z.string().uuid(), role: z.enum(["LOGO", "HERO", "BANNER"]), sortOrder: z.number().int().default(0) })).default([]),
});
export const linePatchSchema = lineSchema.omit({ status: true }).partial();

export const categorySchema = z.object({ lineId: z.string().uuid().nullish(), slug: slug(80), name: z.string().min(2).max(80), sortOrder: z.number().int().default(0) });
export const categoryPatchSchema = categorySchema.partial();

export const productSchema = z.object({
  lineId: z.string().uuid(), categoryId: z.string().uuid().nullish(), slug: slug(120), name: z.string().min(2).max(160), eyebrow: z.string().min(2).max(160),
  collection: z.string().max(80).nullish(), summary: z.string().min(2), presentation: z.string().min(2).max(160), netContent: z.string().max(40).nullish(),
  highlights: z.array(noEmoji.max(120)).max(2), variantName: z.string().max(40).nullish(), specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  regulatoryName: z.string().max(160).nullish(), regulatoryNumber: z.string().max(60).nullish(), weightGrams: z.number().int().nonnegative().nullish(),
  lengthCm: z.number().positive().nullish(), widthCm: z.number().positive().nullish(), heightCm: z.number().positive().nullish(), featured: z.boolean().default(false),
  featuredOrder: z.number().int().nullish(), sortOrder: z.number().int().default(0), visibility: visibility.default("PUBLIC"),
  sections: z.array(sectionSchema).default([]), images: gallerySchema.default([]), pending: z.array(pendingFieldSchema).default([]),
});
export const productPatchSchema = productSchema.partial();

export const skuSchema = z.object({ code: slug(100), label: z.string().max(60).nullish(), price: z.number().nonnegative(), imageId: z.string().uuid().nullish(), trackStock: z.boolean().default(false), stockQuantity: z.number().int().nonnegative().nullish(), isActive: z.boolean().default(true), sortOrder: z.number().int().default(0), aliases: z.array(slug(100)).default([]) });
export const skuPatchSchema = skuSchema.omit({ code: true }).partial();

export const uploadRequestSchema = z.object({ filename: z.string().min(1).max(180), mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), sizeBytes: z.number().int().positive().max(8 * 1024 * 1024) });
export const mediaCategorySchema = z.enum(["PRODUCT", "PROTOCOL", "CLINICAL_CASE", "BRAND", "OTHER"]);
export const mediaConfirmSchema = z.object({ path: z.string().min(1).max(500), alt: z.string().min(2).max(300), purpose: z.enum(["catalog", "clinical"]).default("catalog"), category: mediaCategorySchema.nullish(), lineId: z.string().uuid().nullish() });
export const mediaPatchSchema = z.object({ alt: z.string().min(2).max(300).optional(), category: mediaCategorySchema.nullish(), lineId: z.string().uuid().nullish() }).refine((value) => Object.keys(value).length > 0, "Nada para atualizar.");

export const protocolSchema = z.object({
  lineId: z.string().uuid(), slug: slug(120), name: z.string().min(2).max(160), introduction: z.string().min(2), note: z.string().nullish(), indications: z.array(z.string()).default([]),
  sessions: z.string().min(1).max(40), frequency: z.string().min(1).max(60), reconstitution: z.array(z.string()).default([]), application: z.array(z.string()).default([]),
  marking: z.string().default(""), expectedResults: z.array(z.string()).default([]), coverImageId: z.string().uuid().nullish(), mappingImageId: z.string().uuid().nullish(),
  visibility: visibility.default("PUBLIC"), sortOrder: z.number().int().default(0),
  components: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive(), role: z.string().min(1), sortOrder: z.number().int().default(0) })).default([]),
  images: gallerySchema.default([]),
});
export const protocolPatchSchema = protocolSchema.partial();

export const caseSchema = z.object({
  slug: slug(120), title: z.string().min(2).max(160), description: z.string().nullish(), professional: z.string().min(2).max(160), country: z.string().max(60).nullish(),
  sessions: z.number().int().positive(), parameters: z.array(z.object({ label: z.string(), value: z.string() })).default([]), beforeImageId: z.string().uuid(), afterImageId: z.string().uuid(),
  imageRightsConfirmed: z.boolean().default(false), imageRightsNote: z.string().nullish(), sortOrder: z.number().int().default(0),
  productIds: z.array(z.string().uuid()).default([]), protocolIds: z.array(z.string().uuid()).default([]), status: status.default("DRAFT"),
});
export const casePatchSchema = caseSchema.partial();
