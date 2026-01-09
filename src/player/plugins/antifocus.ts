import Logger from '../../Logger'
import BasePlayer from '../BasePlayer'

export class AntiFocusPlugin {
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

        const plyrContainer = document.querySelector('.plyr') as HTMLElement
        if (!plyrContainer) {
            Logger.warn('AntiFocus: cannot find .plyr container.')
            return
        }

        plyrContainer.addEventListener('focus', function () {
            plyrContainer.blur()
        })

        plyrContainer.querySelectorAll('*').forEach((element) => {
            element.addEventListener('focus', function () {
                ;(element as HTMLElement).blur()
            })
        })
    }
}

