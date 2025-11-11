import { useEffect, useRef, useState } from 'react'
import { Card } from './ui/card'
import NativePlayer from '../player/NativePlayer'
import { ExternalLink, Play, Film, MonitorPlay } from 'lucide-react'
import type { EpisodeVideoData, SettingsV019 } from '../global'
import IFramePlayerComm from '../player/IFrameComm'

interface PlayerPreviewProps {
    settings: SettingsV019
    customCSS: string
}

const TEST_EPISODES: Array<{
    id: string
    title: string
    provider: 'Indavideo' | 'Videa'
    iframe: string
    sourcePage?: string
}> = [
    {
        id: 'solo-leveling-ep1',
        title: 'Solo Leveling – 1. rész',
        provider: 'Indavideo',
        iframe: 'https://embed.indavideo.hu/player/video/cf96f7eaeb',
        sourcePage: 'https://embed.indavideo.hu/player/video/cf96f7eaeb',
    },
    {
        id: 'teszt-indavideo-2',
        title: '86 - Eighty Six – 1. rész (Indavideo teszt)',
        provider: 'Indavideo',
        iframe: 'https://embed.indavideo.hu/player/video/090845521f',
        sourcePage: 'https://embed.indavideo.hu/player/video/090845521f',
    },
    {
        id: 'teszt-videa-1',
        title: 'Demon Slayer – 1. rész (Videa teszt)',
        provider: 'Videa',
        iframe: 'https://videa.hu/player?v=arSfa4D6aSZhEltE',
        sourcePage: 'https://videa.hu/player?v=arSfa4D6aSZhEltE',
    },
    {
        id: 'teszt-videa-2',
        title: 'Jujutsu Kaisen – 1. rész (Videa teszt)',
        provider: 'Videa',
        iframe: 'https://videa.hu/player?v=2dSQaZt8ARheeksS',
        sourcePage: 'https://videa.hu/player?v=2dSQaZt8ARheeksS',
    },
    {
        id: 'teszt-videa-3',
        title: 'Chainsaw Man – 1. rész (Videa teszt)',
        provider: 'Videa',
        iframe: 'https://videa.hu/player?v=hVARTXURn2FCIDVQ',
        sourcePage: 'https://videa.hu/player?v=hVARTXURn2FCIDVQ',
    }
]

