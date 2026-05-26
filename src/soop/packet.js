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

    console.log({ header, body: body.toString('utf8') }, '@');

    return Buffer.concat([
        Buffer.from(header, 'binary'),
        body
    ]);
}

export function makePlayLog(channel = {}, options = {}) {
    const ack = DELIMITER.ACK;
    const bps = channel.BPS || 16000;

    console.log(options, '#');

    return [
        ack,
        `&${ack}set_bps${ack}=${ack}${channel.BPS}`,
        `&${ack}view_bps${ack}=${ack}${channel.BPS}`,
        `&${ack}quality${ack}=${ack}ori`,
        `&${ack}uuid${ack}=${ack}${options._au}`,
        `&${ack}geo_cc${ack}=${ack}${channel.geo_cc}`,
        `&${ack}geo_rc${ack}=${ack}${channel.geo_rc}`,
        `&${ack}acpt_lang${ack}=${ack}${channel.STRM_LANG_TYPE}`,
        `&${ack}svc_lang${ack}=${ack}${channel.STRM_LANG_TYPE}`,
        `&${ack}is_iframeapi${ack}=${ack}false`,
        channel.join_cc
            ? `&${ack}join_cc${ack}=${ack}${channel.join_cc}`
            : '',
        `&${ack}subscribe${ack}=${ack}${channel.SUB_PAY_CNT}`,
        `&${ack}lowlatency${ack}=${ack}1`,
        `&${ack}mode${ack}=${ack}landing`,
    ].join('');
}

export function makeInfoMap(data = {}) {
    return (Object.entries(data)
        .filter(([, value]) => (
            value !== undefined
            && value !== null
            && value !== ''
        ))
        .map(([key, value]) => (
            `${key}${DELIMITER.DC1}`
            + `${value}${DELIMITER.DC2}`
        ))
        .join('')
    );
}

export function login(ticket = '') {
    const fields = [
        ticket,
        '',
        16
    ];

    return makePacket(SVC.LOGIN, fields);
}

export function joinChannel2(channel, password = '', options = {}) {
    const playLog = makePlayLog(channel, options);

    const log = makeInfoMap({
        pwd: password,
        authInfo: 'NULL',
        pver: 0,
        access_system: 'html5',
        nation_lang: channel.STRM_LANG_TYPE
    });

    const fields = [
        channel.CHATNO,
        channel.FTK,
        0,
        password,
        log
    ];

    return makePacket(SVC.JOIN_CHANNEL, fields);
}

export function joinChannel(chatno = '', ftk = '', flag = 0, password = '') {
    const log = makeInfoMap({
        pwd: password,
        authInfo: 'NULL',
        pver: 0,
        access_system: 'html5',
        nation_lang: 'ko_KR'
    });

    const fields = [
        chatno,
        ftk,
        flag,
        password,
        log
    ];

    return makePacket(SVC.JOIN_CHANNEL, fields);
}

export function info(synAck = '') {
    const fields = [
        synAck
    ];

    return makePacket(SVC.INFO, fields);
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
    );
}