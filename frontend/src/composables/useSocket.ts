import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'

let socket: Socket | null = null
export const isConnected = ref(false)

export function useSocket() {
  function connect(token: string) {
    if (socket?.connected) return socket

    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => { isConnected.value = true })
    socket.on('disconnect', () => { isConnected.value = false })

    return socket
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    isConnected.value = false
  }

  function getSocket() { return socket }

  return { connect, disconnect, getSocket, isConnected }
}
