import openApiDocument from "lib/api/openapi";
import SwaggerClientPage from "lib/components/swagger/SwaggerClientPage";
import { notFound } from "next/navigation";

function ApiDoc() {
  const doc = openApiDocument;
  if (process.env.NODE_ENV === "development") {
    return <SwaggerClientPage spec={doc} />;
  }
  return notFound();
}

export default ApiDoc;
