import { buildSchema } from "graphql";

const pythonServiceUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";
const springServiceUrl = process.env.SPRING_SERVICE_URL ?? "http://localhost:8080";
const goServiceUrl = process.env.GO_SERVICE_URL ?? "http://localhost:8081";

export const schema = buildSchema(`
  type Item {
    id: ID!
    name: String!
  }

  type ServiceHealth {
    service: String!
    status: String!
  }

  type Query {
    health: [ServiceHealth!]!
    items: [Item!]!
  }

  type Mutation {
    createItem(name: String!): Item!
  }
`);

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream request failed (${response.status}): ${body}`);
  }
  return response.json();
}

export const rootValue = {
  health: async () => {
    const [python, spring, go] = await Promise.all([
      requestJson(`${pythonServiceUrl}/health`),
      requestJson(`${springServiceUrl}/actuator/health`),
      requestJson(`${goServiceUrl}/health`),
    ]);

    return [
      { service: python.service ?? "python-api", status: python.status },
      { service: "spring-api", status: spring.status.toLowerCase() },
      { service: go.service ?? "go-api", status: go.status },
      { service: "express-api", status: "ok" },
    ];
  },
  items: () => requestJson(`${pythonServiceUrl}/items`),
  createItem: ({ name }) =>
    requestJson(`${pythonServiceUrl}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
};
