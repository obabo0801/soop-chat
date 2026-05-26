import {
    SVC,
    SVC_CODE,
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

export function svcBody(value) {
    return String(value.length).padStart(6, '0')
}

export function makePacket(service, fields = []) {
    const body = toBody(fields);
    
    const header = (
        DELIMITER.ESC
        + DELIMITER.TAB
        + svcCode(service)
        + svcBody(body)
        + '00'
    );

    console.log(header, fields, '@');

    return Buffer.concat([
        Buffer.from(header, 'binary'),
        body
    ]);
}

export function addInfo(data = {}) {
    return (Object.entries(data)
        .filter(([, value]) => (
            value !== undefined
            && value !== null
            && value !== ''
        ))
        .map(([key, value]) => {
            `${key}${DELIMITER.DC1}`
            + `${value}${DELIMITER.DC2}`
        })
        .join('')
    );
}

export function joinLog(password = '') {
    if (!password) return '';
    return addInfo({ pwd: password });
}

export function login(ticket = '', nick = '', flag = 16) {
    const playload = [
        ticket,
        nick,
        flag
    ];

    return makePacket(SVC.LOGIN, playload);
}

export function joinChannel(chatno = '', ftk = '', flag = 16, password = '') {
    const playload = [
        chatno,
        ftk,
        flag,
        password,
        joinLog(password)
    ];

    return makePacket(SVC.JOIN_CHANNEL, playload);
}

export function info(synAck = '') {
    return makePacket(SVC.INFO, [synAck]);
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
        .filter(Boolean);

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