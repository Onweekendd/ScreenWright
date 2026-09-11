// PeerStream 相关类型定义

/**
 * 特殊按键码映射
 */
export interface SpecialKeyCodes {
  Backspace: 8
  ShiftLeft: 16
  ControlLeft: 17
  AltLeft: 18
  ShiftRight: 253
  ControlRight: 254
  AltRight: 255
}

/**
 * 鼠标按键映射
 */
export interface MouseButton {
  MainButton: 0 // 左键
  AuxiliaryButton: 1 // 滚轮键
  SecondaryButton: 2 // 右键
  FourthButton: 3 // 浏览器后退键
  FifthButton: 4 // 浏览器前进键
}

/**
 * 鼠标按键掩码
 */
export interface MouseButtonsMask {
  1: 0
  2: 2
  4: 1
  8: 3
  16: 4
}

/**
 * 接收消息类型枚举
 */
export interface ReceiveMessageType {
  QualityControlOwnership: 0
  Response: 1
  Command: 2
  FreezeFrame: 3
  UnfreezeFrame: 4
  VideoEncoderAvgQP: 5
  LatencyTest: 6
  InitialSettings: 7
  FileExtension: 8
  FileMimeType: 9
  FileContents: 10
  InputControlOwnership: 12
  CompositionStart: 64
  Protocol: 255
}

/**
 * 发送消息类型枚举
 */
export interface SendMessageType {
  // 控制消息 范围 = 0..49
  IFrameRequest: 0
  RequestQualityControl: 1
  FpsRequest: 2
  AverageBitrateRequest: 3
  StartStreaming: 4
  StopStreaming: 5
  LatencyTest: 6
  RequestInitialSettings: 7

  // 输入消息 范围 = 50..89
  // 通用输入消息 范围 = 50..59
  UIInteraction: 50
  Command: 51

  // 键盘输入消息 范围 = 60..69
  KeyDown: 60
  KeyUp: 61
  KeyPress: 62
  FindFocus: 63
  CompositionEnd: 64

  // 鼠标输入消息 范围 = 70..79
  MouseEnter: 70
  MouseLeave: 71
  MouseDown: 72
  MouseUp: 73
  MouseMove: 74
  MouseWheel: 75

  // 触摸输入消息 范围 = 80..89
  TouchStart: 80
  TouchEnd: 81
  TouchMove: 82

  // 手柄输入消息 范围 = 90..99
  GamepadButtonPressed: 90
  GamepadButtonReleased: 91
  GamepadAnalog: 92
}

/**
 * WebSocket消息类型
 */
export interface WebSocketMessage {
  type:
    | "offer"
    | "answer"
    | "iceCandidate"
    | "playerqueue"
    | "seticeServers"
    | "playerConnected"
    | "ping"
    | "pong"
    | "ueDisConnected"
  [key: string]: any
}

/**
 * ICE候选者消息
 */
export interface IceCandidateMessage extends WebSocketMessage {
  type: "iceCandidate"
  candidate: RTCIceCandidate
}

/**
 * SDP消息（offer/answer）
 */
export interface SdpMessage extends WebSocketMessage {
  type: "offer" | "answer"
  sdp: string
}

/**
 * 玩家队列消息
 */
export interface PlayerQueueMessage extends WebSocketMessage {
  type: "playerqueue"
  // 添加其他队列相关属性
}

/**
 * 设置ICE服务器消息
 */
export interface SetIceServersMessage extends WebSocketMessage {
  type: "seticeServers"
  iceServers: RTCIceServer[]
}

/**
 * 坐标标准化结果
 */
export interface NormalizedCoord {
  inRange: boolean
  x: number
  y: number
}

/**
 * 触摸手指标识符映射
 */
export interface FingerIds {
  [touchIdentifier: number]: number
}

/**
 * 命令消息
 */
export interface CommandMessage {
  command: string
  showOnScreenKeyboard?: boolean
  [key: string]: any
}

