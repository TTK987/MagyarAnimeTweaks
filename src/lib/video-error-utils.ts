import Toast from '../Toast'

export function showVideoRemovedError(videoTitle: string, episodeNumber: number, serverId: string | undefined, videoId: number) {
    const errorContainer = document.querySelector("#VideoPlayer") || document.querySelector(".gen-video-holder")

    if (!errorContainer) {
        Toast.error("Error", "Error container not found. Please check your HTML structure.", { duration: 5000 })
        return
    }


    const errorId = `EP${videoId}-${serverId?.toUpperCase() || 'UNKNOWN'}-VIDEO-REMOVED-001`
    const hibajelentesUrl = serverId ? `https://magyaranime.eu/hibajelentes/${videoId}/${serverId.toLowerCase().replace("s", "")}/` : undefined;


    errorContainer.innerHTML = `
<div class="error-container" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
">
    <div style="
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        padding: 20px;
        justify-content: center;
        ">
        <div style="
            text-align: center;
            font-weight: bold;
            background-color: #05070b;
            border: 1px solid #205daa;
            padding: 20px 24px;
            border-radius: 12px;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            ">
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at 20% 80%, rgba(32, 93, 170, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(32, 93, 170, 0.1) 0%, transparent 50%);
                pointer-events: none;
                "></div>
            <div style="position: relative; z-index: 1;">
                <div style="
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    ">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#205daa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m15 9-6 6"/>
                        <path d="m9 9 6 6"/>
                    </svg>
                </div>
                <div style="
                    margin-bottom: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    letter-spacing: .5px;
                    color: #205daa;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">
                    Videó nem elérhető
                </div>
                <div style="
                    margin-bottom: 16px;
                    font-size: 14px;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.4;
                    ">
                    A(z) "${videoTitle}" ${episodeNumber}. része jelenleg nem elérhető ezen a szerveren.
                    <br>Ez általában azt jelenti, hogy a videó törölve lett vagy átmenetileg nem működik.
                </div>
                <div style="
                    margin-bottom: 16px;
                    font-size: 13px;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.4;
                    padding: 12px;
                    background: rgba(32, 93, 170, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(32, 93, 170, 0.2);
                    ">
                    💡 <strong>Tipp:</strong> Próbálj meg másik szervert választani, vagy jelentsd be a hibát, hogy mielőbb javítani tudják.
                </div>
                <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        flex-direction: row;
                        flex-wrap: wrap;
                    ">
                        ${hibajelentesUrl ? `
                    <button onclick="window.open('${hibajelentesUrl}', '_blank')" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 4px;
                            background: linear-gradient(135deg, #dc2626, #ef4444);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 11px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: 0.3s;
                            box-shadow: rgba(220, 38, 38, 0.3) 0 2px 4px;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                            transform: translateY(0px);
                            flex: 1;
                            min-width: 100px;
                        ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                        Hibajelentés
                    </button>
                    ` : ''}
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 16px;
                    ">
                    <div style="
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        ">
                        <div style="
                            font-size: 11px;
                            font-weight: 500;
                            color: rgba(255, 255, 255, 0.5);
                            font-family: 'Courier New', monospace;
                            background: rgba(255, 255, 255, 0.05);
                            padding: 6px 10px;
                            border-radius: 6px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            ">
                             ${errorId}
                        </div>
                        <button onclick="copyToClipboard('${errorId}', this)" style="
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            color: rgba(255, 255, 255, 0.7);
                            padding: 6px;
                            border-radius: 4px;
                            cursor: pointer;
                            display: flex;
                            justify-content: center;
                            transition: 0.3s;
                            width: 35px;
                            height: auto;
                            align-items: center;
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.color='rgba(255, 255, 255, 1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.color='rgba(255, 255, 255, 0.7)'" title="Copy Error ID">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                    ">
                    <div style="
                        font-size: 11px;
                        color: rgba(255, 255, 255, 0.7);
                        white-space: nowrap;
                        ">
                        További segítségért:
                    </div>
                    <div style="
                        display: flex;
                        gap: 8px;
                        ">
                        <a href="https://discord.com/invite/dJX4tVGZhY" target="_blank" rel="noopener noreferrer" style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            color: #5865F2;
                            text-decoration: none;
                            font-size: 11px;
                            font-weight: 500;
                            padding: 6px 10px;
                            border-radius: 6px;
                            background: rgba(88, 101, 242, 0.1);
                            border: 1px solid rgba(88, 101, 242, 0.2);
                            transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(88, 101, 242, 0.2)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='rgba(88, 101, 242, 0.1)'; this.style.transform='translateY(0)'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                        </a>
                        /
                        <a href="https://github.com/TTK987/MagyarAnimeTweaks/issues" target="_blank" rel="noopener noreferrer" style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            color: #ffffff;
                            text-decoration: none;
                            font-size: 11px;
                            font-weight: 500;
                            padding: 6px 10px;
                            border-radius: 6px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(0)'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <style>
        @keyframes pulse {
        0%, 100% {
        transform: scale(1);
        opacity: 1;
        }
        50% {
        transform: scale(1.05);
        opacity: 0.8;
        }
        }
    </style>
</div>
  `
}



export function showError(text: string, errorId: string) {
    const errorContainer = document.querySelector('#VideoPlayer') || document.querySelector('.gen-video-holder')


    if (!errorContainer) {
        Toast.error('Error', 'Error container not found. Please check your HTML structure.', {duration: 5000})
        return
    }

    errorContainer.innerHTML = `
<div class="error-container" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
">
    <div style="
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        padding: 20px;
        justify-content: center;
        ">
        <div style="
            text-align: center;
            font-weight: bold;
            background-color: #05070b;
            border: 1px solid #ff4444;
            padding: 20px 24px;
            border-radius: 12px;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            ">
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at 20% 80%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 68, 68, 0.1) 0%, transparent 50%);
                pointer-events: none;
                "></div>
            <div style="position: relative; z-index: 1;">
                <div style="
                    margin-bottom: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    letter-spacing: .5px;
                    color: #ff4444;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">
                    [MATweaks] Hiba történt
                </div>
                <div style="
                    margin-bottom: 16px;
                    font-size: 14px;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.4;
                    ">
                   ${text}
                </div>
                <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        flex-direction: row;
                    ">
                    <button onclick="window.location.reload()" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            background: linear-gradient(135deg, rgb(255, 68, 68), rgb(255, 102, 102));
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: 0.3s;
                            box-shadow: rgba(255, 68, 68, 0.3) 0 4px 8px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            transform: translateY(0px);
                        " onmouseover="this.style.transform='translateY(-1px)';" onmouseout="this.style.transform='translateY(0)';">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Próbáld újra
                    </button>
                    <div style="
                        display: flex;
                        gap: 8px;
                        align-items: stretch;
                        ">
                        <div style="
                            font-size: 11px;
                            font-weight: 500;
                            color: rgba(255, 255, 255, 0.5);
                            font-family: 'Courier New', monospace;
                            background: rgba(255, 255, 255, 0.05);
                            padding: 6px 10px;
                            border-radius: 6px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            ">
                             ${errorId}
                        </div>
                        <button onclick="copyToClipboard('${errorId}', this)" style="
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            color: rgba(255, 255, 255, 0.7);
                            padding: 6px;
                            border-radius: 4px;
                            cursor: pointer;
                            display: flex;
                            justify-content: center;
                            transition: 0.3s;
                            width: 35px;
                            height: auto;
                            align-items: center;
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.color='rgba(255, 255, 255, 1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.color='rgba(255, 255, 255, 0.7)'" title="Copy Error ID">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                    ">
                    <div style="
                        font-size: 11px;
                        color: rgba(255, 255, 255, 0.7);
                        white-space: nowrap;
                        ">
                        Ha a hiba továbbra is fennáll, kérlek jelezd:
                    </div>
                    <div style="
                        display: flex;
                        gap: 8px;
                        ">
                        <a href="https://discord.com/invite/dJX4tVGZhY" target="_blank" rel="noopener noreferrer" style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            color: #5865F2;
                            text-decoration: none;
                            font-size: 11px;
                            font-weight: 500;
                            padding: 6px 10px;
                            border-radius: 6px;
                            background: rgba(88, 101, 242, 0.1);
                            border: 1px solid rgba(88, 101, 242, 0.2);
                            transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(88, 101, 242, 0.2)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='rgba(88, 101, 242, 0.1)'; this.style.transform='translateY(0)'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                        </a>
                        /
                        <a href="https://github.com/TTK987/MagyarAnimeTweaks/issues" target="_blank" rel="noopener noreferrer" style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            color: #ffffff;
                            text-decoration: none;
                            font-size: 11px;
                            font-weight: 500;
                            padding: 6px 10px;
                            border-radius: 6px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(0)'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <style>
        @keyframes pulse {
        0%, 100% {
        transform: scale(1);
        opacity: 1;
        }
        50% {
        transform: scale(1.05);
        opacity: 0.8;
        }
        }
    </style>
</div>
  `
}

