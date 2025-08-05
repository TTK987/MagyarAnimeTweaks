class logger {
    private styles: { logo: string; log: string; warn: string; error: string; success: string }
    enabled: boolean

    constructor() {
        this.enabled = false
        this.styles = {
            logo: `color: #2196F3; background-color: #000000; padding: 2px 5px; border-radius: 5px; font-weight: bold;`,
            log: `color: #000000; background-color: #2196F3; padding: 2px 5px; border-radius: 5px;`,
            warn: `color: #000000; background-color: #FFC107; padding: 2px 5px; border-radius: 5px;`,
            error: `color: #000000; background-color: #F44336; padding: 2px 5px; border-radius: 5px;`,
            success: `color: #000000; background-color: #4CAF50; padding: 2px 5px; border-radius: 5px;`,
        }
    }

    /**
     * Logs a message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.log('This is a log message')
     */
    log(message: string, bypass: boolean = false) {
        if (this.enabled || bypass) {
            console.log(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.log)
        }
    }

    /**
     * Logs a warning message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.warn('This is a warning message')
     */
    warn(message: string, bypass: boolean = false) {
        if (this.enabled || bypass) {
            console.warn(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.warn)
        }
    }

    /**
     * Logs an error message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.error('This is an error message')
     */
    error(message: string, bypass: boolean = true) {
        if (this.enabled || bypass) {
            console.error(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.error)
        }
    }

    /**
     * Logs a success message to the console in style
     * @example logger.success('This is a success message')
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.8
     */
    success(message: string, bypass: boolean = false) {
        if (this.enabled || bypass) {
            console.log(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.success)
        }
    }

    /**
     * Enable the logger
     * @since v0.1.7
     */
    enable() {
        this.enabled = true
    }

    /**
     * Disable the logger
     * @since v0.1.7
     */
    disable() {
        this.enabled = false
    }
}

export default new logger()
