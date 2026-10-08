declare module "swagger-ui-dist/swagger-ui-es-bundle.js" {
  const SwaggerUIBundle: (options: { domNode: HTMLElement; url: string } & Record<string, unknown>) => unknown;
  export default SwaggerUIBundle;
}
