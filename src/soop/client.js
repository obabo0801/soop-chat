import { WebSocket } from 'ws';
import crypto from 'crypto';

import * as http from '#soop/http';
import * as packet from '#soop/packet';

import * as handler from '#handler';

import {
    DOMAIN,
    DELIMITER,
    SVC,
    ICE_AUTH
} from '#soop/config';

export class SoopClient {
    constructor(options = {}) {
        this.cookie = options.cookie;
        this.password = options.password;

        this.uuid = crypto
            .randomBytes(16)
            .toString('hex');

        this.socket = null;
        this.channel = null;

        this.streamerId = null;
        this.userId = null;
        this.userFlag = null;

        this.userList = new Map();
        this.events = new Map();

        this.ping = null;

        this.emoticon = null;
        this.recent = null;
        this.signature = null;
        this.ogq = null;
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(handler);
        return this;
    }

    off(event, handler) {
        const handlers = this.events.get(event) || [];

        this.events.set(
            event,
            handlers.filter(fn => fn !== handler)
        );

        return this;
    }

    once(event, handler) {
        const wrapper = payload => {
            this.off(event, wrapper);
            handler(payload);
        }

        this.on(event, wrapper);
        return this;
    }

    emit(event, ...args) {
        const handlers = this.events.get(event) || [];

        for (const handler of handlers) {
            handler(...args);
        }
    }
    
    isOpen(socket) {
        return (
            socket
            && socket.readyState === WebSocket.OPEN
        );
    }
    
    isConnecting(socket) {
        return (
            socket
            && socket.readyState === WebSocket.CONNECTING
        );
    }

    async login(
            userId, password, secondPassword = ''
        ) {
        const result = await http.login(
            userId, password, {
            cookie: this.cookie
        });

        if (!result) return false;

        if (result.data.RESULT === -11) {
            return await this.secondLogin(
                userId, secondPassword
            );
        }

        if (result.data.RESULT !== 1) {
            this.emit('error', result.data);
            return false;
        }

        if (result.cookie?.AuthTicket) {
            this.cookie = result.cookie;
        }

        return result;
    }

    async secondLogin(
            userId, secondPassword
        ) {
        const result = await http.secondLogin(
            userId, secondPassword, {
            cookie: this.cookie
        });

        if (!result) return false;

        if (result.data.RESULT !== 1) {
            this.emit('error', result.data);
            return false;
        }

        if (result.cookie?.AuthTicket) {
            this.cookie = result.cookie;
        }

        return result;
    }

    async logout() {
        await http.logout({
            cookie: this.cookie
        });

        this.cookie = '';
        this.channel = null;

        this.uuid = null;

        return true;
    }

    async connect(
            streamerId = '', password = ''
        ) {
        if (!streamerId) {
            streamerId = this.streamerId;
        }
        if (!password) {
            password = this.password;
        }
        this.streamerId = streamerId;
        this.password = password;

        if (!this.channel) {
            this.channel = await http.postLiveInfo(
                streamerId, {
                cookie: this.cookie
            });
        }
        
        const url = this.makeChatUrl(this.channel);

        if (!url) return false;

        await this.loadAssets();
        
        const headers = {
            ...(this.cookie ? {
                Cookie: http.cookieString(this.cookie)
            } : {})
        };

        this.socket = new WebSocket(url, ['chat'], {
            headers
        });

        await this.openSocket();

        return true;
    }

    async loadAssets() {
        const emo = await http.getEmoticon({
            cookie: this.cookie
        })
        this.emoticon = emo;

        const rec = await http.getRecent({
            cookie: this.cookie
        })
        this.recent = rec;

        const sig = await http.getSignature(
            this.streamerId, {
            cookie: this.cookie
        })
        this.signature = sig;

        const ogq = await http.postOgqList(
            this.streamerId, {
            cookie: this.cookie
        })
        this.ogq = ogq;

        return true;
    }

    makeChatUrl(channel = {}) {
        const { CHDOMAIN, CHPT, BJID } = channel;

        if (!CHDOMAIN || !CHPT) return false;

        const port = `:${Number(CHPT) + 1}`;
        const domain = `${CHDOMAIN}${port}`;

        return (domain.startsWith('ws')
            ? `${domain}/Websocket/${BJID}`
            : `wss://${domain}/Websocket/${BJID}`
        );
    }

