import type { DataConnection } from 'peerjs';
import Peer from 'peerjs';
import { createScopedLogger } from '~/services/loggingService';
import type { GameMessage } from '~/types/messages';
import { decodeMessage, encodeMessage, isRecentMessage, ProtocolError } from './protocol';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
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
export type PeerConnectionHandler = (peerId: string, connected: boolean) => void;
export type PeerStatusHandler = (status: ConnectionStatus) => void;

export class NetworkManager {
  private peer: Peer | null = null;
  private connections = new Map<string, PeerConnection>();
  private messageHandlers = new Map<string, PeerMessageHandler>();
  private statusHandlers = new Set<PeerStatusHandler>();
  private connectionHandlers = new Set<PeerConnectionHandler>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs = 10000;
  private logger = createScopedLogger('NetworkManager');

  private _myId: string = '';
  get myId(): string {
    return this._myId;
  }

  private _isHost: boolean = false;
  get isHost(): boolean {
    return this._isHost;
  }

  async initialize(isHost: boolean, gameId?: string): Promise<string> {
    return this.logger.withPerformance('initialize', async () => {
      this.logger.info('Initializing network manager', { isHost, gameId });

      this._isHost = isHost;
      const peerId = isHost ? gameId || crypto.randomUUID() : crypto.randomUUID();

      this.logger.debug('Generated peer ID', { peerId, isHost });

      // Notify that we're connecting
      this.notifyStatusChange('connecting');

      return new Promise((resolve, reject) => {
        this.peer = new Peer(peerId, {
          config: {
            iceServers: [
              {
                urls: 'stun:stun.relay.metered.ca:80',
              },
              {
                urls: 'turn:standard.relay.metered.ca:80',
                username: '8e5b8fea70e449812126a7b2',
                credential: 'pTkcFGDZ+qSj51xI',
              },
              {
                urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
                username: '8e5b8fea70e449812126a7b2',
                credential: 'pTkcFGDZ+qSj51xI',
              },
              {
                urls: 'turn:standard.relay.metered.ca:443',
                username: '8e5b8fea70e449812126a7b2',
                credential: 'pTkcFGDZ+qSj51xI',
              },
              {
                urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
                username: '8e5b8fea70e449812126a7b2',
                credential: 'pTkcFGDZ+qSj51xI',
              },
            ],
          },
        });

        this.peer.on('open', id => {
          this.logger.info('Peer connection opened', { peerId: id, isHost });
          this._myId = id;
          this.notifyStatusChange('connected');
          this.startHeartbeat();
          resolve(id);
        });

        this.peer.on('error', error => {
          this.logger.error('Peer connection error', {
            error: error.message,
            peerId,
            isHost,
          });
          this.notifyStatusChange('error');
          reject(error);
        });

        this.peer.on('connection', conn => {
          this.logger.info('Incoming peer connection', {
            fromPeer: conn.peer,
            myId: this._myId,
          });
          this.setupConnection(conn);
        });

        this.peer.on('disconnected', () => {
          this.logger.warn('Peer disconnected', { peerId: this._myId });
          this.notifyStatusChange('disconnected');
        });
      });
    });
  }

  async connectToPeer(hostId: string): Promise<void> {
    return this.logger.withPerformance('connectToPeer', async () => {
      this.logger.info('Attempting to connect to peer', {
        hostId,
        myId: this._myId,
      });

      if (!this.peer) {
        this.logger.error('Cannot connect to peer: Network manager not initialized');
        throw new Error('Network manager not initialized');
      }

      return new Promise((resolve, reject) => {
        const conn = this.peer!.connect(hostId, {
          reliable: true,
          serialization: 'binary',
        });

        this.logger.debug('Connection attempt initiated', {
          hostId,
          connectionId: conn.connectionId,
        });

        conn.on('open', () => {
          this.logger.info('Connection to peer established', {
            hostId,
            connectionId: conn.connectionId,
          });
          this.setupConnection(conn);
          resolve();
        });

        conn.on('error', error => {
          this.logger.error('Connection to peer failed', {
            hostId,
            error: error.message,
            connectionId: conn.connectionId,
          });
          reject(error);
        });
      });
    });
  }

