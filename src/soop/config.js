export const DOMAIN = {
    live: 'https://live.sooplive.com',
};

export const AGENT = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 
        'AppleWebKit/537.36 Chrome/120 Safari/537.36'
    )
}

export const BODY = {
    type: 'live',
    player_type: 'html5',
    stream_type: 'common',
    quality: 'HD',
    mode: 'landing',
    from_api: '0',
    is_revive: false
};

export const DELIMITER = {
    ESC: '\x1b\t',
    FF: '\x0c',
    DC1: '\x11',
    DC2: '\x12',
    ACK: '\x06'
};