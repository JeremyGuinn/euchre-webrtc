import type { DataConnection } from 'peerjs';
import Peer from 'peerjs';
import type { GameMessage } from '../types/messages';
import {
  decodeMessage,
  encodeMessage,
  isRecentMessage,
  ProtocolError,
} from './protocol';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface PeerConnection {
  id: string;
  connection: DataConnection;
  status: ConnectionStatus;
  lastHeartbeat: number;
}

export type PeerMessageHandler<T extends GameMessage = GameMessage> = (
  message: T,
  senderId: string
) => void;
export type PeerConnectionHandler = (
  peerId: string,
  connected: boolean
) => void;
export type PeerStatusHandler = (status: ConnectionStatus) => void;

export class NetworkManager {
  private peer: Peer | null = null;
  private connections = new Map<string, PeerConnection>();
  private messageHandlers = new Map<string, PeerMessageHandler>();
  private statusHandlers = new Set<PeerStatusHandler>();
  private connectionHandlers = new Set<PeerConnectionHandler>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs = 10000;

  private _myId: string = '';
  get myId(): string {
    return this._myId;
  }

  private _isHost: boolean = false;
  get isHost(): boolean {
    return this._isHost;
  }

  async initialize(isHost: boolean, gameId?: string): Promise<string> {
    this._isHost = isHost;

    const peerId = isHost ? gameId || crypto.randomUUID() : crypto.randomUUID();

    // Notify that we're connecting
    this.notifyStatusChange('connecting');

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId);

      this.peer.on('open', id => {
        this._myId = id;
        this.notifyStatusChange('connected');
        this.startHeartbeat();
        resolve(id);
      });

      this.peer.on('error', error => {
        this.notifyStatusChange('error');
        reject(error);
      });

      this.peer.on('connection', conn => {
        this.setupConnection(conn);
      });

