import * as config from '#soop/config';

export function addInfo(data = {}) {
    return Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}${config.DELIMITER.DC1}${value}${config.DELIMITER.DC2}`)
        .join('');
}

export function joinLog(password = '') {
    return addInfo({ pwd: password });
}

function stringToUint(value = '') {
    try {
        value = unescape(encodeURIComponent(value));
    } catch {
        value = unescape(value);
    }

    return Uint8Array.from(
        String(value),
        ch => ch.charCodeAt(0)
    );
}

function toBuffer(value = '') {
    if (Buffer.isBuffer(value)) {
        return value;
    }

    if (value instanceof Uint8Array) {
        return Buffer.from(value);
    }

    return Buffer.from(String(value), 'utf8');
}

function makeBody(fields = []) {
    const chunks = [];

    for (const field of fields) {
        chunks.push(toBuffer(config.DELIMITER.FF));
        chunks.push(toBuffer(field));
    }

    chunks.push(toBuffer(config.DELIMITER.FF));

    return Buffer.concat(chunks);
}

export function makePacket(service, fields = []) {
    const body = makeBody(fields);

    const header = (
        config.DELIMITER.ESC
        + config.DELIMITER.TAB
        + String(service).padStart(4, '0')
        + String(body.length).padStart(6, '0')
        + '00'
    );

    return Buffer.concat([
        Buffer.from(header, 'binary'),
        body
    ]);
}

export function login(ticket = '', nick = '', flag = 16) {
    return makePacket(config.SVC.LOGIN, [
        ticket,
        nick,
        flag
    ]);
}

export function joinChannel(chatNo, fanTicket = '', type = 0, password = '', log = '') {
    return makePacket(config.SVC.JOIN_CHANNEL, [
        chatNo,
        fanTicket,
        type,
        password,
        log
    ]);
}

export function keepAlive() {
    return makePacket(config.SVC.KEEPALIVE, []);
}

export function parse(data) {
    const raw = Buffer.isBuffer(data)
        ? data.toString('utf8')
        : String(data);

    const head = config.DELIMITER.ESC + config.DELIMITER.TAB;
    const offset = raw.startsWith(head) ? head.length : 0;

    const service = Number(raw.slice(offset, offset + 4));
    const length = Number(raw.slice(offset + 4, offset + 10));
    const flag = raw.slice(offset + 10, offset + 12);
    const body = raw.slice(offset + 12);

    const fields = body
        .split(config.DELIMITER.FF)
        .filter(Boolean);

    return {
        service,
        length,
        flag,
        fields,
        raw
    };
}

export function visible(data) {
    return String(data)
        .replaceAll(config.DELIMITER.ESC, '<ESC>')
        .replaceAll(config.DELIMITER.TAB, '<TAB>')
        .replaceAll(config.DELIMITER.FF, '<FF>')
        .replaceAll(config.DELIMITER.DC1, '<DC1>')
        .replaceAll(config.DELIMITER.DC2, '<DC2>');
}

export function requestUserList() {
    return makePacket(config.SVC.CHUSER, []);
}

export function info(synAck = '') {
    return makePacket(config.SVC.INFO, [
        synAck
    ]);
}