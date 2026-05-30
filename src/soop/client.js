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
        this.uuid = crypto
            .randomBytes(16)
            .toString('hex');

        this.socket = null;
        this.channel = null;

        this.streamerId = (
            options.streamerId
        );
        this.userId = null;
        this.password = (
            options.password
        );
        this.userFlag = null;

        this.pver = (
            options.pver
        );

        this.subtitle = (
            options.subtitle
        );

        this.cookie = (
            options.cookie
        );

        this.userList = new Map();
        this.events = new Map();

        this.ping = null;

        this.info = null;
        this.rule = null;
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

    async login(userId, password, secondPassword = '') {
        const result = (
            await http.login(
            userId, password,
            { cookie: this.cookie }
        ));

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

    async secondLogin(userId, secondPassword) {
        const result = (
            await http.secondLogin(
            userId, secondPassword,
            { cookie: this.cookie }
        ));

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
        await http.logout(
            { cookie: this.cookie }
        );

        this.cookie = '';
        this.channel = null;

        this.uuid = null;

        return true;
    }

    async connect(streamerId = '', password = '') {
        if (!streamerId) {
            streamerId = this.streamerId;
        }
        this.streamerId = streamerId;

        if (!password) {
            password = this.password;
        }
        this.password = password;

        if (!streamerId) return false;

        if (!this.channel) {
            this.channel = (
                await http.postLiveInfo(
                streamerId,
                { cookie: this.cookie }
            ));
        }

        await this.loadAssets();

        const url = this.makeChatUrl(
            this.channel
        );
        if (!url) return false;
        
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

    disconnect() {
        if (!this.socket) {
            return false;
        }

        this.stopPing();
        this.socket.close();
        this.socket = null;

        return true;
    }

    async loadAssets() {
        const options = {
            cookie: this.cookie
        };

        const [
            info, rule, emo, rec, sig, ogq
        ] = await Promise.all([
            http.getPrivateInfo(
                options
            ),
            http.postChatRule(
                this.streamerId,
                options
            ),
            http.getEmoticon(options),
            http.getRecent(options),
            http.getSignature(
                this.streamerId,
                options
            ),
            http.postOgqList(
                this.streamerId,
                options
            ),
        ]);

        this.info = info;
        this.rule = rule;
        this.recent = rec;
        this.signature = sig;
        this.ogq = ogq;

        this.emoticon = (
            this.makeEmoticon(
            emo, sig
        ));

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

    sendJoinChannel(password = '', pver = 2) {
        return this.send(packet.makeJoinChannel(
            this.channel, pver, password,
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

    sendUserFlag(flag = '') {
        return this.send(packet.makeUserFlag(
            flag
        ));
    }

    sendClubColor(color = 0) {
        return this.send(packet.makeClubColor(
            color
        ));
    }

    sendTranslation(message = '', mode = 1) {
        return this.send(packet.makeTranslation(
            message, mode
        ));
    }

    sendDumb(targetId = '', message = '') {
        return this.send(packet.makeDumb(
            targetId, message
        ));
    }

    sendKick(targetId = '', index = 0, message = '') {
        const user = this.userList.get(targetId);
        const name = user?.name || '';

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

    sendSlowMode(count = 0) {
        return this.send(packet.makeSlowMode(
            this.channel.CHATNO,
            count
        ));
    }

    async sendIceMode(type, auth = 0) { 
        const result = (
            await http.postIceMode(
            this.channel.BNO,
            this.userId,
            type,
            auth,
            { cookie: this.cookie }
        ));

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

    sendSubtitle(index = this.subtitle) {
        return this.send(packet.makeSubtitle(
            index
        ));
    }

    sendUserList() {
        return this.send(packet.makeUserList());
    }

    async sendOgq(message, ogqId, index = 1) {
        const result = (
            await http.postOgqChat(
            this.channel,
            this.userId,
            message,
            ogqId,
            index,
            { cookie: this.cookie }
        ));

        return result;
    }

    getChatAssets(data = {}) {
        const emoticons = this.findEmoticons(
            data.message
        );

        const tier = Number(data.tier) || 0;
        const subMonth = Number(data.subMonth) || 0;

        const tierUrl = tier > 0
            ? this.makeTierUrl(tier, subMonth)
            : '';

        return { emoticons, tier, subMonth, tierUrl }
    }

    makeBalloonUrl(data = {}) {
        const count = Number(data.count) || 0;

        const step = (
            count < 10 ? 1 :
            count < 50 ? 2 :
            count < 100 ? 3 :
            count < 500 ? 4 :
            count < 1000 ? 5 : 6
        );

        const defaultUrl = new URL(
            `/new_player/items/ba_step${step}.png`,
            DOMAIN.res
        );

        if (data.isDefault) {
            return defaultUrl.href;
        }

        let fileName = String(data.fileName || '');

        if (!fileName) {
            return defaultUrl.href;
        }

        const isSpecial = (
            fileName.includes('evt') ||
            fileName.includes('sig') ||
            fileName.includes('signature')
        );

        if (
            data.senderLanguage &&
            data.senderLanguage !== 'ko_KR' &&
            !isSpecial
        ) {
            fileName += '_en';
        }

        let url = isSpecial
            ? new URL(
                `/starballoon/story_m/${fileName}.png`,
                DOMAIN.static
            )
            : new URL(
                `/new_player/items/m_balloon_${fileName}.png`,
                DOMAIN.res
            );

        if (data.urlModify) {
            url.href += `?v=${data.urlModify}`;
        }

        return url.href;
    }

    makeStickerUrl(type) {
        return new URL(
            `/new_player/items/${type}.png`,
            DOMAIN.res
        ).href;
    }

    makeGudokUrl(month = 1, modify = '') {
        let url = new URL(
            `/subscription_ceremony/m/gudok_${month}.png`,
            DOMAIN.static
        );

        return (modify
            ? `${url}?v=${modify}`
            : url.href
        );
    }

    makeTierUrl(tier = 1, month = 0) {
        const pcon = this.channel?.PCON_OBJECT;

        if (!pcon || typeof pcon !== 'object') {
            return '';
        }

        if (tier === 2) {
            tier = 'tier2';
        } else {
            tier = 'tier1';
        }

        const list = pcon[tier];

        if (!Array.isArray(list)) {
            return '';
        }

        const sorted = [...list].sort((a, b) => {
            return Number(b.MONTH) - Number(a.MONTH);
        });

        for (const item of sorted) {
            const itemMonth = Number(item.MONTH);
            const fileName = item.FILENAME;

            if (month >= itemMonth && fileName) {
                return fileName;
            }
        }

        return '';
    }

    makeOgqUrl(index = 0, subId = 1) {
        const ogq = this.ogq;
        const item = ogq?.data?.[index];

        if (!ogq?.img_domain || !item) {
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

        return new URL(
            `/sticker/${ogqId}/${subId}.${extension}`,
            http.normalize(ogq.img_domain)
        ).href;
    }

    makeEmoticon(data = {}, signature = []) {
        const map = new Map();

        for (const type of ['default', 'subscribe']) {
            
        const section = data[type];

        if (!section) continue;

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
            smallUrl: new URL(
                emoticon.fileName, section.small_url
            ).href,
            bigUrl: new URL(
                emoticon.fileName, section.big_url
            ).href
        });

        }}}

        const url = new URL(
            `/signature_emoticon/${this.streamerId}/`,
            DOMAIN.static
        );

        for (const [tierKey, list] of Object.entries(signature || {})) {

        const tier = Number(tierKey.replace('tier', ''));

        for (const item of list || []) {
        
        const title = item.title;
        const keyword = `/${title}/`;

        map.set(keyword, {
            type: 'signature',
            group: tierKey,
            title,
            keyword,
            tier,
            order: Number(item.order_no),
            fileName: item.pc_img,
            smallUrl: new URL(
                item.mobile_img, url.href
            ).href,
            bigUrl: new URL(
                item.pc_img, url.href
            ).href
        });

        }}

        return map;
    }

    findEmoticons(message = '') {
        const result = [];

        if (!message || !(this.emoticon instanceof Map)) {
            return result;
        }

        for (const [keyword, emoticon] of this.emoticon) {
            if (message.includes(keyword)) {
                result.push(emoticon);
            }
        }

        return result;
    }
}