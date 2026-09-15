<template>
  <div class="ft-voice-control">
    <div
      class="ft-voice-control-icon"
      :class="{
        'component-bind-events': true,
        'has-bind': events?.length && isBuild.value,
        'has-encode': encodes?.length && isBuild.value
      }"
      :style="{
        cursor: `${isNotPointer ? 'not-allowed' : 'pointer'}`
      }"
      @click.stop="handelVoiceEvent"
    >
      <template v-if="!option.isWakeUp">
        <img v-if="!voiceStatus" :src="setMinioUrl(option.voiceImg)" alt="" />
        <img v-else :src="setMinioUrl(option.voiceStartImg)" alt="" />
      </template>
    </div>
    <div class="result-text" ref="resultTextRef" v-if="!isBuild.value && option.showResult" v-html="resultTextHtml" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import dayjs from "dayjs";
import { debounce } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData, Websocketconfig } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

//@ts-ignore
import * as RecorderInsModule from "./recorder-core.js";

const RecorderIns = RecorderInsModule.default || (window as any).RecorderIns;

defineOptions({
  name: "ftVoiceControl"
});
const { addEvent } = useActionEvent();
const props = defineProps<{
  element: ComponentType;
}>();

const { isBuild, events, encodes, option, handleEventAndCallbackEvent } = useBaseData(props.element);

// 声明emits
// const emit = defineEmits(["click"])

// 状态变量
const isNotPointer = ref(false);
const voiceStatus = ref(false);
const speechSokt = ref<any>(null);
const recorderObj = ref<any>(null);
const sampleBuf = ref(new Int16Array());
const resultText = ref("");
const resultTextHtml = computed(() => resultText.value.replace(/\n/g, "<br/>"));
const dataChart = ref<Array<{ value: string }>>([]);

// 生命周期钩子
onMounted(() => {
  if (!isBuild.value) {
    wsConnectMethod();
    initRecorder();
    addEvent({
      [`${interactiveEnum.FtVoiceControl}-${props.element.id}`]: {
        upodateVoiceState
      }
    });
  }
});

onBeforeUnmount(() => {
  if (speechSokt.value) {
    try {
      speechSokt.value.onclose();
    } catch (error) {
      console.error("Error closing websocket:", error);
    }
  }

  if (recorderObj.value) {
    try {
      recorderObj.value.close();
    } catch (error) {
      console.error("Error closing recorder:", error);
    }
  }
});

// 处理语音事件
const handelVoiceEvent = async () => {
  if (isNotPointer.value) return;
  isNotPointer.value = true;
  upodateVoiceState();
  await sleep(1000);
  isNotPointer.value = false;
};

// 回调事件
// const callbackEvent = (info: any) => {
//   emit("click", {
//     type: "sw-voice-control",
//     component: null,
//     value: info
//   })
// }

// 默认配置
const wsOpenConfig = () => {
  const { chunk_size, wav_name, chunk_interval, is_speaking, itn, mode, hotwords } = option.value;
  const request: any = {
    chunk_size,
    wav_name,
    chunk_interval,
    is_speaking,
    itn,
    mode
  };
  if (hotwords) request.hotwords = getHotwords(hotwords);

  if (speechSokt.value) {
    speechSokt.value.sendMsg(request);
  }
};

// 热词处理
const getHotwords = (val: string) => {
  const items = val.split(/[(\r\n)\r\n]+/); // split by \r\n
  const jsonresult: Record<string, number> = {};
  const regexNum = /^[0-9]*$/; // test number

  for (const item of items) {
    const result = item.split(" ");
    if (result.length >= 2 && regexNum.test(result[result.length - 1])) {
      let wordstr = "";
      for (let i = 0; i < result.length - 1; i++) wordstr = wordstr + result[i] + " ";

      jsonresult[wordstr.trim()] = parseInt(result[result.length - 1]);
    }
  }
  return JSON.stringify(jsonresult);
};

// 连接WebSocket
const wsConnectMethod = () => {
  const { asrUrl } = option.value;
  if (!asrUrl || !asrUrl.match(/wss:\S*|ws:\S*/)) {
    return;
  }
  try {
    speechSokt.value = new Websocketconfig({
      src: asrUrl
    });
    // 注册接收数据方法
    if (speechSokt.value) {
      speechSokt.value.localSocket(receiveWSMessage, null, wsOpenConfig);
    }
  } catch (error) {
    console.error("Error connecting to WebSocket:", error);
  }
};

