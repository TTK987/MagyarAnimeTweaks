import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "../../components/ui/alert-dialog"
import {AlertCircle, Search, Settings, SortAsc, SortDesc, Trash2} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card"
import History, {Anime, type Episode} from "../../History"
import AnimeCard from "../../components/anime-card"
import {Button} from "../../components/ui/button"
import React, {useEffect, useState} from "react"
import {Input} from "../../components/ui/input"
import Footer from "../../components/footer"
import Navbar from "../../components/navbar"
import {createRoot} from "react-dom/client"
import Logger from "../../Logger"
import Toast from "../../Toast"
import MAT from "../../MAT"
import {QueryClientProvider, QueryClient, useQuery} from "@tanstack/react-query"

function FeatureDisabledPage() {
    const openSettings = () => {
        window.open(chrome.runtime.getURL("src/pages/settings/index.html"), "_blank")
        Toast.success("Beállítások megnyitva új lapon")
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar version={MAT.version} eap={MAT.eap} />
            <main className="grow container mx-auto px-4 py-6 min-h-screen">
                {/* Feature Disabled Card */}
                <div className="flex items-center justify-center h-screen">
                    <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <AlertCircle className="h-16 w-16 text-[#ff6b6b] mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-4">Előzmények funkció letiltva</h2>
                            <p className="text-white/70 text-center max-w-md mb-6">
                                Az előzmények funkció jelenleg le van tiltva. A funkció használatához engedélyezd azt a beállításokban.
                            </p>
                            <div className="space-y-3 flex flex-col items-center">
                                <Button onClick={openSettings} className="bg-[#205daa] hover:bg-[#3f9fff] text-white px-6 py-2">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Beállítások megnyitása
                                </Button>
                                <p className="text-sm text-white/50 text-center">
                                    Beállítások → Könyvjelzők & Előzmények → Előzmények engedélyezése
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer version={MAT.version} eap={MAT.eap} />
        </div>
    )
}