/**
 * 延迟测试时间
 */
export interface LatencyTimings {
  [key: string]: number
}

/**
 * 初始设置
 */
export interface InitialSettings {
  [key: string]: any
}

/**
 * PeerStream 自定义事件详情
 */
export interface PeerStreamEventDetail {
  message: string
  playerqueue: PlayerQueueMessage
  ueDisConnected: WebSocketMessage
  playerdisconnected: {}
}

/**
 * PeerStream 类接口
 */
export interface IPeerStream extends HTMLVideoElement {
  // WebRTC 相关属性
  ws: WebSocket
  pc: RTCPeerConnection
  dc: RTCDataChannel
  audio?: HTMLAudioElement

  // 状态属性
  VideoEncoderQP?: number
  QualityControlOwnership?: boolean
  InputControlOwnership?: boolean
  InitialSettings?: InitialSettings
  enableChinese?: boolean
  keysDown: Set<number>
  reconnect?: NodeJS.Timeout

  // 生命周期方法
  connectedCallback(): Promise<void>
  disconnectedCallback(): void
  adoptedCallback(): void
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void

  // WebRTC 支持检查
  checkWebRTCSupport(): boolean

  // WebSocket 和数据通道处理
  onWebSocketMessage(msg: string): Promise<void>
  onDataChannelMessage(data: ArrayBuffer): void

  // 连接设置
  setupVideo(): void
  setupDataChannel(e: RTCDataChannelEvent): void
  setupDataChannel_ue4(label?: string): void
  setupPeerConnection(): void
  setupPeerConnection_ue4(): void
  setupOffer(): Promise<void>

  // 事件注册
  registerKeyboardEvents(): void
  registerTouchEvents(): void
  registerDbTouchEvents(): void
  registerFakeMouseEvents(): void
  registerMouseHoverEvents(): void
  registerPointerLockEvents(): void
  registerMouseEnterAndLeaveEvents(): void

  // 输入事件发射
  emitMouseMove(x: number, y: number, deltaX: number, deltaY: number): void
  emitMouseDown(button: number, x: number, y: number): void
  emitMouseUp(button: number, x: number, y: number): void
  emitMouseWheel(delta: number, x: number, y: number): void
  emitTouchData(type: number, touches: TouchList, fingerIds: FingerIds): void
  emitMessage(msg: string | object, messageType?: number): Promise<string>

  // 坐标处理
  normalize(x: number, y: number): NormalizedCoord

  // 键盘事件处理器
  onkeydown: (e: KeyboardEvent) => void
  onkeyup: (e: KeyboardEvent) => void
  onkeypress: (e: KeyboardEvent) => void
  onblur: (e: FocusEvent) => void

  // 鼠标事件处理器
  onmousemove: (e: MouseEvent) => void
  onmousedown: (e: MouseEvent) => void
  onmouseup: (e: MouseEvent) => void
  onmouseenter: (e: MouseEvent) => void
  onmouseleave: (e: MouseEvent) => void
  oncontextmenu: (e: MouseEvent) => void
  onwheel: (e: WheelEvent) => void

  // 触摸事件处理器
  ontouchstart: (e: TouchEvent) => void
  ontouchend: (e: TouchEvent) => void
  ontouchmove: (e: TouchEvent) => void
}

/**
 * PeerStream 类构造函数
 */
export interface PeerStreamConstructor {
  new (): IPeerStream
}

/**
 * HTML元素标签映射
 */
declare global {
  interface HTMLElementTagNameMap {
    "peer-stream": IPeerStream
  }
}

// 常量导出
export declare const SpecialKeyCodes: SpecialKeyCodes
export declare const MouseButton: MouseButton
export declare const MouseButtonsMask: MouseButtonsMask
export declare const RECEIVE: ReceiveMessageType
export declare const SEND: SendMessageType

// 类导出
export declare const PeerStream: PeerStreamConstructor
