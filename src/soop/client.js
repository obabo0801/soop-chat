import { WebSocket } from 'ws';

import * as config from '#soop/config';
import * as http from '#soop/http';

export class SoopClient {
    constructor(options = {}) {
        this.options = options;

        this.domain = config.DOMAIN;
        this.userAgent = config.AGENT;
        this.subtitle = config.SUBTITLE;

        this.socket = null;
        this.streamerId = null;
        this.userId = null;
        this.userList = new Map();
        this.channel = null;
        this.events = new Map();
    }

    async getLiveInfo(bjId) {
    const url = (config.DOMAIN.live
        + `/afreeca/player_live_api.php?bjid=${bjId}`
    );

    const body = new URLSearchParams({
        bid: bjId,
        bno: '0',
        ...config.BODY
    });

    return http.request(url, {
        method: 'POST',
        cookie: this.options.cookie,
        body
    });
}
}