    async openSocket() {
        return new Promise((resolve, reject) => {

        const timeout = setTimeout(() => {
            reject(new Error('timeout'));
        }, 10000);

        const done = () => {
            clearTimeout(timeout);
            resolve(true);
        };

        this.once('join', done);

        this.socket.on('open', () => {
            this.sendLogin();
            this.startPing();
            this.emit('open');
        });

        this.socket.on('message', data => {
            handler.dispatch(
                this, 
                packet.parse(data)
            );
        });

        this.socket.on('error', error => {
            clearTimeout(timeout);
            this.emit('error', error);
            reject(error);
        });

        this.socket.on('close', (code, reason) => {
            clearTimeout(timeout);
            this.stopPing();

            this.emit('close', {
                code,
                reason: reason.toString()
            });
        });

        });
    }

    send(data) {
        if (!this.isOpen(this.socket)) {
            return false;
        }

        this.socket.send(data);
        return true;
    }

    sendLogin() {
        return this.send(packet.makeLogin(
            this.channel?.TK || ''
        ));
    }

    sendJoinChannel(password = '') {
        return this.send(packet.makeJoinChannel(
            this.channel, password,
            this.cookie?._au || this.uuid || ''
        ));
    }

    sendPing() {
        this.send(packet.makeKeepAlive());
    }

    startPing() {
        this.stopPing();

        this.ping = setInterval(() => {
            this.sendPing();
        }, 60000);
    }

    stopPing() {
        if (!this.ping) {
            return false;
        }
        
        clearInterval(this.ping);
        this.ping = null;
    }

    sendChat(message = '') {
        return this.send(
            packet.makeChat(message)
        );
    }

    sendManagerChat(message = '') {
        return this.send(packet.makeManagerChat(
            message
        ));
    }

    sendDirectChat(message = '', targetId = '') {
        return this.send(packet.makeDirectChat(
            message, targetId
        ));
    }

    sendTranslation(message = '') {
        return this.send(packet.makeTranslation(
            message
        ));
    }

    sendUserFlag(flag = '') {
        return this.send(packet.makeUserFlag(
            flag
        ));
    }

    sendDumb(targetId = '', message = '') {
        return this.send(packet.makeDumb(
            targetId, message
        ));
    }

    sendKick(targetId = '', index = 0, message = '') {
        const name = this.userList.get(targetId);
        return this.send(packet.makeKick(
            targetId, name, this.userId,
            this.channel.BNO, index, message
        ));
    }

    sendBlack(targetId = '', adminId = '') {
        return this.send(packet.makeBlack(
            this.channel.BNO, adminId, targetId
        ));
    }

    sendKickList() {
        return this.send(packet.makeKickList(
            this.channel.BNO
        ));
    }

    async sendIceMode(type, auth = 0) {
        const result = await http.postIceMode(
            this.channel.BNO,
            this.userId,
            type,
            auth,
            {
                cookie: this.cookie
            }
        );

        return result;
    }

    makeIceAuth({
        streamer = true,
        fanClub = false,
        supporter = false,
        topFan = false,
        subscriber = false,
        manager = true,
    } = {}) {
        let mask = 0;

        if (streamer) mask |= ICE_AUTH.STREAMER;
        if (fanClub) mask |= ICE_AUTH.FAN_CLUB;
        if (supporter) mask |= ICE_AUTH.SUPPORTER;
        if (topFan) mask |= ICE_AUTH.TOP_FAN;
        if (subscriber) mask |= ICE_AUTH.SUBSCRIBER;
        if (manager) mask |= ICE_AUTH.MANAGER;

        return mask;
    }

    async sendIceOption(count = 0, date = 1) {
        const result = await http.postIceOption(
            count,
            date,
            {
                cookie: this.cookie
            }
        );

        return result;
    }

    sendSubtitle(value = 0) {
        return this.send(packet.makeSubtitle(
            value
        ));
    }

    sendUserList() {
        return this.send(packet.makeUserList());
    }

    async sendOgq(message = '', ogqId = '', index = 1) {
        const result = await http.postOgqChat(
            this.channel,
            this.userId,
            message,
            ogqId,
            index,
            {
                cookie: this.cookie
            }
        );

        return result;
    }

    sendSlowMode(count = 0) {
        return this.send(packet.makeSlowMode(
            this.channel.CHATNO,
            count
        ));
    }

    getDefaultBalloonStep(count = 0) {
        count = Number(count) || 0;

        if (count < 10) return 1;
        if (count < 50) return 2;
        if (count < 100) return 3;
        if (count < 500) return 4;
        if (count < 1000) return 5;

        return 6;
    }

