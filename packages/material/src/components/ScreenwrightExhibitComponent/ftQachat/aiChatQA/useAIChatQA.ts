import { getUserInfo, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

export interface Props {
  element: ComponentType;
  isExtend?: boolean;
  textStyle?:
    | CSSProperties
    | {
        fontFamily: string;
        color: string;
        fontSize: string;
      };
  chatStyle?: Record<string, any>;
  questionAsk?: boolean;
  qaUrl?: string;
  defaultAsk?: string;
  inputBox?: string;
}

export interface MessageItem {
  role: string;
  content: string;
  loading?: boolean;
  message?: any;
  selection?: string[] | null;
}

export interface ParamsType {
  history: MessageItem[];
  query: string;
  token: string;
  type: string;
  url: string;
  password: string;
  username: string;
}

export const useAIChatQA = (props: Props) => {
  const userInfo = getUserInfo<any>();
  const { isBuild, isShare } = useBaseData(props.element);
  const message = ref<string>("");
  const isLoading = ref<boolean>(false);
  const contentTimer = ref<NodeJS.Timeout | null>(null);
  const placeholder = ref<string>("问点什么...");
  const messageList = ref<MessageItem[]>([
    {
      role: "assistant",
      content: "您好，我是小云，请问有什么可以帮到您？",
    },
  ]);
  const tempMessage = ref<MessageItem[]>([]);
  //   const tModuleList = ref<MessageItem[]>([])
  //   const prevConfig = ref<any>(null)
  //   const chatFileInfo = ref<ChatFileInfoType>({ name: "", token: "" })
  //   const chatComponentIds = ref<chatComponentIdsItem>({ ids: [], theme: "default" })
  //   const countLayersNumber = ref<number>(-1)
  //   const currentModelValue = ref<string>("")
  const defaultAskContent = ref<string>(
    `。回答完毕后，然后基于回答内容给出3个我可能感兴趣的问题，请确保问题不重复，问题不要超过15个字，不涉及敏感内容。`,
  );
  const streamData = ref<string>("");
  const isStreaming = ref<boolean>(false);
  const reader = ref<any>(null);

  const username = computed(() => {
    return userInfo?.userName || "You";
  });

  const stopStream = () => {
    isStreaming.value = false;
    if (reader.value) {
      reader.value.cancel(); // 取消读取
      reader.value = null;
    }
  };

  const extractQuestions = (msg: string) => {
    const questionItems = msg.match(/\d+[.、]\s*[^.\d]+?(？|\?|$)/g);
    if (!questionItems) {
      return [];
    }
    return questionItems.map((q) => q.replace(/^\d+[.、]\s*/, "").trim());
  };

  const handleDelete = () => {
    tempMessage.value.splice(0, tempMessage.value.length);
    messageList.value.splice(0, messageList.value.length);
    // prevConfig.value = null
    // countLayersNumber.value = -1
    isLoading.value = false;
    clearInterval(contentTimer.value as NodeJS.Timeout);
  };
  const handleInput = () => {
    message.value = message.value.replace(/\n/g, "");
  };

  return {
    message,
    isLoading,
    contentTimer,
    placeholder,
    messageList,
    tempMessage,
    // tModuleList,
    // prevConfig,
    // chatFileInfo,
    // chatComponentIds,
    // countLayersNumber,
    // currentModelValue,
    defaultAskContent,
    streamData,
    isStreaming,
    reader,
    isBuild,
    isShare,
    username,
    handleInput,
    stopStream,
    extractQuestions,
    handleDelete,
  };
};
