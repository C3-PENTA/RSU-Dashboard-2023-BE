import { IoAdapter } from '@nestjs/platform-socket.io';
import { Socket } from 'socket.io';

const verifyToken = (token: string) => {
  try {
    if (token != process.env.SOCKET_SECRET_TOKEN) {
      throw Error('Authentication error');
    }
  } catch (err) {
    throw err;
  }
};

export class AuthAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, { ...options, cors: true });
    server.use((socket: Socket, next) => {
      if (socket.handshake.headers && socket.handshake.headers.secret_token) {
        verifyToken(socket.handshake.headers.secret_token as string);
        next();
      } else {
        next(new Error('Authentication error'));
      }
    });
    return server;
  }
}
