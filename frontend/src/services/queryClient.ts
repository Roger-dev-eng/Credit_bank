import {
  dehydrate,
  hydrate,
  MutationCache,
  QueryClient,
  type DehydratedState,
  type Query,
} from "@tanstack/react-query";
import { z } from "zod";
import { identidade } from "../config";

const cacheKey = "credito:listas:v1";
const maxAge = 24 * 60 * 60 * 1000;
const cacheable = (query: Query) =>
  query.queryKey[0] === "contratos" ||
  (query.queryKey[0] === "clientes" && !query.queryKey[1]);
const clientesSchema = z.array(
  z.object({
    id: z.string(),
    nome: z.string(),
    telefone: z.string().nullable(),
    observacoes: z.string().nullable(),
  }),
);
const contratosSchema = z.array(
  z.object({
    contrato: z.object({
      id: z.string(),
      cliente_id: z.string(),
      cliente_nome: z.string(),
      modalidade: z.enum(["PARCELA_FIXA", "SO_JUROS"]),
      prazo: z.number(),
      taxa: z.union([z.string(), z.number()]),
    }),
    indicadores: z.object({
      original: z.number(),
      recebido: z.number(),
      saldo: z.number(),
      atraso: z.number(),
    }),
    status: z.string(),
  }),
);

// Persist only read-only lists. Contract details, history and mutations must
// always come from the database before any financial operation.
export function createQueryClient() {
  let client: QueryClient;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const discard = () => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // Storage may be unavailable or full; it must not block the application.
    }
  };
  client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
    mutationCache: new MutationCache({
      onMutate: async () => {
        discard();
        await client.cancelQueries({ predicate: cacheable });
        await client.invalidateQueries({
          predicate: cacheable,
          refetchType: "none",
        });
      },
      onSettled: () => client.invalidateQueries({ predicate: cacheable }),
    }),
  });
  client.setQueryDefaults(["clientes"], { gcTime: maxAge });
  client.setQueryDefaults(["contratos"], { gcTime: maxAge });
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const saved = JSON.parse(raw) as {
        version: string;
        timestamp: number;
        state: DehydratedState;
      };
      const age = Date.now() - saved.timestamp;
      if (
        saved.version !== identidade.versao ||
        !Number.isFinite(age) ||
        age < 0 ||
        age > maxAge ||
        !Array.isArray(saved.state?.queries)
      ) {
        discard();
      } else {
        hydrate(client, {
          mutations: [],
          queries: saved.state.queries.filter(
            (query) =>
              (query.queryKey[0] === "contratos" ||
                (query.queryKey[0] === "clientes" && !query.queryKey[1])) &&
              query.state.status === "success" &&
              !query.state.isInvalidated &&
              query.state.dataUpdatedAt > 0 &&
              query.state.dataUpdatedAt <= Date.now() &&
              Date.now() - query.state.dataUpdatedAt <= maxAge &&
              (query.queryKey[0] === "clientes"
                ? clientesSchema
                : contratosSchema
              ).safeParse(query.state.data).success,
          ),
        });
      }
    }
  } catch {
    discard();
  }
  const persist = () => {
    clearTimeout(timer);
    if (client.isMutating()) return;
    try {
      const state = dehydrate(client, {
        shouldDehydrateMutation: () => false,
        shouldDehydrateQuery: (query) =>
          cacheable(query) &&
          query.state.status === "success" &&
          !query.state.isInvalidated &&
          Date.now() - query.state.dataUpdatedAt <= maxAge,
      });
      // Keep the summary only, without duplicating payment and installment
      // histories in WebView storage. Details are fetched under another key.
      for (const query of state.queries) {
        if (
          query.queryKey[0] === "contratos" &&
          Array.isArray(query.state.data)
        ) {
          query.state = {
            ...query.state,
            data: query.state.data.map(({ contrato, indicadores, status }) => ({
              contrato,
              indicadores,
              status,
            })),
          };
        }
      }
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          version: identidade.versao,
          timestamp: Date.now(),
          state,
        }),
      );
    } catch {
      discard();
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(persist, 150);
  };
  client.getQueryCache().subscribe(schedule);
  client.getMutationCache().subscribe(schedule);
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });
  return client;
}
