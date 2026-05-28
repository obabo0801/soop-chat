import {
    SVC,
    DELIMITER,
    USER_FLAG1,
    USER_FLAG2,
    ICE_AUTH,
    SUBTITLE,
    DOMAIN
} from '#soop/config';

import * as log from '#utils/log';

export function packet(soop, packet) {

    switch (packet.service) {

    // 1
    case SVC.LOGIN: {
        soop.userId = packet.fields[0];
        soop.userFlag = packet.fields[1];
        soop.sendJoinChannel(soop.password);
        break;
    }

    // 2
    case SVC.JOIN_CHANNEL: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }
        soop.userFlag = packet.fields[6];

        if (soop.cookie?.AuthTicket) {
            soop.sendUserFlag(soop.userFlag);
        }
        break;
    }

    // 3
    case SVC.QUIT_CHANNEL: {
        soop.emit('error', `강제 퇴장되었습니다. (처리자 ${packet.fields[1]})`, packet.fields);
        soop.disconnect();
        break;
    }

    // 4
    case SVC.CHUSER: {
        const users = userList(soop, packet.fields);

        if (users.length > 1) {
            break;
        }

        const type = Number(packet.fields[0]);

        soop.emit('chuser', type, users[0]);
        break;
    }
    
    // 5
    case SVC.CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('chat', {
            message: packet.fields[0],
            userId: packet.fields[1],
            userName: packet.fields[5],
            subMonth: Number(packet.fields[7]),
            userFlag: packet.fields[6],
            ...checkFlag(packet.fields[6])
        });
        break;``
    }

    // 7
    case SVC.SET_BJ_STAT: {
        log.info('[SET_BJ_STAT]', packet.fields);
        break;
    }

    // 8
    case SVC.SET_DUMB: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('dumb', {
            userId: packet.fields[0],
            userFlag: packet.fields[1],
            time: Number(packet.fields[2]),
            count: Number(packet.fields[3]),
            managerId: packet.fields[4],
            unknown1: Number(packet.fields[5]),
            unknown2: packet.fields[5],
            userName: packet.fields[7],
            ...checkFlag(packet.fields[1])
        });
        break;
    }

    // 9
    case SVC.DIRECT_CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('dchat', {
            message: packet.fields[0],
            toId: packet.fields[1],
            fromId: packet.fields[2],
            type: Number(packet.fields[3]),
            unknown: Number(packet.fields[4]),
            fromName: packet.fields[5],
            toName: packet.fields[6],
            userFlag: packet.fields[7],
            ...checkFlag(packet.fields[7])
        });
        break;
    }

    // 12
    case SVC.SET_USER_FLAG: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
        }
        if (packet.fields.length > 4) {
            const flag = checkFlag(packet.fields[0]);
            const userId = packet.fields[1];
            const userName = packet.fields[2];

            if (flag.isBlockt) {
                soop.emit('alarm', `${userName}(${userId})님이 귓속말 수신 거부 하셨습니다.`);
            } else {
                soop.emit('alarm', `${userName}(${userId})님이 귓속말 수신 허용 하셨습니다.`);
            }
        } else {
            soop.userFlag = packet.fields[0];

            soop.emit('userFlag', {
                userFlag: packet.fields[0],
                ...checkFlag(packet.fields[0]),
            });
        }
        break;
    }

    // 13
    case SVC.SET_SUB_BJ: {
        if (packet.fields.length > 4) {
            const flag = checkFlag(packet.fields[0]);
            const userId = packet.fields[1];
            const userName = packet.fields[2];

            if (flag.isBlockt) {
                soop.emit('alarm', `${userName}(${userId})님이 귓속말 수신 거부 하셨습니다.`);
            } else {
                soop.emit('alarm', `${userName}(${userId})님이 귓속말 수신 허용 하셨습니다.`);
            }

        } else {
            const userId = packet.fields[0];
            const userName = packet.fields[3];
            const flag = checkFlag(packet.fields[1]);

            if (flag.isManager) {
                soop.emit('alarm', `${userName}(${userId})님이 매니저가 되셨습니다.`);
            } else {
                soop.emit('alarm', `${userName}(${userId})님이 매니저에서 해임 되셨습니다.`);
            }
        }        
        break;
    }

    // 14
    case SVC.SET_NICKNAME: {
        const userId = packet.fields[0];
        const newNickname = packet.fields[1];
        const changeType = Number(packet.fields[2]);
        const userFlag = packet.fields[3];
        const oldNickname = packet.fields[4];

        const data = {
            userId,
            oldNickname,
            newNickname,
            changeType,
            userFlag,
            ...checkFlag(userFlag),
        };

        // 유저 목록 갱신
        const user = soop.userList.get(userId);

        if (user) {
            user.name = newNickname;
            user.flag = userFlag;
            soop.userList.set(userId, user);
        } else {
            soop.userList.set(userId, {
                id: userId,
                name: newNickname,
                flag: userFlag,
                ...splitFlag(userFlag),
            });
        }

        soop.emit('nickname', data);

        break;
    }

    // 18
    case SVC.SEND_BALLOON: {
        const data = {
            streamerId: packet.fields[0],
            userId: packet.fields[1],
            userName: packet.fields[2],
            count: Number(packet.fields[3]),
            join: Number(packet.fields[4]),
            fileName: packet.fields[7] || '',
            isDefault: Number(packet.fields[8]) === 1,
            isTopFan: Number(packet.fields[9]) || 0,
            senderLanguage: packet.fields[12] || 'ko_KR',
            urlModify: packet.fields[13] || '',
            relay: 0,
        };

        soop.emit('balloon', {
            ...data,
            image: soop.makeBalloonUrl(data)
        });
        break;
    }

    // 19
    case SVC.ICE_MODE: {
        log.info('[ICE_MODE]', packet.fields);
        break;
    }

    // 21
    case SVC.ICE_MODE_EX: {
        const count = Number(packet.fields[3]);
        const date = Number(packet.fields[4]);

        soop.emit('ice', {
            index: Number(packet.fields[0]),
            choice: Number(packet.fields[1]),
            auth: parseIceAuth(packet.fields[2]),
            count,
            date
        });

        soop.ice = { count, date };
        break;
    }

    // 23
    case SVC.SLOW_MODE: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        const count = Number(packet.fields[1]);
        soop.emit('alarm', count > 0
            ? `저속모드가 활성화되었습니다.\n${count}초 간격으로 채팅 입력이 가능합니다.`
            : '저속모드가 비활성화되었습니다.\n지연 없이 채팅 입력이 가능합니다.'
        );
        break;
    }

    // 26
    case SVC.MANAGER_CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('mchat', {
            message: packet.fields[0],
            userId: packet.fields[1],
            userName: packet.fields[4],
            userFlag: packet.fields[5],
            ...checkFlag(packet.fields[5])
        });
        break;
    }

    // 36
    case SVC.BJ_STICKER_ITEM: {
        const data = {
            bjId: packet.fields[0] || '',
            senderId: packet.fields[1] || '',
            senderName: packet.fields[2] || '',
            count: Number(packet.fields[3]) || 0,
            supporterOrder: Number(packet.fields[4]) || 0,
            type: packet.fields[5] || 'sticker',
            relay: Number(packet.fields[6]) || 0,
        };

        soop.emit('sticker', {
            ...data,
            imageUrl: makeStickerUrl(data.type),
        });
        break;
    }

    // 50
    case SVC.NOTIFY_POLL: {
        const status = Number(packet.fields[0]);

        const pollData = {
            streamerId: packet.fields[1],
            status,
            no: Number(packet.fields[2]),
            show: Number(packet.fields[3]),
        };

        soop.pollData = pollData;

        soop.emit('poll', pollData);
        break;
    }

    // 52
    case SVC.BDM_ADD_BLACK_INFO: {
        console.log('[블랙]', packet.fields);
        break;
    }

    // 54
    case SVC.BAN_WORD: {
        const original = packet.fields[0];
        const replacement = packet.fields[1].split(DELIMITER.ACK);
        soop.original = original;
        soop.emit('alarm', `금칙어가 적용되었습니다. (${original} -> ${replacement})`);
        break;
    }

    // 58
    case SVC.SEND_ADMIN_NOTICE: {
        soop.emit('alarm', `관리자 공지 : ${packet.fields[0]}`);
        break;
    }

    // 76
    case SVC.KICK_AND_CANCEL: {
        console.log('[강퇴]', packet.fields);

        const type = Number(packet.fields[4]);
        if (type === 0) {
            console.log('[강퇴]', packet.fields);
        } else {
            console.log('[강퇴 취소]', packet.fields);
        }

        const type2 = Number(packet.fields[0]);
        const userId = packet.fields[1];
        const userName = packet.fields[2];
        soop.emit('alarm', `${userName}(${userId})님의 강제퇴장이 취소되었습니다.`, type2);
        break;
    }

    // 77
    case SVC.KICK_USER_LIST: {
        const list = parseKickUserListText(packet.fields.join(', '));
        const text = formatKickUserList(list);
        soop.emit('alarm', `강제 퇴장 유저 목록 (${list.length}명)\n${text}`);
        break;
    }

    // 87
    case SVC.ADCON_EFFECT: {
        const data = {
            chatNo: Number(packet.fields[0]) || 0,
            bjId: packet.fields[1] || '',
            userId: packet.fields[2] || '',
            userName: packet.fields[3] || '',

            message: packet.fields[4] || '',
            message2: packet.fields[5] || '',
            title: packet.fields[6] || '',

            imageUrl: packet.fields[7] || '',
            defaultImageUrl: packet.fields[8] || '',

            adconCount: Number(packet.fields[9]) || 0,
            fanOrder: Number(packet.fields[10]) || 0,
            isTopFan: Number(packet.fields[11]) === 1,
            isFanChief: Number(packet.fields[12]) === 1,
            isSubRoom: Number(packet.fields[13]) === 1,

            itemCode: packet.fields[14] || '',
            uuid: packet.fields[15] || '',
            senderLanguage: packet.fields[16] || '',
            urlModify: packet.fields[17] || '',
        };

        soop.emit('adcon', data);
        break;
    }

    // 88
    case SVC.CLOSE_BROAD: {
        soop.disconnect();
        break;
    }

    // 90
    case SVC.KICK_MSG_STATE: {
        const catNo = Number(packet.fields[0]);
        const index = Number(packet.fields[1]);
        if (index === 0) {
            soop.emit('alarm', `강제 퇴장 메시지 유저에게 보이기 ON`);
        } else {
            soop.emit('alarm', `강제 퇴장 메시지 유저에게 보이기 OFF`);
        }
        break;
    }

    // 93
    case SVC.FOLLOW_ITEM_EFFECT: {
        const data = {
            bjId: packet.fields[0] || '',
            sendId: packet.fields[1] || '',
            sendNick: packet.fields[2] || '',

            month: Number(packet.fields[3]) || 1,
            chatNo: Number(packet.fields[4]) || 0,
            type: Number(packet.fields[5]) || 0,
            accMonth: Number(packet.fields[6]) || 0,
            tier: Number(packet.fields[7]) || 1,

            unknown: packet.fields[8] || '',
            senderLanguage: packet.fields[9] || 'ko_KR',
            urlModify: packet.fields[10] || '',
        };

        soop.emit('subscriptionItemEffect', {
            ...data,
            imageUrl: makeSubscriptionItemEffectUrl(data),
            fallbackUrl: makeSubscriptionDefaultUrl(data.senderLanguage),
        });
        break;
    }

    // 94
    case SVC.TRANSLATION_STATE: {
        const index = Number(packet.fields[0]);
        if (index === 1) {
            soop.emit('alarm', `채팅 번역 기능 ON`);
        } else {
            soop.emit('alarm', `채팅 번역 기능 OFF`);
        }
        break;
    }

    // 95
    case SVC.TRANSLATION: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        const idx = Number(packet.fields[0]);
        const mode = Number(packet.fields[1]);
        const message = packet.fields[2];
        const orilang = Number(packet.fields[3]);
        const tralang = Number(packet.fields[4]);
        soop.emit('alarm', `채팅 번역 : ${message} (${orilang} -> ${tralang})`);
        break
    }

    // 104
    case SVC.BJ_NOTICE: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('notice', {
            catNo: Number(packet.fields[0]),
            state: Number(packet.fields[1]),
            message: packet.fields[3]
        });
        break;
    }

    // 107
    case SVC.VOD_ADCON:
    case SVC.STATION_ADCON: {
        const isVod = packet.service === SVC.VOD_ADCON;

        const data = {
            bjId: packet.fields[0] || '',
            userId: packet.fields[1] || '',
            userName: packet.fields[2] || '',
            adconCount: Number(packet.fields[3]) || 0,

            imageUrl: packet.fields[4] || '',
            title: packet.fields[5] || '',
            chatNo: Number(packet.fields[6]) || 0,

            senderLanguage: packet.fields[7] || '',
            urlModify: packet.fields[8] || '',

            fromVod: isVod,
            fromChannel: !isVod,
        };

        soop.emit('adconEffect', data);
        break;
    }

    // 109
    case SVC.OGQ_EMOTICON: {
        const userFlag = packet.fields[7];
        const flag = checkFlag(userFlag);

        const ext = Number(
            packet.fields[17]
        ) === 1 ? 'webp' : 'png';
        
        const ogqId = packet.fields[2];
        const subId = packet.fields[3];

        const url = new URL(
            `/sticker/${ogqId}/${subId}.${ext}`,
            DOMAIN.ogq
        );

        soop.emit('ogq', {
            chatNo: Number(packet.fields[0]),
            message: packet.fields[1],

            ogqId,
            subId,

            userId: packet.fields[5],
            userName: packet.fields[6],
            userFlag,

            subMonth: Number(packet.fields[12]),
            accSubMonth: Number(packet.fields[15]),
            ext,
            url: url.href,

            ...flag,
        });

        break;
    }

    // 110
    case SVC.PUNGASI_START_JSON: {
        log.info('[PUNGASI_START_JSON]', packet.fields);
        break;
    }

    // 119
    case SVC.AD_IN_BROAD_JSON: {
        let data = null;

        try {
            data = JSON.parse(packet.fields[0]);
        } catch (error) {
            soop.emit('error', error);
            break;
        }

        soop.emit('adInBroad', data);
        break;
    }

    // 121
    case SVC.MISSION: {
        let data = null;

        try {
            data = JSON.parse(packet.fields[0]);
        } catch (error) {
            soop.emit('error', error);
            break;
        }

        const type = data?.type || '';

        const isChallenge = type.startsWith('CHALLENGE_');

        soop.emit('mission', {
            type,
            isChallenge,
            raw: data,
        });

        if (isChallenge) {
            soop.emit('challengeMission', data);
        } else {
            soop.emit('battleMission', data);
        }
        break;
    }

    // 125
    case SVC.MISSION_SETTLE: {
        console.log('[MISSION_SETTLE]', packet.fields);
        break;
    }

    // 127
    case SVC.CHUSER_EXTEND: {
//        log.info('[CHUSER_EXTEND]', packet.fields);
        break;
    }

    // 136
    case SVC.GLOBAL_SUBTITLE: {
        const lang = Number(packet.fields[2]);
        soop.emit('subtitle', {
            streamerId: packet.fields[0],
            lang: SUBTITLE[lang],
            message: packet.fields[3]
        });
        break;
    }

    // 137
    case SVC.USER_LANG_SET: {
        const lang = Number(packet.fields[0]);
        soop.emit('alarm', `자막 언어 설정이 변경되었습니다. (${SUBTITLE[lang].label})`);
        break;
    }

    default:
        log.debug('[PACKET]', packet);
        break;
    }
}

