import {
    SVC,
    DELIMITER,
    USER_FLAG1,
    USER_FLAG2,
    ICE_AUTH
} from '#soop/config';

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
//        console.log('[SET_BJ_STAT]', packet.fields);
        break;
    }

    // 8
    case SVC.SET_DUMB: {
        console.log('[SET_DUMB]', packet.fields);

        soop.emit('dumb', {
            userId: packet.fields[0],
            userFlag: packet.fields[1],
            count: Number(packet.fields[2]),
            index: Number(packet.fields[3]),
            streamerId: packet.fields[4],
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
            break;
        }
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

    // 19
    case SVC.ICE_MODE: {
//        console.log('[ICE_MODE]', packet.fields);
        break;
    }

    // 21
    case SVC.ICE_MODE_EX: {
        soop.emit('ice', {
            index: Number(packet.fields[0]),
            choice: Number(packet.fields[1]),
            auth: parseIceAuth(packet.fields[2]),
            money: Number(packet.fields[3])
        });
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

    // 54
    case SVC.BAN_WORD: {
        const original = packet.fields[0];
        const replacement = packet.fields[1].split(DELIMITER.ACK);
        soop.emit('alarm', `금칙어가 적용되었습니다. (${original} -> ${replacement})`);
        break;
    }

    // 76
    case SVC.KICK_AND_CANCEL: {
        const type = Number(packet.fields[0]);
        const userId = packet.fields[1];
        const userName = packet.fields[2];
        soop.emit('alarm', `${userName}(${userId})님의 강제퇴장이 취소되었습니다.`, type);
        break;
    }

    // 77
    case SVC.KICK_USER_LIST: {
        soop.emit('alarm', `강제 퇴장 유저 목록 (${packet.fields.join(', ')})`);
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
            message: packet.fields[3]
        });
        break;
    }

    // 109
    case SVC.OGQ_EMOTICON: {
        console.log('[OGQ_EMOTICON]', packet.fields);
        break;
    }

    // 110
    case SVC.PUNGASI_START_JSON: {
//        console.log('[PUNGASI_START_JSON]', packet.fields);
        break;
    }

    // 121
    case SVC.MISSION: {
        try {
            const data = JSON.parse(packet.fields[0]);
        } catch (error) {
            soop.emit('error', error);
        }
        soop.emit('mission', data);
        break;
    }

    // 127
    case SVC.CHUSER_EXTEND: {
//        console.log('[CHUSER_EXTEND]', packet.fields);
        break;
    }

    default:
        console.log('[PACKET]', packet);
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
    if (flagInfo.isTopFan) return '최고 팬';
    if (flagInfo.isFanClub) return '팬클럽';

    return '일반';
}

export function subTier(flag = '0|0') {
    const flagInfo = checkFlag(flag);
    if (flagInfo.isTier3) return '티어 3';
    if (flagInfo.isTier2) return '티어 2';
    if (flagInfo.isTier1) return '티어 1';

    return '';
}