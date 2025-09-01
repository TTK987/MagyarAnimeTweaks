/// <reference types="vite/client" />

type SettingsV019 = {
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
    resume: {
        enabled: boolean;
        mode: "auto" | "ask"
        clearAfter: "1w" | "1m" | "3m" | "1y" | "never"
    }
    skip: { time: number } // Value to skip in seconds using arrow keys only
    advanced: {
        consoleLog: boolean
        player: "plyr" | "default"
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

type SettingsV018 =  {
    forwardSkip: {
        enabled: boolean;
        time: number;
        keyBind: {
            ctrlKey: boolean;
            altKey: boolean;
            shiftKey: boolean;
            key: string;
        };
    };
    backwardSkip: {
        enabled: boolean;
        time: number;
        keyBind: {
            ctrlKey: boolean;
            altKey: boolean;
            shiftKey: boolean;
            key: string;
        };
    };
    nextEpisode: {
        enabled: boolean;
        keyBind: {
            ctrlKey: boolean;
            altKey: boolean;
            shiftKey: boolean;
            key: string;
        };
    };
    previousEpisode: {
        enabled: boolean;
        keyBind: {
            ctrlKey: boolean;
            altKey: boolean;
            shiftKey: boolean;
            key: string;
        };
    };
    autoNextEpisode: {
        enabled: boolean;
        time: number;
    };
    autoplay: {
        enabled: boolean;
    };
    bookmarks: {
        enabled: boolean;
    };
    resume: {
        enabled: boolean;
        mode: 'ask' | 'auto';
    };
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
    private: {
        eap: boolean;
    };
    version: string;
};

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
};


type keyBind = {
    ctrlKey: boolean
    altKey: boolean
    shiftKey: boolean
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
    error: string // Error message if there's an issue
    videoid: number // ID of the video
    servers: {
        server: "s1" | "s2" | "s3" | "s4" // Server identifier
        hq: string // Quality (e.g., "240", "360", etc.)
        title: string // Server title
        active: number // Indicates if the server is active (1 for active)
    }[]
    output: string // HTML output for the video player
    hls: boolean // Indicates if HLS is supported
    hls_url: string // Base64-encoded HLS URL
    needRefleshPage: boolean // Indicates if the page needs to be refreshed (Expired csrf token)
    daily_limit: string // Daily limit message
    download_link: string // Download link for the video
    button_vid_prev: number // ID of the previous video (-1 if none)
    button_vid_next: number // ID of the next video (-1 if none)
    button_aid: number // ID of the datasheet page
}










export {
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
}
