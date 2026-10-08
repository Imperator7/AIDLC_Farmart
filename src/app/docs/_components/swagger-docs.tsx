"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

/** Swagger UI, bundled from swagger-ui-dist (the CSP blocks CDN scripts) and loaded only in the browser. */
export default function SwaggerDocs({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    let cancelled = false;
    import("swagger-ui-dist/swagger-ui-es-bundle.js").then(({ default: SwaggerUIBundle }) => {
      if (cancelled || !node) return;
      SwaggerUIBundle({
        domNode: node,
        url,
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 0,
        displayOperationId: true,
        displayRequestDuration: true,
        filter: true,
        validatorUrl: null, // don't send the spec to validator.swagger.io
      });
    });
    return () => {
      cancelled = true;
      node?.replaceChildren();
    };
  }, [url]);

  return <div ref={ref} />;
}