export function userList(soop, fields = []) {
    const type = Number(fields[0]);
    const users = [];

    if (type === 1) {
        for (let i = 1; i < fields.length; i += 3) {
            const id = fields[i];
            const name = fields[i + 1];
            const flag = fields[i + 2];

            if (!id) continue;

            const user = {
                id,
                name,
                flag,
                ...splitFlag(flag)
            };

            soop.userList.set(id, user);
            users.push(user);
        }

        return users;
    }

    if (type === -1) {
        const id = fields[1];
        const name = fields[2];
        const kick = Number(fields[3])
        const count = Number(fields[4])
        const flag = fields[5];

        if (!id) return users;

        const user = {
            id,
            name,
            kick,
            count,
            flag,
            ...splitFlag(flag)
        }

        soop.userList.delete(id);
        users.push(user);

        return users;
    }

    return users;
}

export function splitFlag(flag = '0|0') {
    const [flag1 = 0, flag2 = 0] = String(flag).split('|');

    return {
        flag1: Number(flag1) || 0,
        flag2: Number(flag2) || 0
    };
}

export function hasFlag(value = 0, flag = 0) {
    return (value & flag) === flag;
}

export function checkFlag(flag = '0|0') {
    const { flag1, flag2 } = splitFlag(flag);

    return {
        flag1,
        flag2,
        ...checkFlag1(flag1),
        ...checkFlag2(flag2),
    };
}

