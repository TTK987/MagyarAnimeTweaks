import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import {AlertCircle, BookmarkIcon, Play, Search, Settings, Trash2} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import React, { useEffect, useState } from "react"
import { Input } from "../../components/ui/input"
import Footer from "../../components/footer"
import Navbar from "../../components/navbar"
import { createRoot } from "react-dom/client"
import Bookmarks from "../../Bookmark"
import Logger from "../../Logger"
import Toast from "../../Toast"
import type { Bookmark } from "../../global"
import MAT from "../../MAT"


interface BookmarksPageState {
    bookmarks: Bookmark[]
    filteredBookmarks: Bookmark[]
    searchTerm: string
    loading: boolean
    isAnimating: boolean
}

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
                            <h2 className="text-2xl font-bold text-white mb-4">Könyvjelzők funkció letiltva</h2>
                            <p className="text-white/70 text-center max-w-md mb-6">
                                Az könyvjelzők funkció jelenleg le van tiltva. A funkció használatához engedélyezd azt a beállításokban.
                            </p>
                            <div className="space-y-3 flex flex-col items-center">
                                <Button onClick={openSettings} className="bg-[#205daa] hover:bg-[#3f9fff] text-white px-6 py-2">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Beállítások megnyitása
                                </Button>
                                <p className="text-sm text-white/50 text-center">
                                    Beállítások → Könyvjelzők & Előzmények → Könyvjelzők engedélyezése
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