// 接收WebSocket消息
const receiveWSMessageRaw = (info: any) => {
  console.log("receiveWSMessage", info, props.element.id, props.element.events);
  const { text, is_final, mode } = info || {};

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,
    throwValue: text
  });

  if (mode === "2pass-offline" && text && !is_final) {
    dataChart.value = [
      {
        value: text.replace(/\s+|[，。？、]/g, "")
      }
    ];
    if (option.value.showResult) {
      resultText.value =
        resultText.value + dayjs(new Date()).format("HH:mm:ss") + " " + text.replace(/\s+|[，。？、]/g, "") + "\n";
    }
  }
};

const receiveWSMessage = debounce(receiveWSMessageRaw, 1000);

// 发送消息
const sendMessage = (msg: any) => {
  if (!speechSokt.value) return;

  try {
    if (speechSokt.value.ws && speechSokt.value.ws.readyState === 1) {
      speechSokt.value.sendMsg(msg, true);
    } else {
      speechSokt.value.localSocket(receiveWSMessage, null, wsOpenConfig);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// 初始化录音
const initRecorder = () => {
  try {
    recorderObj.value = new RecorderIns({
      type: "pcm",
      bitRate: 16,
      sampleRate: 16000,
      onProcess: recorderProcess
    });
  } catch (error) {
    console.error("Error initializing recorder:", error);
  }
};

// 处理录音过程
const recorderProcess = (
  buffer: any,
  _powerLevel: any,
  _bufferDuration: any,
  bufferSampleRate: any,
  _newBufferIdx: any,
  _asyncEnd: any
) => {
  if (!speechSokt.value) return;

  try {
    const data_48k = buffer[buffer.length - 1];

    const array_48k = [data_48k];
    const data_16k = RecorderIns.SampleData(array_48k, bufferSampleRate, 16000).data;

    sampleBuf.value = Int16Array.from([...sampleBuf.value, ...data_16k]);
    const chunk_size = 960; // for asr chunk_size [5, 10, 5]
    while (sampleBuf.value.length >= chunk_size) {
      const sendBuf = sampleBuf.value.slice(0, chunk_size);
      sampleBuf.value = sampleBuf.value.slice(chunk_size, sampleBuf.value.length);
      sendMessage(sendBuf);
    }
  } catch (error) {
    console.error("Error processing recorder data:", error);
  }
};

// 更新语音状态
const upodateVoiceState = (value?: string) => {
  if (value) {
    // start stop
    voiceStatus.value = value === "start";
  } else {
    voiceStatus.value = !voiceStatus.value;
  }
};

// 开始录音
const startVoice = () => {
  if (!recorderObj.value) return;

  try {
    recorderObj.value.open(() => {
      recorderObj.value.start();
    });
  } catch (error) {
    console.error("Error starting voice:", error);
  }
};

// 停止录音
const stopVoice = () => {
  if (!recorderObj.value) return;

  try {
    recorderObj.value.close();
    sampleBuf.value = new Int16Array();
  } catch (error) {
    console.error("Error stopping voice:", error);
  }
};

// 监听语音状态变化
watch(
  () => voiceStatus.value,
  (v) => {
    console.log("语音状态变化", v);
    v ? startVoice() : stopVoice();
  }
);

// 监听数据变化
watch(
  () => dataChart.value,
  (val) => {
    if (val && val.length > 0) {
      if (events.value.length) {
        const { trigger } = events.value[0];
        if (trigger !== "dataChange") return;

        const filterEvents = events.value.filter((item: any) => item.trigger === "dataChange");

        if (filterEvents && filterEvents.length) {
          handleEventAndCallbackEvent({
            id: props.element.id,
            triggerType: EventTypeEnum.DataChange,
            events: props.element.events,

            throwValue: val[0]
          });
        }
      }
    }
  },
  { deep: true }
);

// 获取DOM引用
const resultTextRef = ref<HTMLElement | null>(null);

watch(resultText, async () => {
  await nextTick();
  if (resultTextRef.value) {
    resultTextRef.value.scrollTop = resultTextRef.value.scrollHeight;
  }
});
</script>

<style scoped lang="scss">
.ft-voice-control {
  position: relative;
  & > div,
  img {
    width: 100%;
    height: 100%;
  }
  .result-text {
    width: 300px;
    height: 120px; /* 你可以根据需要调整高度 */
    background-color: transparent !important;
    border-color: transparent !important;
    border: none !important;
    color: #ccc;
    white-space: pre-line; /* 保证\n换行 */
    overflow-y: auto; /* 超出时可滚动 */
    scrollbar-width: none; /* Firefox 隐藏滚动条 */
  }

  .result-text::-webkit-scrollbar {
    display: none;
  }
}
</style>
