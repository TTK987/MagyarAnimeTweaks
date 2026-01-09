import Bookmarks from '../../Bookmark'
import Logger from '../../Logger'
import { formatTime } from '../../lib/time-utils'
import BasePlayer from '../BasePlayer'

export class BookmarkPlugin {
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
        if (this.ctx.epID === undefined) return

        this.openBookmarkIfNeeded()
        this.addBookmarkButton()
    }

    /**
     * Return bookmark markers for current episode (used by Plyr markers)
     */
    getBookmarks(): Array<{ time: number; label: string }> {
        const bmks: Array<{ time: number; label: string }> = []
        if (!this.ctx.settings.bookmarks.enabled) return bmks

        Bookmarks.bookmarks.forEach((bm) => {
            if (bm.epID !== this.ctx.epID) return
            bmks.push({
                time: bm.epTime,
                label: formatTime(bm.epTime),
            })
        })
        return bmks
    }

    /**
     * Check extension "openBookmarks" queue and seek if current ep matches
     */
    private openBookmarkIfNeeded() {
        chrome.runtime.sendMessage({ type: 'getOpenBookmarks' }, (response) => {
            if (!response) {
                Logger.error('Error while getting the bookmarks. (response is null)')
                this.ctx.Toast(
                    'error',
                    'Hiba történt',
                    'Hiba a könyvjelzők lekérdezése közben.',
                )
                return
            }

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
                    Logger.log('No bookmark data found for the current URL.')
                    continue
                }

                const bookmark = Bookmarks.getBookmark(response[i].epID)
                if (!bookmark) {
                    Logger.error('Error while getting the bookmark. (bookmark is null)')
                    return
                }
                if (Number(bookmark.epID) !== this.ctx.epID) {
                    Logger.error('Error while getting the bookmark. (epID mismatch)')
                    return
                }

                this.ctx.seekTo(Number(bookmark.epTime))
                chrome.runtime.sendMessage(
                    { type: 'removeOpenBookmark', id: response[i].epID },
                    (removeResponse) => {
                        if (removeResponse) {
                            Logger.log('Bookmark opened.')
                            this.ctx.Toast('info', 'Könyvjelző megnyitva')
                        } else {
                            Logger.error('Error while opening the bookmark.')
                            this.ctx.Toast(
                                'error',
                                'Hiba történt',
                                'Hiba a könyvjelző megnyitása közben.',
                            )
                        }
                    },
                )
            }
        })
    }

    /**
     * Create the bookmark button and wire up click behaviour
     */
    private addBookmarkButton() {
        if (document.querySelector('.plyr__controls__item[data-plyr="bookmark"]')) {
            Logger.log('Bookmark button already exists.')
            return
        }

        const bookmarkButton = document.createElement('button')
        bookmarkButton.className = 'plyr__controls__item plyr__control'
        bookmarkButton.setAttribute('data-plyr', 'bookmark')
        bookmarkButton.setAttribute('role', 'button')
        bookmarkButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z"/></svg>
        <span class="plyr__tooltip">Könyvjelző hozzáadása</span>`

        bookmarkButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            if (
                this.ctx.plyr.currentTime <= 5 ||
                this.ctx.plyr.currentTime >= this.ctx.plyr.duration - 5
            ) {
                this.ctx.Toast(
                    'warning',
                    'Könyvjelző hozzáadása sikertelen',
                    'A könyvjelző hozzáadásához a videónak legalább 5 másodpercesnek kell lennie.',
                )
                return
            }

            const currentTime = this.ctx.plyr.currentTime
            Bookmarks.addBookmark(
                Date.now(),
                this.ctx.animeTitle,
                this.ctx.epNum,
                `${this.ctx.animeTitle} - ${this.ctx.epNum}.rész, ${((Number(currentTime) % 3600) / 60)
                    .toFixed(0)
                    .padStart(2, '0')}:${(Number(currentTime) % 60)
                    .toFixed(0)
                    .padStart(2, '0')}`,
                currentTime,
                this.ctx.epID,
                this.ctx.animeID,
            )
            this.ctx.Toast('success', 'Könyvjelző hozzáadva', 'A könyvjelző sikeresen hozzáadva.')
        })

        const controls = document.querySelector('.plyr__menu') as HTMLElement
        if (controls) {
            controls.after(bookmarkButton)
        }
    }
}

