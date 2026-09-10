import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { rootValue, schema } from "./graphql.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  const graphqlHandler = createHandler({ schema, rootValue });
  app.get("/graphql", (request, response, next) => {
    if (request.query.query) return graphqlHandler(request, response);
    return response.json({
      message: "GraphQL endpoint",
      method: "POST",
      example: { query: "{ items { id name } }" },
    });
  });
  app.post("/graphql", graphqlHandler);

  app.get("/health", (_request, response) => {
    response.json({ service: "express-api", status: "ok" });
  });

  app.get("/", (_request, response) => {
    response.json({ message: "Express API", endpoints: ["/health", "/graphql"] });
  });

  return app;
}
