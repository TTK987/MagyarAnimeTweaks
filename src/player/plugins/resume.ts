import Resume, { Episode } from '../../Resume'
import Logger from '../../Logger'
import { formatTime } from '../../lib/time-utils'
import Toast from '../../Toast'
import BasePlayer from '../BasePlayer'

export class ResumePlugin {
    private ctx: BasePlayer
    private isEnabled: boolean = true

    constructor(ctx: BasePlayer) {
        this.ctx = ctx
    }

    disable() {
        this.isEnabled = false
    }

    init() {
        if (!this.isEnabled) return
        Resume.loadData()
            .then(() => {
                if (this.ctx.epID === undefined) return
                this.addResumeEventListeners()
                this.checkResume().then((response) => {
                    if (response) return
                    this.ctx.addCSS(
                        `#MATweaks-resume-Toast { left: 50%; transform: translateX(-50%); background: var(--black-color); color: white; border-radius: 5px; z-index: 1000; transition: opacity 1s; justify-content: center; display: flex; position: absolute; width: auto; bottom: 4em; background: #00000069; align-items: center; padding: 3px; } #MATweaks-resume-button { border-radius: 5px; box-shadow: 3px 3px 3px 2px rgb(0 0 0 / 20%); cursor: pointer; color: var(--white-color); border: none; height: auto; line-height: 2; text-transform: uppercase; -webkit-border-radius: 5px; -moz-border-radius: 5px; transition: all 0.5s ease-in-out; -moz-transition: all 0.5s ease-in-out; -ms-transition: all 0.5s ease-in-out; -o-transition: all 0.5s ease-in-out; -webkit-transition: all 0.5s ease-in-out; text-shadow: 1px 1px #000; font-weight: 500; background: #ffffff26; font-size: x-small; margin: 3px; display: flex; align-items: center; justify-content: space-between; width: 120px; padding: 5px; } #MATweaks-resume-button:hover { background: #ffffff4d; }#MATweaks-resume-button svg { width: 16px; height: 16px; margin-left: 5px; }`,
                    )
                    let curResumeData = Resume.getDataByEpisodeId(this.ctx.epID)
                    if (!curResumeData) return
                    if (this.ctx.settings.resume.mode === 'auto') {
                        this.ctx.seekTo(curResumeData.epTime)
                        Logger.log('Resumed playback.')
                        this.ctx.Toast('success', 'Folytatás sikeres.')
                    } else if (this.ctx.settings.resume.mode === 'ask')
                        this.askUserToResume(curResumeData).then((response) => {
                            if (response) {
                                this.ctx.seekTo(curResumeData?.epTime)
                                Logger.log('Resumed playback.')
                                this.ctx.Toast('success', 'Folytatás sikeres.')
                            } else {
                                Logger.log('User chose not to resume.')
                            }
                        })
                    else {
                        Logger.error('Invalid resume mode: ' + this.ctx.settings.resume.mode)
                        this.ctx.Toast(
                            'error',
                            'Hiba történt',
                            'Érvénytelen folytatás mód: ' + this.ctx.settings.resume.mode,
                        )
                    }
                })
            })
            .catch((error) => {
                Logger.error('Error while loading resume data: ' + error)
                this.ctx.Toast('error', 'Hiba történt', 'Hiba a folytatás adatok betöltése közben.')
            })
    }

    private checkResume(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getOpenResume' }, (response) => {
                if (response) {
                    for (let i = 0; i < response.length; i++) {
                        const path = new URL(response[i].epURL).pathname
                        const playMatch = path.match(/\/inda-play-(\d+)\//)
                        const dataMatch = path.match(/(-s\d+)?\/(\d+)\//)
                        const idFromUrl = playMatch
                            ? parseInt(playMatch[1], 10) + 100000
                            : dataMatch
                              ? parseInt(dataMatch[2], 10)
                              : -1

                        if (idFromUrl !== this.ctx.epID) {
                            Logger.log('No resume data found for the current URL.')
                            continue
                        }
                        this.ctx.seekTo(response[i].epTime)
                        chrome.runtime.sendMessage(
                            {
                                type: 'removeOpenResume',
                                id: response[i].epID,
                            },
                            (r) => {
                                if (r) {
                                    Logger.log('Resumed playback.')
                                    Toast.info('Folytatás sikeres.')
                                } else {
                                    Logger.error('Error while resuming playback.')
                                    Toast.error('Hiba történt a folytatás közben.')
                                }
                            },
                        )
                        resolve(true)
                    }
                    resolve(false)
                } else {
                    Logger.error('Error while getting the resume data.')
                    Toast.error('Hiba történt az epizód adatai lekérdezése közben.')
                    resolve(false)
                }
            })
        })
    }

    private askUserToResume(data: Episode): Promise<boolean> {
        const div = document.createElement('div')
        div.id = 'MATweaks-resume-Toast'
        const button = document.createElement('button')
        button.id = 'MATweaks-resume-button'
        button.innerHTML = `Folytatás: ${formatTime(data.epTime)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="#ffffff"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>`
        div.appendChild(button)
        ;(document.querySelector('.plyr') as HTMLElement).appendChild(div)

        return new Promise((resolve) => {
            const cleanupAndResolve = (shouldResume: boolean) => {
                div.style.transition = 'opacity 0.5s'
                div.style.opacity = '0'
                setTimeout(() => {
                    div.remove()
                }, 500)
                resolve(shouldResume)
            }

            button.addEventListener('click', () => cleanupAndResolve(true))
            setTimeout(() => cleanupAndResolve(false), 10000)
        })
    }

    private updateResumeData() {
        Resume.updateData(
            this.ctx.epID,
            this.ctx.plyr.currentTime,
            this.ctx.animeID,
            this.ctx.animeTitle,
            window.location.href.startsWith('https://magyaranime.eu')
                ? window.location.href
                : `https://magyaranime.eu/resz/${this.ctx.epID}/`,
            this.ctx.epNum,
            Date.now(),
        )
        Logger.log('Resume data updated.')
    }

    private addResumeEventListeners() {
        const updateData = () => {
            if (
                this.ctx.plyr.duration <= 10 ||
                this.ctx.plyr.currentTime <= 5 ||
                this.ctx.plyr.currentTime >= this.ctx.plyr.duration - 5 ||
                this.ctx.isANEpTriggered
            )
                return
            let curResumeData = Resume.getDataByEpisodeId(this.ctx.epID)
            if (curResumeData && Math.abs(this.ctx.plyr.currentTime - curResumeData.epTime) > 5) {
                this.updateResumeData()
            } else if (!curResumeData) {
                this.updateResumeData()
            }
        }
        const removeData = () => {
            this.ctx.isANEpTriggered = true
            Resume.removeData(this.ctx.epID)
                .then(() => {
                    Logger.log('Removed resume data.')
                })
                .catch((e) => {
                    Logger.error('Error while removing resume data: ' + e)
                    this.ctx.Toast(
                        'error',
                        'Hiba történt',
                        'Hiba a folytatás adatok eltávolítása közben.',
                    )
                })
        }
        const video = document.querySelector(this.ctx.selector) as HTMLVideoElement
        video.addEventListener('pause', updateData)
        video.addEventListener('ended', removeData)
        window.addEventListener('beforeunload', updateData)
        window.addEventListener('unload', updateData)
        document.addEventListener('visibilitychange', updateData)
    }
}
