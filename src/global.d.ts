/// <reference types="vite/client" />

import { SkipType } from './api/AniSkip'

type SettingsV0110 = {
    forwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBind
    }
    backwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBind
    }
    nextEpisode: {
        enabled: boolean
        keyBind: keyBind
    }
    previousEpisode: {
        enabled: boolean
        keyBind: keyBind
    }
    autoNextEpisode: { enabled: boolean; time: number }
    autoplay: { enabled: boolean }
    bookmarks: { enabled: boolean }
    history: {
        enabled: boolean
        mode: 'auto' | 'ask'
        clearAfter: '1w' | '1m' | '3m' | '1y' | 'never'
    }
    skip: { time: number }
    advanced: {
        consoleLog: boolean
        downloadName: string
    }
    nav: {
        searchBox: {
            enabled: boolean
            open: keyBind
            close: keyBind
            openSearch: keyBind
        }
        episode: {
            enabled: boolean
            open: keyBind
        }
        mainPage: {
            enabled: boolean
            open: keyBind
        }
    }
    plyr: {
        design: boolean
        shortcuts: {
            playPause: keyBind[]
            muteUnmute: keyBind[]
            volumeUp: keyBind[]
            volumeDown: keyBind[]
            fullscreen: keyBind[]
        }
        plugins: {
            aniSkip: {
                enabled: boolean
                skips: SkipType[]
                keyBind: keyBind
                autoSkip: SkipType[]
            }
        }
    }
    eap: boolean
    version: string
}

type SettingsV019 = {
    forwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBindLegacy
    }
    backwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBindLegacy
    }
    nextEpisode: {
        enabled: boolean
        keyBind: keyBindLegacy
    }
    previousEpisode: {
        enabled: boolean
        keyBind: keyBindLegacy
    }
    autoNextEpisode: { enabled: boolean; time: number }
    autoplay: { enabled: boolean }
    bookmarks: { enabled: boolean }
    resume: {
        enabled: boolean
        mode: 'auto' | 'ask'
        clearAfter: '1w' | '1m' | '3m' | '1y' | 'never'
    }
    skip: { time: number } // Value to skip in seconds using arrow keys only
    advanced: {
        consoleLog: boolean
        player: 'plyr' | 'default'
        downloadName: string
    }
    plyr: {
        design: {
            enabled: boolean
            // The css is stored in the local storage, but not in the settings
        }
    }
    eap: boolean
    version: string
}

type SettingsV018 = {
    forwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBindLegacy
    }
    backwardSkip: {
        enabled: boolean
        time: number
        keyBind: keyBindLegacy
    }
    nextEpisode: {
        enabled: boolean
        keyBind: keyBindLegacy
    }
    previousEpisode: {
        enabled: boolean
        keyBind: keyBindLegacy
    }
    autoNextEpisode: {
        enabled: boolean
        time: number
    }
    autoplay: {
        enabled: boolean
    }
    bookmarks: {
        enabled: boolean
    }
    resume: {
        enabled: boolean
        mode: 'ask' | 'auto'
    }
    advanced: {
        enabled: boolean
        settings: {
            ConsoleLog: {
                enabled: boolean
            }
            DefaultPlayer: {
                player: string
            }
        }
        plyr: {
            design: {
                enabled: boolean
                settings: {
                    svgColor: string
                    hoverBGColor: string
                    mainColor: string
                    hoverColor: string
                }
            }
        }
        downloadName: string
    }
    private: {
        eap: boolean
    }
    version: string
}

type SettingsV017 = {
    forwardSkip: {
        enabled: boolean;
        time: number;
        ctrlKey: boolean;
        altKey: boolean;
        shiftKey: boolean;
        key: string;
    };
    backwardSkip: {
        enabled: boolean;
        time: number;
        ctrlKey: boolean;
        altKey: boolean;
        shiftKey: boolean;
        key: string;
    };
    nextEpisode: {
        enabled: boolean;
        ctrlKey: boolean;
        altKey: boolean;
        shiftKey: boolean;
        key: string;
    };
    previousEpisode: {
        enabled: boolean;
        ctrlKey: boolean;
        altKey: boolean;
        shiftKey: boolean;
        key: string;
    };
    autoNextEpisode: {
        enabled: boolean;
        time: number;
    };
    autoplay: {
        enabled: boolean;
    };
    version: string;
    eap: boolean;
    advanced: {
        enabled: boolean;
        settings: {
            ConsoleLog: {
                enabled: boolean;
            };
            DefaultPlayer: {
                player: string;
            };
        };
        plyr: {
            design: {
                enabled: boolean;
                settings: {
                    svgColor: string;
                    hoverBGColor: string;
                    mainColor: string;
                    hoverColor: string;
                };
            };
        };
        downloadName: string;
    };
}

type keyBindLegacy = {
    ctrlKey: boolean
    altKey: boolean
    shiftKey: boolean
    key: string
}

type keyBind = {
    ctrlKey: boolean
    altKey: boolean
    shiftKey: boolean
    metaKey: boolean
    key: string
}

interface FansubData {
    name: string
    link: string
}


interface EpisodeData {
    episodeNumber: number
    title: string
}

interface EpisodeListItem {
    title: string
    link: string
    epNumber: number
    status: string
    thumbnail: string
}

interface SourceData {
    site: string
    link: string
}

interface EpisodeVideoData {
    url: string
    quality: number
    // This will be used later to determine whether the video's url is expired or not (and automatically refresh it)
    expires?: number
}

interface Bookmark {
    bookmarkID: number
    animeTitle: string
    epNum: number
    bookmarkDesc: string
    epTime: number // Time in seconds
    epID: number
    animeID: number
}

type ServerResponse = {
    // Error message if there's an issue
    error: string
    // An id for the player... I guess? Never used...
    playerid: number
    servers: {
        // Server identifier
        server: serverType
        // Quality (e.g., "240", "360", etc.)
        hq: string
        // Server title
        title: string
        // Indicates if the server is active (1 for active)
        active: number
    }[]
    // HTML output for the video player
    output: string
    // Indicates if HLS is supported
    hls: boolean
    // Base64-encoded HLS URL
    hls_url: string
    // Indicates if the page needs to be refreshed (Expired csrf token)
    needRefleshPage: boolean
    // Daily limit message
    daily_limit: string
    // Download link for the video
    download_link: string
    // ID of the previous video (-1 if none)
    button_vid_prev: number
    // ID of the next video (-1 if none)
    button_vid_next: number
    // ID of the datasheet page
    button_aid: number
    // Type of the fansub group (normal or AI)
    csapat_type: 'normal' | 'ai'
    // You would expect this to be the name of the fansub group, however... it is a html string...
    // like this: A videóban szereplő felirat a `<a href="..." target=\"_blank\" rel=\"noopener noreferrer\">...</a> munkája. A felirat emberi fordítást tartalmaz.`
    csapat_name: string
}

type serverType = 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8'


// Timestamp related types
type UnixTimestamp = number & { readonly __brand: 'UnixTimestamp' }

// Current settings type
type Settings = SettingsV0110


export {
    Settings,
    SettingsV0110,
    SettingsV019,
    SettingsV018,
    SettingsV017,
    keyBind,
    FansubData,
    EpisodeData,
    EpisodeListItem,
    SourceData,
    EpisodeVideoData,
    Bookmark,
    ServerResponse,
    serverType,
    UnixTimestamp,
    MillisecondTimestamp,
}
