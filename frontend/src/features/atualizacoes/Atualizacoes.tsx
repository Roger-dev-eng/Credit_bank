import { isTauri, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { Modal } from "../../components/molecules/Modal";
import { identidade } from "../../config";

interface Release {
  available: boolean;
  currentVersion: string;
  version?: string;
  notes?: string;
}
interface Progress {
  stage: "download" | "backup" | "install";
  downloaded?: number;
  total?: number;
}
interface UpdatesContext {
  release: Release | null;
  checking: boolean;
  error: string;
  progress: Progress | null;
  check: () => Promise<void>;
  install: () => Promise<void>;
}
const Context = createContext<UpdatesContext | null>(null);
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function AtualizacoesProvider({ children }: { children: ReactNode }) {
  const [release, setRelease] = useState<Release | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const check = useCallback(async () => {
    if (!isTauri()) return;
    setChecking(true);
    setError("");
    try {
      setRelease(await invoke<Release>("check_update"));
    } catch (e) {
      setError(message(e));
    } finally {
      setChecking(false);
    }
  }, []);
  const install = useCallback(async () => {
    setError("");
    setProgress({ stage: "download" });
    try {
      await invoke("install_update");
    } catch (e) {
      setError(message(e));
      setProgress(null);
    }
  }, []);
  useEffect(() => {
    if (!isTauri()) return;
    const timer = setTimeout(() => {
      void check();
    }, 5000);
    const unlisten = listen<Progress>("update-progress", (e) =>
      setProgress(e.payload),
    );
    return () => {
      clearTimeout(timer);
      void unlisten.then((stop) => stop());
    };
  }, [check]);
  const percent = progress?.total
    ? Math.min(
        100,
        Math.round(((progress.downloaded || 0) / progress.total) * 100),
      )
    : null;
  return (
    <Context.Provider
      value={{ release, checking, error, progress, check, install }}
    >
      {children}
      {progress && (
        <div
          className="update-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Atualizando sistema"
        >
          <section className="card update-status">
            <RefreshCw className="update-spinner" size={28} />
            <h2>
              {progress.stage === "download"
                ? "Baixando atualização"
                : progress.stage === "backup"
                  ? "Protegendo seus dados"
                  : "Instalando atualização"}
            </h2>
            <p>
              {progress.stage === "download"
                ? "O pacote será verificado antes da instalação."
                : progress.stage === "backup"
                  ? "Criando uma cópia de segurança do banco local."
                  : "O aplicativo será fechado e reaberto ao concluir."}
            </p>
            {progress.stage === "download" && (
              <>
                <progress
                  aria-label="Progresso do download"
                  max={100}
                  value={percent ?? undefined}
                />
                <p>{percent !== null ? percent + "%" : "Aguarde…"}</p>
              </>
            )}
            <p className="muted">Seu banco de dados será mantido.</p>
          </section>
        </div>
      )}
    </Context.Provider>
  );
}
function useUpdates() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Atualizações indisponíveis.");
  return ctx;
}
export function AvisoAtualizacao() {
  const { release, progress } = useUpdates();
  if (!release?.available || progress) return null;
  return (
    <div className="update-notice" role="status">
      <span>Nova versão {release.version} disponível.</span>
      <Link to="/atualizacoes">Ver atualização</Link>
    </div>
  );
}
export function PainelAtualizacao() {
  const ctx = useUpdates();
  const [confirm, setConfirm] = useState(false);
  const desktop = isTauri();
  return (
    <section className="card">
      <h2>Atualizações do sistema</h2>
      <p>
        Versão instalada:{" "}
        <strong>{ctx.release?.currentVersion || identidade.versao}</strong>
      </p>
      <p className="muted">
        As atualizações são obtidas do canal oficial no GitHub. Clientes,
        contratos e pagamentos permanecem neste computador.
      </p>
      {!desktop ? (
        <p className="muted">
          A atualização está disponível no aplicativo Windows instalado.
        </p>
      ) : (
        <>
          <Button
            variant="outline"
            disabled={ctx.checking || !!ctx.progress}
            onClick={() => void ctx.check()}
          >
            <RefreshCw size={16} />
            {ctx.checking ? "Verificando…" : "Verificar atualizações"}
          </Button>
          {ctx.error && (
            <p role="alert" className="error">
              {ctx.error}
            </p>
          )}
          {ctx.release &&
            !ctx.release.available &&
            !ctx.error &&
            !ctx.checking && (
              <p role="status">
                Você está usando a versão mais recente disponível.
              </p>
            )}
          {ctx.release?.available && (
            <div className="preview">
              <h3>Versão {ctx.release.version}</h3>
              {ctx.release.notes && (
                <p className="release-notes">{ctx.release.notes}</p>
              )}
              <Button
                disabled={ctx.checking || !!ctx.progress}
                onClick={() => setConfirm(true)}
              >
                <Download size={16} />
                Atualizar agora
              </Button>
            </div>
          )}
        </>
      )}
      {confirm && (
        <Modal
          title={"Instalar versão " + ctx.release?.version}
          onClose={() => setConfirm(false)}
        >
          <p>
            Seu banco de dados será preservado. O sistema criará um backup antes
            da instalação e será reaberto ao concluir. Conclua qualquer
            preenchimento em andamento antes de continuar.
          </p>
          <div className="actions end">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Agora não
            </Button>
            <Button
              onClick={() => {
                setConfirm(false);
                void ctx.install();
              }}
            >
              Baixar e instalar
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
