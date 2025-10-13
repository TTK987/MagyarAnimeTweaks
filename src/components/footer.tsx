import { CgWebsite } from 'react-icons/cg'
import { FaDiscord, FaGithub } from 'react-icons/fa'
import React from 'react'
export default function Footer(props: { version: string; eap: boolean }) {
    return (
        <footer className="border-t border-[#205daa]/20 py-6 mt-12 bg-[#0a0e17]">
            <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#fff]/70">
                        © MATweaks {new Date().getFullYear()}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-[#205daa]/30 px-2 py-0.5 text-xs font-medium text-[#3f9fff]">
                        v{props.version}
                    </span>
                    {props.eap && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-[#aa2020]/30 px-2 py-0.5 text-xs font-medium text-[#ff3f3f]">
                            EAP
                        </span>
                    )}
                    <br />
                    <span className="text-sm text-[#fff]/70">by TTK987</span>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href={props.eap ? 'https://beta.matweaks.hu' : 'https://matweaks.hu'}
                        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                        target="_blank"
                    >
                        <CgWebsite className="mr-2 h-4 w-4" />
                        <span>Weboldal</span>
                    </a>
                    <a
                        href="https://github.com/TTK987/MagyarAnimeTweaks"
                        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                        target="_blank"
                    >
                        <FaGithub className="mr-2 h-4 w-4" />
                        <span>GitHub</span>
                    </a>
                    <a
                        href="https://discord.gg/dJX4tVGZhY"
                        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#205daa]/20 hover:text-[#60b0ff]"
                        target="_blank"
                    >
                        <FaDiscord className="mr-2 h-4 w-4" />
                        <span>Discord</span>
                    </a>
                </div>
            </div>
        </footer>
    )
}
