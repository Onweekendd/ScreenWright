<template>
  <div class="aichat-QA-box" ref="aichatBox" :style="chatStyle">
    <div class="box-content" ref="msgLayout">
      <div :class="['content-msg', 'content-msg-' + item.role]" v-for="(item, i) in messageList" :key="i">
        <div class="msg-head">
          <span
            :class="{
              'span-assistant': item.role == 'assistant',
              active: item.role == 'assistant' && item.loading
            }"
          />
        </div>
        <div class="msg-text">
          <!-- <div class="text-name">{{ item.role == "user" ? username : "chatBI" }}</div> -->
          <div class="text-view" :style="textStyle">
            <span v-if="item.content">
              <p>{{ item.role == "user" ? item.content : "" }}</p>
              <markdownView :ref="'md' + i" v-show="item.role != 'user'" :content="item.content" :typingSpeed="25" />
            </span>
            <template v-if="item.role == 'assistant' && item.selection">
              <div class="selection-list">
                <div class="selection-list-item" v-for="citem in item.selection" :key="citem">
                  <span @click="handleEnter(citem)">{{ citem }}</span>
                </div>
              </div>
            </template>
            <div v-if="item.role == 'assistant' && item.loading" class="loading-animation">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="box-title">
      <el-input
        v-model="message"
        type="textarea"
        :rows="1"
        :autosize="{ minRows: 1, maxRows: 5 }"
        resize="none"
        :placeholder="placeholder"
        @input="handleInput"
        @keyup.enter="handleEnter()"
      />
      <Icon
        type="iconfont-xiangshangjiantou"
        :class="['btn-enter ', !message ? 'not-pointer' : '']"
        @click="handleEnter()"
      />
      <Icon
        type="iconfont-shanchu1"
        :class="['btn-enter btn-enter-delete ', !messageList.length ? 'not-pointer' : '']"
        @click="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import Icon from "@editor/base/Icon/index.vue";
import { getToken } from "@screenwright/composables";
import { BaseName } from "@screenwright/composables";

import markdownView from "./markdownView.vue";
import type { ParamsType, Props } from "./useAIChatQA";
import { useAIChatQA } from "./useAIChatQA";

const { VITE_API_BASE_URL } = process.env;
const BASEURL = VITE_API_BASE_URL;

const props = defineProps<Props>();

console.log(props, "props");

const {
  isBuild,
  isShare,
  streamData,
  placeholder,
  defaultAskContent,
  message,
  messageList,
  tempMessage,
  isLoading,
  isStreaming,
  contentTimer,
  reader,
  // username,
  handleInput,
  stopStream,
  extractQuestions,
  handleDelete
} = useAIChatQA(props);
//页面滚动
const msgLayout = ref<HTMLDivElement | null>(null);

const setScrollBottom = async () => {
  await nextTick();

  setTimeout(() => {
    if (msgLayout.value === null) return;
    msgLayout.value.scrollTo({
      top: msgLayout.value.scrollHeight, // 设置要滚动到的位置
      behavior: "smooth" // 添加过渡效果
    });
  }, 200);
};

const parseSSEEvents = (chunk: string) => {
  // 按 "\n\n" 分割事件（每个事件以空行结尾）
  const events = chunk.split("\n\n");
  events.forEach((event) => {
    if (event.trim() === "") return; // 忽略空事件
    // 提取 data 字段（支持多行 data）
    const data = event
      .split("\n")
      // .filter(line => line.startsWith("data:"))
      .map((line) => line.replace("data:", "").trim())
      .join("\n");
    if (data && data !== "[DONE]") {
      try {
        streamData.value += data;
        messageList.value[messageList.value.length - 1].content += data;

        setScrollBottom();
      } catch (e) {
        console.error("解析 JSON 失败:", e);
      }
    }
  });
};

// 设置流文本消息问题
const setStreamTextEnd = (msg: string) => {
  isLoading.value = false;
  messageList.value[messageList.value.length - 1].loading = false;

  // 记录一次assistant回答后的内容
  tempMessage.value.push({
    role: "assistant",
    content: msg
  });
  const extendQuestions = extractQuestions(msg);
  if (props.questionAsk && extendQuestions.length) {
    messageList.value[messageList.value.length - 1].selection = extendQuestions;
  }
  setScrollBottom();
};

