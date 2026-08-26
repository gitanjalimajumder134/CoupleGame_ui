export class WSSocket {
    constructor(url) {
        this.url = url;
        this.listeners = {};
        this.id = null;
        this.messageQueue = [];
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log("Connected to WebSocket API");
            
            // Flush queued messages
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                this.ws.send(msg);
            }

            if (this.listeners['connect']) {
                this.listeners['connect'].forEach(cb => cb());
            }
        };

        this.ws.onclose = () => {
            console.log("Disconnected from WebSocket API");
            if (this.listeners['disconnect']) {
                this.listeners['disconnect'].forEach(cb => cb());
            }
            // Auto reconnect after 3 seconds
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                
                // Intercept socketId assignment
                if (parsed.type === 'socketId') {
                    this.id = parsed.payload;
                }

                if (this.listeners[parsed.type]) {
                    this.listeners[parsed.type].forEach(cb => cb(parsed.payload));
                }
            } catch (err) {
                console.error("Failed to parse websocket message", err);
            }
        };
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        if (!callback) {
            this.listeners[event] = [];
        } else {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        const payload = JSON.stringify({ action: event, data: data });
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        } else {
            console.log(`WebSocket not open yet. Queueing event: ${event}`);
            this.messageQueue.push(payload);
        }
    }
}

// Ensure you replace this with the generated WSS URL from SAM
export const socket = new WSSocket('wss://gm948eb46i.execute-api.ap-south-1.amazonaws.com/Prod');
