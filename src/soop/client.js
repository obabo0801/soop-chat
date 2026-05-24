import * as config from '#soop/config';

export class SoopClient {
    constructor(options = {}) {
        this.domain = config.DOMAIN;
        this.agent = config.AGENT;
        this.cookie = options.cookie;
        this.socket = null;
        this.streamerId = null;
        this.userId = null;
        this.userList = new Map();
        this.channel = null;
        this.events = new Map();
    }
}