  private setupConnection(conn: DataConnection): void {
    this.logger.debug('Setting up connection', {
      peerId: conn.peer,
      connectionId: conn.connectionId,
      isOpen: conn.open,
    });

    const peerConnection: PeerConnection = {
      id: conn.peer,
      connection: conn,
      status: 'connected',
      lastHeartbeat: Date.now(),
    };

    this.connections.set(conn.peer, peerConnection);
    this.logger.info('Peer connection established', {
      peerId: conn.peer,
      totalConnections: this.connections.size,
    });

    // Notify that we're connected to this specific peer
    this.notifyConnectionChange(conn.peer, true);

    conn.on('data', data => {
      this.logger.trace('Data received from peer', {
        peerId: conn.peer,
        dataSize: data instanceof Uint8Array ? data.length : 'unknown',
      });
      this.handleIncomingData(data as Uint8Array, conn.peer);
    });

    conn.on('close', () => {
      this.logger.info('Peer connection closed', { peerId: conn.peer });
      this.handleConnectionClose(conn.peer);
    });

    conn.on('error', error => {
      this.logger.error('Peer connection error', {
        peerId: conn.peer,
        error: error.message,
      });
      this.handleConnectionError(conn.peer);
    });
  }

  private handleIncomingData(data: Uint8Array, senderId: string): void {
    try {
      const message = decodeMessage(data);

      // Only log non-heartbeat messages to reduce noise
      if (message.type !== 'HEARTBEAT') {
        this.logger.debug('Message decoded successfully', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
          timestamp: message.timestamp,
        });
      }

      if (!isRecentMessage(message)) {
        this.logger.warn('Discarding old message', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
          timestamp: message.timestamp,
        });
        return;
      }

      // Update heartbeat timestamp
      const connection = this.connections.get(senderId);
      if (connection) {
        connection.lastHeartbeat = Date.now();
      }

      // Handle heartbeat messages
      if (message.type === 'HEARTBEAT') {
        // Remove trace logging for heartbeats to reduce noise
        this.sendHeartbeatResponse(senderId);
        return;
      }

