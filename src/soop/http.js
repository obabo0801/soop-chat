import * as config from '#soop/config';

export async function getStation(
        userId, options = {}
    ) {
    const url = (config.DOMAIN.chapi
        + `/api/${userId}/station`
    );

    const headers = {
        'User-Agent': config.USER_AGENT
    };

    const data =  await rejson(url, {
        ...options,
        method: 'GET',
        headers
    });

    return data;
}

export async function getBroad(
        userId, password = '', options = {}
    ) {
    const url = (config.DOMAIN.live
        + `/afreeca/player_live_api.php?bjid=${userId}`
    );

    const body = new URLSearchParams({
        ...config.BODY,
        bid: userId,
        bno: '0',
        pwd: password
    });

    const data =  await rejson(url, {
        ...options,
        method: 'POST',
        body
    });

    return data?.CHANNEL;
}

export async function getAuthTicket(
        options = {}
    ) {
    const url = (config.DOMAIN.member
        + `/app/session_allow.php`
    );

    const data =  await request(url, {
        ...options,
        method: 'GET'
    });

    return data;
}

export async function getChatRule(
        userId, options = {}
    ) {
    const url = (config.DOMAIN.live
        + `/api/broad_chat_rule.php`
    );

    const body = new URLSearchParams({
        bj_id: userId,
        szAction: 'get'
    });

    const data =  await request(url, {
        method: 'POST',
        body
    });

    return data?.DATA;
}

export async function getMyPlus(
        options = {}
    ) {
    const url = (config.DOMAIN.live
        + `/api/myplus/preferbjOnLnbController'
        + '.php?isForce=n&szType=all`
    );

    const body = new URLSearchParams({
        isForce: 'n',
        szType: 'all'
    });

    const data =  await request(url, {
        ...options,
        method: 'GET',
        body
    });

    return data?.DATA;
}

export async function getSection(
        userId, chip = '', options = {}
    ) {
    const url = (config.DOMAIN.channel
        + `/v1.1/channel/${userId}/${chip}`
    );

    const data =  await request(url, {
        ...options,
        method: 'GET',
    });

    return data;
}

export async function getLogin(
        userId, password = '', options = {}
    ) {
    const url = (config.DOMAIN.login
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
        'User-Agent': config.USER_AGENT,
        'Origin': config.DOMAIN.login,
        'Referer': (
            config.DOMAIN.login
            + '/afreeca/login.php'
        )
    };

    const res =  await request(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    if (!res) return false;

    const text = await res.text();
    const data = JSON.parse(text);

    const cookie = cookieJson(
        readCookie(res)
    );

    return { data, cookie };
}

export async function getSecondLogin(
        userId, secondPassword = '', options = {}
    ) {
    const url = config.DOMAIN.login + `/app/LoginAction.php`;

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
        'User-Agent': config.USER_AGENT,
        'Origin': config.DOMAIN.login,
        'Referer': (
            config.DOMAIN.login
            + '/afreeca/login.php'
        )
    };

    const res = await request(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    if (!res) return false;

    const text = await res.text();
    const data = JSON.parse(text);

    const cookie = cookieJson(
        readCookie(res)
    );

    return { data, cookie };
}

export async function getLogout(options = {}) {
    const url = config.DOMAIN.login + `/app/LogOut.php?szType=json`;

    const res = await request(url, {
        ...options,
        method: 'GET'
    });

    return !!res;
}

export function readCookie(res) {
    const cookies = res.headers.getSetCookie?.();

    if (Array.isArray(cookies) && cookies.length > 0) {
        return cookies;
    }

    const cookie = res.headers.get('set-cookie');
    
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

            const key = v.slice(0, index).trim();
            const value = v.slice(index + 1).trim();

            result[key] = value;
        });

    return result;
}

export async function rejson(
        url, options = {}
    ) {
    const res = await request(url, options);

    if (!res) return false;

    const text = await res.text();

    if (text) {
        return JSON.parse(text);
    }
}

export async function request(
        url, options = {}
    ) {
    const {
        method = 'GET',
        headers = {},
        body,
        cookie = ''
    } = options;

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': config.CONTENT_TYPE,
            ...(cookie ? {
                Cookie: cookieString(cookie)
            } : {}),
            ...headers,
        },
        body
    });

    if (!res.ok) {
        return false;
    }

    return res;
}