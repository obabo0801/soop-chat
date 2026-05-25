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

    const data =  await request(url, {
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

    const data =  await request(url, {
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
        + `/v1.1/channel/${userId}`
        + `/home/section/${chip}`
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
        ...config.BODY,
        szWork: 'login',
        szType: 'json',
        szUid: userId,
        szPassword: password,
        isSaveId: false,
        isSavePw: false,
        isSaveJoin: false,
        isLoginRetain: 'Y'
    });

    const headers = {
        'User-Agent': config.USER_AGENT
    };

    const data =  await request(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    return data;
}

export async function rejson(
        url, options = {}
    ) {
    const res = request(url, options);

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
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body
    });

    if (!res.ok) {
        return false;
    }

    return res;
}