// 设置纯文本消息
const setPlainTextMessage = (msg: string, extend?: any) => {
  let index = 0;

  clearInterval(contentTimer.value as NodeJS.Timeout);
  const extendQuestions = extractQuestions(msg);
  const subStringMsg = extendQuestions.length ? msg.slice(0, msg.indexOf(extendQuestions[0]) - 3) : msg;
  let curTxt = "";
  contentTimer.value = setInterval(() => {
    curTxt += subStringMsg[index++];
    messageList.value[messageList.value.length - 1].content = curTxt;
    if (index >= subStringMsg.length) {
      clearInterval(contentTimer.value as NodeJS.Timeout);
      contentTimer.value = null;
      isLoading.value = false;
      messageList.value[messageList.value.length - 1].loading = false;

      if (extend && extendQuestions.length) {
        messageList.value[messageList.value.length - 1].selection = extendQuestions;
      }
    }
    setScrollBottom();
  }, 25);
};

const startStream = async (params: ParamsType) => {
  isStreaming.value = true;
  const url = `${BASEURL}${isShare ? BaseName.System : BaseName.Online}/chatBI/chat`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream"
  };

  if (!isShare) {
    headers["X-Access-Token"] = getToken() || "";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: params,
        path: "/chatbi",
        applicationCode: "BI"
      })
    });

    // 2. 获取可读流和文本解码器
    reader.value = (response as any).body.getReader();
    const decoder = new TextDecoder();
    messageList.value[messageList.value.length - 1].content = "";

    // 3. 持续读取数据块
    while (isStreaming.value) {
      const { done, value } = await reader.value.read();
      if (done) {
        stopStream();
        setStreamTextEnd(streamData.value);
        streamData.value = "";
        break;
      }

      // 4. 解码数据并处理事件
      const chunk = decoder.decode(value);
      parseSSEEvents(chunk);
    }
  } catch (error) {
    console.error("流请求失败:", error);
    stopStream();
    setPlainTextMessage("抱歉，我暂时无法回答您的问题!");
  }
};

const handleEnter = (msg?: string | Event) => {
  if (msg && typeof msg === "object" && msg instanceof Event) {
    msg = undefined;
  }

  if ((msg || message.value) && !isLoading.value) {
    // 插到消息列表
    const messageInfo = {
      role: "user",
      content: msg || cloneDeep(message.value)
    };
    messageList.value.push(messageInfo);

    messageList.value.push({
      role: "assistant",
      content: "",
      loading: true,
      message: null,
      selection: null
    });

    setScrollBottom();
    isLoading.value = true;
    message.value = "";

    const params: ParamsType = {
      history: [...tempMessage.value],
      query: messageInfo.content + (props.questionAsk ? defaultAskContent.value : ""),
      token: (getToken() || props.element.id || "2025").toString(),
      type: "stream",
      url: "",
      password: "",
      username: ""
    };

    // 插到历史记录
    tempMessage.value.push(messageInfo);
    startStream(params);
  }
};

onMounted(() => {
  if (props.defaultAsk && !isBuild.value) {
    // 默认提问词
    messageList.value = [];
    handleEnter(props.defaultAsk);
  }
});
</script>

