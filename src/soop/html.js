import * as config from '#soop/config';

export async function getStation(userId) {
    const url = (config.DOMAIN.chapi
        + `/api/${userId}/station`
    );

    const headers = {
        'User-Agent': config.USER_AGENT,
    };

    const data =  await request(url, {
        method: 'GET',
        headers
    });

    return data;
}

export async function getLive(userId, options = {}) {
    const url = (config.DOMAIN.live
        + `/afreeca/player_live_api.php?bjid=${userId}`
    );

    const body = new URLSearchParams({
        ...config.BODY,
        bid: userId,
        bno: '0',
        pwd: options.password
    });

    const data =  await request(url, {
        ...options,
        method: 'POST',
        body
    });

    return data?.CHANNEL;
}

export async function getChatRule(userId) {
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

export async function request(url, options = {}) {
    const {
        method = 'GET',
        headers = {},
        body,
        cookie = '',
    } = options;

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': config.CONTENT_TYPE,
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
}