export function checkFlag1(flag1 = 0) {
    flag1 = Number(flag1) || 0;
    return {
        isAdmin: hasFlag(flag1, USER_FLAG1.ADMIN),
        isHidden: hasFlag(flag1, USER_FLAG1.HIDDEN),
        isBJ: hasFlag(flag1, USER_FLAG1.BJ),
        isGuest: hasFlag(flag1, USER_FLAG1.GUEST),
        isFanClub: hasFlag(flag1, USER_FLAG1.FANCLUB),
        isManager: hasFlag(flag1, USER_FLAG1.MANAGER),
        isMobile: hasFlag(flag1, USER_FLAG1.MOBILE),
        isTopFan: hasFlag(flag1, USER_FLAG1.TOP_FAN),
        isRealName: hasFlag(flag1, USER_FLAG1.REAL_NAME),
        isQuickView: hasFlag(flag1, USER_FLAG1.QUICKVIEW),
        isMobileWeb: hasFlag(flag1, USER_FLAG1.MOBILE_WEB),
        isNightBot: hasFlag(flag1, USER_FLAG1.NIGHTBOT),
        isBlockt: hasFlag(flag1, USER_FLAG1.BLOCK)
    };
}

export function checkFlag2(flag2 = 0) {
    flag2 = Number(flag2) || 0;
    return {
        isGlobalPc: hasFlag(flag2, USER_FLAG2.GLOBAL_PC),
        isClan: hasFlag(flag2, USER_FLAG2.CLAN),
        isTopClan: hasFlag(flag2, USER_FLAG2.TOP_CLAN),
        isTop20: hasFlag(flag2, USER_FLAG2.TOP_20),
        isEmployee: hasFlag(flag2, USER_FLAG2.EMPLOYEE),
        isCleanAti: hasFlag(flag2, USER_FLAG2.CLEAN_ATI),
        isPolice: hasFlag(flag2, USER_FLAG2.POLICE),
        isAdminChat: hasFlag(flag2, USER_FLAG2.ADMIN_CHAT),
        isPc: hasFlag(flag2, USER_FLAG2.PC),
        isSpecify: hasFlag(flag2, USER_FLAG2.SPECIFY),
        isTier1: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER1),
        isTier2: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER2),
        isTier3: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER3)
    };
}