<style lang="scss" scoped>
.aichat-QA-box {
  width: 500px;
  height: 600px;
  padding: 10px 0;
  font-size: 30px;
  flood-color: #ffffff;
  // border-radius: 5px;
  overflow: hidden;
  --compsize-w: 450px;
  --compsize-h: 225px;
  // background: url(/img/bichat_bg.ad110245.jpg) no-repeat;
  background-size: 100% 100%;
  :deep(.el-textarea) {
    padding: 1px 1px;
    // border: 1px solid #333543;
    width: 100%;
    // background-color: rgba(26, 30, 39, 0.5);
    // background: linear-gradient(180deg, #1D1F27, #1D1F27);
    background: linear-gradient(180deg, #6095ff, #4d50ae);
    border-radius: 10px;
    // &:hover {
    //   background: linear-gradient(180deg, #6095FF, #4D50AE);
    // }
    .el-textarea__inner {
      // resize: none;
      border: none;
      padding: 0 10px;
      border-radius: 8px;
      font-family:
        Source Han Sans CN-Regular,
        Source Han Sans CN;
      background-color: #394269 !important;
      color: #ffffff !important;
      font-size: 14px;
      height: 36px;
      line-height: 36px;
      &::-webkit-input-placeholder {
        color: #859094 !important;
      }
    }
  }
  .box-title {
    padding: 0 20px 0 20px;
    margin-bottom: 10px;
    position: absolute;
    width: 100%;
    bottom: 16px;
    left: 0;

    .btn-enter {
      cursor: pointer;
      padding: 5px 5px;
      color: #dfe0e3;
      position: absolute;
      right: 50px;
      bottom: 5px;
      font-size: 16px;
      &.btn-enter-delete {
        right: 20px;
        z-index: 10;
      }
    }
    .toolbar-box {
      background-color: #1a1e27;
      padding: 5px 5px;
      display: flex;
      flex-direction: column;
      border-radius: 5px;
      position: absolute;
      // bottom: 26px;
      right: -8px;
      & > div,
      & > span {
        margin: 2px 2px;
        width: fit-content;
        height: 16px;
        line-height: 16px;
        cursor: pointer;
        // background-color: #3d404c;
        padding: 5px 5px;
        border-radius: 5px;
      }
      :v-deep(.el-upload) > span {
        padding: 0;
      }
    }
  }
  .box-content {
    height: calc(100% - 75px);
    padding: 0 20px 0 20px;
    overflow-x: hidden;
    overflow-y: auto;
    // overflow: auto;
    position: relative;
    z-index: 1;
    &::-webkit-scrollbar {
      width: 0px;
    }
    .content-msg {
      display: flex;
      margin: 10px 0 20px 0;
      &.content-msg-assistant {
        margin: 10px 0 0 0;
      }
    }
    .msg-head {
      width: 36px;
      & > span {
        width: 52.8px;
        height: 41.6px;
        display: inline-block;
        border-radius: 50%;
        overflow: hidden;
        color: #bfbfbf;
        margin: 0 5px;
        text-align: center;
        line-height: 30px;
        font-size: 14px;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        background-image: url("../assets/AI_me.png");
        transform: translateX(-30px);
      }
      .span-assistant {
        background-image: url("../assets/AI_head.png");
        &.active {
          background-image: url("../assets/AI_head_active.png");
        }
      }
    }
    .msg-text {
      width: calc(100% - 36px);
      letter-spacing: 1px;
      .text-name {
        color: #bfbfbf;
        font-size: 13px;
        height: 10px;
      }
      .text-view {
        color: #bfbfbf;
        font-size: 13px;
        width: calc(100% - 4px);
        & > span {
          word-wrap: normal;
          tab-size: 4;
          text-align: left;
          white-space: pre-line; // pre-warp
          word-break: normal;
          word-spacing: normal;
        }
        :deep(.markdown-view) {
          ol > li {
            transform: translateX(1em);
          }
        }
      }
      .view-box {
        max-width: var(--compsize-w);
        max-height: var(--compsize-h);
        cursor: pointer;
        & > div {
          pointer-events: none !important;
        }
      }
    }
  }
  .selection-list {
    .selection-list-item {
      cursor: pointer;
      width: fit-content;
      border-radius: 8px;
      letter-spacing: 1px;
      padding: 2px 10px;
      margin: 5px 0;
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid #303656;
      background-color: #38416e;
      &:hover {
        color: #6095ff;
        border-color: #6095ff;
        background-color: #38416e;
      }
    }
  }
}

.loading-animation {
  text-align: left;
  display: inline-block;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url("../assets/AI_loading.png");
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: transparent;
    border-radius: 50%;
    margin: 0 5px;
    animation: pulse 1s infinite;
  }
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.5);
    }
    100% {
      transform: scale(1);
    }
  }
}
</style>
