import * as config from '#soop/config';

export function addInfo(data = {}) {
    return Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}${config.DELIMITER.DC1}${value}${config.DELIMITER.DC2}`)
        .join('');
}

export function joinLog({ password = '', authInfo = '' } = {}) {
    return addInfo({
        pwd: password,
        auth_info: authInfo,
        pver: 2,
        access_system: 'html5',
        nation_lang: 'ko_KR',
    });
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
        stringToUint(nick),
        flag
    ]);
}

export function joinChannel(chatNo, fanTicket = '', type = 0, password = '', log = '') {
    return makePacket(config.SVC.JOIN_CHANNEL, [
        chatNo,
        fanTicket,
        type,
        stringToUint(password),
        log
    ]);
}

export function keepAlive() {
    return makePacket(config.SVC.KEEPALIVE, []);
}