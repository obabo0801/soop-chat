import {
    DOMAIN,
    CONTENT_TYPE,
    USER_AGENT,
    SVC,
    DELIMITER,
} from '#soop/config';

export async function requestRaw(
        url, options = {}
    ) {
    let {
        method = 'GET',
        headers = {},
        body,
        cookie = ''
    } = options;

    headers = {
        'Content-Type': CONTENT_TYPE,
        ...(cookie ? {
            Cookie: cookieString(cookie)
        } : {}),
        'User-Agent': USER_AGENT,
        ...headers,
    }

    const res = await fetch(url, {
        method,
        headers,
        body
    });

    if (!res.ok) return false;

    return res;
}

export async function requestJson(
        url, options = {}
    ) {
    const res = await requestRaw(url, options);

    if (!res) return false;

    const text = await res.text();

    if (text) {
        return JSON.parse(text);
    }
}

export async function getStation(
        userId, options = {}
    ) {
    const url = (DOMAIN.chapi
        + `/api/${userId}/station`
    );

    const json =  await requestJson(url, {
        ...options,
        method: 'GET'
    });

    return json;
}

export async function getLiveInfo(
        userId, options = {}
    ) {
    const url = (DOMAIN.live
        + `/afreeca/player_live_api.php?bjid=${userId}`
    );

    const body = new URLSearchParams({
        bid: userId,
        bno: 0,
        type: 'live',
        pwd: '',
        player_type: 'html5',
        stream_type: 'common',
        quality: 'HD',
        mode: 'landing',
        from_api: 0,
        is_revive: false,
    });

    const json =  await requestJson(url, {
        ...options,
        method: 'POST',
        body
    });

    return json?.CHANNEL;
}

export async function getPrivateInfo(
        options = {}
    ) {
    const url = new URL(DOMAIN.event
        + `/api/get_private_info.php`
    );

    url.searchParams.set('_', Date.now());

    const data =  await requestJson(url, {
        ...options,
        method: 'GET'
    });

    return data?.CHANNEL;
}

export async function getSessionAllow(
        options = {}
    ) {
    const url = (DOMAIN.member
        + `/app/session_allow.php`
    );

    const raw =  await requestRaw(url, {
        ...options,
        method: 'GET'
    });

    return raw;
}

export function getChatUrl(channel = {}) {
    const { CHDOMAIN, CHPT, BJID } = channel;

    if (!CHDOMAIN || !CHPT) return false;

    const port = `:${Number(CHPT) + 1}`;
    const domain = `${CHDOMAIN}${port}`;

    return (domain.startsWith('ws')
        ? `${domain}/Websocket/${BJID}`
        : `wss://${domain}/Websocket/${BJID}`
    );
}

export async function getChatRule(
        userId, options = {}
    ) {
    const url = (DOMAIN.live
        + `/api/broad_chat_rule.php`
    );

    const body = new URLSearchParams({
        bj_id: userId,
        szAction: 'get'
    });

    const json =  await requestJson(url, {
        ...options,
        method: 'POST',
        body
    });

    return json?.DATA;
}

export async function getMyPlus(
        options = {}
    ) {
    const url = (DOMAIN.live
        + '/api/myplus/preferbjOnLnbController'
        + '.php?isForce=n&szType=all'
    );

    const json = await requestJson(url, {
        ...options,
        method: 'GET'
    });

    return json?.DATA;
}

export async function getSection(
        userId, chip = '', options = {}
    ) {
    const url = (DOMAIN.channel
        + `/v1.1/channel/${userId}/${chip}`
    );

    const data =  await requestRaw(url, {
        ...options,
        method: 'GET',
    });

    return data;
}

export async function login(
        userId, password = '', options = {}
    ) {
    const url = (DOMAIN.login
        + `/app/LoginAction.php`
    );

    const body = new URLSearchParams({
        szWork: 'login',
        szType: 'json',
        szUid: userId,
        szPassword: password,
        isSaveId: false,
        szScriptVar: 'oLoginRet',
        szAction: '',
        isLoginRetain: 'N'
    });

    const headers = {
        'User-Agent': USER_AGENT,
        'Origin': DOMAIN.login,
        'Referer': (
            DOMAIN.login
            + '/afreeca/login.php'
        )
    };

    const raw =  await requestRaw(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    if (!raw) return false;

    const text = await raw.text();
    const data = JSON.parse(text);

    const cookie = cookieJson(
        readCookie(raw)
    );

    return { data, cookie };
}

export async function secondLogin(
        userId, secondPassword = '', options = {}
    ) {
    const url = (DOMAIN.login
        + `/app/LoginAction.php`
    );

    const body = new URLSearchParams({
        szWork: 'second_login',
        szType: 'json',
        szUid: userId,
        szPassword: secondPassword,
        isSaveId: false,
        szScriptVar: 'oLoginRet',
        isLoginRetain: 'N'
    });

    const headers = {
        'User-Agent': USER_AGENT,
        'Origin': DOMAIN.login,
        'Referer': (
            DOMAIN.login
            + '/afreeca/login.php'
        )
    };

    const raw = await requestRaw(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    if (!raw) return false;

    const text = await raw.text();
    const data = JSON.parse(text);

    const cookie = cookieJson(
        readCookie(raw)
    );

    return { data, cookie };
}

export async function logout(options = {}) {
    const url = (DOMAIN.login
        + `/app/LogOut.php?szType=json`
    );

    const raw = await requestRaw(url, {
        ...options,
        method: 'GET'
    });

    return !!raw;
}

export function readCookie(data) {
    const cookies = data.headers.getSetCookie?.();

    if (Array.isArray(cookies) && cookies.length > 0) {
        return cookies;
    }

    const cookie = data.headers.get('set-cookie');
    
    return cookie ? [cookie] : [];
}

export function cookieString(cookie = {}) {
    if (!cookie) return '';

    if (typeof cookie === 'string') {
        return cookie;
    }

    return Object.entries(cookie)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

export function cookieJson(cookie = '') {
    if (!cookie) return {};

    const result = {};
    const cookies = (
        Array.isArray(cookie)
        ? cookie : [cookie]
    );

    cookies
        .flatMap(v => String(v)
            .split(/,(?=\s*[^;,=\s]+=)/)
        )
        .map(v => v.split(';')[0].trim())
        .filter(Boolean)
        .forEach(v => {
            const index = v.indexOf('=');
            if (index <= 0) return;

            const key = v.slice(
                0, index
            ).trim();
            const value = v.slice(
                index + 1
            ).trim();

            result[key] = value;
        });

    return result;
}