      this.peer.on('disconnected', () => {
        this.notifyStatusChange('disconnected');
      });
    });
  }

  async connectToPeer(hostId: string): Promise<void> {
    if (!this.peer) {
      throw new Error('Network manager not initialized');
    }

    return new Promise((resolve, reject) => {
      const conn = this.peer!.connect(hostId, {
        reliable: true,
        serialization: 'binary',
      });

      conn.on('open', () => {
        this.setupConnection(conn);
        resolve();
      });

      conn.on('error', error => {
        reject(error);
      });
    });
  }

  private setupConnection(conn: DataConnection): void {
    const peerConnection: PeerConnection = {
      id: conn.peer,
      connection: conn,
      status: 'connected',
      lastHeartbeat: Date.now(),
    };

    this.connections.set(conn.peer, peerConnection);

    // Notify that we're connected to this specific peer
    this.notifyConnectionChange(conn.peer, true);

    conn.on('data', data => {
      this.handleIncomingData(data as Uint8Array, conn.peer);
    });

    conn.on('close', () => {
      this.handleConnectionClose(conn.peer);
    });

    conn.on('error', () => {
      this.handleConnectionError(conn.peer);
    });
  }

  private handleIncomingData(data: Uint8Array, senderId: string): void {
    try {
      const message = decodeMessage(data);

      if (!isRecentMessage(message)) {
        return;
      }

      // Update heartbeat timestamp
      const connection = this.connections.get(senderId);
      if (connection) {
        connection.lastHeartbeat = Date.now();
      }

      // Handle heartbeat messages
      if (message.type === 'HEARTBEAT') {
        this.sendHeartbeatResponse(senderId);
        return;
      }

      // Dispatch to handlers
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message, senderId);
      }
    } catch (error) {
      if (error instanceof ProtocolError) {
        this.sendErrorMessage(senderId, error.message, error.code);
      }
    }
  }

  private handleConnectionClose(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.status = 'disconnected';
      // Notify that this specific peer disconnected
      this.notifyConnectionChange(peerId, false);
    }
  }

  private handleConnectionError(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.status = 'error';
      // Notify that this specific peer had an error/disconnected
      this.notifyConnectionChange(peerId, false);
    }
  }

  sendMessage(message: GameMessage, targetId?: string): void {
    try {
      const encodedMessage = encodeMessage(message);

      if (targetId) {
        // Send to specific peer
        const connection = this.connections.get(targetId);
        if (connection?.connection.open) {
          try {
            connection.connection.send(encodedMessage);
          } catch (error) {
            console.warn(
              `Failed to send message to ${targetId}, connection may be closed:`,
              error
            );
            this.handleConnectionError(targetId);
          }
        } else if (connection) {
          // Connection exists but is not open, handle as disconnected
          console.warn(
            `Attempted to send message to ${targetId} but connection is not open`
          );
          this.handleConnectionClose(targetId);
        }
      } else {
        // Broadcast to all connected peers
        const connectedPeers = Array.from(this.connections.values()).filter(
          conn => conn.connection.open
        );

        connectedPeers.forEach(connection => {
          try {
            connection.connection.send(encodedMessage);
          } catch (error) {
            console.warn(
              `Failed to send message to ${connection.id}, connection may be closed:`,
              error
            );
            this.handleConnectionError(connection.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to encode message:', error);
    }
  }

  onMessage(messageType: string, handler: PeerMessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  onStatusChange(handler: PeerStatusHandler): void {
    this.statusHandlers.add(handler);
  }

  onConnectionChange(handler: PeerConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  getConnectedPeers(): string[] {
    const connectedPeers = Array.from(this.connections.values())
      .filter(conn => {
        const isConnected = conn.status === 'connected' && conn.connection.open;

        // If connection appears disconnected but we haven't handled it yet, handle it now
        if (!isConnected && conn.status === 'connected') {
          console.warn(
            `Detected stale connection for peer ${conn.id}, handling disconnection`
          );
          this.handleConnectionClose(conn.id);
        }

        return isConnected;
      })
      .map(conn => conn.id);
    return connectedPeers;
  }

  isConnectedToPeer(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    if (!connection) {
      return false;
    }

    // Check both status and actual connection state
    const isConnected =
      connection.status === 'connected' && connection.connection.open;

    return isConnected;
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
      this.checkConnectionHealth();
      this.cleanupStaleConnections();
    }, this.heartbeatIntervalMs);
  }

  private sendHeartbeats(): void {
    this.sendMessage({
      type: 'HEARTBEAT',
      timestamp: Date.now(),
      messageId: `heartbeat-${Date.now()}`,
      payload: { gameId: this.myId },
    });
  }

  private sendHeartbeatResponse(targetId: string): void {
    this.sendMessage(
      {
        type: 'HEARTBEAT',
        timestamp: Date.now(),
        messageId: `heartbeat-response-${Date.now()}`,
        payload: { gameId: this.myId },
      },
      targetId
    );
  }

  private checkConnectionHealth(): void {
    const now = Date.now();
    const timeout = this.heartbeatIntervalMs * 3; // 3 missed heartbeats = timeout

    this.connections.forEach((connection, peerId) => {
      if (now - connection.lastHeartbeat > timeout) {
        console.warn(
          `Connection to ${peerId} timed out (last heartbeat: ${new Date(connection.lastHeartbeat).toISOString()})`
        );

        // Check if connection is actually still open
        if (connection.connection.open) {
          console.warn(
            `Connection to ${peerId} appears open but heartbeat timed out, treating as disconnected`
          );
        }

        this.handleConnectionError(peerId);
      }
    });
  }

  private sendErrorMessage(
    targetId: string,
    message: string,
    code?: string
  ): void {
    this.sendMessage(
      {
        type: 'ERROR',
        timestamp: Date.now(),
        messageId: `error-${Date.now()}`,
        payload: { message, code },
      },
      targetId
    );
  }

  private notifyStatusChange(status: ConnectionStatus): void {
    this.statusHandlers.forEach(handler => handler(status));
  }

  private notifyConnectionChange(peerId: string, connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(peerId, connected));
  }

  disconnect(): void {
    // Notify that we're disconnecting
    this.notifyStatusChange('disconnected');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all peer connections and notify about each one
    this.connections.forEach((connection, peerId) => {
      connection.connection.close();
      this.notifyConnectionChange(peerId, false);
    });
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  disconnectPeer(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.connection.close();
      this.connections.delete(peerId);
      this.notifyConnectionChange(peerId, false);
    } else {
      console.warn(`No connection found for peer ${peerId}`);
    }
  }

  private cleanupStaleConnections(): void {
    // Clean up connections that are marked as connected but are actually closed
    this.connections.forEach((connection, peerId) => {
      if (connection.status === 'connected' && !connection.connection.open) {
        console.warn(`Cleaning up stale connection for peer ${peerId}`);
        this.handleConnectionClose(peerId);
      }
    });
  }
}
