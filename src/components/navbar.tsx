import { FaBookmark, FaCog, FaHistory } from 'react-icons/fa'
import React from 'react'

export default function Navbar(props: { version: string; eap: boolean }) {
    const isActive = (path: string): boolean => {
        return window.location.pathname.includes(path)
    }

    const getLinkClass = (path: string): string => {
        const baseClass =
            'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors'

        return isActive(path)
            ? `${baseClass} bg-[#205daa]/40 text-[#60b0ff] font-semibold`
            : `${baseClass} text-white hover:bg-[#205daa]/20 hover:text-[#60b0ff]`
    }

    return (
        <header className="border-b border-[#205daa]/20 bg-[#0a0e17]">
            <div className="container flex items-center justify-between py-4 h-16">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                        Magyar<span className="text-[#3f9fff]">Anime</span>Tweaks
                        <span className="ml-2 inline-flex items-center rounded-full bg-[#205daa]/30 px-2 py-0.5 text-xs font-medium text-[#3f9fff]">
                            v{props.version}
                        </span>
                        {props.eap && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-[#aa2020]/30 px-2 py-0.5 text-xs font-medium text-[#ff3f3f]">
                                EAP
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/src/pages/settings/index.html" className={getLinkClass('/settings')}>
                        <FaCog className="mr-2 h-4 w-4" />
                        <span>Beállítások</span>
                    </a>
                    <a href="/src/pages/bookmark/index.html" className={getLinkClass('/bookmark')}>
                        <FaBookmark className="mr-2 h-4 w-4" />
                        <span>Könyvjelzők</span>
                    </a>
                    <a href="/src/pages/resume/index.html" className={getLinkClass('/resume')}>
                        <FaHistory className="mr-2 h-4 w-4" />
                        <span>Előzmények</span>
                    </a>
                </div>
            </div>
        </header>
    )
}
