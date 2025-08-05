import Toast from "../Toast";
import {Calendar, Clock, ImageIcon, Info, Play, Trash2} from "lucide-react";
import {Button} from "./ui/button";
import React, {useState} from "react";
import Resume, {Anime, type Episode} from "../Resume";
import Logger from "../Logger";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "./ui/alert-dialog";
import {DialogContent, DialogTitle} from "./ui/dialog";
import {formatDate, formatTime } from "../lib/time-utils";

export function AnimeDetailsDialog({anime, onEpisodePlay, onAnimeDelete,}: {
    anime: Anime;
    onEpisodePlay: (episode: Episode) => void;
    onAnimeDelete: (animeId: number) => void
}) {
    const [animeEpisodes, setAnimeEpisodes] = useState<Episode[]>(anime.episodes)

    const openDatasheet = () => {
        if (anime.animeID !== -1) {
            window.open(`https://magyaranime.eu/leiras/${anime.animeID}/    `, "_blank")
            Toast.success("Adatlap megnyitva új lapon")
        } else {
            Toast.error("Nincs elérhető adatlap ehhez az animéhez")
        }
    }

    let onEpisodeDelete = (episodeId: number) => {
        Resume.removeData(episodeId)
            .then(() => {
                Toast.success("Epizód törölve az előzményekből")
                setAnimeEpisodes((prev) => prev.filter((ep) => ep.epID !== episodeId))
                if (animeEpisodes.length === 1) { // If this was the last episode, delete the anime
                    onAnimeDelete(anime.animeID)
                }
            })
            .catch((error) => {
                Logger.error("Failed to delete episode:", error)
                Toast.error("Hiba történt az epizód törlése során")
            })
    }

    return (
        <DialogContent className="bg-[#0a0e17] border-[#205daa]/20 text-white max-w-6xl h-[85vh] overflow-hidden"
                       aria-describedby="">
            <DialogTitle hidden={true}>Anime részletek</DialogTitle>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
                {/* Left Side - Anime Info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Anime Image */}
                    <div
                        className="relative aspect-video bg-[#182031] rounded-lg border border-[#205daa]/20 overflow-hidden">
                        {anime.animeID !== -1 ? (
                            <img
                                src={`https://magyaranime.eu/_public/images_v2/boritokepek/small/${anime.animeID}.webp`}
                                alt={anime.animeTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = "none"
                                    target.nextElementSibling?.classList.remove("hidden")
                                }}
                            />
                        ) : null}
                        <div
                            className={`${anime.animeID !== -1 ? "hidden" : ""} w-full h-full flex items-center justify-center`}
                        >
                            <ImageIcon className="h-16 w-16 text-[#205daa]"/>
                        </div>
                    </div>

                    {/* Title and Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{anime.animeTitle}</h2>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={openDatasheet}
                            className="w-full bg-[#205daa] hover:bg-[#3f9fff] text-white cursor-pointer"
                            disabled={anime.animeID === -1}
                        >
                            <Info className="h-4 w-4 mr-2"/>
                            Adatlap megnyitása
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Anime törlése
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Anime törlése</AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#fff]/70">
                                        Biztos, hogy törölni szeretnéd a(z) "{anime.animeTitle}" animét és az összes hozzá
                                        tartozó epizódot az
                                        előzményekből? Ez a művelet nem vonható vissza.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel
                                        className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                        Mégse
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onAnimeDelete(anime.animeID)}
                                        className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                    >
                                        Törlés
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Right Side - Episodes */}
                <div className="lg:col-span-3 flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">Epizódok
                        ({anime.episodes.length})</h3>
                    <div className="flex-1 overflow-y-auto pr-2" style={{maxHeight: "calc(85vh - 120px)"}}>
                        <div className="space-y-2">
                            {animeEpisodes.sort((a, b) => a.epNum - b.epNum)
                                .map((episode) => (
                                    <div
                                        key={episode.epID}
                                        className="flex items-center justify-between p-3 bg-[#182031] rounded-md border border-[#205daa]/20 hover:bg-[#205daa]/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div
                                                className="w-8 h-8 bg-[#205daa] rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm font-medium">{episode.epNum}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white text-sm font-medium">{episode.epNum}. rész</p>
                                                <div className="flex items-center gap-3 text-xs text-[#fff]/70">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3"/>
                                                        <span>{formatTime(episode.epTime)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3"/>
                                                        <span>{formatDate(episode.updateTime)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEpisodePlay(episode)}
                                                className="text-[#3f9fff] hover:bg-[#205daa]/20 cursor-pointer"
                                            >
                                                <Play className="h-4 w-4"/>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm"
                                                            className="text-red-400 hover:bg-red-500/20 cursor-pointer">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-white">Epizód
                                                            törlése</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-[#fff]/70">
                                                            Biztos, hogy törölni szeretnéd a(z) {episode.epNum}.
                                                            epizódot az előzményekből?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel
                                                            className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                                            Mégse
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => onEpisodeDelete(episode.epID)}
                                                            className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                                        >
                                                            Törlés
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    )
}
