import { EventEmitter } from 'events';

export class MockGateway extends EventEmitter {
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

  constructor() {
    super();
  }

  connect() {
    console.log('[MockGateway] Connected (Safe Mode)');
    this.readyState = 1; // OPEN
    // Simulate connection event
    setTimeout(() => this.emit('open'), 100);
  }

  send(msg: any) {
    let parsed = msg;
    if (typeof msg === 'string') {
      try {
        parsed = JSON.parse(msg);
      } catch {
        parsed = { type: 'unknown', payload: msg };
      }
    }

    console.log('[MockGateway] Received message:', JSON.stringify(parsed));
    
    // Simulate responses based on message type
    if (parsed.type === 'connect') {
      setTimeout(() => {
        this.emit('message', JSON.stringify({
          type: 'connect_ack',
          payload: { connected: true, role: parsed.params?.role ?? 'operator' }
        }));
      }, 100);
    } else if (parsed.type === 'register_agent') {
      setTimeout(() => {
        this.emit('message', JSON.stringify({
          type: 'register_success',
          payload: { clientId: 'mock-client-id' }
        }));
      }, 500);
    } else if (parsed.type === 'ping') {
      setTimeout(() => {
        this.emit('message', JSON.stringify({
          type: 'pong',
          payload: { timestamp: parsed.payload?.timestamp }
        }));
      }, 50);
    } else if (parsed.type === 'request_history') {
      setTimeout(() => {
        this.emit('message', JSON.stringify({
          type: 'history_batch',
          payload: { 
            messages: [
              {
                id: 'mock-hist-1',
                text: 'System rehydrated successfully.',
                senderType: 'system',
                timestamp: new Date().toISOString()
              }
            ]
          }
        }));
      }, 200);
    }
  }

  close() {
    console.log('[MockGateway] Closing connection...');
    this.readyState = 3; // CLOSED
    this.disconnect();
  }

  disconnect() {
    console.log('[MockGateway] Disconnected');
    this.readyState = 3;
    this.emit('close');
  }
}