    makeBalloonUrl(data = {}) {

        const count = Number(data.count) || 0;

        if (data.isDefault) {
            const step = this.getDefaultBalloonStep(count);
            return `${DOMAIN.res}/new_player/items/ba_step${step}.png`;
        }

        let fileName = String(data.fileName || '');

        if (!fileName) {
            return `${DOMAIN.res}/new_player/items/ba_step${this.getDefaultBalloonStep(count)}.png`;
        }

        const isEventBalloon = fileName.includes('evt');
        const isSignatureBalloon = fileName.includes('sig') || fileName.includes('signature');

        if (
            data.senderLanguage &&
            data.senderLanguage !== 'ko_KR' &&
            !isEventBalloon &&
            !isSignatureBalloon
        ) {
            fileName += '_en';
        }

        let url;

        if (isEventBalloon || isSignatureBalloon) {
            url = `${DOMAIN.static}/starballoon/story_m/${fileName}.png`;
        } else {
            url = `${DOMAIN.res}/new_player/items/m_balloon_${fileName}.png`;
        }

        if (data.urlModify) {
            url += `?v=${data.urlModify}`;
        }

        return url;
    }

    makeStickerUrl(type = 'sticker') {
        return `${DOMAIN.res}/new_player/items/${type}.png`;
    }

    makeSubscriptionItemEffectUrl({
        month = 1,
        senderLanguage = 'ko_KR',
        urlModify = '',
    } = {}) {

        month = Number(month) || 1;

        let url = `${DOMAIN.static}/subscription_ceremony/m/gudok_${month}.png`;

        if (senderLanguage && senderLanguage !== 'ko_KR') {
            url = url.replace('.png', '_en.png');
        }

        return urlModify
            ? `${url}?v=${urlModify}`
            : url;
    }

    makeSubscriptionDefaultUrl(senderLanguage = 'ko_KR') {
        let url = `${DOMAIN.static}/subscription_ceremony/m/gudok_1.png`;

        if (senderLanguage && senderLanguage !== 'ko_KR') {
            url = url.replace('.png', '_en.png');
        }

        return url;
    }

    normalizeTier(tier = 1) {
        if (
            tier === 2 ||
            tier === '2' ||
            tier === 'tier2' ||
            tier === '티어2' ||
            tier === '티어 2'
        ) {
            return 'tier2';
        }

        return 'tier1';
    }

    makeTierUrl(tier = 1, month = 0) {
        const pcon = this.channel.PCON_OBJECT;

        if (!pcon || typeof pcon !== 'object') {
            return '';
        }

        const tierKey = this.normalizeTier(tier);
        const list = pcon[tierKey];

        if (!Array.isArray(list)) {
            return '';
        }

        const subMonth = Number(month) || 0;

        const sorted = [...list].sort((a, b) => {
            return Number(b.MONTH || 0) - Number(a.MONTH || 0);
        });

        for (const item of sorted) {
            const itemMonth = Number(item.MONTH) || 0;
            const filename = item.FILENAME || '';

            if (subMonth >= itemMonth && filename) {
                return filename;
            }
        }

        return '';
    }

    makeOgqUrl(index = 0, subId = 1) {
        const ogq = this.ogq;
        const item = ogq.data?.[index];

        if (!ogq?.img_domain) {
            return '';
        }

        if (!item) {
            return '';
        }

        const ogqId = item.ogq_id;
        const max = Number(item.ogq_numbering);
        const extension = item.extension;

        if (!ogqId || !max || !extension) {
            return '';
        }

        if (subId < 1 || subId > max) {
            return '';
        }

        const url = new URL(
            `/sticker/${ogqId}/${subId}.${extension}`,
            http.normalize(ogq.img_domain)
        );

        return url.href;
    }

    makeEmoticon(data = {}) {
        const map = new Map();

        for (const type of ['default', 'subscribe']) {
            const section = data[type];

            if (!section) continue;

            const smallUrl = section.small_url;
            const bigUrl = section.big_url;

            for (const group of section.groups || []) {
                for (const emoticon of group.emoticons || []) {
                    if (emoticon.isDeprecated) {
                        continue;
                    }

                    map.set(emoticon.keyword, {
                        type,
                        group: group.title,
                        keyword: emoticon.keyword,
                        fileName: emoticon.fileName,
                        staticFileName: emoticon.staticFileName || '',
                        smallUrl: new URL(emoticon.fileName, smallUrl).href,
                        bigUrl: new URL(emoticon.fileName, bigUrl).href,
                    });
                }
            }
        }

        return map;
    }

    findEmoticons(message = '', emoticonMap = new Map()) {
        const result = [];

        message = String(message || '');

        for (const [keyword, emoticon] of emoticonMap) {
            if (message.includes(keyword)) {
                result.push(emoticon);
            }
        }

        return result;
    }

    disconnect() {
        if (!this.socket) {
            return false;
        }

        this.stopPing();
        this.socket.close();
        this.socket = null;

        return true;
    }
}