      // Dispatch to handlers
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        this.logger.debug('Dispatching message to handler', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
        });
        handler(message, senderId);
      } else {
        this.logger.warn('No handler found for message type', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
        });
      }
    } catch (error) {
      this.logger.error('Error processing incoming data', {
        senderId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof ProtocolError) {
        this.logger.warn('Protocol error, sending error message', {
          senderId,
          errorMessage: error.message,
          errorCode: error.code,
        });
        this.sendErrorMessage(senderId, error.message, error.code);
      }
    }
  }

  private handleConnectionClose(peerId: string): void {
    this.logger.info('Handling connection close', { peerId });

    const connection = this.connections.get(peerId);
    if (connection) {
      connection.status = 'disconnected';
      this.logger.debug('Connection status updated to disconnected', {
        peerId,
      });
      // Notify that this specific peer disconnected
      this.notifyConnectionChange(peerId, false);
    } else {
      this.logger.warn('Connection close handled for unknown peer', { peerId });
    }
  }

  private handleConnectionError(peerId: string): void {
    this.logger.warn('Handling connection error', { peerId });

    const connection = this.connections.get(peerId);
    if (connection) {
      connection.status = 'error';
      this.logger.debug('Connection status updated to error', { peerId });
      // Notify that this specific peer had an error/disconnected
      this.notifyConnectionChange(peerId, false);
    } else {
      this.logger.warn('Connection error handled for unknown peer', { peerId });
    }
  }

  sendMessage(message: GameMessage, targetId?: string): void {
    try {
      const encodedMessage = encodeMessage(message);

      // Only log non-heartbeat messages to reduce noise
      if (message.type !== 'HEARTBEAT') {
        this.logger.debug('Sending message', {
          messageType: message.type,
          messageId: message.messageId,
          targetId: targetId || 'broadcast',
          timestamp: message.timestamp,
        });
      }

      if (targetId) {
        // Send to specific peer
        const connection = this.connections.get(targetId);
        if (connection?.connection.open) {
          try {
            connection.connection.send(encodedMessage);
            // Only log non-heartbeat message confirmations
            if (message.type !== 'HEARTBEAT') {
              this.logger.trace('Message sent to peer', {
                messageType: message.type,
                messageId: message.messageId,
                targetId,
              });
            }
          } catch (error) {
            this.logger.error('Failed to send message to peer', {
              messageType: message.type,
              messageId: message.messageId,
              targetId,
              error: error instanceof Error ? error.message : String(error),
            });
            this.handleConnectionError(targetId);
          }
        } else if (connection) {
          // Connection exists but is not open, handle as disconnected
          this.logger.warn('Attempted to send message to closed connection', {
            messageType: message.type,
            messageId: message.messageId,
            targetId,
          });
          this.handleConnectionClose(targetId);
        } else {
          this.logger.warn('Attempted to send message to unknown peer', {
            messageType: message.type,
            messageId: message.messageId,
            targetId,
          });
        }
      } else {
        // Broadcast to all connected peers
        const connectedPeers = Array.from(this.connections.values()).filter(
          conn => conn.connection.open
        );

        // Only log non-heartbeat broadcasts
        if (message.type !== 'HEARTBEAT') {
          this.logger.debug('Broadcasting message to all peers', {
            messageType: message.type,
            messageId: message.messageId,
            peerCount: connectedPeers.length,
          });
        }

        connectedPeers.forEach(connection => {
          try {
            connection.connection.send(encodedMessage);
            // Only log non-heartbeat broadcast confirmations
            if (message.type !== 'HEARTBEAT') {
              this.logger.trace('Broadcast message sent to peer', {
                messageType: message.type,
                messageId: message.messageId,
                peerId: connection.id,
              });
            }
          } catch (error) {
            this.logger.error('Failed to send broadcast message to peer', {
              messageType: message.type,
              messageId: message.messageId,
              peerId: connection.id,
              error: error instanceof Error ? error.message : String(error),
            });
            this.handleConnectionError(connection.id);
          }
        });
      }
    } catch (error) {
      this.logger.error('Failed to encode/send message', {
        messageType: message.type,
        messageId: message.messageId,
        targetId: targetId || 'broadcast',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  onMessage(messageType: string, handler: PeerMessageHandler): void {
    this.logger.debug('Registering message handler', { messageType });
    this.messageHandlers.set(messageType, handler);
  }

  onStatusChange(handler: PeerStatusHandler): void {
    this.logger.debug('Registering status change handler');
    this.statusHandlers.add(handler);
  }

  onConnectionChange(handler: PeerConnectionHandler): void {
    this.logger.debug('Registering connection change handler');
    this.connectionHandlers.add(handler);
  }

  getConnectedPeers(): string[] {
    const connectedPeers = Array.from(this.connections.values())
      .filter(conn => {
        const isConnected = conn.status === 'connected' && conn.connection.open;

        // If connection appears disconnected but we haven't handled it yet, handle it now
        if (!isConnected && conn.status === 'connected') {
          this.logger.debug('Detected stale connection, handling close', {
            peerId: conn.id,
          });
          this.handleConnectionClose(conn.id);
        }

        return isConnected;
      })
      .map(conn => conn.id);

    this.logger.trace('Retrieved connected peers', {
      peerCount: connectedPeers.length,
      peers: connectedPeers,
    });

    return connectedPeers;
  }

  isConnectedToPeer(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    if (!connection) {
      this.logger.trace('Peer connection check: peer not found', { peerId });
      return false;
    }

    // Check both status and actual connection state
    const isConnected = connection.status === 'connected' && connection.connection.open;

    this.logger.trace('Peer connection check', {
      peerId,
      isConnected,
      status: connection.status,
      connectionOpen: connection.connection.open,
    });

    return isConnected;
  }

  private startHeartbeat(): void {
    this.logger.debug('Starting heartbeat system', {
      intervalMs: this.heartbeatIntervalMs,
    });

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
    const connectedPeers = this.getConnectedPeers();
    // Only log heartbeats if there are actually peers to send to, and reduce frequency
    if (connectedPeers.length > 0) {
      // Log heartbeats less frequently to reduce noise
      const now = Date.now();
      if (now % (this.heartbeatIntervalMs * 5) < this.heartbeatIntervalMs) {
        this.logger.debug('Sending heartbeats', {
          peerCount: connectedPeers.length,
        });
      }
    }

    this.sendMessage({
      type: 'HEARTBEAT',
      timestamp: Date.now(),
      messageId: `heartbeat-${Date.now()}`,
      payload: { gameId: this.myId },
    });
  }

  private sendHeartbeatResponse(targetId: string): void {
    // Remove trace logging for heartbeat responses to reduce noise
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
    let timeoutCount = 0;

    this.connections.forEach((connection, peerId) => {
      const timeSinceHeartbeat = now - connection.lastHeartbeat;
      if (timeSinceHeartbeat > timeout) {
        this.logger.warn('Connection health check failed - timeout detected', {
          peerId,
          timeSinceHeartbeat,
          timeout,
        });
        this.handleConnectionError(peerId);
        timeoutCount++;
      }
    });

    if (timeoutCount > 0) {
      this.logger.debug('Connection health check completed', {
        timeoutCount,
        totalConnections: this.connections.size,
      });
    }
  }

  private sendErrorMessage(targetId: string, message: string, code?: string): void {
    this.logger.warn('Sending error message to peer', {
      targetId,
      errorMessage: message,
      errorCode: code,
    });

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
    this.logger.debug('Notifying status change', {
      status,
      handlerCount: this.statusHandlers.size,
    });
    this.statusHandlers.forEach(handler => handler(status));
  }

  private notifyConnectionChange(peerId: string, connected: boolean): void {
    this.logger.debug('Notifying connection change', {
      peerId,
      connected,
      handlerCount: this.connectionHandlers.size,
    });
    this.connectionHandlers.forEach(handler => handler(peerId, connected));
  }

  isConnected(): boolean {
    return this.getConnectedPeers().length > 0;
  }

  disconnect(): void {
    this.logger.info('Disconnecting network manager', {
      connectionCount: this.connections.size,
      myId: this._myId,
    });

    // Notify that we're disconnecting
    this.notifyStatusChange('disconnected');

    if (this.heartbeatInterval) {
      this.logger.debug('Stopping heartbeat system');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all peer connections and notify about each one
    this.connections.forEach((connection, peerId) => {
      this.logger.debug('Closing connection to peer', { peerId });
      connection.connection.close();
      this.notifyConnectionChange(peerId, false);
    });
    this.connections.clear();

    if (this.peer) {
      this.logger.debug('Destroying peer instance', { myId: this._myId });
      this.peer.destroy();
      this.peer = null;
    }

    this.logger.info('Network manager disconnected successfully');
  }

  disconnectPeer(peerId: string): void {
    this.logger.info('Disconnecting specific peer', { peerId });

    const connection = this.connections.get(peerId);
    if (connection) {
      connection.connection.close();
      this.connections.delete(peerId);
      this.notifyConnectionChange(peerId, false);
      this.logger.debug('Peer disconnected successfully', { peerId });
    } else {
      this.logger.warn('Attempted to disconnect unknown peer', { peerId });
    }
  }

  private cleanupStaleConnections(): void {
    let cleanedUp = 0;

    // Clean up connections that are marked as connected but are actually closed
    this.connections.forEach((connection, peerId) => {
      if (connection.status === 'connected' && !connection.connection.open) {
        this.logger.debug('Cleaning up stale connection', { peerId });
        this.handleConnectionClose(peerId);
        cleanedUp++;
      }
    });

    if (cleanedUp > 0) {
      this.logger.debug('Stale connection cleanup completed', {
        cleanedUp,
        remainingConnections: this.connections.size,
      });
    }
  }
}