function BookmarksPage() {
    const [state, setState] = useState<BookmarksPageState>({
        bookmarks: [],
        filteredBookmarks: [],
        searchTerm: "",
        loading: true,
        isAnimating: false,
    })

    const loadBookmarks = async () => {
        try {
            setState((prev) => ({ ...prev, loading: true }))
            const bookmarksData = await Bookmarks.loadBookmarks()

            setState((prev) => ({
                ...prev,
                bookmarks: bookmarksData,
                filteredBookmarks: bookmarksData,
                loading: false,
            }))
        } catch (error) {
            Logger.error("Failed to load bookmarks:" + error)
            Toast.error("Hiba történt a könyvjelzők betöltése során")
            setState((prev) => ({ ...prev, loading: false }))
        }
    }

    const filterBookmarks = () => {
        setState((prev) => ({ ...prev, isAnimating: true }))

        setTimeout(() => {
            const filtered = state.bookmarks.filter(
                (bookmark) =>
                    bookmark.animeTitle.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                    bookmark.bookmarkDesc.toLowerCase().includes(state.searchTerm.toLowerCase()),
            )

            setState((prev) => ({
                ...prev,
                filteredBookmarks: filtered,
                isAnimating: false,
            }))
        }, 150)
    }

    const handleSearch = (value: string) => {
        setState((prev) => ({ ...prev, searchTerm: value }))
    }

    const handleBookmarkOpen = (id: number) => {
        try {
            Bookmarks.openBookmark(id)
            Toast.success("Könyvjelző megnyitva új lapon")
        } catch (error) {
            Logger.error("Failed to open bookmark:" + error)
            Toast.error("Hiba történt a könyvjelző megnyitása során")
        }
    }

    const handleBookmarkDelete = async (id: number) => {
        try {
            await Bookmarks.deleteBookmark(id)
            await loadBookmarks()
            Toast.success("Könyvjelző törölve")
        } catch (error) {
            Logger.error("Failed to delete bookmark:" + error)
            Toast.error("Hiba történt a könyvjelző törlése során")
        }
    }

    const clearAllBookmarks = async () => {
        try {
            for (const bookmark of state.bookmarks) {
                await Bookmarks.deleteBookmark(bookmark.bookmarkID)
            }
            await loadBookmarks()
            Toast.success("Összes könyvjelző törölve")
        } catch (error) {
            Logger.error("Failed to clear all bookmarks:" + error)
            Toast.error("Hiba történt a könyvjelzők törlése során")
        }
    }

    useEffect(() => {
        MAT.loadSettings()
        loadBookmarks()
    }, [])

    useEffect(() => {
        if (state.searchTerm !== "") {
            filterBookmarks()
        } else {
            setState((prev) => ({
                ...prev,
                filteredBookmarks: prev.bookmarks,
                isAnimating: false,
            }))
        }
    }, [state.bookmarks, state.searchTerm])

    if (state.loading) {
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

    if (!MAT.settings.bookmarks.enabled) {
        return ( <FeatureDisabledPage /> )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar version={MAT.version} eap={MAT.eap} />
            <main className="grow container mx-auto px-4 py-6 min-h-screen">
                {/* Header Card */}
                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md mb-6 mt-4">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            Könyvjelzők
                        </CardTitle>
                        <p className="text-white/70">Itt találod az elmentett könyvjelzőidet.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                                    <Input
                                        placeholder="Keresés anime címe alapján..."
                                        value={state.searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10 bg-[#182031] border-[#205daa]/30 text-white placeholder:text-white/50 focus:ring-[#3f9fff]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                                disabled={state.bookmarks.length === 0}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Összes törlése
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">Összes könyvjelző törlése</AlertDialogTitle>
                                                <AlertDialogDescription className="text-white/70">
                                                    Biztos, hogy törölni szeretnéd az összes könyvjelzőt? Ez a művelet végleges és nem vonható
                                                    vissza.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                                    Mégse
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={clearAllBookmarks}
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

                {/* Bookmarks Grid */}
                <div className={`transition-opacity duration-300 ${state.isAnimating ? "opacity-50" : "opacity-100"}`}>
                    {state.filteredBookmarks.length === 0 ? (
                        <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="h-12 w-12 text-[#3f9fff] mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">
                                    {state.searchTerm ? "Nincs találat" : "Nincs könyvjelző"}
                                </h3>
                                <p className="text-white/70 text-center max-w-md">
                                    {state.searchTerm
                                        ? "Próbálj meg más keresési kifejezést használni."
                                        : "Még nem mentettél el könyvjelzőket. Látogass el egy anime epizód oldalára és adj hozzá könyvjelzőt."}
                                </p>
                                {state.searchTerm && (
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
                            {state.filteredBookmarks.map((bookmark) => (
                                <BookmarkCard
                                    key={bookmark.bookmarkID}
                                    bookmark={bookmark}
                                    onOpen={handleBookmarkOpen}
                                    onDelete={handleBookmarkDelete}
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

function BookmarkCard({
                          bookmark,
                          onOpen,
                          onDelete,
                      }: {
    bookmark: Bookmark
    onOpen: (id: number) => void
    onDelete: (id: number) => void
}) {
    return (
        <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
            {/* Bookmark Image */}
            <div className="relative aspect-video bg-linear-to-r from-[#205daa] to-[#3f9fff] border-b border-[#205daa]/20 shrink-0">
                <img
                    src={`https://magyaranime.eu/_public/images_v2/boritokepek/small/${bookmark.animeID}.webp`}
                    alt={bookmark.animeTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        target.nextElementSibling?.classList.remove("hidden")
                    }}
                />
                <div className="hidden w-full h-full flex items-center justify-center">
                    <BookmarkIcon className="h-20 w-20 text-[#c4e8ff]" />
                </div>
            </div>

            <CardContent className="p-4 flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-white text-lg font-medium mb-3 line-clamp-2 h-14 flex items-center">{bookmark.animeTitle}</h3>

                {/* Description */}
                <div className="bg-[#182031] rounded-lg p-3 mb-4 border border-[#205daa]/30 flex-1">
                    <p className="text-white/70 text-sm line-clamp-3">{bookmark.bookmarkDesc || "Nincs leírás"}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mt-auto">
                    <Button
                        onClick={() => onOpen(bookmark.bookmarkID)}
                        className="w-full bg-[#205daa] hover:bg-[#3f9fff] text-white cursor-pointer"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Megnyitás
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Törlés
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0a0e17] border-[#205daa]/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Könyvjelző törlése</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                    Biztos, hogy törölni szeretnéd a(z) "{bookmark.animeTitle}" könyvjelzőt?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#182031] border-[#205daa]/30 text-white hover:bg-[#205daa]/20 cursor-pointer">
                                    Mégse
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(bookmark.bookmarkID)}
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

const root = createRoot(document.getElementById("root") as HTMLElement)
root.render(
    <React.StrictMode>
        <BookmarksPage />
    </React.StrictMode>,
)

declare global {
    interface Window {
        Toast: typeof Toast
        MAT: typeof MAT
        Logger: typeof Logger
        Bookmarks: typeof Bookmarks
    }
}


window.Toast = Toast
window.MAT = MAT
window.Logger = Logger
window.Bookmarks = Bookmarks
