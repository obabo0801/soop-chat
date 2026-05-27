import { WebSocket } from 'ws';
import crypto from 'crypto';
import * as handler from '#handler';
import * as log from '#utils/log';

import {
    SVC,
    DELIMITER
} from '#soop/config';

import * as http from '#soop/http';
import * as packet from '#soop/packet';

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
        this.usefFlag = null;

        this.userList = new Map();
        this.events = new Map();

        this.ping = null;
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(handler);
        return this;
    }

    off(event, handler) {
        const handlers = this.events.get(event) || []

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
        const handlers = this.events.get(event) || []

        for (const handler of handlers) {
            try {
                handler(...args);
            } catch (error) {
                log.error(error.message);
            }
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
            this.channel = await http.getLiveInfo(
                streamerId, {
                cookie: this.cookie
            });
        }
        
        const url = http.getChatUrl(this.channel);

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

        this.socket.on('open', () => {
            this.sendLogin();
            this.startPing();
            this.emit('open');
            resolve(true);
        });

        this.socket.on('message', data => {
            handler.packet(
                this, 
                packet.parse(data)
            );
        });

        this.socket.on('error', error => {
            this.emit('error', error);
            reject(error);
        });

        this.socket.on('close', (code, reason) => {
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
        return this.send(
            packet.login(this.channel?.TK || '')
        );
    }

    sendJoinChannel(password = '') {
        return this.send(
            packet.joinChannel(
                this.channel,
                password,
                this.cookie?._au || this.uuid
            )
        );
    }

    sendChat(message = '') {
        if (!message && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.chat(message)
        );
    }

    sendManagerChat(message = '') {
        if (!message && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.managerChat(message)
        );
    }

    sendKickUserList(bano = 0) {
        if (bano === 0 && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.kickUserList(bano)
        );
    }

    sendDirectChat(message = '', targetId = '') {
        if (!message && !targetId) {
            return false;
        }
        if (!this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.directChat(message, targetId)
        );
    }

    sendslowMode(count = 0) {
        if (!count && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.slowMode(
                this.channel.CHATNO,
                count
            )
        );
    }

    sendUserFlag(flag = '') {
        if (!flag && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.setUserFlag(flag)
        );
    }

    sendTranslation(message = '') {
        if (!message && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.translation(message)
        );
    }

    async sendIceMode({
            streamer = true,
            fanClub = false,
            supporter = false,
            topFan = false,
            subscriber = false,
            manager = false,
            setType = 'ice_on'
        } = {}) {
        const result = await http.updateIceMode({
            broadNo: this.channel?.BNO,
            chatUserId: this.userId,
            iceAuth: setType === 'ice_on'
                ? http.makeIceAuthString({
                streamer,
                fanClub,
                supporter,
                topFan,
                subscriber,
                manager
            }) : 0,
            setType: setType,
            options: {
                cookie: this.cookie
            },
        });

        return result;
    }

    async sendIceOption(count = 0) {
        const result = await http.setIceOption({
            giftCount: count,
            subscriptionDate: 0,
            options: {
                cookie: this.cookie
            }
        });

        return result;
    }

    sendSubTitle(value = 0) {
        if (!value && !this.isOpen(this.socket)) {
            return false;
        }

        return this.send(
            packet.makeSubtitle(value)
        );
    }

    sendUserList() {
        return this.send(
            packet.userList()
        );
    }

    sendPing() {
        if (!this.isOpen(this.socket)) {
            return false;
        }

        this.send(packet.keepAlive());
        return true;
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