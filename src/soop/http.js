import { DOMAIN } from '#soop/config';
import * as request from '#utils/request';

export async function getStation(
        userId, options = {}
    ) {
    const url = new URL(
        `/api/${encodeURIComponent(userId)}/station`,
        DOMAIN.chapi
    );

    const json =  await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json;
}

export async function postLiveInfo(
        userId, options = {}
    ) {
    const url = new URL(
        `/afreeca/player_live_api.php`,
        DOMAIN.live
    );

    url.searchParams.set('bjid', userId);

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

    const json =  await request.json(url, {
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

    const data = await request.json(url, {
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

    const raw =  await request.raw(url, {
        ...options,
        method: 'GET'
    });

    return !!raw;
}

export function makeChatUrl(channel = {}) {
    const { CHDOMAIN, CHPT, BJID } = channel;

    if (!CHDOMAIN || !CHPT) return false;

    const port = `:${Number(CHPT) + 1}`;
    const domain = `${CHDOMAIN}${port}`;

    return (domain.startsWith('ws')
        ? `${domain}/Websocket/${BJID}`
        : `wss://${domain}/Websocket/${BJID}`
    );
}

export async function postChatRule(
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

    const json =  await request.json(url, {
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
        '/api/myplus/preferbjOnLnbController.php',
        DOMAIN.live
    );

    url.searchParams.set('isForce', 'n');
    url.searchParams.set('szType', 'all');

    const json = await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json?.DATA;
}

export async function getSection(
        userId, chip = '', options = {}
    ) {
    const url = new URL(
        `/v1.1/channel/${encodeURIComponent(userId)}/${chip}`,
        DOMAIN.channel
    );

    const json = await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json;
}

export async function getVote(
        userId, surveyNo = 0, options = {}
    ) {
    const url = new URL(
        `/api/survey/Controllers/SurveyListController.php`,
        DOMAIN.live
    );

    url.searchParams.set('szBjId', userId);
    url.searchParams.set('nSurveyNo', surveyNo);

    const json =  await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json?.data;
}

export async function postVote(
        userId, surveyNo = 0, voteNo = 0, options = {}
    ) {
    const url = new URL(
        `/api/survey/Controllers/SurveyAnswerController.php`,
        DOMAIN.live
    );

    const body = new URLSearchParams({
        szBjId: userId,
        nSurveyNo: surveyNo,
        nAnswerNo: voteNo
    });

    const json =  await request.json(url, {
        ...options,
        method: 'POST',
        body
    });

    return json;
}

export async function postChatNotice(
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
        store: 1,
    });

    const json = await request.json(url, {
        ...options,
        method: 'POST',
        body,
    });

    return json;
}

export async function postIceMode({
        broadNo, userId, type = 'ice_on',
        auth = '100001', options = {},
    }) {
    const url = new URL(
        '/api/chat_config_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        type: 'updateIceInfo',
        work: 'Ice',
        user_id: userId,
        broad_no: broadNo,
        ice_area_type: 0,
        ice_auth: auth,
        ice_relay_range: 0,
        ice_set_type: type,
        access_system: 'html5',
        is_ext_dashboard: 'false',
    });

    return request.json(url, {
        ...options,
        method: 'POST',
        body,
    });
}

export async function postTopFan(
        userId, flag, options = {},
    ) {
    const url = new URL(
        '/api/topfan_setting_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        work: 'SET_JOIN_NOTICE',
        user_id: userId,
        join_notice_flag: flag,
    });

    return request.json(url, {
        ...options,
        method: 'POST',
        body,
    });
}

export async function postIceOption({
        count = 0, date = 0, options = {},
    }) {
    const url = new URL(
        '/api/chat_config_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        type: 'setIceSetting',
        work: 'Ice',
        gift_cnt: count,
        subscription_date: date,
        access_system: 'html5',
        is_ext_dashboard: 'false',
    });

    return request.json(url, {
        ...options,
        method: 'POST',
        body
    });
}

export async function login(
        userId, password = '', options = {}
    ) {
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

    return postLogin(body, options);
}

export async function secondLogin(
        userId, secondPassword = '', options = {}
    ) {
    const body = new URLSearchParams({
        szWork: 'second_login',
        szType: 'json',
        szUid: userId,
        szPassword: secondPassword,
        isSaveId: false,
        szScriptVar: 'oLoginRet',
        isLoginRetain: 'N'
    });

    return postLogin(body, options);
}

export async function postLogin(
        body, options = {}
    ) {
    const url = new URL(
        `/app/LoginAction.php`,
        DOMAIN.login
    );

    const referer = new URL(
        `/afreeca/login.php`,
        DOMAIN.login
    );

    const headers = {
        'Origin': DOMAIN.login,
        'Referer': referer.href,
    };

    const raw =  await request.raw(url, {
        ...options,
        method: 'POST',
        headers,
        body
    });

    if (!raw) return false;

    const text = await raw.text();
    const data = JSON.parse(text);

    const cookie = request.cookieJson(
        request.cookieRead(raw)
    );

    return { data, cookie };
}

export async function logout(options = {}) {
    const url = new URL(
        `/app/LogOut.php`,
        DOMAIN.login
    );

    url.searchParams.set('szType', 'json');

    const raw = await requestRaw(url, {
        ...options,
        method: 'GET'
    });

    return true;
}