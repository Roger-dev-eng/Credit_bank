import { test, expect } from "@playwright/test";

const cacheKey = "credito:listas:v1";
const cliente = (nome: string) => [
  {
    id: "cliente-cache",
    nome,
    telefone: null,
    observacoes: null,
    criadoEm: "2026-10-28T10:00:00",
    atualizadoEm: "2026-10-28T10:00:00",
  },
];

test("reabrir mostra clientes do cache antes do backend e atualiza os dados", async ({
  page,
  context,
}) => {
  await page.route("**/api/clientes?busca=", (route) =>
    route.fulfill({ json: cliente("Cliente em cache") }),
  );
  await page.goto("/#/clientes");
  await expect(
    page.getByRole("link", { name: "Cliente em cache", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), cacheKey))
    .toContain("Cliente em cache");
  await page.close();
  const reopened = await context.newPage();
  let liberar!: () => void;
  const aguardar = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await reopened.route("**/api/clientes?busca=", async (route) => {
    await aguardar;
    await route.fulfill({ json: cliente("Cliente atualizado no banco") });
  });
  await reopened.goto("/#/clientes");
  try {
    await expect(
      reopened.getByRole("link", { name: "Cliente em cache", exact: true }),
    ).toBeVisible();
    await expect(
      reopened.getByText("Carregando dados…", { exact: true }),
    ).toHaveCount(0);
  } finally {
    liberar();
  }
  await expect(
    reopened.getByRole("link", {
      name: "Cliente atualizado no banco",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reopened.getByRole("link", { name: "Cliente em cache", exact: true }),
  ).toHaveCount(0);
  await expect(
    reopened.getByText("Armazenamento local", { exact: true }),
  ).toHaveCount(0);
  await expect(
    reopened.getByText("Uso local · BRL", { exact: true }),
  ).toHaveCount(0);
});

test("cache corrompido é descartado sem impedir a abertura", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{invalido"),
    cacheKey,
  );
  await page.route("**/api/clientes?busca=", (route) =>
    route.fulfill({ json: cliente("Cliente vindo do banco") }),
  );
  await page.goto("/#/clientes");
  await expect(
    page.getByRole("link", { name: "Cliente vindo do banco", exact: true }),
  ).toBeVisible();
});

test("cache expirado não reaparece enquanto o banco carrega", async ({
  page,
}) => {
  await page.route("**/api/clientes?busca=", (route) =>
    route.fulfill({ json: cliente("Cliente antigo expirado") }),
  );
  await page.goto("/#/clientes");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), cacheKey))
    .toContain("Cliente antigo expirado");
  // Expire storage before the next document initializes its query client.
  await page.addInitScript((key) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      saved.timestamp = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(key, JSON.stringify(saved));
    }
  }, cacheKey);
  await page.unroute("**/api/clientes?busca=");
  let liberar!: () => void;
  const aguardar = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route("**/api/clientes?busca=", async (route) => {
    await aguardar;
    await route.fulfill({ json: cliente("Cliente atual") });
  });
  await page.reload();
  try {
    await expect(
      page.getByText("Carregando dados…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Cliente antigo expirado", exact: true }),
    ).toHaveCount(0);
  } finally {
    liberar();
  }
  await expect(
    page.getByRole("link", { name: "Cliente atual", exact: true }),
  ).toBeVisible();
});
