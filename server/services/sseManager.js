const clients = new Map();

export function addClient(userId, res) {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    clients.get(userId).add(res);
}

export function removeClient(userId, res) {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
}

function send(res, event, data) {
    try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
        // connection already closed
    }
}

export function sendToUser(userId, event, data) {
    const set = clients.get(userId);
    if (!set) return;
    for (const res of set) send(res, event, data);
}

export function broadcast(event, data) {
    for (const [, set] of clients) {
        for (const res of set) send(res, event, data);
    }
}

export function broadcastToRole(role, event, data, pool) {
    for (const [userId, set] of clients) {
        for (const res of set) {
            if (res._sseRole === role) send(res, event, data);
        }
    }
}

export function getClientCount() {
    let count = 0;
    for (const [, set] of clients) count += set.size;
    return count;
}
