import Logger from './Logger'
import { Bookmark } from './global'

class Bookmarks {
    bookmarks: Bookmark[]
    /**
     * @since v0.1.8
     * @constructor Bookmarks
     * @property {Array<Bookmark>} bookmarks
     */
    constructor() {
        this.bookmarks = []
    }

    private formatBookmark(bookmarks: any): Bookmark[] {
        return bookmarks.map((bookmark: any) => {
            if (
                bookmark.id !== undefined &&
                bookmark.title !== undefined &&
                bookmark.episode !== undefined &&
                bookmark.description !== undefined &&
                bookmark.time !== undefined &&
                bookmark.episodeId !== undefined &&
                bookmark.datasheetId !== undefined
            ) {
                return {
                    bookmarkID: bookmark.id,
                    animeTitle: bookmark.title,
                    epNum: bookmark.episode,
                    bookmarkDesc: bookmark.description,
                    epTime: bookmark.time,
                    epID: bookmark.episodeId,
                    animeID: bookmark.datasheetId
                }
            }
            return {
                bookmarkID: bookmark.bookmarkID || 0,
                animeTitle: bookmark.animeTitle || '',
                epNum: bookmark.epNum || 0,
                bookmarkDesc: bookmark.bookmarkDesc || '',
                epTime: bookmark.epTime || 0,
                epID: bookmark.epID || 0,
                animeID: bookmark.animeID || 0
            }
        })
    }

    /**
     * @returns {Promise<Array<Bookmark>>} The current bookmarks from the storage
     * @since v0.1.8
     */
    loadBookmarks(): Promise<Array<Bookmark>> {
        return new Promise((resolve) => {
            chrome.storage.local.get('bookmarks', (bookmarks) => {
                if (bookmarks.bookmarks && bookmarks.bookmarks.length > 0) {
                    this.bookmarks = this.formatBookmark(bookmarks.bookmarks)
                    Logger.success('Bookmarks loaded', true)
                    resolve(this.bookmarks)
                } else {
                    resolve([])
                }
            })
        })
    }

    /**
     * Save the bookmarks
     * @since v0.1.8
     */
    saveBookmarks() {
        chrome.storage.local
            .set({ bookmarks: this.formatBookmark(this.bookmarks) })
            .then(() => {
                Logger.log('Bookmarks saved', true)
            })
            .catch(() => {
                Logger.error('Error: Bookmarks not saved', true)
            })
    }

    /**
     * Add a new bookmark
     * @param {Number} bookmarkID - The ID of the bookmark
     * @param {String} animeTitle - The title of the anime
     * @param {Number} epNum - The episode number
     * @param {String} bookmarkDesc - The description of the bookmark
     * @param {Number} epTime - The time of the episode
     * @param {Number} epID - The ID of the episode
     * @param {Number} animeID - The ID of the anime
     * @returns {Bookmark} The created bookmark
     * @method addBookmark - Add a new bookmark
     * @since v0.1.8
     */
    addBookmark(
        bookmarkID: number,
        animeTitle: string,
        epNum: number,
        bookmarkDesc: string,
        epTime: number,
        epID: number,
        animeID: number
    ): Bookmark | null {
        this.loadBookmarks().then(() => {
            const bookmark: Bookmark = {
                bookmarkID,
                animeTitle,
                epNum,
                bookmarkDesc,
                epTime,
                epID,
                animeID
            }
            this.bookmarks.push(bookmark)
            this.saveBookmarks()
            return bookmark
        })
        return null
    }

    /**
     * Delete a bookmark
     * @param {Number} id - The ID of the bookmark
     * @returns {Promise<boolean>} Whether the bookmark was deleted
     * @since v0.1.8
     */
    deleteBookmark(id: number): Promise<boolean> {
        return new Promise((resolve) => {
            this.loadBookmarks().then(() => {
                this.bookmarks = this.bookmarks.filter((b) => Number(b.bookmarkID) !== Number(id))
                this.saveBookmarks()
                resolve(this.getBookmark(Number(id)) === undefined)
            })
        })
    }

    /**
     * Open a bookmark
     * @param {Number} id - The ID of the bookmark
     * @since v0.1.8
     */
    openBookmark(id: number) {
        Logger.log('Opening bookmark with id: ' + id, true)
        const bookmark = this.getBookmark(Number(id))
        if (bookmark) {
            chrome.runtime.sendMessage(
                {
                    type: 'openBookmark',
                    epID: bookmark.bookmarkID,
                    epURL: `https://magyaranime.eu/resz/${bookmark.epID}/`,
                },
                (response) => {
                    if (response) {
                        Logger.log('Bookmark opened', true)
                    } else {
                        Logger.error('Error: Bookmark not opened', true)
                    }
                },
            )
        } else {
            Logger.error('Bookmark not found', true)
        }
    }

    /**
     * Get a bookmark by ID
     * @param {Number} id - The ID of the bookmark
     * @returns {Bookmark | undefined} The bookmark
     */
    getBookmark(id: number): Bookmark | undefined {
        return this.bookmarks.find((b) => Number(b.bookmarkID) === Number(id))
    }
}

export default new Bookmarks()
