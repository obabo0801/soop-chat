import {
    DOMAIN,
    CONTENT_TYPE,
    ACCEPT_LANGUAGE,
    USER_AGENT
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
        'Accept-Language': ACCEPT_LANGUAGE,
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
    const url = new URL(
        `/api/${userId}/station`,
        DOMAIN.chapi
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
    const url = new URL(
        `/afreeca/player_live_api.php?bjid=${userId}`,
        DOMAIN.live
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
    const url = new URL(
        `/api/get_private_info.php`,
        DOMAIN.event
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
    const url = new URL(
        `/app/session_allow.php`,
        DOMAIN.member
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
    const url = new URL(
        `/api/broad_chat_rule.php`,
        DOMAIN.live
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
    const url = new URL(
        '/api/myplus/preferbjOnLnbController.php?isForce=n&szType=all',
        DOMAIN.live
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
    const url = new URL(
        `/v1.1/channel/${userId}/${chip}`,
        DOMAIN.channel
    );

    const data =  await requestRaw(url, {
        ...options,
        method: 'GET'
    });

    return data;
}

export async function getVote(
        userId, surveyNo = 0, options = {}
    ) {
    const url = new URL(
        `/api/survey/Controllers/SurveyListController.php`,
        DOMAIN.live
    );

    const body = new URLSearchParams({
        szBjId: userId,
        nSurveyNo: surveyNo
    });

    url.searchParams.set('szBjId', userId);
    url.searchParams.set('nSurveyNo', surveyNo);

    const json =  await requestJson(url, {
        ...options,
        method: 'GET'
    });

    return json?.data;
}

export async function setVote(
        userId, surveyNo = 0, answerNo = 0, options = {}
    ) {
    const url = new URL(
        `/api/survey/Controllers/SurveyAnswerController.php`,
        DOMAIN.live
    );

    const body = new URLSearchParams({
        szBjId: userId,
        nSurveyNo: surveyNo,
        nAnswerNo: answerNo
    });

    const json =  await requestJson(url, {
        ...options,
        method: 'POST',
        body
    });

    return json;
}

export async function startVote(
        title = '', options = {}
    ) {
    const url = new URL(
        'https://st.sooplive.com/api/survey.php?work=StudioRegister&action=start'
    );

    const body = new URLSearchParams({
        nNo: 1,
        szViewType: '',
        title: title,
        article: '투표 1',
        random_yn: 'on'
    });

    const json =  await requestJson(url, {
        ...options,
        method: 'POST',
        body
    });

    return json;
}

export async function setChatNotice(
        broadNo, message = '', state = 1, options = {}
    ) {
    const url = new URL(
        `/api/chat_notice.php`,
        DOMAIN.live
    );

    const body = new URLSearchParams({
        broad_no: broadNo,
        msg: message,
        state: state,
        store: '1',
    });

    const json = await requestJson(url, {
        ...options,
        method: 'POST',
        body,
    });

    return json;
}

export async function updateIceMode({
        broadNo, chatUserId, areaType = 0, relayRange = 0, setType = 'ice_on', iceAuth = '100001', options = {},
    }) {
    const url = new URL(
        '/api/chat_config_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        type: 'updateIceInfo',
        work: 'Ice',
        user_id: chatUserId,
        broad_no: broadNo,
        ice_area_type: areaType,
        ice_auth: iceAuth,
        ice_relay_range: relayRange,
        ice_set_type: setType,
        access_system: 'html5',
        is_ext_dashboard: 'false',
    });

    return requestJson(url, {
        ...options,
        method: 'POST',
        body,
    });
}

export function makeIceAuthString({
    streamer = true,
    fanClub = false,
    supporter = false,
    topFan = false,
    subscriber = false,
    manager = false,
} = {}) {
    return [
        streamer ? '1' : '0',
        fanClub ? '1' : '0',
        supporter ? '1' : '0',
        topFan ? '1' : '0',
        subscriber ? '1' : '0',
        manager ? '1' : '0',
    ].join('');
}

export async function setIceOption({
        giftCount = 0, subscriptionDate = 0, options = {},
    }) {
    const url = new URL(
        '/api/chat_config_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        type: 'setIceSetting',
        work: 'Ice',
        gift_cnt: giftCount,
        subscription_date: subscriptionDate,
        access_system: 'html5',
        is_ext_dashboard: 'false',
    });

    return requestJson(url, {
        ...options,
        method: 'POST',
        body
    });
}

export async function login(
        userId, password = '', options = {}
    ) {
    const url = new URL(
        `/app/LoginAction.php`,
        DOMAIN.login
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
    const url = new URL(
        `/app/LoginAction.php`,
        DOMAIN.login
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
    const url = new URL(
        `/app/LogOut.php?szType=json`,
        DOMAIN.login
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