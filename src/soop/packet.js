import {
    SVC,
    DELIMITER
} from '#soop/config';

function toBuffer(value = '') {
    if (Buffer.isBuffer(value)) {
        return value;
    }

    if (value instanceof Uint8Array) {
        return Buffer.from(value);
    }

    return Buffer.from(String(value), 'utf8');
}

function toBody(fields = []) {
    const chunks = [];

    for (const field of fields) {
        chunks.push(toBuffer(DELIMITER.FF));
        chunks.push(toBuffer(field));
    }

    chunks.push(toBuffer(DELIMITER.FF));

    return Buffer.concat(chunks);
}

export function svcCode(value) {
    return String(value).padStart(4, '0');
}

export function bodySize(body) {
    return String(body.length).padStart(6, '0')
}

export function makePacket(service, fields = []) {
    const body = toBody(fields);

    const header = (
        DELIMITER.ESC
        + DELIMITER.TAB
        + svcCode(service)
        + bodySize(body)
        + '00'
    );

//    console.log('[SEND]', {
//        header: visible(header),
//        body: visible(body)
//    });

    return Buffer.concat([
        Buffer.from(header, 'binary'),
        body
    ]);
}

export function makePayload(data = {}) {
    const dc1 = DELIMITER.DC1;
    const dc2 = DELIMITER.DC2;

    return (Object.entries(data)
        .filter(([, value]) => (
            value !== undefined
            && value !== null
            && value !== ''
        ))
        .map(([key, value]) => (
            `${key}${dc1}`
            + `${value}${dc2}`
        ))
        .join('')
    );
}

export function makePlayLog(
        channel = {}, uuid = ''
    ) {
    const ack = DELIMITER.ACK;

    return [
        ack,
        `&${ack}set_bps${ack}=`
            + `${ack}${channel.BPS}`,
        `&${ack}view_bps${ack}=`
            + `${ack}${channel.BPS}`,
        `&${ack}quality${ack}=`
            + `${ack}ori`,
        `&${ack}uuid${ack}=`
            + `${ack}${uuid}`,
        `&${ack}geo_cc${ack}=`
            + `${ack}${channel.geo_cc}`,
        `&${ack}geo_rc${ack}=`
            + `${ack}${channel.geo_rc}`,
        `&${ack}acpt_lang${ack}=`
            + `${ack}${channel.STRM_LANG_TYPE}`,
        `&${ack}svc_lang${ack}=`
            + `${ack}${channel.STRM_LANG_TYPE}`,
        `&${ack}is_iframeapi${ack}=`
            + `${ack}false`,
        channel.join_cc
            ? `&${ack}join_cc${ack}=`
                + `${ack}${channel.join_cc}`
            : '',
        `&${ack}subscribe${ack}=`
            + `${ack}${channel.SUB_PAY_CNT}`,
        `&${ack}lowlatency${ack}=`
            + `${ack}1`,
        `&${ack}mode${ack}=`
            + `${ack}landing`
    ].join('');
}

export function chat(message = '') {
    const fields = [
        message,
        0
    ];

    return makePacket(SVC.CHAT, fields);
}

export function managerChat(message = '') {
    const fields = [
        message
    ];

    return makePacket(SVC.MANAGER_CHAT, fields);
}

export function directChat(message = '', targetId = '') {
    const fields = [
        message,
        targetId
    ];

    return makePacket(SVC.DIRECT_CHAT, fields);
}

export function slowMode(chatno = 0, count = 0) {
    const fields = [
        chatno,
        count
    ];

    return makePacket(SVC.SLOW_MODE, fields);
}

export function kickUserList(bno = 0) {
    const fields = [
        bno
    ];

    return makePacket(SVC.KICK_USER_LIST, fields);
}

export function login(ticket = '') {
    const fields = [
        ticket,
        '',
        16
    ];

    return makePacket(SVC.LOGIN, fields);
}

export function joinChannel(
        channel, password = '', uuid = ''
    ) {
    const mode = makePayload({
        log: makePlayLog(channel, uuid),
        pwd: password,
        auth_info: 'NULL',
        pver: 0,
        access_system: 'html5',
        nation_lang: channel.STRM_LANG_TYPE
    });

    const fields = [
        channel.CHATNO,
        channel.FTK,
        0,
        '',
        mode
    ];

    return makePacket(SVC.JOIN_CHANNEL, fields);
}

export function setUserFlag(synAck = '') {
    const fields = [
        synAck,
        0
    ];

    return makePacket(SVC.SET_USER_FLAG, fields);
}

export function setNotice(catNo = 0, message = '') {
    const fields = [
        catNo,
        1,
        1,
        message
    ];

    return makePacket(SVC.BJ_NOTICE, fields);
}

export function translation(message = '') {
    const fields = [
        1,
        1,
        message,
        3
    ];

    return makePacket(SVC.TRANSLATION, fields);
}

export function keepAlive() {
    return makePacket(SVC.KEEPALIVE);
}

export function userList() {
    return makePacket(SVC.CHUSER);
}

export function parse(data) {
    const raw = Buffer.isBuffer(data)
        ? data.toString('utf8')
        : String(data);

    const head = (
        DELIMITER.ESC
        + DELIMITER.TAB
    );

    const offset = raw.startsWith(head)
        ? head.length
        : 0;

    const service = Number(
        raw.slice(offset, offset + 4)
    );

    const length = Number(
        raw.slice(offset + 4, offset + 10)
    );

    const flag = raw.slice(
        offset + 10,
        offset + 12
    );

    const body = raw.slice(offset + 12);

    const fields = body
        .split(DELIMITER.FF)
        .slice(1, -1);

    return { service, length, flag, fields, raw };
}

export function visible(data) {
    return (String(data)
        .replaceAll(DELIMITER.ESC, '<ESC>')
        .replaceAll(DELIMITER.TAB, '<TAB>')
        .replaceAll(DELIMITER.FF, '<FF>')
        .replaceAll(DELIMITER.DC1, '<DC1>')
        .replaceAll(DELIMITER.DC2, '<DC2>')
        .replaceAll(DELIMITER.ACK, '<ACK>')
    );
}