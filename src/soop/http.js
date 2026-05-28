import { DOMAIN } from '#soop/config';
import * as request from '#utils/request';

export async function getEmoticons(options = {}) {
    const url = new URL(
        '/api/emoticons.php',
        DOMAIN.st
    );

    const json = await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json?.data;
}

export async function getRecentEmoticons(options = {}) {
    const url = new URL(
        '/api/recent_used_emoticon.php',
        DOMAIN.live
    );

    const json = await request.json(url, {
        ...options,
        method: 'GET'
    });

    return json?.DATA;
}

export async function getSignatureEmoticons(userId, options = {}) {
    const url = new URL(
        '/api/signature_emoticon_api.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        work: 'list',
        v: 'tier',
        szBjId: userId
    });

    const json = await request.json(url, {
        ...options,
        method: 'POST',
        body
    });

    return json?.data;
}

export async function postOgqList(streamerId, options = {}) {
    const url = new URL(
        '/api/ogq.php',
        DOMAIN.live
    );

    const body = new URLSearchParams({
        ogq_type: 'STICKER',
        bj_id: streamerId,
        ogq_pay_type: 'A',
        sort: 'PURCHASE',
        work: 'ogq_list'
    });

    const json = await request.json(url, {
        ...options,
        method: 'POST',
        body
    });

    return json;
}

export async function postOgqChat({
        chatIp,
        chatPort,
        chatNo,
        chatId,
        message = '',
        streamerId,
        ogqId,
        ogqNumbering = 0,
        ogqGroupId = 0,
        gemUse = 'N',
        apiKey = '',
        serviceLocation = 'live',
        options = {},
    }) {
    const url = new URL(
        `/api/ogq.php`,
        DOMAIN.live
    );

    const body = new URLSearchParams({
        chat_ip: chatIp,
        chat_port: String(chatPort),
        chat_no: String(chatNo),
        chat_id: chatId,
        chat_message: message,
        bj_id: streamerId,
        ogq_id: ogqId,
        ogq_numbering: String(ogqNumbering),
        ogq_group_id: String(ogqGroupId),
        gem_use: gemUse,
        api_key: apiKey,
        service_location: serviceLocation,
        work: 'chat_send',
    });

    const json = await request.json(url, {
        ...options,
        method: 'POST',
        body
    });

    return json;
}

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
        `/v1.1/channel/${encodeURIComponent(userId)}`
        + `/home/section/${chip}`,
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

    const raw = await request.raw(url, {
        ...options,
        method: 'GET'
    });

    return true;
}

export function normalize(domain) {
    domain = String(domain || '').trim();

    domain = domain.replaceAll('\\', '/');

    if (domain.startsWith('//')) {
        return `https:${domain}`;
    }

    if (!/^https?:\/\//i.test(domain)) {
        return `https://${domain}`;
    }

    return domain;
}