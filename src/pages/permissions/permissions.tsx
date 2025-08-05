import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Shield, CheckCircle, AlertCircle, Globe, RefreshCw } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import MAT from "../../MAT"

function PermissionsPage() {
    const [permissionStatus, setPermissionStatus] = useState("pending")
    const [isLoading, setIsLoading] = useState(false)
    const [hostPermissions, setHostPermissions] = useState<string[]>([])

    useEffect(() => {

        // Get host permissions from manifest
        const manifest = chrome.runtime.getManifest()
        const permissions = manifest.host_permissions || []
        setHostPermissions(permissions)

        // Check if permissions are already granted
        if (chrome && chrome.permissions) {
            chrome.permissions.contains(
                {
                    origins: permissions,
                },
                (result) => {
                    if (result) {
                        setPermissionStatus("granted")
                    }
                },
            )
        }
    }, [])

    const handleRequestPermissions = () => {
        setIsLoading(true)

        if (chrome && chrome.permissions) {
            chrome.permissions.request(
                {
                    origins: hostPermissions,
                },
                (granted) => {
                    setIsLoading(false)
                    setPermissionStatus(granted ? "granted" : "denied")
                },
            )
        } else {
            setIsLoading(false)
            setPermissionStatus("denied")
        }
    }

    return (
        <div className="min-h-screen bg-[#182031] text-white">
            <Navbar version={MAT.getVersion()} eap={MAT.isEAP()} />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-center mt-12">
                    <div className="w-full max-w-2xl">
                        <Card className="bg-[#0a0e17] border-[#205daa]/20">
                            <CardHeader className="text-center pb-6">
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 rounded-full bg-[#3f9fff]/10 border border-[#3f9fff]/20">
                                        <Shield className="w-8 h-8 text-[#3f9fff]" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold text-white">Engedélyek szükségesek</CardTitle>
                                <p className="text-[#fff]/70 mt-2">
                                    A bővítmény működéséhez hozzáférés szükséges az alábbi weboldalakhoz
                                </p>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Host Permissions List */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Globe className="w-5 h-5 text-[#3f9fff]" />
                                        <h3 className="text-lg font-semibold text-white">Weboldal hozzáférések</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center">
                                        {hostPermissions.map((permission: string, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 rounded-lg bg-[#1c2533] border border-[#205daa]/10 hover:border-[#205daa]/30 transition-colors w-full max-w-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#3f9fff]" />
                                                    <span className="text-white font-mono text-sm">{permission.replace(/\*:\/\/\*\./, "")}</span>
                                                </div>
                                                {permissionStatus === "granted" && <CheckCircle className="w-5 h-5 text-green-400" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status and Action */}
                                <div className="pt-6 border-t border-[#205daa]/20">
                                    {permissionStatus === "pending" && (
                                        <Button
                                            onClick={handleRequestPermissions}
                                            disabled={isLoading}
                                            className="w-full bg-[#3f9fff] hover:bg-[#1c7ed6] text-white py-3 text-base font-medium"
                                            size="lg"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Feldolgozás...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-5 h-5" />
                                                    Engedélyek megadása
                                                </div>
                                            )}
                                        </Button>
                                    )}

                                    {permissionStatus === "granted" && (
                                        <div className="text-center space-y-4">
                                            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                                <CheckCircle className="w-6 h-6 text-green-400" />
                                                <span className="text-green-400 font-medium">Engedélyek sikeresen megadva</span>
                                            </div>
                                        </div>
                                    )}

                                    {permissionStatus === "denied" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                                <AlertCircle className="w-6 h-6 text-red-400" />
                                                <span className="text-red-400 font-medium">Engedélyek megadása sikertelen</span>
                                            </div>
                                            <Button
                                                onClick={handleRequestPermissions}
                                                disabled={isLoading}
                                                className="w-full bg-[#3f9fff] hover:bg-[#1c7ed6] text-white"
                                                size="lg"
                                            >
                                                {isLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        Feldolgozás...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-5 h-5" />
                                                        Újrapróbálás
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer version={MAT.getVersion()} eap={MAT.isEAP()} />
        </div>
    )
}

const root = createRoot(document.getElementById("root") as HTMLElement)
root.render(
    <React.StrictMode>
        <PermissionsPage />
    </React.StrictMode>,
)
