import MAT from "../../MAT"
import Resume from "../../History"
import { FaCog, FaBookmark, FaHistory, FaSpinner, FaTrash, FaPlay, FaImage, FaExternalLinkAlt } from "react-icons/fa"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Clock } from "lucide-react"
import React from "react"
import { createRoot } from "react-dom/client"
import type { Anime, Episode } from "../../History"
import {formatTime} from "../../lib/time-utils";
import Logger from "../../Logger";

function Popup() {
    const [loading, setLoading] = React.useState(true)
    const [latest, setLatest] = React.useState<{
        anime: Anime
        episode: Episode
    } | null>(null)
    const [error, setError] = React.useState(false)
    const [isFeatureEnabled, setIsFeatureEnabled] = React.useState(true)

    React.useEffect(() => {
        Resume.loadData()
            .then(() => {
                setLatest(Resume.getLastUpdated())
                setLoading(false)
            })
            .catch(() => {
                setError(true)
                setLoading(false)
            })
        MAT.loadSettings()
            .then(() => {
                setIsFeatureEnabled(MAT.settings.history.enabled)
            })
            .catch(() => {
                Logger.error("Hiba a beállítások betöltésekor", true)
                setError(true)
                setLoading(false)
            })
    }, [])

    const handleDelete = async (id: number) => {
        await Resume.removeData(id)
        setLoading(true)
        Resume.loadData()
            .then(() => {
                setLatest(Resume.getLastUpdated())
                setLoading(false)
            })
            .catch(() => {
                setError(true)
                setLoading(false)
            })
    }

    const handleResume = (id: number) => {
        Resume.openEpisode(id)
    }

    return (
        <div className="popup-container">
            {/* Header */}
            <div className="popup-header">
                <div className="header-content">
                    <div className="logo-section">
            <span className="text-xl font-bold">
              Magyar<span className="text-[#3f9fff]">Anime</span>Tweaks
              <span className="ml-2 inline-flex items-center rounded-full bg-[#205daa]/30 px-2 py-0.5 text-xs font-medium text-[#3f9fff]">
                v{MAT.version}
              </span>
                {MAT.eap && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-[#aa2020]/30 px-2 py-0.5 text-xs font-medium text-[#ff3f3f]">
                  EAP
                </span>
                )}
            </span>
                    </div>
                    <div className="header-actions">
                        <a
                            href="https://matweaks.hu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                            title="Weboldal megnyitása"
                        >
                            <FaExternalLinkAlt />
                        </a>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="popup-nav">
                <a
                    href="/src/pages/settings/index.html"
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-white hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                    rel="noreferrer"
                >
                    <FaCog className="mr-1 h-4 w-4" />
                    <span>Beállítások</span>
                </a>
                <a
                    href="/src/pages/bookmark/index.html"
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-white hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                    rel="noreferrer"
                >
                    <FaBookmark className="mr-1 h-4 w-4" />
                    <span>Könyvjelzők</span>
                </a>
                <a
                    href="/src/pages/resume/index.html"
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-white hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                    rel="noreferrer"
                >
                    <FaHistory className="mr-1 h-4 w-4" />
                    <span>Előzmények</span>
                </a>
            </div>

            {/* Content */}
            <div className="popup-content">
                <div className="content-header">
                    <h2>Legutóbbi epizód</h2>
                </div>

                <div className="content-body">
                    {loading && (
                        <div className="loading-state">
                            <FaSpinner className="loading-spinner" />
                            <span>Betöltés...</span>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <span>Hiba történt az adatok betöltése közben</span>
                        </div>
                    )}

                    {!isFeatureEnabled && (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <span>Az előzmények funkció le van tiltva</span>
                            <p className="text-xs text-white/50 mt-1">
                                Engedélyezd a <strong>Előzmények</strong> funkciót a beállításokban, hogy megjelenjen a legutóbbi epizódod.
                            </p>
                        </div>
                    )}

                    {!loading && !error && isFeatureEnabled && (
                        <>
                            {latest && latest.episode ? (
                                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden">
                                    {/* Compact Image */}
                                    <div className="relative bg-[#182031] border-b border-[#205daa]/20 aspect-video">
                                        {latest?.anime?.animeID !== -1 ? (
                                            <img
                                                src={`https://magyaranime.eu/_public/images_v2/boritokepek/small/${latest?.anime?.animeID}.webp`}
                                                alt={latest?.anime?.animeTitle}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = "none"
                                                    target.nextElementSibling?.classList.remove("hidden")
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`${latest?.anime?.animeID !== -1 ? "hidden" : ""} w-full h-full flex items-center justify-center`}
                                        >
                                            <FaImage className="h-6 w-6 text-[#205daa]" />
                                        </div>
                                    </div>

                                    <CardContent className="p-3">
                                        {/* Title */}
                                        <h3 className="text-white text-sm font-medium mb-2 line-clamp-1" title={latest?.anime?.animeTitle}>
                                            {latest?.anime?.animeTitle}
                                        </h3>

                                        {/* Episode Info */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-xs text-white/70">
                                                <span className="text-[#3f9fff] font-medium">{latest.episode.epNum}. rész</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatTime(latest.episode.epTime)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(latest?.episode?.epID || -1)}
                                                className="h-6 w-6 p-0 text-white/50 hover:text-red-400 hover:bg-red-500/20"
                                                title="Törlés"
                                            >
                                                <FaTrash className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            onClick={() => handleResume(latest?.episode?.epID || -1)}
                                            className="w-full h-8 bg-[#205daa] hover:bg-[#3f9fff] text-white text-sm font-medium transition-colors"
                                        >
                                            <FaPlay className="h-3 w-3 mr-2" />
                                            Folytatás
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md">
                                    <CardContent className="flex flex-col items-center justify-center py-6">
                                        <div className="text-white/30 mb-2">
                                            <FaHistory className="text-xl" />
                                        </div>
                                        <span className="text-white/70 text-sm text-center">Nincs elkezdett epizód</span>
                                        <p className="text-white/50 text-xs text-center mt-1">Kezdj el nézni egy animét!</p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const root = createRoot(document.getElementById("root") as HTMLDivElement)
root.render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
)