export function parseIceAuth(mask = 0) {
    mask = Number(mask) || 0;

    return {
        raw: mask,

        isStreamerAllowed: hasFlag(mask, ICE_AUTH.STREAMER),
        isFanClubAllowed: hasFlag(mask, ICE_AUTH.FAN_CLUB),
        isSupporterAllowed: hasFlag(mask, ICE_AUTH.SUPPORTER),
        isTopFanAllowed: hasFlag(mask, ICE_AUTH.TOP_FAN),
        isSubscriberAllowed: hasFlag(mask, ICE_AUTH.SUBSCRIBER),
        isManagerAllowed: hasFlag(mask, ICE_AUTH.MANAGER),
    };
}

export function userRole(flag = '0|0') {
    const flagInfo = checkFlag(flag);
    if (flagInfo.isBJ) return '스트리머';
    if (flagInfo.isManager) return '매니저';
    if (flagInfo.isTopFan) return '열혈';
    if (flagInfo.isFanClub) return '팬';

    return '일반';
}

export function subTier(flag = '0|0') {
    const flagInfo = checkFlag(flag);
    if (flagInfo.isTier3) return 3;
    if (flagInfo.isTier2) return 2;
    if (flagInfo.isTier1) return 1;

    return 0;
}

function parseKickUserListText(text = '') {
    const fields = text
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);

    const list = [];

    for (let i = 0; i < fields.length; i += 6) {
        const [
            userId,
            userName,
            time,
            managerId,
            managerName,
            managerFlag,
        ] = fields.slice(i, i + 6);

        if (!userId) continue;

        list.push({
            userId,
            userName,
            time,
            managerId,
            managerName,
            managerFlag,
        });
    }

    return list;
}

function formatKickUserList(list = []) {
    return list
        .map(item => {
            return (
                `${item.userId}, ${item.userName}, ${item.time}, ${item.managerId}`
                + ` | ${item.managerName}, ${item.managerFlag}`
            );
        })
        .join('\n');
}

function parseColor(value = 0) {
    const n = Number(value);

    if (!n || Number.isNaN(n)) {
        return '';
    }

    let hex = n.toString(16).padStart(6, '0').toUpperCase();

    return `#${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}`;
}