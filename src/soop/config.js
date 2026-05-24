export const DOMAIN = {
    live: 'https://live.sooplive.com',
};

export const USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; WOW64) '
    + 'AppleWebKit/537.36 (KHTML, like Gecko) '
    + 'Chrome/148.0.0.0 Safari/537.36'
);

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

export const SUBTITLE = {
    [-1]: { label: 'OFF', code: 'off' },
    0: { label: '한국어', code: 'ko_KR' },
    1: { label: 'English', code: 'en_US' },
    2: { label: 'ไทย', code: 'th_TH' },
    3: { label: '中文 繁體', code: 'zh_TW' },
    4: { label: '中文 简体', code: 'zh_CN' },
    5: { label: '日本語', code: 'ja_JP' },
    6: { label: 'Tiếng Việt', code: 'vi_VN' },
    7: { label: 'Indonesia', code: 'id_ID' },
}