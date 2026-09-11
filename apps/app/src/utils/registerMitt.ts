import mitt from "mitt";
// import IOSender from "@/utils/io-sender";

export const registerMitt = () => {
  window.emitter = mitt();
  window.emitter.on("post-inside-message", (data: any) => {
    window.parent.postMessage(JSON.parse(JSON.stringify(data)), "*");
  });

  window.addEventListener(
    "message",
    (e) => {
      e.preventDefault();
      window.emitter.emit("post-outside-message", { ...e.data });
    },
    false
  );

  // 单例模式实例化
  // const ioSender = new IOSender();
  // 发送消息到 Socket.IO 服务器
  // ioSender.sendResponse("测试数据：Hello from the client!");
};
