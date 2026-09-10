import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("creates an Express application", () => {
  assert.equal(typeof createApp().listen, "function");
});

test("serves GraphQL introspection", async () => {
  const server = createApp().listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { __typename: "Query" } });
  } finally {
    server.close();
  }
});

test("describes GraphQL usage when opened in a browser", async () => {
  const server = createApp().listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/graphql`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.message, "GraphQL endpoint");
  } finally {
    server.close();
  }
});