export default function PlayerPreview({ settings, customCSS }: PlayerPreviewProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const plyrRef = useRef<NativePlayer | null>(null)
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const commRef = useRef<IFramePlayerComm | null>(null)
    const activeLoadIndex = useRef<number | null>(null)

    const [videoData, setVideoData] = useState<EpisodeVideoData[] | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number>(-1)

    useEffect(() => {
        if (selectedEpisodeIndex === -1) {
            const random = Math.floor(Math.random() * TEST_EPISODES.length)
            setSelectedEpisodeIndex(random)
        }
    }, [selectedEpisodeIndex])

    const selectedEpisode = selectedEpisodeIndex >= 0 ? TEST_EPISODES[selectedEpisodeIndex] : null

    useEffect(() => {
        if (!selectedEpisode) return
        setLoading(true)
        setError(null)
        setVideoData(null)
    }, [selectedEpisodeIndex])

    useEffect(() => {
        if (!selectedEpisode) return

        const cleanup = () => {
            if (plyrRef.current) {
                try { plyrRef.current.plyr.destroy() } catch (_) {}
                plyrRef.current = null
            }
            if (commRef.current) {
                commRef.current.removeMSGListeners()
                commRef.current = null
            }
            if (iframeRef.current) {
                iframeRef.current.remove()
                iframeRef.current = null
            }
        }

        activeLoadIndex.current = selectedEpisodeIndex

        const initIframe = () => {
            const iframe = document.createElement('iframe')
            iframe.src = selectedEpisode.iframe
            iframe.style.width = '0px'
            iframe.style.height = '0px'
            iframe.style.display = 'none'
            iframe.id = 'mat-preview-iframe'
            iframe.setAttribute('referrerpolicy', 'no-referrer')
            iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen')
            document.body.appendChild(iframe)
            iframeRef.current = iframe

            const comm = new IFramePlayerComm()
            commRef.current = comm

            comm.onFrameLoaded = () => {
                comm.getVideoData()
                    .then((data) => {
                        // Ignore stale responses
                        if (activeLoadIndex.current !== selectedEpisodeIndex) return
                        if (!data || data.length === 0) {
                            setError(`Videó adatok nem találhatók: ${selectedEpisode.title}`)
                            setLoading(false)
                            return
                        }
                        const sorted = [...data].sort((a, b) => b.quality - a.quality)
                        setVideoData(sorted)
                        setLoading(false)
                        iframe.remove()
                        iframeRef.current = null
                    })
                    .catch(() => {
                        if (activeLoadIndex.current !== selectedEpisodeIndex) return
                        setError(`Nem sikerült videó adatokat kinyerni: ${selectedEpisode.title}`)
                        setLoading(false)
                    })
            }
        }

        initIframe()
        return cleanup
    }, [selectedEpisodeIndex, selectedEpisode])

    useEffect(() => {
        if (!videoData || !containerRef.current || !selectedEpisode) return

        if (plyrRef.current) {
            try { plyrRef.current.plyr.destroy() } catch (_) {}
            plyrRef.current = null
        }

        containerRef.current.innerHTML = `\n<video id="mat-preview-player" tabindex="0" controls playsinline>\n${videoData
            .map(
                (v) =>
                    `<source src="${v.url}" type="video/mp4; codecs=avc1.42E01E, mp4a.40.2" size="${v.quality}" />`,
            )
            .join('')}\n</video>`

        plyrRef.current = new NativePlayer(
            '#mat-preview-player',
            videoData,
            false,
            settings,
            0,
            0,
            selectedEpisode.title,
            0,
            0,
            0,
        )

        plyrRef.current.changeQuality = (q, vE) => {
            const currentTime = vE.currentTime
            vE.src = plyrRef.current?.epData?.find((d) => d.quality === q)?.url || ''
            vE.currentTime = currentTime
        }

        plyrRef.current.previousEpisode = () => {}
        plyrRef.current.nextEpisode = () => {}
        plyrRef.current.ResumeFeature = () => {}
        plyrRef.current.BookmarkFeature = () => {}

        plyrRef.current.replace()
    }, [videoData, settings, selectedEpisode])

    const destroyPlayerInstant = () => {
        if (plyrRef.current) {
            try { plyrRef.current.plyr.destroy() } catch (_) {}
            plyrRef.current = null
        }
        if (commRef.current) {
            commRef.current.removeMSGListeners()
            commRef.current = null
        }
        if (iframeRef.current) {
            iframeRef.current.remove()
            iframeRef.current = null
        }
        setVideoData(null)
        setError(null)
        if (containerRef.current) containerRef.current.innerHTML = ''
    }

    return (
        <div className="space-y-4">
            {settings.plyr.design.enabled && customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md overflow-hidden">
                <div className="plyr-container" ref={containerRef}>
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-sm text-gray-400">
                            <div className="animate-pulse mb-2">Videó betöltése...</div>
                            <div className="h-1 w-40 bg-gray-700 rounded overflow-hidden">
                                <div className="h-full w-1/2 bg-[#205daa] animate-[progress_1.2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    )}
                    {!loading && error && (
                        <div className="p-4 text-center text-xs text-red-400">{error}</div>
                    )}
                    {!loading && !error && !videoData && (
                        <div className="p-4 text-center text-xs text-yellow-400">Nincsenek videó adatok.</div>
                    )}
                </div>
            </Card>

            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-4">
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                    <Film className="w-4 h-4 text-[#205daa]" />
                    <span>Teszt epizód választó</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TEST_EPISODES.map((ep, i) => {
                        const active = i === selectedEpisodeIndex
                        return (
                            <button
                                key={ep.id}
                                onClick={() => {
                                    if (i === selectedEpisodeIndex) return
                                    destroyPlayerInstant()
                                    setLoading(true)
                                    setSelectedEpisodeIndex(i)
                                }}
                                className={`group relative rounded-md border px-3 py-2 text-left text-xs transition ${
                                    active
                                        ? 'border-[#205daa] bg-[#112033] shadow-inner'
                                        : 'border-[#1e293b] hover:border-[#205daa]/70 bg-[#0f1624]'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-200 group-hover:text-white truncate max-w-[130px]">
                                        {ep.title}
                                    </span>
                                    <MonitorPlay className={`w-3 h-3 ${active ? 'text-[#3f9fff]' : 'text-gray-500'}`} />
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400">{ep.provider}</span>
                                    {active && (
                                        <span className="text-[10px] text-[#3f9fff] font-semibold">Aktív</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </Card>

            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-6">
                {selectedEpisode ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <Play className="w-5 h-5 text-[#205daa]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white leading-tight">
                                    {selectedEpisode.title}
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Szolgáltató: <span className="text-gray-300">{selectedEpisode.provider}</span>
                                </p>
                            </div>
                        </div>

                        {selectedEpisode.sourcePage && (
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <a
                                        href={selectedEpisode.sourcePage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#205daa] hover:text-[#2d6bc7] text-sm font-medium transition-colors duration-200 hover:underline"
                                    >
                                        Eredeti forrás link
                                    </a>
                                </div>
                            </div>
                        )}

                        {videoData && !loading && !error && (
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <MonitorPlay className="w-4 h-4 text-[#205daa]" />
                                </div>
                                <div className="text-xs text-gray-300">
                                    <p className="text-gray-400 mb-1">Elérhető minőségek:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {videoData.map((q) => (
                                            <span
                                                key={q.quality}
                                                className="px-2 py-0.5 rounded bg-[#13263d] border border-[#205daa]/40 text-[10px] text-gray-200"
                                            >
                                                {q.quality}p
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-xs text-gray-400">Nincs kiválasztott epizód.</div>
                )}
            </Card>
        </div>
    )
}
