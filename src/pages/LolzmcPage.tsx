import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Play,
  RefreshCw,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import { LolzteamIcon } from "../components/LolzteamIcon";
import { useI18n } from "../i18n";
import type { GameInstance, LolzmcData, MinecraftServerStatus, RouteId } from "../types";

interface LolzmcPageProps {
  instances: GameInstance[];
  onPlay: (instance: GameInstance) => void;
  onNavigate: (route: RouteId) => void;
  onOpen: (instance: GameInstance) => void;
  onNotify: (tone: "success" | "warning" | "info", title: string, message: string) => void;
}

const LZT_ENDPOINTS = ["mc.lolz.games", "mc-2.lolz.games"] as const;

export function LolzmcPage({
  instances,
  onPlay,
  onOpen,
  onNotify,
}: LolzmcPageProps) {
  const { t: _t } = useI18n();

  const [activeEndpoint, setActiveEndpoint] = useState<string>("mc.lolz.games");
  const [serverStatus, setServerStatus] = useState<MinecraftServerStatus | null>(null);
  const [endpointStats, setEndpointStats] = useState<
    Array<{ address: string; latencyMs: number | null; online: boolean }>
  >([]);
  const [lolzData, setLolzData] = useState<LolzmcData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIp, setCopiedIp] = useState(false);

  const officialInstance =
    instances.find((inst) => inst.id === "lolzmc-official") ??
    instances.find((inst) => inst.favorite) ??
    instances[0];

  const isGameRunning = officialInstance?.status === "running";

  const fetchStatus = async () => {
    setLoading(true);

    const pingPromises = LZT_ENDPOINTS.map(async (address) => {
      try {
        const res = await window.onyx.system.serverStatus(address);
        return {
          address,
          latencyMs: res.online ? (res.latencyMs ?? null) : null,
          online: Boolean(res.online),
          res,
        };
      } catch {
        return {
          address,
          latencyMs: null,
          online: false,
          res: { online: false, address },
        };
      }
    });

    try {
      const results = await Promise.all(pingPromises);
      setEndpointStats(
        results.map((r) => ({
          address: r.address,
          latencyMs: r.latencyMs,
          online: r.online,
        })),
      );

      const onlineEndpoints = results
        .filter((r) => r.online)
        .sort((a, b) => (a.latencyMs ?? 9999) - (b.latencyMs ?? 9999));

      if (onlineEndpoints.length > 0) {
        setActiveEndpoint(onlineEndpoints[0].address);
        setServerStatus(onlineEndpoints[0].res);
      } else {
        setActiveEndpoint("mc.lolz.games");
        setServerStatus(results[0]?.res ?? { online: false, address: "mc.lolz.games" });
      }
    } catch {
      setActiveEndpoint("mc.lolz.games");
    }

    try {
      const data = await window.onyx.system.lolzmcStatus();
      if (data) {
        setLolzData(data);
      }
    } catch {
      // ignore status error
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleCopyIp = async () => {
    try {
      await navigator.clipboard.writeText(activeEndpoint);
      setCopiedIp(true);
      onNotify("info", "Адрес скопирован", `${activeEndpoint} в буфере обмена`);
      setTimeout(() => setCopiedIp(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleLaunchLolzmc = async () => {
    if (!officialInstance) return;

    try {
      await window.onyx.state.updateInstance(officialInstance.id, {
        settings: {
          ...officialInstance.settings,
          serverAddress: activeEndpoint,
        },
      });

      const updated: GameInstance = {
        ...officialInstance,
        settings: {
          ...officialInstance.settings,
          serverAddress: activeEndpoint,
        },
      };

      onPlay(updated);
    } catch {
      onPlay(officialInstance);
    }
  };

  const totalPlayersOnline =
    lolzData?.servers?.reduce((acc, s) => acc + (s.online_players || 0), 0) ||
    serverStatus?.playersOnline ||
    0;

  const totalPlaytimeHours = lolzData?.playtime_ms
    ? Math.floor(lolzData.playtime_ms / 3600000).toLocaleString("ru-RU")
    : null;

  return (
    <motion.div
      className="page lolzmc-page"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      {/* Hero-блок в стиле Feather / Lunar */}
      <section className="lzt-hero glass-panel">
        <div className="lzt-hero__glow" />

        <div className="lzt-hero__top">
          <div className="lzt-hero__brand">
            <div className="lzt-hero__icon-frame">
              <LolzteamIcon size={32} color="#2BAD72" />
            </div>
            <div className="lzt-hero__meta">
              <div className="lzt-hero__tags">
                <span className="lzt-tag lzt-tag--green">1.21.4 Fabric</span>
                <span className="lzt-tag">PlasmoVoice</span>
                <span className="lzt-tag">Lolz Auth</span>
              </div>
              <h1 className="lzt-hero__title">Lolzteam Craft</h1>
            </div>
          </div>

          <div className="lzt-hero__network-badge">
            <div className="lzt-hero__net-row">
              <span className={`radar-dot ${serverStatus?.online ? "radar-dot--online" : "radar-dot--offline"}`} />
              <strong className="lzt-hero__address">{activeEndpoint}</strong>
              {serverStatus?.latencyMs != null && (
                <span className="lzt-hero__latency">{serverStatus.latencyMs} ms</span>
              )}
            </div>
            <div className="lzt-hero__net-sub">
              <span>{totalPlayersOnline} {totalPlayersOnline === 1 ? "игрок онлайн" : "игроков онлайн"}</span>
              <i>·</i>
              <span>{serverStatus?.online ? "Кластер активен" : "Сервер офлайн"}</span>
            </div>
          </div>
        </div>

        <div className="lzt-hero__bottom">
          <div className="lzt-hero__actions">
            <button
              className="button button--primary button--lg lzt-hero__launch-btn"
              onClick={() => void handleLaunchLolzmc()}
              disabled={isGameRunning}
            >
              <Play size={16} fill="currentColor" />
              <span>{isGameRunning ? "Игра запущена" : "Играть"}</span>
            </button>

            <button
              type="button"
              className="button button--secondary button--lg"
              onClick={() => void handleCopyIp()}
            >
              {copiedIp ? <Check size={15} color="#2BAD72" /> : <Copy size={15} />}
              <span>{copiedIp ? "Скопировано" : "Копировать IP"}</span>
            </button>

            {officialInstance && (
              <button
                type="button"
                className="button button--secondary button--lg"
                onClick={() => onOpen(officialInstance)}
              >
                Сборка
              </button>
            )}

            <button
              type="button"
              className="button button--ghost icon-button"
              onClick={() => void fetchStatus()}
              disabled={loading}
              title="Обновить пинг"
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="lzt-hero__links">
            <div className="lzt-hero__mirrors">
              {endpointStats.map((ep) => (
                <span key={ep.address} className="lzt-mirror-item" title={ep.address}>
                  <span className={`status-dot ${ep.online ? "status-dot--online" : "status-dot--offline"}`} />
                  <span>{ep.address}</span>
                  {ep.online && ep.latencyMs != null && <em>{ep.latencyMs}ms</em>}
                </span>
              ))}
            </div>

            <div className="lzt-hero__nav-links">
              <a href="https://lolz.games" target="_blank" rel="noreferrer" className="lzt-nav-link">
                <Globe size={13} />
                <span>lolz.games</span>
                <ExternalLink size={11} />
              </a>
              <a href="https://lolz.live/threads/9517755/" target="_blank" rel="noreferrer" className="lzt-nav-link">
                <span>Форум</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Игровые режимы — карточки в стиле Lunar/Feather */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Игровые миры</h2>
            <p>Доступные режимы на сервере</p>
          </div>
        </div>

        <div className="lzt-modes-grid">
          {lolzData?.servers?.map((server) => {
            const isPvp = server.name.toLowerCase().includes("pvp") || server.name.toLowerCase().includes("arena");
            const isSurvival = server.name.toLowerCase().includes("survival");
            const isBedwars = server.name.toLowerCase().includes("bedwars");

            return (
              <div
                key={server.name}
                className={`lzt-mode-card glass-panel ${!server.is_online ? "lzt-mode-card--offline" : ""}`}
              >
                <div className="lzt-mode-card__header">
                  <div className="lzt-mode-card__icon">
                    {isPvp ? (
                      <Swords size={18} />
                    ) : isBedwars ? (
                      <Flame size={18} />
                    ) : isSurvival ? (
                      <Shield size={18} />
                    ) : (
                      <Users size={18} />
                    )}
                  </div>
                  <div className="lzt-mode-card__title-box">
                    <div className="lzt-mode-card__topline">
                      <h3>{server.name}</h3>
                      <span className="lzt-mode-card__tps">
                        TPS {server.tps != null ? server.tps.toFixed(1) : "20.0"}
                      </span>
                    </div>
                    <span className="lzt-mode-card__online-tag">
                      <span className={`status-dot ${server.is_online ? "status-dot--online" : "status-dot--offline"}`} />
                      {server.online_players} в игре
                    </span>
                  </div>
                </div>

                <p className="lzt-mode-card__desc">{server.description}</p>

                {server.players && server.players.length > 0 && (
                  <div className="lzt-mode-card__players">
                    <span className="lzt-mode-card__players-label">Онлайн:</span>
                    <div className="lzt-mode-card__player-tags">
                      {server.players.map((nick) => (
                        <span key={nick} className="lzt-player-tag">
                          {nick}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(!lolzData?.servers || lolzData.servers.length === 0) && (
            <div className="lzt-mode-card lzt-mode-card--empty glass-panel">
              <RefreshCw size={18} className="spin" />
              <span>Опрос игровых нод...</span>
            </div>
          )}
        </div>
      </section>

      {/* Компактная полоска телеметрии внизу */}
      {lolzData && (
        <section className="lzt-stats-strip glass-panel">
          <div className="lzt-stat-cell">
            <span className="lzt-stat-cell__label">Всего игроков</span>
            <strong className="lzt-stat-cell__value">{lolzData.total_players?.toLocaleString("ru-RU")}</strong>
          </div>
          <div className="lzt-stat-cell__divider" />
          <div className="lzt-stat-cell">
            <span className="lzt-stat-cell__label">Сессий</span>
            <strong className="lzt-stat-cell__value">{lolzData.sessions?.toLocaleString("ru-RU")}</strong>
          </div>
          <div className="lzt-stat-cell__divider" />
          <div className="lzt-stat-cell">
            <span className="lzt-stat-cell__label">Часов в игре</span>
            <strong className="lzt-stat-cell__value">{totalPlaytimeHours ?? "—"}</strong>
          </div>
          <div className="lzt-stat-cell__divider" />
          <div className="lzt-stat-cell">
            <span className="lzt-stat-cell__label">Убито мобов</span>
            <strong className="lzt-stat-cell__value">{lolzData.mob_kills?.toLocaleString("ru-RU")}</strong>
          </div>
          <div className="lzt-stat-cell__divider" />
          <div className="lzt-stat-cell">
            <span className="lzt-stat-cell__label">PvP-убийств</span>
            <strong className="lzt-stat-cell__value">{lolzData.player_kills?.toLocaleString("ru-RU")}</strong>
          </div>
        </section>
      )}
    </motion.div>
  );
}
