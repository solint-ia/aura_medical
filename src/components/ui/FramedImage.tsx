import Image from "next/image";
import type { ComponentProps } from "react";

import { framingStyle, type ImageFraming } from "@/lib/imageFraming";

/**
 * `next/image` que respeita o enquadramento definido no acervo.
 *
 * Sem ajuste, a imagem se comporta exatamente como antes e as classes de quem
 * chamou continuam mandando. Com ajuste, o estilo em linha prevalece sobre as
 * classes — por isso o contêiner precisa recortar (`overflow-hidden`) quando o
 * admin aproxima a foto.
 */
export function FramedImage({
  framing,
  style,
  ...props
}: ComponentProps<typeof Image> & { framing?: ImageFraming }) {
  const adjusted = framingStyle(framing);
  return <Image {...props} style={adjusted || style ? { ...adjusted, ...style } : undefined} />;
}
