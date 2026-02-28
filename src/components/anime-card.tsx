import {Card, CardContent} from "./ui/card";
import {Button} from "./ui/button";
import React from "react";
import {Anime, type Episode} from "../History";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "./ui/alert-dialog"
import {Clock, Eye, ImageIcon, Play, Trash2} from "lucide-react"
import {formatDate, formatTime} from "../lib/time-utils";
import {Dialog, DialogTrigger} from "./ui/dialog";
import {AnimeDetailsDialog} from "./anime-details-dialog";


export default function AnimeCard({anime, onEpisodePlay, onEpisodeDelete, onAnimeDelete,}: { anime: Anime; onEpisodePlay: (episode: Episode) => void; onEpisodeDelete: (animeId: number, episodeId: number) => void; onAnimeDelete: (animeId: number) => void; }) {
    const lastEpisode = anime.episodes.sort((a, b) => b.updateTime - a.updateTime)[0]
    const episodeCount = anime.episodes.length

    return (
        <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
            {/* Anime Image with Date Overlay */}
            <div className="relative aspect-video bg-gradient-to-r from-[#205daa] to-[#3f9fff] border-b border-[#205daa]/20 flex-shrink-0">
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
                <div className={`${anime.animeID !== -1 ? "hidden" : ""} w-full h-full flex items-center justify-center`}>
                    <ImageIcon className="h-20 w-20 text-[#c4e8ff]" />
                </div>
                {/* Date overlay */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDate(lastEpisode?.updateTime || 0)}
                </div>
            </div>

            <CardContent className="p-4 flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-white text-lg font-medium mb-3 line-clamp-2 h-14 flex items-center">{anime.animeTitle}</h3>

                {/* Last Episode Section - More Distinct */}
                <div className="bg-[#182031] rounded-lg p-3 mb-3 border border-[#205daa]/30">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">{lastEpisode?.epNum}. epizód</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-[#fff]/70" />
                                <span className="text-xs text-[#fff]/70">{formatTime(lastEpisode?.epTime || 0)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEpisodePlay(lastEpisode)}
                                className="text-[#3f9fff] hover:bg-[#205daa]/20 p-2 cursor-pointer"
                                title="Epizód folytatása"
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:bg-red-500/20 p-2 cursor-pointer"
                                        title="Epizód törlése"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Epizód törlése</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#fff]/70">
                                            Biztos, hogy törölni szeretnéd a(z) {lastEpisode?.epNum}. epizódot az előzményekből?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                            Mégse
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onEpisodeDelete(anime.animeID, lastEpisode?.epID || 0)}
                                            className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                        >
                                            Törlés
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mt-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Összes epizód ({episodeCount})
                            </Button>
                        </DialogTrigger>
                        <AnimeDetailsDialog
                            anime={anime}
                            onEpisodePlay={onEpisodePlay}
                            onAnimeDelete={onAnimeDelete}
                        />
                    </Dialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Anime törlése
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Anime törlése</AlertDialogTitle>
                                <AlertDialogDescription className="text-[#fff]/70">
                                    Biztos, hogy törölni szeretnéd a(z) "{anime.animeTitle}" animét és az összes hozzá tartozó epizódot az
                                    előzményekből? Ez a művelet nem vonható vissza.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
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
            </CardContent>
        </Card>
    )
}