function ResumePage() {

    const fetchResumeData = async () => {
        return await History.loadData()
    }

    const useResumeData = () => {
        return useQuery({
            queryKey: ["resumeData"],
            queryFn: fetchResumeData,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
            retry: 1,
            refetchInterval: 30000, // 30 seconds
            throwOnError: true,
        })
    }

    const filterAndSortAnimes = (
        animes: Anime[],
        searchTerm: string,
        sortBy: "title" | "lastWatched" | "lastUpdated",
        sortOrder: "asc" | "desc"
    ) => {
        const filtered = animes.filter((anime) =>
            anime.animeTitle.toLowerCase().includes(searchTerm.toLowerCase())
        )

        filtered.sort((a, b) => {
            let comparison = 0

            switch (sortBy) {
                case "title":
                    comparison = a.animeTitle.localeCompare(b.animeTitle)
                    break
                case "lastWatched":
                    const aLastEpisode = a.episodes.sort((x, y) => y.updateTime - x.updateTime)[0]
                    const bLastEpisode = b.episodes.sort((x, y) => y.updateTime - x.updateTime)[0]
                    comparison = (aLastEpisode?.updateTime || 0) - (bLastEpisode?.updateTime || 0)
                    break
                case "lastUpdated":
                    const aLatest = Math.max(...a.episodes.map((ep) => ep.updateTime))
                    const bLatest = Math.max(...b.episodes.map((ep) => ep.updateTime))
                    comparison = aLatest - bLatest
                    break
            }

            return sortOrder === "asc" ? comparison : -comparison
        })

        return filtered
    }

    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<"title" | "lastWatched" | "lastUpdated">("lastWatched")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [isAnimating, setIsAnimating] = useState(false)

    const { data: resumeData, isLoading, refetch } = useResumeData()

    const animes = resumeData
        ? Array.from(new Map(resumeData.map((anime: Anime) => [anime.animeID, anime])).values())
        : []

    const filteredAnimes = filterAndSortAnimes(animes, searchTerm, sortBy, sortOrder)

    const handleSearch = (value: string) => {
        setIsAnimating(true)
        setSearchTerm(value)
        setTimeout(() => setIsAnimating(false), 150)
    }

    const handleSort = (newSortBy: "title" | "lastWatched" | "lastUpdated") => {
        setIsAnimating(true)
        setSortBy(newSortBy)
        setSortOrder(sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc")
        setTimeout(() => setIsAnimating(false), 150)
    }

    const handleEpisodePlay = (episode: Episode) => {
        History.openEpisode(episode.epID)
        Toast.success("Epizód megnyitva új lapon")
    }

    const handleEpisodeDelete = async (animeId: number, episodeId: number) => {
        try {
            await History.removeData(episodeId)
            await refetch()
            Toast.success("Epizód törölve az előzményekből")
        } catch (error) {
            Logger.error("Failed to delete episode:" + error)
            Toast.error("Hiba történt az epizód törlése során")
        }
    }

    const handleAnimeDelete = async (animeId: number) => {
        try {
            const anime = animes.find((a) => a.animeID === animeId)
            if (anime) {
                for (const episode of anime.episodes) {
                    await History.removeData(episode.epID)
                }
                await refetch()
                Toast.success("Anime törölve az előzményekből")
            }
        } catch (error) {
            Logger.error("Failed to delete anime:" + error)
            Toast.error("Hiba történt az anime törlése során")
        }
    }

    const clearAllHistory = async () => {
        try {
            History.animes = []
            History.saveData()
            await refetch()
            Toast.success("Összes előzmény törölve")
        } catch (error) {
            Logger.error("Failed to clear history:" + error)
            Toast.error("Hiba történt az előzmények törlése során")
        }
    }

    useEffect(() => {
        MAT.loadSettings()
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar version={MAT.version} eap={MAT.eap} />
                <main className="grow container mx-auto px-4 py-6 min-h-screen">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white">Betöltés...</div>
                    </div>
                </main>
                <Footer version={MAT.version} eap={MAT.eap} />
            </div>
        )
    }

    if (!MAT.settings.history.enabled) {
        return ( <FeatureDisabledPage /> )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar version={MAT.version} eap={MAT.eap} />
            <main className="grow container mx-auto px-4 py-6 min-h-screen">
                {/* Header Card */}
                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md mb-6 mt-4">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white">Megtekintési előzmények</CardTitle>
                        <p className="text-white/70">Itt találod a korábban megtekintett epizódokat és folytathatod a részek nézését.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                                    <Input
                                        placeholder="Keresés anime címe alapján..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10 bg-[#182031] border-[#205daa]/30 text-white placeholder:text-white/50 focus:ring-[#3f9fff]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSort("title")}
                                        className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer"
                                    >
                                        Cím{" "}
                                        {sortBy === "title" &&
                                            (sortOrder === "asc" ? (
                                                <SortAsc className="ml-1 h-4 w-4" />
                                            ) : (
                                                <SortDesc className="ml-1 h-4 w-4" />
                                            ))}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSort("lastWatched")}
                                        className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer"
                                    >
                                        Utoljára nézve{" "}
                                        {sortBy === "lastWatched" &&
                                            (sortOrder === "asc" ? (
                                                <SortAsc className="ml-1 h-4 w-4" />
                                            ) : (
                                                <SortDesc className="ml-1 h-4 w-4" />
                                            ))}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                                disabled={animes.length === 0}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Összes törlése
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">Összes előzmény törlése</AlertDialogTitle>
                                                <AlertDialogDescription className="text-white/70">
                                                    Biztos, hogy törölni szeretnéd az összes megtekintési előzményt? Ez a művelet végleges és nem
                                                    vonható vissza.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                                    Mégse
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={clearAllHistory}
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
                    </CardContent>
                </Card>

                {/* Anime Grid */}
                <div className={`transition-opacity duration-300 ${isAnimating ? "opacity-50" : "opacity-100"}`}>
                    {filteredAnimes.length === 0 ? (
                        <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="h-12 w-12 text-[#3f9fff] mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">
                                    {searchTerm ? "Nincs találat" : "Nincs megtekintési előzmény"}
                                </h3>
                                <p className="text-white/70 text-center max-w-md">
                                    {searchTerm
                                        ? "Próbálj meg más keresési kifejezést használni."
                                        : "Kezdj el nézni egy animét, hogy itt megjelenjenek az előzményeid."}
                                </p>
                                {searchTerm && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSearch("")}
                                        className="mt-4 bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer"
                                    >
                                        Keresés törlése
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAnimes.map((anime) => (
                                <AnimeCard
                                    key={anime.animeID}
                                    anime={anime}
                                    onEpisodePlay={handleEpisodePlay}
                                    onEpisodeDelete={handleEpisodeDelete}
                                    onAnimeDelete={handleAnimeDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer version={MAT.version} eap={MAT.eap} />
        </div>
    )
}



const root = createRoot(document.getElementById("root") as HTMLElement)

const queryClient = new QueryClient()
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ResumePage />
        </QueryClientProvider>
    </React.StrictMode>
)



declare global {
    interface Window {
        Toast: typeof Toast
        MAT: typeof MAT
        Logger: typeof Logger
        Resume: typeof History
    }
}

window.Toast = Toast
window.MAT = MAT
window.Logger = Logger
window.Resume = History
