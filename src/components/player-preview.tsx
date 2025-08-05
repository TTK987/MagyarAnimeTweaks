import { useRef, useEffect } from 'react'
import { Card } from './ui/card'
import MAT from '../MAT'
import NativePlayer from '../player/NativePlayer'
import { ExternalLink, Play, User } from 'lucide-react'
import type { SettingsV019 } from '../global'

interface PlayerPreviewProps {
    settings: SettingsV019
    customCSS: string
}

export default function PlayerPreview({ settings, customCSS }: PlayerPreviewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const plyrRef = useRef<NativePlayer | null>(null)

    useEffect(() => {
        if (!videoRef.current) return

        if (plyrRef.current) {
            plyrRef.current.plyr.destroy()
        }

        plyrRef.current = new NativePlayer(
            'video',
            [
                {
                    url: `https://matweaks.hu/testvideos/vid1/720?MAT=v${MAT.getVersion()}`,
                    quality: 720,
                },
                {
                    url: `https://matweaks.hu/testvideos/vid1/1080?MAT=v${MAT.getVersion()}`,
                    quality: 1080,
                },
                {
                    url: `https://matweaks.hu/testvideos/vid1/360?MAT=v${MAT.getVersion()}`,
                    quality: 360,
                },
                {
                    url: `https://matweaks.hu/testvideos/vid1/144?MAT=v${MAT.getVersion()}`,
                    quality: 144,
                },
            ],
            false,
            settings,
            0,
            0,
            'Seven Nation Army「AMV」Anime Mix',
            0,
        )

        plyrRef.current.changeQuality = (q, vE) => {
            const currentTime = vE.currentTime
            vE.src = plyrRef.current?.epData?.find((data) => data.quality === q)?.url || ''
            vE.currentTime = currentTime
        }

        plyrRef.current.previousEpisode = () => {} // Disable previous episode feature
        plyrRef.current.nextEpisode = () => {} // Disable next episode feature
        plyrRef.current.ResumeFeature = () => {} // Disable resume feature
        plyrRef.current.BookmarkFeature = () => {} // Disable bookmark feature

        plyrRef.current.replace()

        return () => {
            if (plyrRef.current) {
                plyrRef.current.plyr.destroy()
            }
        }
    }, [])

    const vidInfo = {
        title: 'Seven Nation Army「AMV」Anime Mix',
        creator: 'Assassïn OVER 妖怪',
        link: 'https://www.youtube.com/watch?v=LJa3I6M7CL0',
    }

    return (
        <div className="space-y-4">
            {settings.plyr.design.enabled && customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md overflow-hidden">
                <div className="plyr-container">
                    <video
                        controls
                        crossOrigin="anonymous"
                        playsInline
                        className="w-full h-full"
                        ref={videoRef}
                    >
                        <source
                            src={`https://matweaks.hu/testvideos/vid1/720?MAT=v${MAT.getVersion()}`}
                            type="video/mp4"
                            sizes="720"
                        />
                        <source
                            src={`https://matweaks.hu/testvideos/vid1/1080?MAT=v${MAT.getVersion()}`}
                            type="video/mp4"
                            sizes="1080"
                        />
                        <source
                            src={`https://matweaks.hu/testvideos/vid1/360?MAT=v${MAT.getVersion()}`}
                            type="video/mp4"
                            sizes="360"
                        />
                        <source
                            src={`https://matweaks.hu/testvideos/vid1/144?MAT=v${MAT.getVersion()}`}
                            type="video/mp4"
                            sizes="144"
                        />
                    </video>
                </div>
            </Card>

            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <Play className="w-5 h-5 text-[#205daa]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white leading-tight">
                                {vidInfo.title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm">
                                <span className="text-gray-500">Készítette: </span>
                                <span className="font-medium">{vidInfo.creator}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <a
                                href={vidInfo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#205daa] hover:text-[#2d6bc7] text-sm font-medium transition-colors duration-200 hover:underline"
                            >
                                YouTube Link
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <span className="inline-block w-4 h-4 bg-[#205daa] rounded-full"></span>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm">
                                <span className="text-gray-500">
                                    A videora CC (Creative Commons) licensz vonatkozik, amely
                                    lehetővé teszi a videó szabad felhasználását és megosztását,
                                    amennyiben a szerzőt megfelelően feltüntetik.
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#205daa]/30 to-transparent"></div>
                    </div>
                    <p className="text-gray-500 text-xs text-center">
                        Ha szeretnéd, hogy a videód itt legyen, írj nekem Discordon,{' '}
                        <a
                            href="https://discord.gg/dJX4tVGZhY"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#205daa] hover:text-[#2d6bc7] transition-colors duration-200 hover:underline"
                        >
                            ttk987
                        </a> néven megtalálsz.
                    </p>
                </div>
            </Card>
        </div>
    )
}
