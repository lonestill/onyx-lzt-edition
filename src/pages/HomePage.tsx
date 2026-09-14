import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight,
  Folder,
  FolderOpen,
  Play,
  Plus,
  Server,
  Settings,
  ShieldAlert,
  Sparkles,
  Square,
  Wrench,
} from "lucide-react";
import { useI18n } from "../i18n";
import type { GameInstance, PlaySession, RouteId } from "../types";
import { formatPlaytime } from "../utils";

interface HomePageProps {
  instances: GameInstance[];
  sessions: PlaySession[];
  profileName: string;
  onNavigate: (route: RouteId) => void;
  onPlay: (instance: GameInstance) => void;
  onOpen: (instance: GameInstance) => void;
  onCreate: () => void;
  onConfigure: (instance: GameInstance) => void;
}

export function HomePage({
  instances,
  sessions,
  profileName,
  onNavigate,
  onPlay,
  onOpen,
  onCreate,
  onConfigure,
}: HomePageProps) {
  const { locale, t } = useI18n();
  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? t("home.greeting.night")
      : hour < 12
        ? t("home.greeting.morning")
        : hour < 18
          ? t("home.greeting.day")
          : t("home.greeting.evening");

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const activeInstance =
    instances.find((instance) => instance.id === selectedInstanceId) ??
    instances.find((instance) => instance.favorite) ??
    instances[0];

  const displayName = (instance: GameInstance) =>
    instance.id === "vanilla-start" && instance.name === "Pure Game"
      ? t("home.defaultName")
      : instance.name;

  const displayDescription = (instance: GameInstance) =>
    instance.id === "vanilla-start" && instance.description === "Minecraft without modifications"
      ? t("home.defaultDescription")
      : instance.description;

  const latestSession = sessions[0];
  const failedInstance =
    latestSession?.exitCode !== undefined &&
    latestSession?.exitCode !== null &&
    latestSession.exitCode !== 0
      ? instances.find((instance) => instance.id === latestSession.instanceId)
      : undefined;

  const isRunning = activeInstance?.status === "running";
  const isSetup = activeInstance?.status === "setup" || activeInstance?.status === "pack-ready";
  const isError = activeInstance?.status === "error";


  return (
    <motion.div
      className="page home-page"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <div className="page-heading page-heading--home">
        <div>
          <p className="eyebrow">Command center</p>
          <h1>
            {greeting}, <span>{profileName === "Player" ? t("profile.player") : profileName}</span>
          </h1>
        </div>
        <div className="page-heading__actions">
          <button className="button button--secondary" onClick={() => onNavigate("library")}>
            {t("home.library")}
            <ArrowRight size={14} />
          </button>
          <button className="button button--primary" onClick={onCreate}>
            <Plus size={15} />
            {t("home.newInstance")}
          </button>
        </div>
      </div>

      {activeInstance && (
        <section className="hero-station hero-station--zen">
          <div className="hero-station__visual">
            <div className="hero-station__badge-avatar">
              {activeInstance.iconUrl ? (
                <img src={activeInstance.iconUrl} alt="" />
              ) : (
                <span>{activeInstance.glyph || "MC"}</span>
              )}
            </div>
          </div>

          <div className="hero-station__content">
            <div className="hero-station__tag">
              <span
                className={`status-pill ${
                  isRunning
                    ? "status-pill--running"
                    : isError
                      ? "status-pill--error"
                      : "status-pill--ready"
                }`}
              >
                {isRunning
                  ? t("home.status.running")
                  : isError
                    ? t("home.status.error")
                    : isSetup
                      ? t("home.status.setup")
                      : t("home.status.continue")}
              </span>
              <i>·</i>
              <span>
                {activeInstance.lastPlayed === "Never played"
                  ? t("home.neverPlayed")
                  : activeInstance.lastPlayed}
              </span>
              {activeInstance.settings?.serverAddress && (
                <>
                  <i>·</i>
                  <span className="hero-station__server-pill">
                    <Server size={11} />
                    {activeInstance.settings.serverAddress}
                  </span>
                </>
              )}
            </div>

            <h2>{displayName(activeInstance)}</h2>
            {displayDescription(activeInstance) && (
              <p className="hero-station__desc">{displayDescription(activeInstance)}</p>
            )}

            <div className="hero-station__meta-inline">
              <span>Minecraft {activeInstance.version}</span>
              <i>·</i>
              <span>{activeInstance.loader}</span>
              <i>·</i>
              <span>{formatPlaytime(activeInstance.playtimeMinutes, locale)}</span>
              {activeInstance.modCount > 0 && (
                <>
                  <i>·</i>
                  <span>{t("home.modsActive", { count: activeInstance.modCount })}</span>
                </>
              )}
            </div>
          </div>

          <div className="hero-station__cta">
            <button
              className={`button button--play button--large ${
                isRunning ? "button--danger-quiet" : "button--primary"
              }`}
              onClick={() => onPlay(activeInstance)}
            >
              {isRunning ? (
                <>
                  <Square size={16} fill="currentColor" />
                  {t("home.action.stop")}
                </>
              ) : isSetup ? (
                <>
                  <Sparkles size={16} />
                  {t("home.action.install")}
                </>
              ) : isError ? (
                <>
                  <Wrench size={16} />
                  {t("home.action.retry")}
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  {t("home.action.play")}
                </>
              )}
            </button>

            <div className="hero-station__quick-tools">
              <button
                className="button button--secondary"
                onClick={() => onOpen(activeInstance)}
                title={t("common.open")}
              >
                <FolderOpen size={14} />
                <span>{t("common.open")}</span>
              </button>
              <button
                className="button button--secondary button--icon-only"
                onClick={() => onConfigure(activeInstance)}
                title={t("home.action.configure")}
              >
                <Settings size={14} />
              </button>
              <button
                className="button button--secondary button--icon-only"
                onClick={() => void window.onyx.state.openInstanceFolder(activeInstance.id)}
                title="Open instance folder in Finder"
              >
                <Folder size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {failedInstance && (
        <div className="incident-banner">
          <div className="incident-banner__icon">
            <ShieldAlert size={20} />
          </div>
          <div className="incident-banner__copy">
            <strong>
              Last launch of {displayName(failedInstance)} exited with code {failedInstance.lastExitCode ?? 1}
            </strong>
            <p>
              {failedInstance.lastDiagnosis?.message || "Crash log recorded and ready for analysis."}
            </p>
          </div>
          <button
            className="button button--danger-quiet button--small"
            onClick={() => onOpen(failedInstance)}
          >
            <Wrench size={13} />
            Analyze Crash & Bisect
          </button>
        </div>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>{t("home.recent")}</h2>
            <p>{t("home.recentHint")}</p>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate("library")}
          >
            {t("home.library")} <ArrowRight size={13} />
          </button>
        </div>

        <div className="recent-grid">
          {instances.slice(0, 3).map((instance, index) => {
            const isCurrent = instance.id === activeInstance?.id;
            return (
              <motion.article
                className={`recent-card recent-card--instance recent-card--${instance.color} ${
                  isCurrent ? "is-selected" : ""
                }`}
                key={instance.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedInstanceId(instance.id)}
                onDoubleClick={() => onOpen(instance)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedInstanceId(instance.id);
                  }
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * index }}
              >
                <span className="recent-card__icon">
                  {instance.iconUrl ? (
                    <img src={instance.iconUrl} alt="" />
                  ) : (
                    instance.glyph
                  )}
                </span>
                <span className="recent-card__copy">
                  <strong>{displayName(instance)}</strong>
                  <small>
                    {instance.version} · {instance.loader.split(" ")[0]}
                  </small>
                </span>
                <button
                  className="recent-card__play"
                  aria-label={t("home.action.play")}
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlay(instance);
                  }}
                >
                  <Play size={13} fill="currentColor" />
                </button>
              </motion.article>
            );
          })}

          <button className="recent-card recent-card--new" onClick={onCreate}>
            <span className="recent-card__icon">
              <Plus size={18} />
            </span>
            <span className="recent-card__copy">
              <strong>{t("home.newInstance")}</strong>
              <small>{t("home.newHint")}</small>
            </span>
          </button>
        </div>
      </section>
    </motion.div>
  );
}
