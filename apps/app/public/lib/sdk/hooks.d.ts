import * as node_modules__screenwright_core_dist_events_CallbackArguments from 'node_modules/@screenwright/core/dist/events/CallbackArguments';
import * as _screenwright_core from '@screenwright/core';
import * as _screenwright_composables from '@screenwright/composables';
import { useEventHandling } from '@screenwright/composables';
import * as vue from 'vue';
import * as _screenwright_types_types_action from '@screenwright/types/types/action';
import * as _screenwright_types from '@screenwright/types';
import { ComponentType, SystemComponentProps, Action as Action$1, PanelState, FolderEnum, ActionAnimation, AllComponentType, Animation, BindComponent, Callback, CallbackManager, CallbackSource, CallbackTarget, ChildComponent, ComponentMinioAsset, Condition, DataRemark, DataSourceType, DataType, DbItem, AllEchartEnum, EncodeAction, EncodeEvent, Event as Event$1, ExhibitEnum, Filter, IotAddress, ListenArg, MinioResource, PanelEnum, StandardComponentType, TempPool, ThirdPartEnum, WebSocketDataSource, ExtendsChildComponentEnum, ExtendsEnum, IndicatorEnum, InteractiveEnum, MediaEnum, SceneEnum, TextEnum, ThreeComponentEnum, EventTypeEnum } from '@screenwright/types';

/**
 * 素材库文件分类
 */
declare enum FileTypeEnum {
    /** 个人大屏文件  只有当前大屏可用 */
    personalScreen = 1,
    /** 个人页面资产 所有大屏通用 */
    personalPageAssets = 2,
    /** 个人场景资产 */
    personalSceneAssets = 3,
    /** 城市编辑器资产 */
    cityEditorAssets = 4
}

/** UI渲染单项类型 */
interface MenuItemForRender {
    id?: number;
    title: string;
    name?: string;
    img: string;
    isVideo?: boolean | undefined | null;
    moduleId?: number;
    url?: string;
    fileType?: string;
    type?: string;
    assetType?: FileTypeEnum;
}

type ComponentPlacement = {
    parentId: number;
    parentType: "group";
} | {
    parentId: number;
    parentType: "dynamicPanel";
    stateId: string;
};
interface MoveComponentTarget {
    parentId: number;
    parentType: "group" | "dynamicPanel";
    stateId?: string;
}
interface MoveComponentsResult {
    success: boolean;
    message: string;
}
interface CreateComponentOptions {
    /** 组件的中文名称（title 字段） */
    componentTitle: string;
    componentConfig?: Partial<ComponentType>;
    placement?: ComponentPlacement;
}
interface CreateComponentResult {
    success: boolean;
    message: string;
    componentId?: number;
    /** 建好的那一份（含业务接口分配的真实 id）；回传给后端过 core 放进树并整屏落盘 */
    component?: ComponentType;
}
declare function useCreateComponent(): {
    createComponent: ({ componentConfig, componentTitle, placement }: CreateComponentOptions) => Promise<CreateComponentResult>;
    findMenuItemByName: (name: string) => MenuItemForRender | undefined;
    createComponentFromConfig: (config: SystemComponentProps | ComponentType, placement?: ComponentPlacement) => Promise<CreateComponentResult>;
    fixDataFilterRelationRecursive: (componentId: number) => Promise<void>;
    onDeleteComponent: (componentId: number, placement: ComponentPlacement) => Promise<{
        message: string;
        success: boolean;
    } | undefined>;
    moveComponents: (componentIds: number[], target?: MoveComponentTarget) => Promise<MoveComponentsResult>;
};

type Action = Required<Action$1>;

declare const renderFolderType: FolderEnum[];

declare enum ContextMenuType {
    TOP = "top",
    BOTTOM = "bottom",
    UP = "up",
    DOWN = "down",
    GROUP = "group",
    UN_GROUP = "unGroup",
    DEL = "delete",
    COPY = "copy",
    PASTE = "paste",
    COPY_STYLE = "copyStyle",
    PASTE_STYLE = "pasteStyle",
    SYNC_STYLE = "syncStyle",
    ADD_CASE = "addCase",
    ADD_PERSON_CASE = "addPersonCase",
    LOCK = "lock",
    UN_LOCK = "unLock",
    CLEAR = "clear",
    TranslateDynamicPanel = "translateDynamicPanel"
}
interface MenuOptionsItemType {
    label: string;
    key: ContextMenuType;
    icon: string;
    fnHandle?: (targetStatus?: PanelState) => void;
    disabled?: boolean;
    hidden?: boolean;
}
interface TargetChartType {
    hoverId?: number;
    selectId: string[];
}
declare enum EditCanvasTypeEnum {
    EDIT_LAYOUT_DOM = "editLayoutDom",
    EDIT_CONTENT_DOM = "editContentDom",
    OFFSET = "offset",
    SCALE = "scale",
    USER_SCALE = "userScale",
    LOCK_SCALE = "lockScale",
    IS_CREATE = "isCreate",
    IS_DRAG = "isDrag",
    IS_SELECT = "isSelect",
    IS_CODE_EDIT = "isCodeEdit"
}
declare enum MouseEventButton {
    LEFT = 1,
    RIGHT = 2
}
interface EditCanvasType {
    editLayoutDom: HTMLElement | null;
    editContentDom: HTMLElement | null;
    offset: number;
    userScale: number;
    lockScale: boolean;
    isCreate: boolean;
    isDrag: boolean;
    isSelect: boolean;
    isCodeEdit: boolean;
}
declare enum DragKeyEnum {
    DRAG_KEY = "ComponentData"
}
interface IComponent {
    width: number;
    height: number;
    name: string;
    prop: string;
}
declare enum direction {
    l = "l",
    t = "t",
    b = "b",
    r = "r",
    lt = "lt",
    rt = "rt",
    lb = "lb",
    rb = "rb"
}
interface LayerInfo {
    color: string;
    name: string;
    callBackField: string;
    childNodeField: string;
}
interface Scale {
    lock: boolean;
    origin: string;
    originGrid: OriginGrid;
    x: number;
    y: number;
}
interface OriginGrid {
    left: string;
    top: string;
}
interface Translate {
    toX: number;
    toY: number;
}
interface Ue4Config {
    messageName: string;
    messageJson: string;
    messageContent: string;
    messageType: string;
}
interface SceneObjectExplosion {
    index: string;
    lidName: string;
    baseName: string;
    type: string;
}

type CoreType_Action = Action;
declare const CoreType_ActionAnimation: typeof ActionAnimation;
declare const CoreType_AllComponentType: typeof AllComponentType;
declare const CoreType_Animation: typeof Animation;
declare const CoreType_BindComponent: typeof BindComponent;
declare const CoreType_Callback: typeof Callback;
declare const CoreType_CallbackManager: typeof CallbackManager;
declare const CoreType_CallbackSource: typeof CallbackSource;
declare const CoreType_CallbackTarget: typeof CallbackTarget;
declare const CoreType_ChildComponent: typeof ChildComponent;
declare const CoreType_ComponentMinioAsset: typeof ComponentMinioAsset;
declare const CoreType_ComponentType: typeof ComponentType;
declare const CoreType_Condition: typeof Condition;
type CoreType_ContextMenuType = ContextMenuType;
declare const CoreType_ContextMenuType: typeof ContextMenuType;
declare const CoreType_DataRemark: typeof DataRemark;
declare const CoreType_DataSourceType: typeof DataSourceType;
declare const CoreType_DataType: typeof DataType;
declare const CoreType_DbItem: typeof DbItem;
type CoreType_DragKeyEnum = DragKeyEnum;
declare const CoreType_DragKeyEnum: typeof DragKeyEnum;
type CoreType_EditCanvasType = EditCanvasType;
type CoreType_EditCanvasTypeEnum = EditCanvasTypeEnum;
declare const CoreType_EditCanvasTypeEnum: typeof EditCanvasTypeEnum;
declare const CoreType_EncodeAction: typeof EncodeAction;
declare const CoreType_EncodeEvent: typeof EncodeEvent;
declare const CoreType_Filter: typeof Filter;
type CoreType_IComponent = IComponent;
declare const CoreType_IotAddress: typeof IotAddress;
type CoreType_LayerInfo = LayerInfo;
declare const CoreType_ListenArg: typeof ListenArg;
type CoreType_MenuOptionsItemType = MenuOptionsItemType;
declare const CoreType_MinioResource: typeof MinioResource;
type CoreType_MouseEventButton = MouseEventButton;
declare const CoreType_MouseEventButton: typeof MouseEventButton;
declare const CoreType_PanelEnum: typeof PanelEnum;
type CoreType_Scale = Scale;
type CoreType_SceneObjectExplosion = SceneObjectExplosion;
declare const CoreType_StandardComponentType: typeof StandardComponentType;
type CoreType_TargetChartType = TargetChartType;
declare const CoreType_TempPool: typeof TempPool;
type CoreType_Translate = Translate;
type CoreType_Ue4Config = Ue4Config;
declare const CoreType_WebSocketDataSource: typeof WebSocketDataSource;
type CoreType_direction = direction;
declare const CoreType_direction: typeof direction;
declare const CoreType_renderFolderType: typeof renderFolderType;
declare namespace CoreType {
  export { type CoreType_Action as Action, CoreType_ActionAnimation as ActionAnimation, CoreType_AllComponentType as AllComponentType, CoreType_Animation as Animation, CoreType_BindComponent as BindComponent, CoreType_Callback as Callback, CoreType_CallbackManager as CallbackManager, CoreType_CallbackSource as CallbackSource, CoreType_CallbackTarget as CallbackTarget, CoreType_ChildComponent as ChildComponent, CoreType_ComponentMinioAsset as ComponentMinioAsset, CoreType_ComponentType as ComponentType, CoreType_Condition as Condition, CoreType_ContextMenuType as ContextMenuType, CoreType_DataRemark as DataRemark, CoreType_DataSourceType as DataSourceType, CoreType_DataType as DataType, CoreType_DbItem as DbItem, CoreType_DragKeyEnum as DragKeyEnum, AllEchartEnum as EchartEnum, type CoreType_EditCanvasType as EditCanvasType, CoreType_EditCanvasTypeEnum as EditCanvasTypeEnum, CoreType_EncodeAction as EncodeAction, CoreType_EncodeEvent as EncodeEvent, Event$1 as Event, ExhibitEnum as ExhibitEnumType, CoreType_Filter as Filter, FolderEnum as FolderType, type CoreType_IComponent as IComponent, CoreType_IotAddress as IotAddress, type CoreType_LayerInfo as LayerInfo, CoreType_ListenArg as ListenArg, type CoreType_MenuOptionsItemType as MenuOptionsItemType, CoreType_MinioResource as MinioResource, CoreType_MouseEventButton as MouseEventButton, CoreType_PanelEnum as PanelEnum, type CoreType_Scale as Scale, type CoreType_SceneObjectExplosion as SceneObjectExplosion, CoreType_StandardComponentType as StandardComponentType, type CoreType_TargetChartType as TargetChartType, CoreType_TempPool as TempPool, ThirdPartEnum as ThirdPartEnumType, type CoreType_Translate as Translate, type CoreType_Ue4Config as Ue4Config, CoreType_WebSocketDataSource as WebSocketDataSource, CoreType_direction as direction, ExtendsChildComponentEnum as extendsChildComponentEnumType, ExtendsEnum as extendsEnumType, IndicatorEnum as indicatorEnum, InteractiveEnum as interactiveEnum, MediaEnum as mediaEnum, CoreType_renderFolderType as renderFolderType, SceneEnum as sceneEnumType, TextEnum as textEnum, ThreeComponentEnum as threeComponentEnum };
}

declare const sdk: {
    useInitLargeScreenData: () => {
        detailInfo: vue.Ref<{
            layers: string[] | {
                [x: string]: any;
                id: number;
                component: {
                    prop: AllComponentType;
                    width: number;
                    height: number;
                    name: string;
                };
                group?: boolean | undefined;
                selected?: boolean | undefined;
                children?: {
                    [x: string]: any;
                    id: number;
                    component: {
                        prop: AllComponentType;
                        width: number;
                        height: number;
                        name: string;
                    };
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: /*elided*/ any[] | undefined;
                    name: string;
                    left: number;
                    top: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    option: any;
                    data: any;
                    img: string;
                    title: string;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataType: DataType;
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    url?: string | undefined;
                    path?: string | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: {
                        [x: string]: any;
                        id: string;
                        isEdit: boolean;
                        show: boolean;
                        showOperation: boolean;
                        type: string;
                        dataMethod: "get" | "post" | "put" | "delete";
                        dataType: number;
                        requestHeader: Record<string, any>;
                        requestBody: Record<string, any>;
                        crossOrigin: boolean;
                        needCookie: boolean;
                        autoRefresh: boolean;
                        sql: string;
                        component: {
                            prop: ExtendsChildComponentEnum | string;
                            width: number;
                            height: number;
                            name: string;
                        };
                        option: any;
                        name: string;
                        data: any;
                        img: string;
                        title: string;
                        path?: string | undefined;
                        url?: string | undefined;
                        parent?: number | undefined;
                        top: number;
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        left: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        unitPavenType?: "percent" | undefined;
                    }[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    parent?: number | undefined;
                    unitPavenType?: "percent" | undefined;
                    width?: never | undefined;
                    height?: never | undefined;
                    parentDynamicPanelId?: number[] | undefined;
                    parentEncodeId?: string | undefined;
                }[] | undefined;
                name: string;
                left: number;
                top: number;
                isLock?: boolean | undefined;
                zIndex: number;
                display: boolean;
                option: any;
                data: any;
                img: string;
                title: string;
                listenArgs: {
                    filterName: string;
                    usageStatus: boolean;
                    callbackFields: string[];
                    filterType?: boolean | undefined;
                }[];
                cbArgs: {
                    id: string;
                    name: string;
                    type: string;
                    method: string;
                    value: {
                        origin: {
                            displayName: "\u5B57\u6BB5\u503C";
                            type: "input";
                            value: string;
                        };
                        target: {
                            displayName: "\u53D8\u91CF\u540D";
                            type: "input";
                            value: string;
                        };
                    };
                }[];
                openFilter?: boolean | undefined;
                dataSource: Record<string, any> | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    name: string;
                    description: string;
                    type: string;
                    url: string;
                    dataGroupId: number | null;
                    fileName: string;
                    size: number;
                    charsetName: string;
                    layerIds: string;
                    config?: string | undefined;
                } | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    dataGroupId: number | null;
                    name: string;
                    description: string;
                    type: string;
                    desIp: string;
                    desPort: number;
                    localPort: number;
                    charsetName: string;
                    layerIds: number[];
                } | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    type: string;
                    name: string;
                    description: string;
                    config: string;
                    dataGroupId: number | null;
                    layerIds: string;
                    baseUrl: string;
                };
                dataType: DataType;
                dataRemark?: {
                    description?: string | undefined;
                    key: string;
                    map: string;
                    decription?: string | undefined;
                }[] | undefined;
                events: {
                    [x: string]: any;
                    trigger: EventTypeEnum;
                    name: string;
                    id: string;
                    conditionType: _screenwright_types.ConditionLogicTypeEnum;
                    conditions: {
                        id: string;
                        name: string;
                        code: string;
                        type: _screenwright_types.ConditionTypeEnum;
                        compare: _screenwright_types.ConditionCompareEnum;
                        expected: string;
                        field: string;
                        notSaved: boolean;
                        isExists: boolean;
                        tempPool: {
                            name: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            code: string;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            isExists: boolean;
                        };
                    }[];
                    actions: {
                        id: string;
                        name: string;
                        action: _screenwright_types.ActionTypeEnum;
                        actionData?: Record<string, any> | undefined;
                        animation?: {
                            delay: number;
                            duration: number;
                            timingFunction: _screenwright_types.timingFunctionType;
                            type: _screenwright_types.ActionAnimationTypeEnum;
                            idxValue: number | string;
                            isRename?: boolean | undefined;
                        } | undefined;
                        mapBox?: {
                            boxOffsetX: number;
                            boxOffsetY: number;
                        } | undefined;
                        layerInfo?: {
                            color: string;
                            name: string;
                            callBackField: string;
                            childNodeField: string;
                        } | undefined;
                        component: string[];
                        componentConfig?: {
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            name: string;
                            option: any;
                            top: number;
                            left: number;
                        } | undefined;
                        componentScope?: string | undefined;
                        stateId?: string | undefined;
                        sceneStatusName?: string | undefined;
                        switchSceneStatusDelay?: number | undefined;
                        timeFastIn?: number | undefined;
                        timeRewind?: number | undefined;
                        sceneLevelId?: number | undefined;
                        keyframesName?: string | undefined;
                        keyframesPlayDelay?: number | undefined;
                        stateAnimationName?: string | undefined;
                        animationState?: number | undefined;
                        stateAnimationPlayDelay?: number | undefined;
                        sceneObject?: {
                            nameList: string[];
                            name?: string | undefined;
                            objInfoList: any[];
                            visible: string;
                        } | undefined;
                        sceneObjectExplosion?: {
                            index: string;
                            lidName: string;
                            baseName: string;
                            type: string;
                        } | undefined;
                        sceneChildComponent?: {
                            nameList: string[];
                            childComponentInfoList: any[];
                            visible: string;
                        } | undefined;
                        mapChildComponent?: {
                            nameList: string[];
                            childComponentInfoList: any[];
                            visible: string;
                        } | undefined;
                        glMapRegionLift?: {
                            regionId: string;
                            adcode: string;
                            name: string;
                            height: number;
                            duration: number;
                        } | undefined;
                        glMapSceneRoam?: {
                            sceneId: string;
                        } | undefined;
                        glMapIconActive?: {
                            childId: string;
                            matchField: string;
                            matchValue: string;
                            matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                            eventField: string;
                            action: _screenwright_types_types_action.GlMapIconActiveAction;
                            exclusive: boolean;
                            clearWhenMiss: boolean;
                        } | undefined;
                        apiInstructionDetail?: string | undefined;
                        apiInstructionDelay?: number | undefined;
                        scale?: {
                            lock: boolean;
                            origin: string;
                            originGrid: {
                                left: string;
                                top: string;
                            };
                            x: number;
                            y: number;
                        } | undefined;
                        translate?: {
                            toX: number;
                            toY: number;
                        } | undefined;
                        encodeKey?: string | null | undefined;
                        ue4Config?: {
                            messageName: string;
                            messageJson: string;
                            messageContent: string;
                            messageType: string;
                        } | undefined;
                        blueprintKey?: string | undefined;
                        customActionType?: "component" | "message" | "statusAnimation" | undefined;
                        panelStatusAnimationId?: string | undefined;
                        panelStatusId?: string | undefined;
                        tcpudpConfig?: {
                            dataType: _screenwright_types.tcpudpDataTypeEnum;
                            dataSourceId: string;
                            dataSourceObj: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            } | null;
                            sendData: string;
                            sendType: string;
                            dataDelay: number;
                        } | undefined;
                        projectFunName?: string | undefined;
                        projectParamList?: any[] | undefined;
                        projectParamType?: string | undefined;
                        projectParamValue?: Record<string, any> | undefined;
                        projectParamCode?: string | undefined;
                        swiperCardTabsName?: string | undefined;
                        aiManMsgContent?: string | undefined;
                        setBroadcastId?: string | null | undefined;
                        videoStartTime?: number | undefined;
                        videoEndTime?: number | undefined;
                        option?: Record<string, any> | undefined;
                        currentpage?: number | undefined;
                        translation?: string | undefined;
                    }[];
                    btnObjs: any[];
                }[];
                encodes?: {
                    trigger: _screenwright_types.EncodeEventTypeEnum;
                    name: string;
                    id: string;
                    conditionType: _screenwright_types.ConditionLogicTypeEnum;
                    conditions: {
                        id: string;
                        name: string;
                        code: string;
                        type: _screenwright_types.ConditionTypeEnum;
                        compare: _screenwright_types.ConditionCompareEnum;
                        expected: string;
                        field: string;
                        notSaved: boolean;
                        isExists: boolean;
                        tempPool: {
                            name: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            code: string;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            isExists: boolean;
                        };
                    }[];
                    actions: {
                        id: string;
                        name: string;
                        action: string;
                        actionData: Record<string, any>;
                        component: string[];
                        componentConfig: {
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            name: string;
                            option: any;
                            top: number;
                            left: number;
                        };
                        componentScope: string;
                        encodeLabel: string | null;
                        encodeKey: string | null;
                        encodeValue: number[];
                    }[];
                }[] | undefined;
                url?: string | undefined;
                path?: string | undefined;
                dataQuery?: string | undefined;
                loadAnimation: {
                    type: string;
                    direction?: string | undefined;
                    duration: number;
                    delay: number;
                    timingFunction: string;
                    opacityOpen?: boolean | undefined;
                };
                presetChild?: {
                    [x: string]: any;
                    id: string;
                    isEdit: boolean;
                    show: boolean;
                    showOperation: boolean;
                    type: string;
                    dataMethod: "get" | "post" | "put" | "delete";
                    dataType: number;
                    requestHeader: Record<string, any>;
                    requestBody: Record<string, any>;
                    crossOrigin: boolean;
                    needCookie: boolean;
                    autoRefresh: boolean;
                    sql: string;
                    component: {
                        prop: ExtendsChildComponentEnum | string;
                        width: number;
                        height: number;
                        name: string;
                    };
                    option: any;
                    name: string;
                    data: any;
                    img: string;
                    title: string;
                    path?: string | undefined;
                    url?: string | undefined;
                    parent?: number | undefined;
                    top: number;
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: {
                        [x: string]: any;
                        id: number;
                        component: {
                            prop: AllComponentType;
                            width: number;
                            height: number;
                            name: string;
                        };
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        name: string;
                        left: number;
                        top: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        option: any;
                        data: any;
                        img: string;
                        title: string;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataType: DataType;
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        url?: string | undefined;
                        path?: string | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        parent?: number | undefined;
                        unitPavenType?: "percent" | undefined;
                        width?: never | undefined;
                        height?: never | undefined;
                        parentDynamicPanelId?: number[] | undefined;
                        parentEncodeId?: string | undefined;
                    }[] | undefined;
                    left: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: /*elided*/ any[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    unitPavenType?: "percent" | undefined;
                }[] | undefined;
                minioArr?: {
                    [x: string]: unknown;
                    id: number;
                }[] | undefined;
                parent?: number | undefined;
                unitPavenType?: "percent" | undefined;
                width?: never | undefined;
                height?: never | undefined;
                parentDynamicPanelId?: number[] | undefined;
                parentEncodeId?: string | undefined;
            }[];
            component?: Array<any> | undefined;
            config: string | Array<string | number>;
            name: string;
            detail: string | {
                width: string;
                height: string;
                scale: number;
                theme?: string | undefined;
                initLoad: boolean;
                minioIds?: Array<number | null> | undefined;
                backgroundImage: string;
                backgroundColor: string;
                showBackgroundImage: boolean;
                showScreenAdaptation: boolean;
                adaptationNorm: string;
                adaptationType: _screenwright_types.AdaptationType;
                showScreenFilter: boolean;
                screenFilterInfo: {
                    gaussianBlur: number;
                    brightness: number;
                    contrast: number;
                    grayscale: number;
                    hue: number;
                    saturate: number;
                    invert: number;
                    sepia: number;
                    hueRotate?: number | undefined;
                };
                showWaterMark: boolean;
                waterMark: {
                    text: string;
                    fontFamily: string;
                    fontStyle: string;
                    fontWeight: string;
                    fontSize: number;
                    color: string;
                    degree?: number | undefined;
                };
                gridDistance: number;
                query: Record<string, any>;
                controlWebsocketUrl: string;
                heartbeatInterval: number;
                terminalEnableArr: _screenwright_types.TerminalEnableArr;
                name: string;
                mark?: Record<string, any> | undefined;
                isEncodedControl?: boolean | undefined;
                zIndexMap?: Record<string, any> | undefined;
            };
            backgroundUrl: string | null;
            id: number;
            invitationCode: string;
            status: boolean | null;
            type: number;
            versionCode: string;
            versionDesc: string | null;
            dataFilterArr: string | Record<string, Filter>;
            userId: number;
            sceneId?: number | undefined;
            sceneVersionCode?: string | undefined;
            updatedBy: string;
            updatedTime: string;
            encodedControl: string | string[];
            aniFrameSet: string | {
                animationList?: {
                    id: string;
                    name: string;
                    componentSetting: {
                        id: number;
                        animationType: _screenwright_types.AnimationType;
                        direction: _screenwright_types.AnimationDirection;
                        timingFunction: _screenwright_types.TimingFunctionType;
                        duration: number;
                        delay: number;
                        iterationCount?: number | undefined;
                        type: "load" | "unload" | "none";
                    }[];
                    isEnable?: boolean | undefined;
                    panelId?: number | undefined;
                    statusId?: string | undefined;
                    isRename?: boolean | undefined;
                }[] | undefined;
                activeAnimationList?: {
                    panelId?: number | undefined;
                    statusId?: string | undefined;
                    animationId: string;
                    type: "load" | "unload";
                }[] | undefined;
            };
            statusAnimation: string | {
                animations?: {
                    [animationId: string]: _screenwright_types.AnimationInfo;
                } | undefined;
                statusAnimations?: {
                    [animationId: string]: {
                        [statusId: string]: _screenwright_types.StatusAnimationMapping;
                    };
                } | undefined;
                componentAnimations?: {
                    [animationId: string]: {
                        [statusId: string]: {
                            [componentId: string]: _screenwright_types.ComponentAnimationConfig;
                        };
                    };
                } | undefined;
            };
        }, _screenwright_types.LargeScreeInfo | {
            layers: string[] | {
                [x: string]: any;
                id: number;
                component: {
                    prop: AllComponentType;
                    width: number;
                    height: number;
                    name: string;
                };
                group?: boolean | undefined;
                selected?: boolean | undefined;
                children?: {
                    [x: string]: any;
                    id: number;
                    component: {
                        prop: AllComponentType;
                        width: number;
                        height: number;
                        name: string;
                    };
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: /*elided*/ any[] | undefined;
                    name: string;
                    left: number;
                    top: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    option: any;
                    data: any;
                    img: string;
                    title: string;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataType: DataType;
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    url?: string | undefined;
                    path?: string | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: {
                        [x: string]: any;
                        id: string;
                        isEdit: boolean;
                        show: boolean;
                        showOperation: boolean;
                        type: string;
                        dataMethod: "get" | "post" | "put" | "delete";
                        dataType: number;
                        requestHeader: Record<string, any>;
                        requestBody: Record<string, any>;
                        crossOrigin: boolean;
                        needCookie: boolean;
                        autoRefresh: boolean;
                        sql: string;
                        component: {
                            prop: ExtendsChildComponentEnum | string;
                            width: number;
                            height: number;
                            name: string;
                        };
                        option: any;
                        name: string;
                        data: any;
                        img: string;
                        title: string;
                        path?: string | undefined;
                        url?: string | undefined;
                        parent?: number | undefined;
                        top: number;
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        left: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        unitPavenType?: "percent" | undefined;
                    }[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    parent?: number | undefined;
                    unitPavenType?: "percent" | undefined;
                    width?: never | undefined;
                    height?: never | undefined;
                    parentDynamicPanelId?: number[] | undefined;
                    parentEncodeId?: string | undefined;
                }[] | undefined;
                name: string;
                left: number;
                top: number;
                isLock?: boolean | undefined;
                zIndex: number;
                display: boolean;
                option: any;
                data: any;
                img: string;
                title: string;
                listenArgs: {
                    filterName: string;
                    usageStatus: boolean;
                    callbackFields: string[];
                    filterType?: boolean | undefined;
                }[];
                cbArgs: {
                    id: string;
                    name: string;
                    type: string;
                    method: string;
                    value: {
                        origin: {
                            displayName: "\u5B57\u6BB5\u503C";
                            type: "input";
                            value: string;
                        };
                        target: {
                            displayName: "\u53D8\u91CF\u540D";
                            type: "input";
                            value: string;
                        };
                    };
                }[];
                openFilter?: boolean | undefined;
                dataSource: Record<string, any> | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    name: string;
                    description: string;
                    type: string;
                    url: string;
                    dataGroupId: number | null;
                    fileName: string;
                    size: number;
                    charsetName: string;
                    layerIds: string;
                    config?: string | undefined;
                } | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    dataGroupId: number | null;
                    name: string;
                    description: string;
                    type: string;
                    desIp: string;
                    desPort: number;
                    localPort: number;
                    charsetName: string;
                    layerIds: number[];
                } | {
                    createdBy: string;
                    createdTime: string;
                    updatedBy: string;
                    updatedTime: string;
                    id: number;
                    userId: number;
                    type: string;
                    name: string;
                    description: string;
                    config: string;
                    dataGroupId: number | null;
                    layerIds: string;
                    baseUrl: string;
                };
                dataType: DataType;
                dataRemark?: {
                    description?: string | undefined;
                    key: string;
                    map: string;
                    decription?: string | undefined;
                }[] | undefined;
                events: {
                    [x: string]: any;
                    trigger: EventTypeEnum;
                    name: string;
                    id: string;
                    conditionType: _screenwright_types.ConditionLogicTypeEnum;
                    conditions: {
                        id: string;
                        name: string;
                        code: string;
                        type: _screenwright_types.ConditionTypeEnum;
                        compare: _screenwright_types.ConditionCompareEnum;
                        expected: string;
                        field: string;
                        notSaved: boolean;
                        isExists: boolean;
                        tempPool: {
                            name: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            code: string;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            isExists: boolean;
                        };
                    }[];
                    actions: {
                        id: string;
                        name: string;
                        action: _screenwright_types.ActionTypeEnum;
                        actionData?: Record<string, any> | undefined;
                        animation?: {
                            delay: number;
                            duration: number;
                            timingFunction: _screenwright_types.timingFunctionType;
                            type: _screenwright_types.ActionAnimationTypeEnum;
                            idxValue: number | string;
                            isRename?: boolean | undefined;
                        } | undefined;
                        mapBox?: {
                            boxOffsetX: number;
                            boxOffsetY: number;
                        } | undefined;
                        layerInfo?: {
                            color: string;
                            name: string;
                            callBackField: string;
                            childNodeField: string;
                        } | undefined;
                        component: string[];
                        componentConfig?: {
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            name: string;
                            option: any;
                            top: number;
                            left: number;
                        } | undefined;
                        componentScope?: string | undefined;
                        stateId?: string | undefined;
                        sceneStatusName?: string | undefined;
                        switchSceneStatusDelay?: number | undefined;
                        timeFastIn?: number | undefined;
                        timeRewind?: number | undefined;
                        sceneLevelId?: number | undefined;
                        keyframesName?: string | undefined;
                        keyframesPlayDelay?: number | undefined;
                        stateAnimationName?: string | undefined;
                        animationState?: number | undefined;
                        stateAnimationPlayDelay?: number | undefined;
                        sceneObject?: {
                            nameList: string[];
                            name?: string | undefined;
                            objInfoList: any[];
                            visible: string;
                        } | undefined;
                        sceneObjectExplosion?: {
                            index: string;
                            lidName: string;
                            baseName: string;
                            type: string;
                        } | undefined;
                        sceneChildComponent?: {
                            nameList: string[];
                            childComponentInfoList: any[];
                            visible: string;
                        } | undefined;
                        mapChildComponent?: {
                            nameList: string[];
                            childComponentInfoList: any[];
                            visible: string;
                        } | undefined;
                        glMapRegionLift?: {
                            regionId: string;
                            adcode: string;
                            name: string;
                            height: number;
                            duration: number;
                        } | undefined;
                        glMapSceneRoam?: {
                            sceneId: string;
                        } | undefined;
                        glMapIconActive?: {
                            childId: string;
                            matchField: string;
                            matchValue: string;
                            matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                            eventField: string;
                            action: _screenwright_types_types_action.GlMapIconActiveAction;
                            exclusive: boolean;
                            clearWhenMiss: boolean;
                        } | undefined;
                        apiInstructionDetail?: string | undefined;
                        apiInstructionDelay?: number | undefined;
                        scale?: {
                            lock: boolean;
                            origin: string;
                            originGrid: {
                                left: string;
                                top: string;
                            };
                            x: number;
                            y: number;
                        } | undefined;
                        translate?: {
                            toX: number;
                            toY: number;
                        } | undefined;
                        encodeKey?: string | null | undefined;
                        ue4Config?: {
                            messageName: string;
                            messageJson: string;
                            messageContent: string;
                            messageType: string;
                        } | undefined;
                        blueprintKey?: string | undefined;
                        customActionType?: "component" | "message" | "statusAnimation" | undefined;
                        panelStatusAnimationId?: string | undefined;
                        panelStatusId?: string | undefined;
                        tcpudpConfig?: {
                            dataType: _screenwright_types.tcpudpDataTypeEnum;
                            dataSourceId: string;
                            dataSourceObj: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            } | null;
                            sendData: string;
                            sendType: string;
                            dataDelay: number;
                        } | undefined;
                        projectFunName?: string | undefined;
                        projectParamList?: any[] | undefined;
                        projectParamType?: string | undefined;
                        projectParamValue?: Record<string, any> | undefined;
                        projectParamCode?: string | undefined;
                        swiperCardTabsName?: string | undefined;
                        aiManMsgContent?: string | undefined;
                        setBroadcastId?: string | null | undefined;
                        videoStartTime?: number | undefined;
                        videoEndTime?: number | undefined;
                        option?: Record<string, any> | undefined;
                        currentpage?: number | undefined;
                        translation?: string | undefined;
                    }[];
                    btnObjs: any[];
                }[];
                encodes?: {
                    trigger: _screenwright_types.EncodeEventTypeEnum;
                    name: string;
                    id: string;
                    conditionType: _screenwright_types.ConditionLogicTypeEnum;
                    conditions: {
                        id: string;
                        name: string;
                        code: string;
                        type: _screenwright_types.ConditionTypeEnum;
                        compare: _screenwright_types.ConditionCompareEnum;
                        expected: string;
                        field: string;
                        notSaved: boolean;
                        isExists: boolean;
                        tempPool: {
                            name: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            code: string;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            isExists: boolean;
                        };
                    }[];
                    actions: {
                        id: string;
                        name: string;
                        action: string;
                        actionData: Record<string, any>;
                        component: string[];
                        componentConfig: {
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            name: string;
                            option: any;
                            top: number;
                            left: number;
                        };
                        componentScope: string;
                        encodeLabel: string | null;
                        encodeKey: string | null;
                        encodeValue: number[];
                    }[];
                }[] | undefined;
                url?: string | undefined;
                path?: string | undefined;
                dataQuery?: string | undefined;
                loadAnimation: {
                    type: string;
                    direction?: string | undefined;
                    duration: number;
                    delay: number;
                    timingFunction: string;
                    opacityOpen?: boolean | undefined;
                };
                presetChild?: {
                    [x: string]: any;
                    id: string;
                    isEdit: boolean;
                    show: boolean;
                    showOperation: boolean;
                    type: string;
                    dataMethod: "get" | "post" | "put" | "delete";
                    dataType: number;
                    requestHeader: Record<string, any>;
                    requestBody: Record<string, any>;
                    crossOrigin: boolean;
                    needCookie: boolean;
                    autoRefresh: boolean;
                    sql: string;
                    component: {
                        prop: ExtendsChildComponentEnum | string;
                        width: number;
                        height: number;
                        name: string;
                    };
                    option: any;
                    name: string;
                    data: any;
                    img: string;
                    title: string;
                    path?: string | undefined;
                    url?: string | undefined;
                    parent?: number | undefined;
                    top: number;
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: {
                        [x: string]: any;
                        id: number;
                        component: {
                            prop: AllComponentType;
                            width: number;
                            height: number;
                            name: string;
                        };
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        name: string;
                        left: number;
                        top: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        option: any;
                        data: any;
                        img: string;
                        title: string;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataType: DataType;
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        url?: string | undefined;
                        path?: string | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        parent?: number | undefined;
                        unitPavenType?: "percent" | undefined;
                        width?: never | undefined;
                        height?: never | undefined;
                        parentDynamicPanelId?: number[] | undefined;
                        parentEncodeId?: string | undefined;
                    }[] | undefined;
                    left: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: /*elided*/ any[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    unitPavenType?: "percent" | undefined;
                }[] | undefined;
                minioArr?: {
                    [x: string]: unknown;
                    id: number;
                }[] | undefined;
                parent?: number | undefined;
                unitPavenType?: "percent" | undefined;
                width?: never | undefined;
                height?: never | undefined;
                parentDynamicPanelId?: number[] | undefined;
                parentEncodeId?: string | undefined;
            }[];
            component?: Array<any> | undefined;
            config: string | Array<string | number>;
            name: string;
            detail: string | {
                width: string;
                height: string;
                scale: number;
                theme?: string | undefined;
                initLoad: boolean;
                minioIds?: Array<number | null> | undefined;
                backgroundImage: string;
                backgroundColor: string;
                showBackgroundImage: boolean;
                showScreenAdaptation: boolean;
                adaptationNorm: string;
                adaptationType: _screenwright_types.AdaptationType;
                showScreenFilter: boolean;
                screenFilterInfo: {
                    gaussianBlur: number;
                    brightness: number;
                    contrast: number;
                    grayscale: number;
                    hue: number;
                    saturate: number;
                    invert: number;
                    sepia: number;
                    hueRotate?: number | undefined;
                };
                showWaterMark: boolean;
                waterMark: {
                    text: string;
                    fontFamily: string;
                    fontStyle: string;
                    fontWeight: string;
                    fontSize: number;
                    color: string;
                    degree?: number | undefined;
                };
                gridDistance: number;
                query: Record<string, any>;
                controlWebsocketUrl: string;
                heartbeatInterval: number;
                terminalEnableArr: _screenwright_types.TerminalEnableArr;
                name: string;
                mark?: Record<string, any> | undefined;
                isEncodedControl?: boolean | undefined;
                zIndexMap?: Record<string, any> | undefined;
            };
            backgroundUrl: string | null;
            id: number;
            invitationCode: string;
            status: boolean | null;
            type: number;
            versionCode: string;
            versionDesc: string | null;
            dataFilterArr: string | Record<string, Filter>;
            userId: number;
            sceneId?: number | undefined;
            sceneVersionCode?: string | undefined;
            updatedBy: string;
            updatedTime: string;
            encodedControl: string | string[];
            aniFrameSet: string | {
                animationList?: {
                    id: string;
                    name: string;
                    componentSetting: {
                        id: number;
                        animationType: _screenwright_types.AnimationType;
                        direction: _screenwright_types.AnimationDirection;
                        timingFunction: _screenwright_types.TimingFunctionType;
                        duration: number;
                        delay: number;
                        iterationCount?: number | undefined;
                        type: "load" | "unload" | "none";
                    }[];
                    isEnable?: boolean | undefined;
                    panelId?: number | undefined;
                    statusId?: string | undefined;
                    isRename?: boolean | undefined;
                }[] | undefined;
                activeAnimationList?: {
                    panelId?: number | undefined;
                    statusId?: string | undefined;
                    animationId: string;
                    type: "load" | "unload";
                }[] | undefined;
            };
            statusAnimation: string | {
                animations?: {
                    [animationId: string]: _screenwright_types.AnimationInfo;
                } | undefined;
                statusAnimations?: {
                    [animationId: string]: {
                        [statusId: string]: _screenwright_types.StatusAnimationMapping;
                    };
                } | undefined;
                componentAnimations?: {
                    [animationId: string]: {
                        [statusId: string]: {
                            [componentId: string]: _screenwright_types.ComponentAnimationConfig;
                        };
                    };
                } | undefined;
            };
        }>;
        isLoad: vue.Ref<boolean, boolean>;
        groupData: vue.Ref<ComponentType[], ComponentType[]>;
        setDetail2Config: (res: _screenwright_types.LargeScreeInfo) => void;
        initLargeScreen: (id: number) => Promise<void>;
        initLargeScreenData: (res: _screenwright_types.LargeScreeInfo) => Promise<void>;
        initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
    };
    useEditStore: () => {
        targetChart: vue.Ref<_screenwright_composables.TargetChartType, _screenwright_composables.TargetChartType>;
        editCanvas: vue.Ref<{
            editLayoutDom: HTMLElement | null;
            editContentDom: HTMLElement | null;
            offset: number;
            userScale: number;
            lockScale: boolean;
            isCreate: boolean;
            isDrag: boolean;
            isSelect: boolean;
            isCodeEdit: boolean;
        }, EditCanvasType | {
            editLayoutDom: HTMLElement | null;
            editContentDom: HTMLElement | null;
            offset: number;
            userScale: number;
            lockScale: boolean;
            isCreate: boolean;
            isDrag: boolean;
            isSelect: boolean;
            isCodeEdit: boolean;
        }>;
        componentList: vue.Ref<ComponentType[], ComponentType[]>;
        currentCanvasPlacement: () => _screenwright_core.ComponentPlacement | undefined;
        mousePosition: vue.Ref<{
            startX: number;
            startY: number;
            x: number;
            y: number;
        }, {
            startX: number;
            startY: number;
            x: number;
            y: number;
        } | {
            startX: number;
            startY: number;
            x: number;
            y: number;
        }>;
        rightMenuShow: vue.Ref<boolean, boolean>;
        selectTargetDataId: vue.ComputedRef<string[]>;
        selectTargetData: vue.ComputedRef<ComponentType[]>;
        editConfig: vue.WritableComputedRef<_screenwright_types.LargeScreenDetailInfo, _screenwright_types.LargeScreenDetailInfo>;
        actionComponentId: vue.Ref<string, string>;
        selectTargetDataInitial: vue.ComputedRef<(ComponentType | null)[]>;
        syncGlobalComponentData: () => void;
        setDetail2Config: (res: _screenwright_types.LargeScreeInfo) => void;
        setEditConfig: <K extends keyof _screenwright_types.LargeScreenDetailInfo>(key: K, value: _screenwright_types.LargeScreenDetailInfo[K]) => void;
        setEditCanvas: <K extends keyof EditCanvasType>(key: K, value: EditCanvasType[K]) => void;
        setRightMenuShow: (value: boolean) => void;
        setTargetHoverChart: (hoverId?: _screenwright_composables.TargetChartType["hoverId"]) => void;
        setMousePosition: (x?: number, y?: number, startX?: number, startY?: number) => void;
        fetchTargetById: (id: string) => ComponentType | null;
        setTargetSelectChart: (selectId?: string | string[], push?: boolean) => void;
        resetEditStore: () => void;
        updateEditConfig: () => Promise<void>;
        isPanel: () => boolean;
        isDynamicPanel: () => boolean;
        isEncodePanel: () => boolean;
        isBuild: () => boolean;
        scrollIntoViewTree: (id: string) => void;
    };
    useGlobalAnimation: () => {
        triggerRegistry: Map<string, _screenwright_composables.AnimationTrigger>;
        registerAnimationTrigger: (id: string, trigger: (params: {
            animation: Animation;
            newAnimationCallback?: _screenwright_composables.AnimationCallbacks;
            triggerType: "enter" | "leave" | "preview";
        }) => void) => void;
        unregisterAnimationTrigger: (componentId: string) => void;
        getAllTriggers: () => string[];
        resetTriggerRegistry: () => void;
    };
    useDataFilter: () => {
        dataFilter: vue.WritableComputedRef<Record<string, Filter>, Record<string, Filter>>;
        cloneDataFilter: vue.ComputedRef<Record<string, Filter>>;
        diffSelectFilter: vue.WritableComputedRef<Filter[], Filter[]>;
        currentFilter: vue.WritableComputedRef<Filter[], Filter[]>;
        currentFilterNum: vue.ComputedRef<number>;
        isCanAddFilter: vue.ComputedRef<boolean>;
        filterResultCollector: _screenwright_composables.FilterResultCollector;
        newDataFilter: vue.Ref<{
            callBack: string[];
            callBackStatus: boolean;
            dataFormatter: string;
            bindComponent: {
                label: string;
                id: number | string;
            }[];
            checked: boolean;
            notSaved: boolean;
            tempPool: {
                callBack: any[];
                dataFormatter: string;
            };
            name: string;
            show?: boolean | undefined;
            id?: string | undefined;
        }[], Filter[] | {
            callBack: string[];
            callBackStatus: boolean;
            dataFormatter: string;
            bindComponent: {
                label: string;
                id: number | string;
            }[];
            checked: boolean;
            notSaved: boolean;
            tempPool: {
                callBack: any[];
                dataFormatter: string;
            };
            name: string;
            show?: boolean | undefined;
            id?: string | undefined;
        }[]>;
        filterResultForCurrentComponent: vue.ComputedRef<any[]>;
        filterAllResultForCurrentComponent: vue.ComputedRef<_screenwright_core.ResultCollectItem[]>;
        hideAllFilter: () => void;
        handleSelectDataFilter: (value: string) => void;
        handleClearNotSave: () => void;
        addNewDataFilterToGlobal: () => Filter;
        handleSave: (filter: Filter) => Promise<{
            success: false;
            error: "duplicate_name" | "empty_name" | "filter_not_found" | "not_modified";
        } | {
            success: boolean;
            error?: undefined;
        } | {
            success: boolean;
            error: "save_failed";
        }>;
        handleSaveFilter: (filter: Filter, originalName?: string) => Promise<boolean>;
        addDataFilterToComponent: (name?: string) => Promise<void>;
        deleteFilterFromComponent: (item: Filter, component?: ComponentType | ChildComponent) => Promise<{
            success: boolean;
            error: "\u7EC4\u4EF6\u4E0D\u5B58\u5728" | "\u4FDD\u5B58\u5931\u8D25" | undefined;
            data: any[] | null;
        }>;
        cloneDataFilterOnInit: () => void;
        handleFilterEnable: ({ filter, value, component }: {
            filter: Filter;
            value: boolean;
            component: ComponentType | ChildComponent | undefined;
        }) => Promise<any>;
        updateFilterOnComponentPasted: (id: number | string) => Promise<_screenwright_composables.BaseEntity<null> | undefined>;
        updateFilterOnComponentDeleted: (id: number | string) => Promise<_screenwright_composables.BaseEntity<null> | undefined>;
        updateCallbackArgumentToFilter: (filter: Filter, callbackArgument: string[]) => void;
        checkFilterNotSavedOnCallbackChange: (filter: Filter) => void;
        resetDataFilter: () => void;
        onFilterCodeChange: (item: Filter, value: string) => void;
        resetFilterToCloneData: (item: Filter) => void;
        getFilterResult: (result?: _screenwright_core.ResultCollectItem) => any[];
        saveGlobalDataFilter: () => Promise<any>;
        getFilterResultsByComponentId: (id: string | number) => {
            success: false;
            error: string;
            results: never[];
        } | {
            success: true;
            results: {
                filterName: any;
                inputData: any;
                outputData: any;
                success: any;
                error: any;
            }[];
            error?: undefined;
        };
        getFilterInComponentIndex: (filter: Filter) => number;
        shouldShowTest: (filter: Filter, needTest: boolean) => boolean;
        shouldShowCheckbox: (filter: Filter, needCheckBox: boolean) => boolean;
        deleteFilter: (filterName: string) => Promise<{
            success: boolean;
            error?: string;
        }>;
        _addListenArgs: (filter: Filter, component?: ComponentType | ChildComponent) => void;
        _updateFilterStatus: (filter: Filter) => Filter;
        _processCallbackRelations: (name: string, component?: ComponentType | ChildComponent) => void;
        _updateComponentListeners: (name: string, components?: (ComponentType | ChildComponent)[]) => Promise<void>;
    };
    useGlobalComponentData: () => {
        groupData: vue.Ref<ComponentType[], ComponentType[]>;
        globalComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        encodeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        allComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        iframeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        screenWithIframeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        screenRootComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
        panelChildComponentMap: vue.ComputedRef<Map<string, _screenwright_core.ComponentMap>>;
        panelChildComponentMapByStatus: vue.ComputedRef<Map<string, Map<string, _screenwright_core.ComponentMap>>>;
        setGroupData: (detailInfo: _screenwright_types.LargeScreeInfo) => void;
        resetGroupData: () => void;
        findTargetDynamicPanel: typeof _screenwright_core.findTargetDynamicPanel;
    };
    useLargeScreenInfo: () => {
        navInfo: vue.Ref<_screenwright_core.NavInfo, _screenwright_core.NavInfo>;
        isMultiPerson: vue.ComputedRef<boolean>;
        setNavInfo: (detailInfo: _screenwright_types.LargeScreeInfo) => void;
        setVersionCode: (code: string) => void;
        resetNavInfo: () => void;
        setDetailField: <K extends keyof _screenwright_types.LargeScreenDetailInfo>(key: K, value: _screenwright_types.LargeScreenDetailInfo[K]) => void;
        resetDetail: () => void;
    };
    useActionEvent: () => {
        eventList: vue.Ref<_screenwright_types.TotalPanelEventMap, _screenwright_types.TotalPanelEventMap>;
        addEvent: (event: _screenwright_types.toAddEvent) => void;
        addEventHandler: <K extends keyof _screenwright_types.TotalPanelEventMap, F extends keyof _screenwright_types.TotalPanelEventMap[K], T extends Parameters<Extract<_screenwright_types.TotalPanelEventMap[K][F], (...args: any) => any>>>(key: K, functionName: F, handler: (...args: T) => void | Promise<void>) => void;
    };
    useEventHandling: typeof useEventHandling;
    useEventCallbacks: () => {
        registerCallback: (callback: _screenwright_core.EventCallbackFunction) => () => void;
        registerCallbacks: (callbackList: _screenwright_core.EventCallbackFunction[]) => () => void;
        unregisterCallback: (callback: _screenwright_core.EventCallbackFunction) => void;
        clearCallbacks: () => void;
        executeCallbacks: (params: _screenwright_core.EventCallbackParams) => Promise<void>;
        getCallbackCount: () => number;
    };
    useEvent: () => {
        handleEvents: ({ throwValue, events, isExecuteOnlyConditionSatisfied, triggerType, id, throwCallback, callbackDebounce, isExecuteOnlyInViewMod }?: {
            throwValue: Record<string, any>;
            events: _screenwright_types.Event[];
            isOutsideMessage?: boolean;
            id?: number | string;
            isExecuteOnlyConditionSatisfied?: boolean;
            triggerType: _screenwright_types.EventTypeEnum;
            modelId?: string;
            throwCallback?: boolean;
            callbackDebounce?: boolean;
            isExecuteOnlyInViewMod?: boolean;
        }) => Promise<void>;
        handleEventAndCallbackEvent: (params: {
            throwValue: Record<string, any>;
            events: _screenwright_types.Event[];
            isOutsideMessage?: boolean;
            id?: number | string;
            isExecuteOnlyConditionSatisfied?: boolean;
            triggerType: _screenwright_types.EventTypeEnum;
            modelId?: string;
            throwCallback?: boolean;
            callbackDebounce?: boolean;
            isExecuteOnlyInViewMod?: boolean;
        }) => void;
        isBuild: vue.ComputedRef<boolean>;
        activeChildComponent: vue.Ref<any, any>;
    };
    useCallbackArguments: () => {
        callbackEventManager: _screenwright_core.CallbackEventManager;
        callbackArgumentsManager: vue.ComputedRef<_screenwright_types.CallbackManager>;
        callbackArgumentsInstance: vue.Ref<{
            clearCallbackArguments: () => void;
            getCallbackArgumentsManager: () => _screenwright_types.CallbackManager;
            getCallbackArgs: () => Record<string, any>;
            getEventMappingTarget: () => node_modules__screenwright_core_dist_events_CallbackArguments.EventMappingTarget;
            setCallbackArgs: (key: string, value: any) => void;
            deleteCallbackArgs: (key: string) => void;
            addCallbackArgument: (component: ComponentType | ChildComponent) => void;
            initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
            addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
            initCallbackRelation: (field: string) => void;
            removeComponentFromCallbacks: (component: ComponentType | ChildComponent) => void;
            handleCallback: ({ sourceComponent, throwValue }: {
                sourceComponent: ComponentType | ChildComponent;
                throwValue: Record<string, any>;
            }) => void;
        }, _screenwright_core.CallbackArguments | {
            clearCallbackArguments: () => void;
            getCallbackArgumentsManager: () => _screenwright_types.CallbackManager;
            getCallbackArgs: () => Record<string, any>;
            getEventMappingTarget: () => node_modules__screenwright_core_dist_events_CallbackArguments.EventMappingTarget;
            setCallbackArgs: (key: string, value: any) => void;
            deleteCallbackArgs: (key: string) => void;
            addCallbackArgument: (component: ComponentType | ChildComponent) => void;
            initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
            addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
            initCallbackRelation: (field: string) => void;
            removeComponentFromCallbacks: (component: ComponentType | ChildComponent) => void;
            handleCallback: ({ sourceComponent, throwValue }: {
                sourceComponent: ComponentType | ChildComponent;
                throwValue: Record<string, any>;
            }) => void;
        }>;
        addCallbackArgument: (component: ComponentType) => void;
        initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
        initCallbackRelation: (field: string) => void;
        handleCallback: ({ sourceComponent, throwValue, debounce, debounceForCallbackArgs }: {
            sourceComponent: ComponentType | ChildComponent;
            throwValue: Record<string, any>;
            debounceForCallbackArgs?: boolean;
            debounce?: boolean;
        }) => Promise<_screenwright_composables.HandleCallbackResult | undefined>;
        setCallbackArgs: (key: string, value: any) => void;
        updateCallbackRelation: (component: ComponentType | ChildComponent) => void;
        deleteCallbackRelation: (component: ComponentType | ChildComponent) => void;
        addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
        onClear: () => void;
        onAddCallbackField: (id: number | string, callback: _screenwright_core.AddCallbackFieldHandler) => void;
        offAddCallbackField: (id: number | string, callback?: _screenwright_core.AddCallbackFieldHandler) => void;
        emitAddCallbackField: (id: number | string, callbackField: string) => Promise<any[]>;
        onRemoveCallbackField: (id: number | string, callback: _screenwright_core.RemoveCallbackFieldHandler) => void;
        offRemoveCallbackField: (id: number | string, callback?: _screenwright_core.RemoveCallbackFieldHandler) => void;
        emitRemoveCallbackField: (id: number | string, callbackField: string) => Promise<unknown[]>;
        onCallbackFieldTrigger: ({ targetKey, id, callback }: {
            targetKey: string;
            id: number | string;
            callback: _screenwright_core.CallbackFieldTriggerHandler;
        }) => void;
        offCallbackFieldTrigger: ({ targetKey, id, callback }: {
            targetKey: string;
            id: number | string;
            callback?: _screenwright_core.CallbackFieldTriggerHandler;
        }) => Promise<void>;
        emitCallbackFieldTrigger: (targetKey: string, id: number | string) => Promise<any[]>;
        onFilterTrigger: (componentId: string, callback: _screenwright_core.FilterTriggerHandler) => void;
        offFilterTrigger: (componentId: string, callback?: _screenwright_core.FilterTriggerHandler) => void;
        emitFilterTrigger: (componentId: string, customComponent?: ComponentType | ChildComponent) => Promise<any[]>;
    };
    useEncodeEvent: () => {
        handleEncodeEvent: ({ sourceComponent, encodes, throwValue }: {
            sourceComponent?: ComponentType;
            encodes: EncodeEvent[];
            throwValue: any;
        }) => void;
        handleEncodeEventThrottled: (params: Parameters<({ sourceComponent, encodes, throwValue }: {
            sourceComponent?: ComponentType;
            encodes: EncodeEvent[];
            throwValue: any;
        }) => void>[0]) => void;
    };
    useEncodeCommunication: () => {
        terminalCommunicationWs: vue.Ref<{
            limitConnect: number;
            longConnect: boolean;
            websocketServerUrl: string;
            token: string | null;
            socketOpen?: null | string | undefined;
            ws?: {
                binaryType: BinaryType;
                readonly bufferedAmount: number;
                readonly extensions: string;
                onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                onerror: ((this: WebSocket, ev: Event) => any) | null;
                onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                onopen: ((this: WebSocket, ev: Event) => any) | null;
                readonly protocol: string;
                readonly readyState: number;
                readonly url: string;
                close: (code?: number, reason?: string) => void;
                send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                readonly CONNECTING: 0;
                readonly OPEN: 1;
                readonly CLOSING: 2;
                readonly CLOSED: 3;
                addEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                };
                removeEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                };
                dispatchEvent: (event: Event) => boolean;
            } | undefined;
            responseTimeout: number;
            responseCheckTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            lastSendTime: number;
            lastReceiveTime: number;
            onReceiveMessageCallback?: ((data: any) => void) | undefined;
            onOpenCallback?: (() => void) | undefined;
            onErrorCallback?: ((error: string) => void) | undefined;
            hasPendingMessage: boolean;
            enableHeartbeat: boolean;
            heartbeatInterval: number;
            heartbeatMessage?: string | object | undefined;
            heartbeatTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            enableResponseCheck: boolean;
            reconnect: (onReceiveMessage?: (data: any) => void) => void;
            localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
            onopen: () => void;
            onclose: () => void;
            sendMsg: (msg: string | object, isBuffer?: boolean) => void;
        } | null, _screenwright_composables.WebSocketConfig | {
            limitConnect: number;
            longConnect: boolean;
            websocketServerUrl: string;
            token: string | null;
            socketOpen?: null | string | undefined;
            ws?: {
                binaryType: BinaryType;
                readonly bufferedAmount: number;
                readonly extensions: string;
                onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                onerror: ((this: WebSocket, ev: Event) => any) | null;
                onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                onopen: ((this: WebSocket, ev: Event) => any) | null;
                readonly protocol: string;
                readonly readyState: number;
                readonly url: string;
                close: (code?: number, reason?: string) => void;
                send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                readonly CONNECTING: 0;
                readonly OPEN: 1;
                readonly CLOSING: 2;
                readonly CLOSED: 3;
                addEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                };
                removeEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                };
                dispatchEvent: (event: Event) => boolean;
            } | undefined;
            responseTimeout: number;
            responseCheckTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            lastSendTime: number;
            lastReceiveTime: number;
            onReceiveMessageCallback?: ((data: any) => void) | undefined;
            onOpenCallback?: (() => void) | undefined;
            onErrorCallback?: ((error: string) => void) | undefined;
            hasPendingMessage: boolean;
            enableHeartbeat: boolean;
            heartbeatInterval: number;
            heartbeatMessage?: string | object | undefined;
            heartbeatTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            enableResponseCheck: boolean;
            reconnect: (onReceiveMessage?: (data: any) => void) => void;
            localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
            onopen: () => void;
            onclose: () => void;
            sendMsg: (msg: string | object, isBuffer?: boolean) => void;
        } | null>;
        screenCommunicationWs: vue.Ref<{
            limitConnect: number;
            longConnect: boolean;
            websocketServerUrl: string;
            token: string | null;
            socketOpen?: null | string | undefined;
            ws?: {
                binaryType: BinaryType;
                readonly bufferedAmount: number;
                readonly extensions: string;
                onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                onerror: ((this: WebSocket, ev: Event) => any) | null;
                onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                onopen: ((this: WebSocket, ev: Event) => any) | null;
                readonly protocol: string;
                readonly readyState: number;
                readonly url: string;
                close: (code?: number, reason?: string) => void;
                send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                readonly CONNECTING: 0;
                readonly OPEN: 1;
                readonly CLOSING: 2;
                readonly CLOSED: 3;
                addEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                };
                removeEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                };
                dispatchEvent: (event: Event) => boolean;
            } | undefined;
            responseTimeout: number;
            responseCheckTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            lastSendTime: number;
            lastReceiveTime: number;
            onReceiveMessageCallback?: ((data: any) => void) | undefined;
            onOpenCallback?: (() => void) | undefined;
            onErrorCallback?: ((error: string) => void) | undefined;
            hasPendingMessage: boolean;
            enableHeartbeat: boolean;
            heartbeatInterval: number;
            heartbeatMessage?: string | object | undefined;
            heartbeatTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            enableResponseCheck: boolean;
            reconnect: (onReceiveMessage?: (data: any) => void) => void;
            localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
            onopen: () => void;
            onclose: () => void;
            sendMsg: (msg: string | object, isBuffer?: boolean) => void;
        } | null, _screenwright_composables.WebSocketConfig | {
            limitConnect: number;
            longConnect: boolean;
            websocketServerUrl: string;
            token: string | null;
            socketOpen?: null | string | undefined;
            ws?: {
                binaryType: BinaryType;
                readonly bufferedAmount: number;
                readonly extensions: string;
                onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                onerror: ((this: WebSocket, ev: Event) => any) | null;
                onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                onopen: ((this: WebSocket, ev: Event) => any) | null;
                readonly protocol: string;
                readonly readyState: number;
                readonly url: string;
                close: (code?: number, reason?: string) => void;
                send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                readonly CONNECTING: 0;
                readonly OPEN: 1;
                readonly CLOSING: 2;
                readonly CLOSED: 3;
                addEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                };
                removeEventListener: {
                    <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                };
                dispatchEvent: (event: Event) => boolean;
            } | undefined;
            responseTimeout: number;
            responseCheckTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            lastSendTime: number;
            lastReceiveTime: number;
            onReceiveMessageCallback?: ((data: any) => void) | undefined;
            onOpenCallback?: (() => void) | undefined;
            onErrorCallback?: ((error: string) => void) | undefined;
            hasPendingMessage: boolean;
            enableHeartbeat: boolean;
            heartbeatInterval: number;
            heartbeatMessage?: string | object | undefined;
            heartbeatTimer?: {
                ref: () => NodeJS.Timeout;
                unref: () => NodeJS.Timeout;
                hasRef: () => boolean;
                refresh: () => NodeJS.Timeout;
                [Symbol.toPrimitive]: () => number;
            } | undefined;
            enableResponseCheck: boolean;
            reconnect: (onReceiveMessage?: (data: any) => void) => void;
            localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
            onopen: () => void;
            onclose: () => void;
            sendMsg: (msg: string | object, isBuffer?: boolean) => void;
        } | null>;
        encodedControlValues: vue.WritableComputedRef<_screenwright_composables.EncodedControlItem[], _screenwright_composables.EncodedControlItem[]>;
        getIframeWs: (iframeScreenId: string) => _screenwright_composables.WebSocketConfig | undefined;
        initIframeWs: ({ iframeScreenId, controlWebsocketUrl, heartbeatInterval }: {
            iframeScreenId: string;
            controlWebsocketUrl: string;
            heartbeatInterval: number;
        }) => _screenwright_composables.WebSocketConfig;
        initTerminalCommunication: () => void;
        sendTerminalMessage: ({ largeId, actions }: {
            largeId?: string;
            actions: _screenwright_composables.MessageToSend[];
        }) => void;
        initScreenCommunication: () => void;
        createNewTerminalCommunicationWs: ({ controlWebsocketUrl, heartbeatInterval }: {
            controlWebsocketUrl: string;
            heartbeatInterval: number;
        }) => _screenwright_composables.WebSocketConfig;
        closeTerminalWs: (largeId: string) => void;
        handleActions: (actions: _screenwright_composables.MessageToSend[]) => Promise<void>;
        cleanup: () => void;
    };
    useCreateComponent: typeof useCreateComponent;
    EventTypeEnum: typeof EventTypeEnum;
    CoreType: typeof CoreType;
};
declare const screenwright: {
    sdk: {
        useInitLargeScreenData: () => {
            detailInfo: vue.Ref<{
                layers: string[] | {
                    [x: string]: any;
                    id: number;
                    component: {
                        prop: AllComponentType;
                        width: number;
                        height: number;
                        name: string;
                    };
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: {
                        [x: string]: any;
                        id: number;
                        component: {
                            prop: AllComponentType;
                            width: number;
                            height: number;
                            name: string;
                        };
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        name: string;
                        left: number;
                        top: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        option: any;
                        data: any;
                        img: string;
                        title: string;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataType: DataType;
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        url?: string | undefined;
                        path?: string | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: {
                            [x: string]: any;
                            id: string;
                            isEdit: boolean;
                            show: boolean;
                            showOperation: boolean;
                            type: string;
                            dataMethod: "get" | "post" | "put" | "delete";
                            dataType: number;
                            requestHeader: Record<string, any>;
                            requestBody: Record<string, any>;
                            crossOrigin: boolean;
                            needCookie: boolean;
                            autoRefresh: boolean;
                            sql: string;
                            component: {
                                prop: ExtendsChildComponentEnum | string;
                                width: number;
                                height: number;
                                name: string;
                            };
                            option: any;
                            name: string;
                            data: any;
                            img: string;
                            title: string;
                            path?: string | undefined;
                            url?: string | undefined;
                            parent?: number | undefined;
                            top: number;
                            group?: boolean | undefined;
                            selected?: boolean | undefined;
                            children?: /*elided*/ any[] | undefined;
                            left: number;
                            isLock?: boolean | undefined;
                            zIndex: number;
                            display: boolean;
                            listenArgs: {
                                filterName: string;
                                usageStatus: boolean;
                                callbackFields: string[];
                                filterType?: boolean | undefined;
                            }[];
                            cbArgs: {
                                id: string;
                                name: string;
                                type: string;
                                method: string;
                                value: {
                                    origin: {
                                        displayName: "\u5B57\u6BB5\u503C";
                                        type: "input";
                                        value: string;
                                    };
                                    target: {
                                        displayName: "\u53D8\u91CF\u540D";
                                        type: "input";
                                        value: string;
                                    };
                                };
                            }[];
                            openFilter?: boolean | undefined;
                            dataSource: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            };
                            dataRemark?: {
                                description?: string | undefined;
                                key: string;
                                map: string;
                                decription?: string | undefined;
                            }[] | undefined;
                            events: {
                                [x: string]: any;
                                trigger: EventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: _screenwright_types.ActionTypeEnum;
                                    actionData?: Record<string, any> | undefined;
                                    animation?: {
                                        delay: number;
                                        duration: number;
                                        timingFunction: _screenwright_types.timingFunctionType;
                                        type: _screenwright_types.ActionAnimationTypeEnum;
                                        idxValue: number | string;
                                        isRename?: boolean | undefined;
                                    } | undefined;
                                    mapBox?: {
                                        boxOffsetX: number;
                                        boxOffsetY: number;
                                    } | undefined;
                                    layerInfo?: {
                                        color: string;
                                        name: string;
                                        callBackField: string;
                                        childNodeField: string;
                                    } | undefined;
                                    component: string[];
                                    componentConfig?: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    } | undefined;
                                    componentScope?: string | undefined;
                                    stateId?: string | undefined;
                                    sceneStatusName?: string | undefined;
                                    switchSceneStatusDelay?: number | undefined;
                                    timeFastIn?: number | undefined;
                                    timeRewind?: number | undefined;
                                    sceneLevelId?: number | undefined;
                                    keyframesName?: string | undefined;
                                    keyframesPlayDelay?: number | undefined;
                                    stateAnimationName?: string | undefined;
                                    animationState?: number | undefined;
                                    stateAnimationPlayDelay?: number | undefined;
                                    sceneObject?: {
                                        nameList: string[];
                                        name?: string | undefined;
                                        objInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    sceneObjectExplosion?: {
                                        index: string;
                                        lidName: string;
                                        baseName: string;
                                        type: string;
                                    } | undefined;
                                    sceneChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    mapChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    glMapRegionLift?: {
                                        regionId: string;
                                        adcode: string;
                                        name: string;
                                        height: number;
                                        duration: number;
                                    } | undefined;
                                    glMapSceneRoam?: {
                                        sceneId: string;
                                    } | undefined;
                                    glMapIconActive?: {
                                        childId: string;
                                        matchField: string;
                                        matchValue: string;
                                        matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                        eventField: string;
                                        action: _screenwright_types_types_action.GlMapIconActiveAction;
                                        exclusive: boolean;
                                        clearWhenMiss: boolean;
                                    } | undefined;
                                    apiInstructionDetail?: string | undefined;
                                    apiInstructionDelay?: number | undefined;
                                    scale?: {
                                        lock: boolean;
                                        origin: string;
                                        originGrid: {
                                            left: string;
                                            top: string;
                                        };
                                        x: number;
                                        y: number;
                                    } | undefined;
                                    translate?: {
                                        toX: number;
                                        toY: number;
                                    } | undefined;
                                    encodeKey?: string | null | undefined;
                                    ue4Config?: {
                                        messageName: string;
                                        messageJson: string;
                                        messageContent: string;
                                        messageType: string;
                                    } | undefined;
                                    blueprintKey?: string | undefined;
                                    customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                    panelStatusAnimationId?: string | undefined;
                                    panelStatusId?: string | undefined;
                                    tcpudpConfig?: {
                                        dataType: _screenwright_types.tcpudpDataTypeEnum;
                                        dataSourceId: string;
                                        dataSourceObj: Record<string, any> | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            name: string;
                                            description: string;
                                            type: string;
                                            url: string;
                                            dataGroupId: number | null;
                                            fileName: string;
                                            size: number;
                                            charsetName: string;
                                            layerIds: string;
                                            config?: string | undefined;
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            dataGroupId: number | null;
                                            name: string;
                                            description: string;
                                            type: string;
                                            desIp: string;
                                            desPort: number;
                                            localPort: number;
                                            charsetName: string;
                                            layerIds: number[];
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            type: string;
                                            name: string;
                                            description: string;
                                            config: string;
                                            dataGroupId: number | null;
                                            layerIds: string;
                                            baseUrl: string;
                                        } | null;
                                        sendData: string;
                                        sendType: string;
                                        dataDelay: number;
                                    } | undefined;
                                    projectFunName?: string | undefined;
                                    projectParamList?: any[] | undefined;
                                    projectParamType?: string | undefined;
                                    projectParamValue?: Record<string, any> | undefined;
                                    projectParamCode?: string | undefined;
                                    swiperCardTabsName?: string | undefined;
                                    aiManMsgContent?: string | undefined;
                                    setBroadcastId?: string | null | undefined;
                                    videoStartTime?: number | undefined;
                                    videoEndTime?: number | undefined;
                                    option?: Record<string, any> | undefined;
                                    currentpage?: number | undefined;
                                    translation?: string | undefined;
                                }[];
                                btnObjs: any[];
                            }[];
                            encodes?: {
                                trigger: _screenwright_types.EncodeEventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: string;
                                    actionData: Record<string, any>;
                                    component: string[];
                                    componentConfig: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    };
                                    componentScope: string;
                                    encodeLabel: string | null;
                                    encodeKey: string | null;
                                    encodeValue: number[];
                                }[];
                            }[] | undefined;
                            dataQuery?: string | undefined;
                            loadAnimation: {
                                type: string;
                                direction?: string | undefined;
                                duration: number;
                                delay: number;
                                timingFunction: string;
                                opacityOpen?: boolean | undefined;
                            };
                            presetChild?: /*elided*/ any[] | undefined;
                            minioArr?: {
                                [x: string]: unknown;
                                id: number;
                            }[] | undefined;
                            unitPavenType?: "percent" | undefined;
                        }[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        parent?: number | undefined;
                        unitPavenType?: "percent" | undefined;
                        width?: never | undefined;
                        height?: never | undefined;
                        parentDynamicPanelId?: number[] | undefined;
                        parentEncodeId?: string | undefined;
                    }[] | undefined;
                    name: string;
                    left: number;
                    top: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    option: any;
                    data: any;
                    img: string;
                    title: string;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataType: DataType;
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    url?: string | undefined;
                    path?: string | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: {
                        [x: string]: any;
                        id: string;
                        isEdit: boolean;
                        show: boolean;
                        showOperation: boolean;
                        type: string;
                        dataMethod: "get" | "post" | "put" | "delete";
                        dataType: number;
                        requestHeader: Record<string, any>;
                        requestBody: Record<string, any>;
                        crossOrigin: boolean;
                        needCookie: boolean;
                        autoRefresh: boolean;
                        sql: string;
                        component: {
                            prop: ExtendsChildComponentEnum | string;
                            width: number;
                            height: number;
                            name: string;
                        };
                        option: any;
                        name: string;
                        data: any;
                        img: string;
                        title: string;
                        path?: string | undefined;
                        url?: string | undefined;
                        parent?: number | undefined;
                        top: number;
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: {
                            [x: string]: any;
                            id: number;
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            group?: boolean | undefined;
                            selected?: boolean | undefined;
                            children?: /*elided*/ any[] | undefined;
                            name: string;
                            left: number;
                            top: number;
                            isLock?: boolean | undefined;
                            zIndex: number;
                            display: boolean;
                            option: any;
                            data: any;
                            img: string;
                            title: string;
                            listenArgs: {
                                filterName: string;
                                usageStatus: boolean;
                                callbackFields: string[];
                                filterType?: boolean | undefined;
                            }[];
                            cbArgs: {
                                id: string;
                                name: string;
                                type: string;
                                method: string;
                                value: {
                                    origin: {
                                        displayName: "\u5B57\u6BB5\u503C";
                                        type: "input";
                                        value: string;
                                    };
                                    target: {
                                        displayName: "\u53D8\u91CF\u540D";
                                        type: "input";
                                        value: string;
                                    };
                                };
                            }[];
                            openFilter?: boolean | undefined;
                            dataSource: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            };
                            dataType: DataType;
                            dataRemark?: {
                                description?: string | undefined;
                                key: string;
                                map: string;
                                decription?: string | undefined;
                            }[] | undefined;
                            events: {
                                [x: string]: any;
                                trigger: EventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: _screenwright_types.ActionTypeEnum;
                                    actionData?: Record<string, any> | undefined;
                                    animation?: {
                                        delay: number;
                                        duration: number;
                                        timingFunction: _screenwright_types.timingFunctionType;
                                        type: _screenwright_types.ActionAnimationTypeEnum;
                                        idxValue: number | string;
                                        isRename?: boolean | undefined;
                                    } | undefined;
                                    mapBox?: {
                                        boxOffsetX: number;
                                        boxOffsetY: number;
                                    } | undefined;
                                    layerInfo?: {
                                        color: string;
                                        name: string;
                                        callBackField: string;
                                        childNodeField: string;
                                    } | undefined;
                                    component: string[];
                                    componentConfig?: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    } | undefined;
                                    componentScope?: string | undefined;
                                    stateId?: string | undefined;
                                    sceneStatusName?: string | undefined;
                                    switchSceneStatusDelay?: number | undefined;
                                    timeFastIn?: number | undefined;
                                    timeRewind?: number | undefined;
                                    sceneLevelId?: number | undefined;
                                    keyframesName?: string | undefined;
                                    keyframesPlayDelay?: number | undefined;
                                    stateAnimationName?: string | undefined;
                                    animationState?: number | undefined;
                                    stateAnimationPlayDelay?: number | undefined;
                                    sceneObject?: {
                                        nameList: string[];
                                        name?: string | undefined;
                                        objInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    sceneObjectExplosion?: {
                                        index: string;
                                        lidName: string;
                                        baseName: string;
                                        type: string;
                                    } | undefined;
                                    sceneChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    mapChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    glMapRegionLift?: {
                                        regionId: string;
                                        adcode: string;
                                        name: string;
                                        height: number;
                                        duration: number;
                                    } | undefined;
                                    glMapSceneRoam?: {
                                        sceneId: string;
                                    } | undefined;
                                    glMapIconActive?: {
                                        childId: string;
                                        matchField: string;
                                        matchValue: string;
                                        matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                        eventField: string;
                                        action: _screenwright_types_types_action.GlMapIconActiveAction;
                                        exclusive: boolean;
                                        clearWhenMiss: boolean;
                                    } | undefined;
                                    apiInstructionDetail?: string | undefined;
                                    apiInstructionDelay?: number | undefined;
                                    scale?: {
                                        lock: boolean;
                                        origin: string;
                                        originGrid: {
                                            left: string;
                                            top: string;
                                        };
                                        x: number;
                                        y: number;
                                    } | undefined;
                                    translate?: {
                                        toX: number;
                                        toY: number;
                                    } | undefined;
                                    encodeKey?: string | null | undefined;
                                    ue4Config?: {
                                        messageName: string;
                                        messageJson: string;
                                        messageContent: string;
                                        messageType: string;
                                    } | undefined;
                                    blueprintKey?: string | undefined;
                                    customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                    panelStatusAnimationId?: string | undefined;
                                    panelStatusId?: string | undefined;
                                    tcpudpConfig?: {
                                        dataType: _screenwright_types.tcpudpDataTypeEnum;
                                        dataSourceId: string;
                                        dataSourceObj: Record<string, any> | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            name: string;
                                            description: string;
                                            type: string;
                                            url: string;
                                            dataGroupId: number | null;
                                            fileName: string;
                                            size: number;
                                            charsetName: string;
                                            layerIds: string;
                                            config?: string | undefined;
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            dataGroupId: number | null;
                                            name: string;
                                            description: string;
                                            type: string;
                                            desIp: string;
                                            desPort: number;
                                            localPort: number;
                                            charsetName: string;
                                            layerIds: number[];
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            type: string;
                                            name: string;
                                            description: string;
                                            config: string;
                                            dataGroupId: number | null;
                                            layerIds: string;
                                            baseUrl: string;
                                        } | null;
                                        sendData: string;
                                        sendType: string;
                                        dataDelay: number;
                                    } | undefined;
                                    projectFunName?: string | undefined;
                                    projectParamList?: any[] | undefined;
                                    projectParamType?: string | undefined;
                                    projectParamValue?: Record<string, any> | undefined;
                                    projectParamCode?: string | undefined;
                                    swiperCardTabsName?: string | undefined;
                                    aiManMsgContent?: string | undefined;
                                    setBroadcastId?: string | null | undefined;
                                    videoStartTime?: number | undefined;
                                    videoEndTime?: number | undefined;
                                    option?: Record<string, any> | undefined;
                                    currentpage?: number | undefined;
                                    translation?: string | undefined;
                                }[];
                                btnObjs: any[];
                            }[];
                            encodes?: {
                                trigger: _screenwright_types.EncodeEventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: string;
                                    actionData: Record<string, any>;
                                    component: string[];
                                    componentConfig: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    };
                                    componentScope: string;
                                    encodeLabel: string | null;
                                    encodeKey: string | null;
                                    encodeValue: number[];
                                }[];
                            }[] | undefined;
                            url?: string | undefined;
                            path?: string | undefined;
                            dataQuery?: string | undefined;
                            loadAnimation: {
                                type: string;
                                direction?: string | undefined;
                                duration: number;
                                delay: number;
                                timingFunction: string;
                                opacityOpen?: boolean | undefined;
                            };
                            presetChild?: /*elided*/ any[] | undefined;
                            minioArr?: {
                                [x: string]: unknown;
                                id: number;
                            }[] | undefined;
                            parent?: number | undefined;
                            unitPavenType?: "percent" | undefined;
                            width?: never | undefined;
                            height?: never | undefined;
                            parentDynamicPanelId?: number[] | undefined;
                            parentEncodeId?: string | undefined;
                        }[] | undefined;
                        left: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        unitPavenType?: "percent" | undefined;
                    }[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    parent?: number | undefined;
                    unitPavenType?: "percent" | undefined;
                    width?: never | undefined;
                    height?: never | undefined;
                    parentDynamicPanelId?: number[] | undefined;
                    parentEncodeId?: string | undefined;
                }[];
                component?: Array<any> | undefined;
                config: string | Array<string | number>;
                name: string;
                detail: string | {
                    width: string;
                    height: string;
                    scale: number;
                    theme?: string | undefined;
                    initLoad: boolean;
                    minioIds?: Array<number | null> | undefined;
                    backgroundImage: string;
                    backgroundColor: string;
                    showBackgroundImage: boolean;
                    showScreenAdaptation: boolean;
                    adaptationNorm: string;
                    adaptationType: _screenwright_types.AdaptationType;
                    showScreenFilter: boolean;
                    screenFilterInfo: {
                        gaussianBlur: number;
                        brightness: number;
                        contrast: number;
                        grayscale: number;
                        hue: number;
                        saturate: number;
                        invert: number;
                        sepia: number;
                        hueRotate?: number | undefined;
                    };
                    showWaterMark: boolean;
                    waterMark: {
                        text: string;
                        fontFamily: string;
                        fontStyle: string;
                        fontWeight: string;
                        fontSize: number;
                        color: string;
                        degree?: number | undefined;
                    };
                    gridDistance: number;
                    query: Record<string, any>;
                    controlWebsocketUrl: string;
                    heartbeatInterval: number;
                    terminalEnableArr: _screenwright_types.TerminalEnableArr;
                    name: string;
                    mark?: Record<string, any> | undefined;
                    isEncodedControl?: boolean | undefined;
                    zIndexMap?: Record<string, any> | undefined;
                };
                backgroundUrl: string | null;
                id: number;
                invitationCode: string;
                status: boolean | null;
                type: number;
                versionCode: string;
                versionDesc: string | null;
                dataFilterArr: string | Record<string, Filter>;
                userId: number;
                sceneId?: number | undefined;
                sceneVersionCode?: string | undefined;
                updatedBy: string;
                updatedTime: string;
                encodedControl: string | string[];
                aniFrameSet: string | {
                    animationList?: {
                        id: string;
                        name: string;
                        componentSetting: {
                            id: number;
                            animationType: _screenwright_types.AnimationType;
                            direction: _screenwright_types.AnimationDirection;
                            timingFunction: _screenwright_types.TimingFunctionType;
                            duration: number;
                            delay: number;
                            iterationCount?: number | undefined;
                            type: "load" | "unload" | "none";
                        }[];
                        isEnable?: boolean | undefined;
                        panelId?: number | undefined;
                        statusId?: string | undefined;
                        isRename?: boolean | undefined;
                    }[] | undefined;
                    activeAnimationList?: {
                        panelId?: number | undefined;
                        statusId?: string | undefined;
                        animationId: string;
                        type: "load" | "unload";
                    }[] | undefined;
                };
                statusAnimation: string | {
                    animations?: {
                        [animationId: string]: _screenwright_types.AnimationInfo;
                    } | undefined;
                    statusAnimations?: {
                        [animationId: string]: {
                            [statusId: string]: _screenwright_types.StatusAnimationMapping;
                        };
                    } | undefined;
                    componentAnimations?: {
                        [animationId: string]: {
                            [statusId: string]: {
                                [componentId: string]: _screenwright_types.ComponentAnimationConfig;
                            };
                        };
                    } | undefined;
                };
            }, _screenwright_types.LargeScreeInfo | {
                layers: string[] | {
                    [x: string]: any;
                    id: number;
                    component: {
                        prop: AllComponentType;
                        width: number;
                        height: number;
                        name: string;
                    };
                    group?: boolean | undefined;
                    selected?: boolean | undefined;
                    children?: {
                        [x: string]: any;
                        id: number;
                        component: {
                            prop: AllComponentType;
                            width: number;
                            height: number;
                            name: string;
                        };
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: /*elided*/ any[] | undefined;
                        name: string;
                        left: number;
                        top: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        option: any;
                        data: any;
                        img: string;
                        title: string;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataType: DataType;
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        url?: string | undefined;
                        path?: string | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: {
                            [x: string]: any;
                            id: string;
                            isEdit: boolean;
                            show: boolean;
                            showOperation: boolean;
                            type: string;
                            dataMethod: "get" | "post" | "put" | "delete";
                            dataType: number;
                            requestHeader: Record<string, any>;
                            requestBody: Record<string, any>;
                            crossOrigin: boolean;
                            needCookie: boolean;
                            autoRefresh: boolean;
                            sql: string;
                            component: {
                                prop: ExtendsChildComponentEnum | string;
                                width: number;
                                height: number;
                                name: string;
                            };
                            option: any;
                            name: string;
                            data: any;
                            img: string;
                            title: string;
                            path?: string | undefined;
                            url?: string | undefined;
                            parent?: number | undefined;
                            top: number;
                            group?: boolean | undefined;
                            selected?: boolean | undefined;
                            children?: /*elided*/ any[] | undefined;
                            left: number;
                            isLock?: boolean | undefined;
                            zIndex: number;
                            display: boolean;
                            listenArgs: {
                                filterName: string;
                                usageStatus: boolean;
                                callbackFields: string[];
                                filterType?: boolean | undefined;
                            }[];
                            cbArgs: {
                                id: string;
                                name: string;
                                type: string;
                                method: string;
                                value: {
                                    origin: {
                                        displayName: "\u5B57\u6BB5\u503C";
                                        type: "input";
                                        value: string;
                                    };
                                    target: {
                                        displayName: "\u53D8\u91CF\u540D";
                                        type: "input";
                                        value: string;
                                    };
                                };
                            }[];
                            openFilter?: boolean | undefined;
                            dataSource: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            };
                            dataRemark?: {
                                description?: string | undefined;
                                key: string;
                                map: string;
                                decription?: string | undefined;
                            }[] | undefined;
                            events: {
                                [x: string]: any;
                                trigger: EventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: _screenwright_types.ActionTypeEnum;
                                    actionData?: Record<string, any> | undefined;
                                    animation?: {
                                        delay: number;
                                        duration: number;
                                        timingFunction: _screenwright_types.timingFunctionType;
                                        type: _screenwright_types.ActionAnimationTypeEnum;
                                        idxValue: number | string;
                                        isRename?: boolean | undefined;
                                    } | undefined;
                                    mapBox?: {
                                        boxOffsetX: number;
                                        boxOffsetY: number;
                                    } | undefined;
                                    layerInfo?: {
                                        color: string;
                                        name: string;
                                        callBackField: string;
                                        childNodeField: string;
                                    } | undefined;
                                    component: string[];
                                    componentConfig?: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    } | undefined;
                                    componentScope?: string | undefined;
                                    stateId?: string | undefined;
                                    sceneStatusName?: string | undefined;
                                    switchSceneStatusDelay?: number | undefined;
                                    timeFastIn?: number | undefined;
                                    timeRewind?: number | undefined;
                                    sceneLevelId?: number | undefined;
                                    keyframesName?: string | undefined;
                                    keyframesPlayDelay?: number | undefined;
                                    stateAnimationName?: string | undefined;
                                    animationState?: number | undefined;
                                    stateAnimationPlayDelay?: number | undefined;
                                    sceneObject?: {
                                        nameList: string[];
                                        name?: string | undefined;
                                        objInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    sceneObjectExplosion?: {
                                        index: string;
                                        lidName: string;
                                        baseName: string;
                                        type: string;
                                    } | undefined;
                                    sceneChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    mapChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    glMapRegionLift?: {
                                        regionId: string;
                                        adcode: string;
                                        name: string;
                                        height: number;
                                        duration: number;
                                    } | undefined;
                                    glMapSceneRoam?: {
                                        sceneId: string;
                                    } | undefined;
                                    glMapIconActive?: {
                                        childId: string;
                                        matchField: string;
                                        matchValue: string;
                                        matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                        eventField: string;
                                        action: _screenwright_types_types_action.GlMapIconActiveAction;
                                        exclusive: boolean;
                                        clearWhenMiss: boolean;
                                    } | undefined;
                                    apiInstructionDetail?: string | undefined;
                                    apiInstructionDelay?: number | undefined;
                                    scale?: {
                                        lock: boolean;
                                        origin: string;
                                        originGrid: {
                                            left: string;
                                            top: string;
                                        };
                                        x: number;
                                        y: number;
                                    } | undefined;
                                    translate?: {
                                        toX: number;
                                        toY: number;
                                    } | undefined;
                                    encodeKey?: string | null | undefined;
                                    ue4Config?: {
                                        messageName: string;
                                        messageJson: string;
                                        messageContent: string;
                                        messageType: string;
                                    } | undefined;
                                    blueprintKey?: string | undefined;
                                    customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                    panelStatusAnimationId?: string | undefined;
                                    panelStatusId?: string | undefined;
                                    tcpudpConfig?: {
                                        dataType: _screenwright_types.tcpudpDataTypeEnum;
                                        dataSourceId: string;
                                        dataSourceObj: Record<string, any> | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            name: string;
                                            description: string;
                                            type: string;
                                            url: string;
                                            dataGroupId: number | null;
                                            fileName: string;
                                            size: number;
                                            charsetName: string;
                                            layerIds: string;
                                            config?: string | undefined;
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            dataGroupId: number | null;
                                            name: string;
                                            description: string;
                                            type: string;
                                            desIp: string;
                                            desPort: number;
                                            localPort: number;
                                            charsetName: string;
                                            layerIds: number[];
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            type: string;
                                            name: string;
                                            description: string;
                                            config: string;
                                            dataGroupId: number | null;
                                            layerIds: string;
                                            baseUrl: string;
                                        } | null;
                                        sendData: string;
                                        sendType: string;
                                        dataDelay: number;
                                    } | undefined;
                                    projectFunName?: string | undefined;
                                    projectParamList?: any[] | undefined;
                                    projectParamType?: string | undefined;
                                    projectParamValue?: Record<string, any> | undefined;
                                    projectParamCode?: string | undefined;
                                    swiperCardTabsName?: string | undefined;
                                    aiManMsgContent?: string | undefined;
                                    setBroadcastId?: string | null | undefined;
                                    videoStartTime?: number | undefined;
                                    videoEndTime?: number | undefined;
                                    option?: Record<string, any> | undefined;
                                    currentpage?: number | undefined;
                                    translation?: string | undefined;
                                }[];
                                btnObjs: any[];
                            }[];
                            encodes?: {
                                trigger: _screenwright_types.EncodeEventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: string;
                                    actionData: Record<string, any>;
                                    component: string[];
                                    componentConfig: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    };
                                    componentScope: string;
                                    encodeLabel: string | null;
                                    encodeKey: string | null;
                                    encodeValue: number[];
                                }[];
                            }[] | undefined;
                            dataQuery?: string | undefined;
                            loadAnimation: {
                                type: string;
                                direction?: string | undefined;
                                duration: number;
                                delay: number;
                                timingFunction: string;
                                opacityOpen?: boolean | undefined;
                            };
                            presetChild?: /*elided*/ any[] | undefined;
                            minioArr?: {
                                [x: string]: unknown;
                                id: number;
                            }[] | undefined;
                            unitPavenType?: "percent" | undefined;
                        }[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        parent?: number | undefined;
                        unitPavenType?: "percent" | undefined;
                        width?: never | undefined;
                        height?: never | undefined;
                        parentDynamicPanelId?: number[] | undefined;
                        parentEncodeId?: string | undefined;
                    }[] | undefined;
                    name: string;
                    left: number;
                    top: number;
                    isLock?: boolean | undefined;
                    zIndex: number;
                    display: boolean;
                    option: any;
                    data: any;
                    img: string;
                    title: string;
                    listenArgs: {
                        filterName: string;
                        usageStatus: boolean;
                        callbackFields: string[];
                        filterType?: boolean | undefined;
                    }[];
                    cbArgs: {
                        id: string;
                        name: string;
                        type: string;
                        method: string;
                        value: {
                            origin: {
                                displayName: "\u5B57\u6BB5\u503C";
                                type: "input";
                                value: string;
                            };
                            target: {
                                displayName: "\u53D8\u91CF\u540D";
                                type: "input";
                                value: string;
                            };
                        };
                    }[];
                    openFilter?: boolean | undefined;
                    dataSource: Record<string, any> | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        name: string;
                        description: string;
                        type: string;
                        url: string;
                        dataGroupId: number | null;
                        fileName: string;
                        size: number;
                        charsetName: string;
                        layerIds: string;
                        config?: string | undefined;
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        dataGroupId: number | null;
                        name: string;
                        description: string;
                        type: string;
                        desIp: string;
                        desPort: number;
                        localPort: number;
                        charsetName: string;
                        layerIds: number[];
                    } | {
                        createdBy: string;
                        createdTime: string;
                        updatedBy: string;
                        updatedTime: string;
                        id: number;
                        userId: number;
                        type: string;
                        name: string;
                        description: string;
                        config: string;
                        dataGroupId: number | null;
                        layerIds: string;
                        baseUrl: string;
                    };
                    dataType: DataType;
                    dataRemark?: {
                        description?: string | undefined;
                        key: string;
                        map: string;
                        decription?: string | undefined;
                    }[] | undefined;
                    events: {
                        [x: string]: any;
                        trigger: EventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: _screenwright_types.ActionTypeEnum;
                            actionData?: Record<string, any> | undefined;
                            animation?: {
                                delay: number;
                                duration: number;
                                timingFunction: _screenwright_types.timingFunctionType;
                                type: _screenwright_types.ActionAnimationTypeEnum;
                                idxValue: number | string;
                                isRename?: boolean | undefined;
                            } | undefined;
                            mapBox?: {
                                boxOffsetX: number;
                                boxOffsetY: number;
                            } | undefined;
                            layerInfo?: {
                                color: string;
                                name: string;
                                callBackField: string;
                                childNodeField: string;
                            } | undefined;
                            component: string[];
                            componentConfig?: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            } | undefined;
                            componentScope?: string | undefined;
                            stateId?: string | undefined;
                            sceneStatusName?: string | undefined;
                            switchSceneStatusDelay?: number | undefined;
                            timeFastIn?: number | undefined;
                            timeRewind?: number | undefined;
                            sceneLevelId?: number | undefined;
                            keyframesName?: string | undefined;
                            keyframesPlayDelay?: number | undefined;
                            stateAnimationName?: string | undefined;
                            animationState?: number | undefined;
                            stateAnimationPlayDelay?: number | undefined;
                            sceneObject?: {
                                nameList: string[];
                                name?: string | undefined;
                                objInfoList: any[];
                                visible: string;
                            } | undefined;
                            sceneObjectExplosion?: {
                                index: string;
                                lidName: string;
                                baseName: string;
                                type: string;
                            } | undefined;
                            sceneChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            mapChildComponent?: {
                                nameList: string[];
                                childComponentInfoList: any[];
                                visible: string;
                            } | undefined;
                            glMapRegionLift?: {
                                regionId: string;
                                adcode: string;
                                name: string;
                                height: number;
                                duration: number;
                            } | undefined;
                            glMapSceneRoam?: {
                                sceneId: string;
                            } | undefined;
                            glMapIconActive?: {
                                childId: string;
                                matchField: string;
                                matchValue: string;
                                matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                eventField: string;
                                action: _screenwright_types_types_action.GlMapIconActiveAction;
                                exclusive: boolean;
                                clearWhenMiss: boolean;
                            } | undefined;
                            apiInstructionDetail?: string | undefined;
                            apiInstructionDelay?: number | undefined;
                            scale?: {
                                lock: boolean;
                                origin: string;
                                originGrid: {
                                    left: string;
                                    top: string;
                                };
                                x: number;
                                y: number;
                            } | undefined;
                            translate?: {
                                toX: number;
                                toY: number;
                            } | undefined;
                            encodeKey?: string | null | undefined;
                            ue4Config?: {
                                messageName: string;
                                messageJson: string;
                                messageContent: string;
                                messageType: string;
                            } | undefined;
                            blueprintKey?: string | undefined;
                            customActionType?: "component" | "message" | "statusAnimation" | undefined;
                            panelStatusAnimationId?: string | undefined;
                            panelStatusId?: string | undefined;
                            tcpudpConfig?: {
                                dataType: _screenwright_types.tcpudpDataTypeEnum;
                                dataSourceId: string;
                                dataSourceObj: Record<string, any> | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    name: string;
                                    description: string;
                                    type: string;
                                    url: string;
                                    dataGroupId: number | null;
                                    fileName: string;
                                    size: number;
                                    charsetName: string;
                                    layerIds: string;
                                    config?: string | undefined;
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    dataGroupId: number | null;
                                    name: string;
                                    description: string;
                                    type: string;
                                    desIp: string;
                                    desPort: number;
                                    localPort: number;
                                    charsetName: string;
                                    layerIds: number[];
                                } | {
                                    createdBy: string;
                                    createdTime: string;
                                    updatedBy: string;
                                    updatedTime: string;
                                    id: number;
                                    userId: number;
                                    type: string;
                                    name: string;
                                    description: string;
                                    config: string;
                                    dataGroupId: number | null;
                                    layerIds: string;
                                    baseUrl: string;
                                } | null;
                                sendData: string;
                                sendType: string;
                                dataDelay: number;
                            } | undefined;
                            projectFunName?: string | undefined;
                            projectParamList?: any[] | undefined;
                            projectParamType?: string | undefined;
                            projectParamValue?: Record<string, any> | undefined;
                            projectParamCode?: string | undefined;
                            swiperCardTabsName?: string | undefined;
                            aiManMsgContent?: string | undefined;
                            setBroadcastId?: string | null | undefined;
                            videoStartTime?: number | undefined;
                            videoEndTime?: number | undefined;
                            option?: Record<string, any> | undefined;
                            currentpage?: number | undefined;
                            translation?: string | undefined;
                        }[];
                        btnObjs: any[];
                    }[];
                    encodes?: {
                        trigger: _screenwright_types.EncodeEventTypeEnum;
                        name: string;
                        id: string;
                        conditionType: _screenwright_types.ConditionLogicTypeEnum;
                        conditions: {
                            id: string;
                            name: string;
                            code: string;
                            type: _screenwright_types.ConditionTypeEnum;
                            compare: _screenwright_types.ConditionCompareEnum;
                            expected: string;
                            field: string;
                            notSaved: boolean;
                            isExists: boolean;
                            tempPool: {
                                name: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                code: string;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                isExists: boolean;
                            };
                        }[];
                        actions: {
                            id: string;
                            name: string;
                            action: string;
                            actionData: Record<string, any>;
                            component: string[];
                            componentConfig: {
                                component: {
                                    prop: AllComponentType;
                                    width: number;
                                    height: number;
                                    name: string;
                                };
                                name: string;
                                option: any;
                                top: number;
                                left: number;
                            };
                            componentScope: string;
                            encodeLabel: string | null;
                            encodeKey: string | null;
                            encodeValue: number[];
                        }[];
                    }[] | undefined;
                    url?: string | undefined;
                    path?: string | undefined;
                    dataQuery?: string | undefined;
                    loadAnimation: {
                        type: string;
                        direction?: string | undefined;
                        duration: number;
                        delay: number;
                        timingFunction: string;
                        opacityOpen?: boolean | undefined;
                    };
                    presetChild?: {
                        [x: string]: any;
                        id: string;
                        isEdit: boolean;
                        show: boolean;
                        showOperation: boolean;
                        type: string;
                        dataMethod: "get" | "post" | "put" | "delete";
                        dataType: number;
                        requestHeader: Record<string, any>;
                        requestBody: Record<string, any>;
                        crossOrigin: boolean;
                        needCookie: boolean;
                        autoRefresh: boolean;
                        sql: string;
                        component: {
                            prop: ExtendsChildComponentEnum | string;
                            width: number;
                            height: number;
                            name: string;
                        };
                        option: any;
                        name: string;
                        data: any;
                        img: string;
                        title: string;
                        path?: string | undefined;
                        url?: string | undefined;
                        parent?: number | undefined;
                        top: number;
                        group?: boolean | undefined;
                        selected?: boolean | undefined;
                        children?: {
                            [x: string]: any;
                            id: number;
                            component: {
                                prop: AllComponentType;
                                width: number;
                                height: number;
                                name: string;
                            };
                            group?: boolean | undefined;
                            selected?: boolean | undefined;
                            children?: /*elided*/ any[] | undefined;
                            name: string;
                            left: number;
                            top: number;
                            isLock?: boolean | undefined;
                            zIndex: number;
                            display: boolean;
                            option: any;
                            data: any;
                            img: string;
                            title: string;
                            listenArgs: {
                                filterName: string;
                                usageStatus: boolean;
                                callbackFields: string[];
                                filterType?: boolean | undefined;
                            }[];
                            cbArgs: {
                                id: string;
                                name: string;
                                type: string;
                                method: string;
                                value: {
                                    origin: {
                                        displayName: "\u5B57\u6BB5\u503C";
                                        type: "input";
                                        value: string;
                                    };
                                    target: {
                                        displayName: "\u53D8\u91CF\u540D";
                                        type: "input";
                                        value: string;
                                    };
                                };
                            }[];
                            openFilter?: boolean | undefined;
                            dataSource: Record<string, any> | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                name: string;
                                description: string;
                                type: string;
                                url: string;
                                dataGroupId: number | null;
                                fileName: string;
                                size: number;
                                charsetName: string;
                                layerIds: string;
                                config?: string | undefined;
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                dataGroupId: number | null;
                                name: string;
                                description: string;
                                type: string;
                                desIp: string;
                                desPort: number;
                                localPort: number;
                                charsetName: string;
                                layerIds: number[];
                            } | {
                                createdBy: string;
                                createdTime: string;
                                updatedBy: string;
                                updatedTime: string;
                                id: number;
                                userId: number;
                                type: string;
                                name: string;
                                description: string;
                                config: string;
                                dataGroupId: number | null;
                                layerIds: string;
                                baseUrl: string;
                            };
                            dataType: DataType;
                            dataRemark?: {
                                description?: string | undefined;
                                key: string;
                                map: string;
                                decription?: string | undefined;
                            }[] | undefined;
                            events: {
                                [x: string]: any;
                                trigger: EventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: _screenwright_types.ActionTypeEnum;
                                    actionData?: Record<string, any> | undefined;
                                    animation?: {
                                        delay: number;
                                        duration: number;
                                        timingFunction: _screenwright_types.timingFunctionType;
                                        type: _screenwright_types.ActionAnimationTypeEnum;
                                        idxValue: number | string;
                                        isRename?: boolean | undefined;
                                    } | undefined;
                                    mapBox?: {
                                        boxOffsetX: number;
                                        boxOffsetY: number;
                                    } | undefined;
                                    layerInfo?: {
                                        color: string;
                                        name: string;
                                        callBackField: string;
                                        childNodeField: string;
                                    } | undefined;
                                    component: string[];
                                    componentConfig?: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    } | undefined;
                                    componentScope?: string | undefined;
                                    stateId?: string | undefined;
                                    sceneStatusName?: string | undefined;
                                    switchSceneStatusDelay?: number | undefined;
                                    timeFastIn?: number | undefined;
                                    timeRewind?: number | undefined;
                                    sceneLevelId?: number | undefined;
                                    keyframesName?: string | undefined;
                                    keyframesPlayDelay?: number | undefined;
                                    stateAnimationName?: string | undefined;
                                    animationState?: number | undefined;
                                    stateAnimationPlayDelay?: number | undefined;
                                    sceneObject?: {
                                        nameList: string[];
                                        name?: string | undefined;
                                        objInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    sceneObjectExplosion?: {
                                        index: string;
                                        lidName: string;
                                        baseName: string;
                                        type: string;
                                    } | undefined;
                                    sceneChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    mapChildComponent?: {
                                        nameList: string[];
                                        childComponentInfoList: any[];
                                        visible: string;
                                    } | undefined;
                                    glMapRegionLift?: {
                                        regionId: string;
                                        adcode: string;
                                        name: string;
                                        height: number;
                                        duration: number;
                                    } | undefined;
                                    glMapSceneRoam?: {
                                        sceneId: string;
                                    } | undefined;
                                    glMapIconActive?: {
                                        childId: string;
                                        matchField: string;
                                        matchValue: string;
                                        matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                        eventField: string;
                                        action: _screenwright_types_types_action.GlMapIconActiveAction;
                                        exclusive: boolean;
                                        clearWhenMiss: boolean;
                                    } | undefined;
                                    apiInstructionDetail?: string | undefined;
                                    apiInstructionDelay?: number | undefined;
                                    scale?: {
                                        lock: boolean;
                                        origin: string;
                                        originGrid: {
                                            left: string;
                                            top: string;
                                        };
                                        x: number;
                                        y: number;
                                    } | undefined;
                                    translate?: {
                                        toX: number;
                                        toY: number;
                                    } | undefined;
                                    encodeKey?: string | null | undefined;
                                    ue4Config?: {
                                        messageName: string;
                                        messageJson: string;
                                        messageContent: string;
                                        messageType: string;
                                    } | undefined;
                                    blueprintKey?: string | undefined;
                                    customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                    panelStatusAnimationId?: string | undefined;
                                    panelStatusId?: string | undefined;
                                    tcpudpConfig?: {
                                        dataType: _screenwright_types.tcpudpDataTypeEnum;
                                        dataSourceId: string;
                                        dataSourceObj: Record<string, any> | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            name: string;
                                            description: string;
                                            type: string;
                                            url: string;
                                            dataGroupId: number | null;
                                            fileName: string;
                                            size: number;
                                            charsetName: string;
                                            layerIds: string;
                                            config?: string | undefined;
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            dataGroupId: number | null;
                                            name: string;
                                            description: string;
                                            type: string;
                                            desIp: string;
                                            desPort: number;
                                            localPort: number;
                                            charsetName: string;
                                            layerIds: number[];
                                        } | {
                                            createdBy: string;
                                            createdTime: string;
                                            updatedBy: string;
                                            updatedTime: string;
                                            id: number;
                                            userId: number;
                                            type: string;
                                            name: string;
                                            description: string;
                                            config: string;
                                            dataGroupId: number | null;
                                            layerIds: string;
                                            baseUrl: string;
                                        } | null;
                                        sendData: string;
                                        sendType: string;
                                        dataDelay: number;
                                    } | undefined;
                                    projectFunName?: string | undefined;
                                    projectParamList?: any[] | undefined;
                                    projectParamType?: string | undefined;
                                    projectParamValue?: Record<string, any> | undefined;
                                    projectParamCode?: string | undefined;
                                    swiperCardTabsName?: string | undefined;
                                    aiManMsgContent?: string | undefined;
                                    setBroadcastId?: string | null | undefined;
                                    videoStartTime?: number | undefined;
                                    videoEndTime?: number | undefined;
                                    option?: Record<string, any> | undefined;
                                    currentpage?: number | undefined;
                                    translation?: string | undefined;
                                }[];
                                btnObjs: any[];
                            }[];
                            encodes?: {
                                trigger: _screenwright_types.EncodeEventTypeEnum;
                                name: string;
                                id: string;
                                conditionType: _screenwright_types.ConditionLogicTypeEnum;
                                conditions: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    notSaved: boolean;
                                    isExists: boolean;
                                    tempPool: {
                                        name: string;
                                        type: _screenwright_types.ConditionTypeEnum;
                                        code: string;
                                        compare: _screenwright_types.ConditionCompareEnum;
                                        expected: string;
                                        field: string;
                                        isExists: boolean;
                                    };
                                }[];
                                actions: {
                                    id: string;
                                    name: string;
                                    action: string;
                                    actionData: Record<string, any>;
                                    component: string[];
                                    componentConfig: {
                                        component: {
                                            prop: AllComponentType;
                                            width: number;
                                            height: number;
                                            name: string;
                                        };
                                        name: string;
                                        option: any;
                                        top: number;
                                        left: number;
                                    };
                                    componentScope: string;
                                    encodeLabel: string | null;
                                    encodeKey: string | null;
                                    encodeValue: number[];
                                }[];
                            }[] | undefined;
                            url?: string | undefined;
                            path?: string | undefined;
                            dataQuery?: string | undefined;
                            loadAnimation: {
                                type: string;
                                direction?: string | undefined;
                                duration: number;
                                delay: number;
                                timingFunction: string;
                                opacityOpen?: boolean | undefined;
                            };
                            presetChild?: /*elided*/ any[] | undefined;
                            minioArr?: {
                                [x: string]: unknown;
                                id: number;
                            }[] | undefined;
                            parent?: number | undefined;
                            unitPavenType?: "percent" | undefined;
                            width?: never | undefined;
                            height?: never | undefined;
                            parentDynamicPanelId?: number[] | undefined;
                            parentEncodeId?: string | undefined;
                        }[] | undefined;
                        left: number;
                        isLock?: boolean | undefined;
                        zIndex: number;
                        display: boolean;
                        listenArgs: {
                            filterName: string;
                            usageStatus: boolean;
                            callbackFields: string[];
                            filterType?: boolean | undefined;
                        }[];
                        cbArgs: {
                            id: string;
                            name: string;
                            type: string;
                            method: string;
                            value: {
                                origin: {
                                    displayName: "\u5B57\u6BB5\u503C";
                                    type: "input";
                                    value: string;
                                };
                                target: {
                                    displayName: "\u53D8\u91CF\u540D";
                                    type: "input";
                                    value: string;
                                };
                            };
                        }[];
                        openFilter?: boolean | undefined;
                        dataSource: Record<string, any> | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            name: string;
                            description: string;
                            type: string;
                            url: string;
                            dataGroupId: number | null;
                            fileName: string;
                            size: number;
                            charsetName: string;
                            layerIds: string;
                            config?: string | undefined;
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            dataGroupId: number | null;
                            name: string;
                            description: string;
                            type: string;
                            desIp: string;
                            desPort: number;
                            localPort: number;
                            charsetName: string;
                            layerIds: number[];
                        } | {
                            createdBy: string;
                            createdTime: string;
                            updatedBy: string;
                            updatedTime: string;
                            id: number;
                            userId: number;
                            type: string;
                            name: string;
                            description: string;
                            config: string;
                            dataGroupId: number | null;
                            layerIds: string;
                            baseUrl: string;
                        };
                        dataRemark?: {
                            description?: string | undefined;
                            key: string;
                            map: string;
                            decription?: string | undefined;
                        }[] | undefined;
                        events: {
                            [x: string]: any;
                            trigger: EventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: _screenwright_types.ActionTypeEnum;
                                actionData?: Record<string, any> | undefined;
                                animation?: {
                                    delay: number;
                                    duration: number;
                                    timingFunction: _screenwright_types.timingFunctionType;
                                    type: _screenwright_types.ActionAnimationTypeEnum;
                                    idxValue: number | string;
                                    isRename?: boolean | undefined;
                                } | undefined;
                                mapBox?: {
                                    boxOffsetX: number;
                                    boxOffsetY: number;
                                } | undefined;
                                layerInfo?: {
                                    color: string;
                                    name: string;
                                    callBackField: string;
                                    childNodeField: string;
                                } | undefined;
                                component: string[];
                                componentConfig?: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                } | undefined;
                                componentScope?: string | undefined;
                                stateId?: string | undefined;
                                sceneStatusName?: string | undefined;
                                switchSceneStatusDelay?: number | undefined;
                                timeFastIn?: number | undefined;
                                timeRewind?: number | undefined;
                                sceneLevelId?: number | undefined;
                                keyframesName?: string | undefined;
                                keyframesPlayDelay?: number | undefined;
                                stateAnimationName?: string | undefined;
                                animationState?: number | undefined;
                                stateAnimationPlayDelay?: number | undefined;
                                sceneObject?: {
                                    nameList: string[];
                                    name?: string | undefined;
                                    objInfoList: any[];
                                    visible: string;
                                } | undefined;
                                sceneObjectExplosion?: {
                                    index: string;
                                    lidName: string;
                                    baseName: string;
                                    type: string;
                                } | undefined;
                                sceneChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                mapChildComponent?: {
                                    nameList: string[];
                                    childComponentInfoList: any[];
                                    visible: string;
                                } | undefined;
                                glMapRegionLift?: {
                                    regionId: string;
                                    adcode: string;
                                    name: string;
                                    height: number;
                                    duration: number;
                                } | undefined;
                                glMapSceneRoam?: {
                                    sceneId: string;
                                } | undefined;
                                glMapIconActive?: {
                                    childId: string;
                                    matchField: string;
                                    matchValue: string;
                                    matchValueSource: _screenwright_types_types_action.GlMapIconActiveMatchValueSource;
                                    eventField: string;
                                    action: _screenwright_types_types_action.GlMapIconActiveAction;
                                    exclusive: boolean;
                                    clearWhenMiss: boolean;
                                } | undefined;
                                apiInstructionDetail?: string | undefined;
                                apiInstructionDelay?: number | undefined;
                                scale?: {
                                    lock: boolean;
                                    origin: string;
                                    originGrid: {
                                        left: string;
                                        top: string;
                                    };
                                    x: number;
                                    y: number;
                                } | undefined;
                                translate?: {
                                    toX: number;
                                    toY: number;
                                } | undefined;
                                encodeKey?: string | null | undefined;
                                ue4Config?: {
                                    messageName: string;
                                    messageJson: string;
                                    messageContent: string;
                                    messageType: string;
                                } | undefined;
                                blueprintKey?: string | undefined;
                                customActionType?: "component" | "message" | "statusAnimation" | undefined;
                                panelStatusAnimationId?: string | undefined;
                                panelStatusId?: string | undefined;
                                tcpudpConfig?: {
                                    dataType: _screenwright_types.tcpudpDataTypeEnum;
                                    dataSourceId: string;
                                    dataSourceObj: Record<string, any> | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        name: string;
                                        description: string;
                                        type: string;
                                        url: string;
                                        dataGroupId: number | null;
                                        fileName: string;
                                        size: number;
                                        charsetName: string;
                                        layerIds: string;
                                        config?: string | undefined;
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        dataGroupId: number | null;
                                        name: string;
                                        description: string;
                                        type: string;
                                        desIp: string;
                                        desPort: number;
                                        localPort: number;
                                        charsetName: string;
                                        layerIds: number[];
                                    } | {
                                        createdBy: string;
                                        createdTime: string;
                                        updatedBy: string;
                                        updatedTime: string;
                                        id: number;
                                        userId: number;
                                        type: string;
                                        name: string;
                                        description: string;
                                        config: string;
                                        dataGroupId: number | null;
                                        layerIds: string;
                                        baseUrl: string;
                                    } | null;
                                    sendData: string;
                                    sendType: string;
                                    dataDelay: number;
                                } | undefined;
                                projectFunName?: string | undefined;
                                projectParamList?: any[] | undefined;
                                projectParamType?: string | undefined;
                                projectParamValue?: Record<string, any> | undefined;
                                projectParamCode?: string | undefined;
                                swiperCardTabsName?: string | undefined;
                                aiManMsgContent?: string | undefined;
                                setBroadcastId?: string | null | undefined;
                                videoStartTime?: number | undefined;
                                videoEndTime?: number | undefined;
                                option?: Record<string, any> | undefined;
                                currentpage?: number | undefined;
                                translation?: string | undefined;
                            }[];
                            btnObjs: any[];
                        }[];
                        encodes?: {
                            trigger: _screenwright_types.EncodeEventTypeEnum;
                            name: string;
                            id: string;
                            conditionType: _screenwright_types.ConditionLogicTypeEnum;
                            conditions: {
                                id: string;
                                name: string;
                                code: string;
                                type: _screenwright_types.ConditionTypeEnum;
                                compare: _screenwright_types.ConditionCompareEnum;
                                expected: string;
                                field: string;
                                notSaved: boolean;
                                isExists: boolean;
                                tempPool: {
                                    name: string;
                                    type: _screenwright_types.ConditionTypeEnum;
                                    code: string;
                                    compare: _screenwright_types.ConditionCompareEnum;
                                    expected: string;
                                    field: string;
                                    isExists: boolean;
                                };
                            }[];
                            actions: {
                                id: string;
                                name: string;
                                action: string;
                                actionData: Record<string, any>;
                                component: string[];
                                componentConfig: {
                                    component: {
                                        prop: AllComponentType;
                                        width: number;
                                        height: number;
                                        name: string;
                                    };
                                    name: string;
                                    option: any;
                                    top: number;
                                    left: number;
                                };
                                componentScope: string;
                                encodeLabel: string | null;
                                encodeKey: string | null;
                                encodeValue: number[];
                            }[];
                        }[] | undefined;
                        dataQuery?: string | undefined;
                        loadAnimation: {
                            type: string;
                            direction?: string | undefined;
                            duration: number;
                            delay: number;
                            timingFunction: string;
                            opacityOpen?: boolean | undefined;
                        };
                        presetChild?: /*elided*/ any[] | undefined;
                        minioArr?: {
                            [x: string]: unknown;
                            id: number;
                        }[] | undefined;
                        unitPavenType?: "percent" | undefined;
                    }[] | undefined;
                    minioArr?: {
                        [x: string]: unknown;
                        id: number;
                    }[] | undefined;
                    parent?: number | undefined;
                    unitPavenType?: "percent" | undefined;
                    width?: never | undefined;
                    height?: never | undefined;
                    parentDynamicPanelId?: number[] | undefined;
                    parentEncodeId?: string | undefined;
                }[];
                component?: Array<any> | undefined;
                config: string | Array<string | number>;
                name: string;
                detail: string | {
                    width: string;
                    height: string;
                    scale: number;
                    theme?: string | undefined;
                    initLoad: boolean;
                    minioIds?: Array<number | null> | undefined;
                    backgroundImage: string;
                    backgroundColor: string;
                    showBackgroundImage: boolean;
                    showScreenAdaptation: boolean;
                    adaptationNorm: string;
                    adaptationType: _screenwright_types.AdaptationType;
                    showScreenFilter: boolean;
                    screenFilterInfo: {
                        gaussianBlur: number;
                        brightness: number;
                        contrast: number;
                        grayscale: number;
                        hue: number;
                        saturate: number;
                        invert: number;
                        sepia: number;
                        hueRotate?: number | undefined;
                    };
                    showWaterMark: boolean;
                    waterMark: {
                        text: string;
                        fontFamily: string;
                        fontStyle: string;
                        fontWeight: string;
                        fontSize: number;
                        color: string;
                        degree?: number | undefined;
                    };
                    gridDistance: number;
                    query: Record<string, any>;
                    controlWebsocketUrl: string;
                    heartbeatInterval: number;
                    terminalEnableArr: _screenwright_types.TerminalEnableArr;
                    name: string;
                    mark?: Record<string, any> | undefined;
                    isEncodedControl?: boolean | undefined;
                    zIndexMap?: Record<string, any> | undefined;
                };
                backgroundUrl: string | null;
                id: number;
                invitationCode: string;
                status: boolean | null;
                type: number;
                versionCode: string;
                versionDesc: string | null;
                dataFilterArr: string | Record<string, Filter>;
                userId: number;
                sceneId?: number | undefined;
                sceneVersionCode?: string | undefined;
                updatedBy: string;
                updatedTime: string;
                encodedControl: string | string[];
                aniFrameSet: string | {
                    animationList?: {
                        id: string;
                        name: string;
                        componentSetting: {
                            id: number;
                            animationType: _screenwright_types.AnimationType;
                            direction: _screenwright_types.AnimationDirection;
                            timingFunction: _screenwright_types.TimingFunctionType;
                            duration: number;
                            delay: number;
                            iterationCount?: number | undefined;
                            type: "load" | "unload" | "none";
                        }[];
                        isEnable?: boolean | undefined;
                        panelId?: number | undefined;
                        statusId?: string | undefined;
                        isRename?: boolean | undefined;
                    }[] | undefined;
                    activeAnimationList?: {
                        panelId?: number | undefined;
                        statusId?: string | undefined;
                        animationId: string;
                        type: "load" | "unload";
                    }[] | undefined;
                };
                statusAnimation: string | {
                    animations?: {
                        [animationId: string]: _screenwright_types.AnimationInfo;
                    } | undefined;
                    statusAnimations?: {
                        [animationId: string]: {
                            [statusId: string]: _screenwright_types.StatusAnimationMapping;
                        };
                    } | undefined;
                    componentAnimations?: {
                        [animationId: string]: {
                            [statusId: string]: {
                                [componentId: string]: _screenwright_types.ComponentAnimationConfig;
                            };
                        };
                    } | undefined;
                };
            }>;
            isLoad: vue.Ref<boolean, boolean>;
            groupData: vue.Ref<ComponentType[], ComponentType[]>;
            setDetail2Config: (res: _screenwright_types.LargeScreeInfo) => void;
            initLargeScreen: (id: number) => Promise<void>;
            initLargeScreenData: (res: _screenwright_types.LargeScreeInfo) => Promise<void>;
            initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
        };
        useEditStore: () => {
            targetChart: vue.Ref<_screenwright_composables.TargetChartType, _screenwright_composables.TargetChartType>;
            editCanvas: vue.Ref<{
                editLayoutDom: HTMLElement | null;
                editContentDom: HTMLElement | null;
                offset: number;
                userScale: number;
                lockScale: boolean;
                isCreate: boolean;
                isDrag: boolean;
                isSelect: boolean;
                isCodeEdit: boolean;
            }, EditCanvasType | {
                editLayoutDom: HTMLElement | null;
                editContentDom: HTMLElement | null;
                offset: number;
                userScale: number;
                lockScale: boolean;
                isCreate: boolean;
                isDrag: boolean;
                isSelect: boolean;
                isCodeEdit: boolean;
            }>;
            componentList: vue.Ref<ComponentType[], ComponentType[]>;
            currentCanvasPlacement: () => _screenwright_core.ComponentPlacement | undefined;
            mousePosition: vue.Ref<{
                startX: number;
                startY: number;
                x: number;
                y: number;
            }, {
                startX: number;
                startY: number;
                x: number;
                y: number;
            } | {
                startX: number;
                startY: number;
                x: number;
                y: number;
            }>;
            rightMenuShow: vue.Ref<boolean, boolean>;
            selectTargetDataId: vue.ComputedRef<string[]>;
            selectTargetData: vue.ComputedRef<ComponentType[]>;
            editConfig: vue.WritableComputedRef<_screenwright_types.LargeScreenDetailInfo, _screenwright_types.LargeScreenDetailInfo>;
            actionComponentId: vue.Ref<string, string>;
            selectTargetDataInitial: vue.ComputedRef<(ComponentType | null)[]>;
            syncGlobalComponentData: () => void;
            setDetail2Config: (res: _screenwright_types.LargeScreeInfo) => void;
            setEditConfig: <K extends keyof _screenwright_types.LargeScreenDetailInfo>(key: K, value: _screenwright_types.LargeScreenDetailInfo[K]) => void;
            setEditCanvas: <K extends keyof EditCanvasType>(key: K, value: EditCanvasType[K]) => void;
            setRightMenuShow: (value: boolean) => void;
            setTargetHoverChart: (hoverId?: _screenwright_composables.TargetChartType["hoverId"]) => void;
            setMousePosition: (x?: number, y?: number, startX?: number, startY?: number) => void;
            fetchTargetById: (id: string) => ComponentType | null;
            setTargetSelectChart: (selectId?: string | string[], push?: boolean) => void;
            resetEditStore: () => void;
            updateEditConfig: () => Promise<void>;
            isPanel: () => boolean;
            isDynamicPanel: () => boolean;
            isEncodePanel: () => boolean;
            isBuild: () => boolean;
            scrollIntoViewTree: (id: string) => void;
        };
        useGlobalAnimation: () => {
            triggerRegistry: Map<string, _screenwright_composables.AnimationTrigger>;
            registerAnimationTrigger: (id: string, trigger: (params: {
                animation: Animation;
                newAnimationCallback?: _screenwright_composables.AnimationCallbacks;
                triggerType: "enter" | "leave" | "preview";
            }) => void) => void;
            unregisterAnimationTrigger: (componentId: string) => void;
            getAllTriggers: () => string[];
            resetTriggerRegistry: () => void;
        };
        useDataFilter: () => {
            dataFilter: vue.WritableComputedRef<Record<string, Filter>, Record<string, Filter>>;
            cloneDataFilter: vue.ComputedRef<Record<string, Filter>>;
            diffSelectFilter: vue.WritableComputedRef<Filter[], Filter[]>;
            currentFilter: vue.WritableComputedRef<Filter[], Filter[]>;
            currentFilterNum: vue.ComputedRef<number>;
            isCanAddFilter: vue.ComputedRef<boolean>;
            filterResultCollector: _screenwright_composables.FilterResultCollector;
            newDataFilter: vue.Ref<{
                callBack: string[];
                callBackStatus: boolean;
                dataFormatter: string;
                bindComponent: {
                    label: string;
                    id: number | string;
                }[];
                checked: boolean;
                notSaved: boolean;
                tempPool: {
                    callBack: any[];
                    dataFormatter: string;
                };
                name: string;
                show?: boolean | undefined;
                id?: string | undefined;
            }[], Filter[] | {
                callBack: string[];
                callBackStatus: boolean;
                dataFormatter: string;
                bindComponent: {
                    label: string;
                    id: number | string;
                }[];
                checked: boolean;
                notSaved: boolean;
                tempPool: {
                    callBack: any[];
                    dataFormatter: string;
                };
                name: string;
                show?: boolean | undefined;
                id?: string | undefined;
            }[]>;
            filterResultForCurrentComponent: vue.ComputedRef<any[]>;
            filterAllResultForCurrentComponent: vue.ComputedRef<_screenwright_core.ResultCollectItem[]>;
            hideAllFilter: () => void;
            handleSelectDataFilter: (value: string) => void;
            handleClearNotSave: () => void;
            addNewDataFilterToGlobal: () => Filter;
            handleSave: (filter: Filter) => Promise<{
                success: false;
                error: "duplicate_name" | "empty_name" | "filter_not_found" | "not_modified";
            } | {
                success: boolean;
                error?: undefined;
            } | {
                success: boolean;
                error: "save_failed";
            }>;
            handleSaveFilter: (filter: Filter, originalName?: string) => Promise<boolean>;
            addDataFilterToComponent: (name?: string) => Promise<void>;
            deleteFilterFromComponent: (item: Filter, component?: ComponentType | ChildComponent) => Promise<{
                success: boolean;
                error: "\u7EC4\u4EF6\u4E0D\u5B58\u5728" | "\u4FDD\u5B58\u5931\u8D25" | undefined;
                data: any[] | null;
            }>;
            cloneDataFilterOnInit: () => void;
            handleFilterEnable: ({ filter, value, component }: {
                filter: Filter;
                value: boolean;
                component: ComponentType | ChildComponent | undefined;
            }) => Promise<any>;
            updateFilterOnComponentPasted: (id: number | string) => Promise<_screenwright_composables.BaseEntity<null> | undefined>;
            updateFilterOnComponentDeleted: (id: number | string) => Promise<_screenwright_composables.BaseEntity<null> | undefined>;
            updateCallbackArgumentToFilter: (filter: Filter, callbackArgument: string[]) => void;
            checkFilterNotSavedOnCallbackChange: (filter: Filter) => void;
            resetDataFilter: () => void;
            onFilterCodeChange: (item: Filter, value: string) => void;
            resetFilterToCloneData: (item: Filter) => void;
            getFilterResult: (result?: _screenwright_core.ResultCollectItem) => any[];
            saveGlobalDataFilter: () => Promise<any>;
            getFilterResultsByComponentId: (id: string | number) => {
                success: false;
                error: string;
                results: never[];
            } | {
                success: true;
                results: {
                    filterName: any;
                    inputData: any;
                    outputData: any;
                    success: any;
                    error: any;
                }[];
                error?: undefined;
            };
            getFilterInComponentIndex: (filter: Filter) => number;
            shouldShowTest: (filter: Filter, needTest: boolean) => boolean;
            shouldShowCheckbox: (filter: Filter, needCheckBox: boolean) => boolean;
            deleteFilter: (filterName: string) => Promise<{
                success: boolean;
                error?: string;
            }>;
            _addListenArgs: (filter: Filter, component?: ComponentType | ChildComponent) => void;
            _updateFilterStatus: (filter: Filter) => Filter;
            _processCallbackRelations: (name: string, component?: ComponentType | ChildComponent) => void;
            _updateComponentListeners: (name: string, components?: (ComponentType | ChildComponent)[]) => Promise<void>;
        };
        useGlobalComponentData: () => {
            groupData: vue.Ref<ComponentType[], ComponentType[]>;
            globalComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            encodeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            allComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            iframeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            screenWithIframeComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            screenRootComponentMap: vue.ComputedRef<_screenwright_core.FlatComponentMap>;
            panelChildComponentMap: vue.ComputedRef<Map<string, _screenwright_core.ComponentMap>>;
            panelChildComponentMapByStatus: vue.ComputedRef<Map<string, Map<string, _screenwright_core.ComponentMap>>>;
            setGroupData: (detailInfo: _screenwright_types.LargeScreeInfo) => void;
            resetGroupData: () => void;
            findTargetDynamicPanel: typeof _screenwright_core.findTargetDynamicPanel;
        };
        useLargeScreenInfo: () => {
            navInfo: vue.Ref<_screenwright_core.NavInfo, _screenwright_core.NavInfo>;
            isMultiPerson: vue.ComputedRef<boolean>;
            setNavInfo: (detailInfo: _screenwright_types.LargeScreeInfo) => void;
            setVersionCode: (code: string) => void;
            resetNavInfo: () => void;
            setDetailField: <K extends keyof _screenwright_types.LargeScreenDetailInfo>(key: K, value: _screenwright_types.LargeScreenDetailInfo[K]) => void;
            resetDetail: () => void;
        };
        useActionEvent: () => {
            eventList: vue.Ref<_screenwright_types.TotalPanelEventMap, _screenwright_types.TotalPanelEventMap>;
            addEvent: (event: _screenwright_types.toAddEvent) => void;
            addEventHandler: <K extends keyof _screenwright_types.TotalPanelEventMap, F extends keyof _screenwright_types.TotalPanelEventMap[K], T extends Parameters<Extract<_screenwright_types.TotalPanelEventMap[K][F], (...args: any) => any>>>(key: K, functionName: F, handler: (...args: T) => void | Promise<void>) => void;
        };
        useEventHandling: typeof useEventHandling;
        useEventCallbacks: () => {
            registerCallback: (callback: _screenwright_core.EventCallbackFunction) => () => void;
            registerCallbacks: (callbackList: _screenwright_core.EventCallbackFunction[]) => () => void;
            unregisterCallback: (callback: _screenwright_core.EventCallbackFunction) => void;
            clearCallbacks: () => void;
            executeCallbacks: (params: _screenwright_core.EventCallbackParams) => Promise<void>;
            getCallbackCount: () => number;
        };
        useEvent: () => {
            handleEvents: ({ throwValue, events, isExecuteOnlyConditionSatisfied, triggerType, id, throwCallback, callbackDebounce, isExecuteOnlyInViewMod }?: {
                throwValue: Record<string, any>;
                events: _screenwright_types.Event[];
                isOutsideMessage?: boolean;
                id?: number | string;
                isExecuteOnlyConditionSatisfied?: boolean;
                triggerType: _screenwright_types.EventTypeEnum;
                modelId?: string;
                throwCallback?: boolean;
                callbackDebounce?: boolean;
                isExecuteOnlyInViewMod?: boolean;
            }) => Promise<void>;
            handleEventAndCallbackEvent: (params: {
                throwValue: Record<string, any>;
                events: _screenwright_types.Event[];
                isOutsideMessage?: boolean;
                id?: number | string;
                isExecuteOnlyConditionSatisfied?: boolean;
                triggerType: _screenwright_types.EventTypeEnum;
                modelId?: string;
                throwCallback?: boolean;
                callbackDebounce?: boolean;
                isExecuteOnlyInViewMod?: boolean;
            }) => void;
            isBuild: vue.ComputedRef<boolean>;
            activeChildComponent: vue.Ref<any, any>;
        };
        useCallbackArguments: () => {
            callbackEventManager: _screenwright_core.CallbackEventManager;
            callbackArgumentsManager: vue.ComputedRef<_screenwright_types.CallbackManager>;
            callbackArgumentsInstance: vue.Ref<{
                clearCallbackArguments: () => void;
                getCallbackArgumentsManager: () => _screenwright_types.CallbackManager;
                getCallbackArgs: () => Record<string, any>;
                getEventMappingTarget: () => node_modules__screenwright_core_dist_events_CallbackArguments.EventMappingTarget;
                setCallbackArgs: (key: string, value: any) => void;
                deleteCallbackArgs: (key: string) => void;
                addCallbackArgument: (component: ComponentType | ChildComponent) => void;
                initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
                addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
                initCallbackRelation: (field: string) => void;
                removeComponentFromCallbacks: (component: ComponentType | ChildComponent) => void;
                handleCallback: ({ sourceComponent, throwValue }: {
                    sourceComponent: ComponentType | ChildComponent;
                    throwValue: Record<string, any>;
                }) => void;
            }, _screenwright_core.CallbackArguments | {
                clearCallbackArguments: () => void;
                getCallbackArgumentsManager: () => _screenwright_types.CallbackManager;
                getCallbackArgs: () => Record<string, any>;
                getEventMappingTarget: () => node_modules__screenwright_core_dist_events_CallbackArguments.EventMappingTarget;
                setCallbackArgs: (key: string, value: any) => void;
                deleteCallbackArgs: (key: string) => void;
                addCallbackArgument: (component: ComponentType | ChildComponent) => void;
                initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
                addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
                initCallbackRelation: (field: string) => void;
                removeComponentFromCallbacks: (component: ComponentType | ChildComponent) => void;
                handleCallback: ({ sourceComponent, throwValue }: {
                    sourceComponent: ComponentType | ChildComponent;
                    throwValue: Record<string, any>;
                }) => void;
            }>;
            addCallbackArgument: (component: ComponentType) => void;
            initCallbackArguments: (componentList: ComponentType[] | ChildComponent[]) => void;
            initCallbackRelation: (field: string) => void;
            handleCallback: ({ sourceComponent, throwValue, debounce, debounceForCallbackArgs }: {
                sourceComponent: ComponentType | ChildComponent;
                throwValue: Record<string, any>;
                debounceForCallbackArgs?: boolean;
                debounce?: boolean;
            }) => Promise<_screenwright_composables.HandleCallbackResult | undefined>;
            setCallbackArgs: (key: string, value: any) => void;
            updateCallbackRelation: (component: ComponentType | ChildComponent) => void;
            deleteCallbackRelation: (component: ComponentType | ChildComponent) => void;
            addCallbackArgumentsFromComponentList: (componentList: ComponentType[] | ChildComponent[]) => void;
            onClear: () => void;
            onAddCallbackField: (id: number | string, callback: _screenwright_core.AddCallbackFieldHandler) => void;
            offAddCallbackField: (id: number | string, callback?: _screenwright_core.AddCallbackFieldHandler) => void;
            emitAddCallbackField: (id: number | string, callbackField: string) => Promise<any[]>;
            onRemoveCallbackField: (id: number | string, callback: _screenwright_core.RemoveCallbackFieldHandler) => void;
            offRemoveCallbackField: (id: number | string, callback?: _screenwright_core.RemoveCallbackFieldHandler) => void;
            emitRemoveCallbackField: (id: number | string, callbackField: string) => Promise<unknown[]>;
            onCallbackFieldTrigger: ({ targetKey, id, callback }: {
                targetKey: string;
                id: number | string;
                callback: _screenwright_core.CallbackFieldTriggerHandler;
            }) => void;
            offCallbackFieldTrigger: ({ targetKey, id, callback }: {
                targetKey: string;
                id: number | string;
                callback?: _screenwright_core.CallbackFieldTriggerHandler;
            }) => Promise<void>;
            emitCallbackFieldTrigger: (targetKey: string, id: number | string) => Promise<any[]>;
            onFilterTrigger: (componentId: string, callback: _screenwright_core.FilterTriggerHandler) => void;
            offFilterTrigger: (componentId: string, callback?: _screenwright_core.FilterTriggerHandler) => void;
            emitFilterTrigger: (componentId: string, customComponent?: ComponentType | ChildComponent) => Promise<any[]>;
        };
        useEncodeEvent: () => {
            handleEncodeEvent: ({ sourceComponent, encodes, throwValue }: {
                sourceComponent?: ComponentType;
                encodes: EncodeEvent[];
                throwValue: any;
            }) => void;
            handleEncodeEventThrottled: (params: Parameters<({ sourceComponent, encodes, throwValue }: {
                sourceComponent?: ComponentType;
                encodes: EncodeEvent[];
                throwValue: any;
            }) => void>[0]) => void;
        };
        useEncodeCommunication: () => {
            terminalCommunicationWs: vue.Ref<{
                limitConnect: number;
                longConnect: boolean;
                websocketServerUrl: string;
                token: string | null;
                socketOpen?: null | string | undefined;
                ws?: {
                    binaryType: BinaryType;
                    readonly bufferedAmount: number;
                    readonly extensions: string;
                    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                    onerror: ((this: WebSocket, ev: Event) => any) | null;
                    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                    onopen: ((this: WebSocket, ev: Event) => any) | null;
                    readonly protocol: string;
                    readonly readyState: number;
                    readonly url: string;
                    close: (code?: number, reason?: string) => void;
                    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                    readonly CONNECTING: 0;
                    readonly OPEN: 1;
                    readonly CLOSING: 2;
                    readonly CLOSED: 3;
                    addEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    };
                    removeEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | undefined;
                responseTimeout: number;
                responseCheckTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                lastSendTime: number;
                lastReceiveTime: number;
                onReceiveMessageCallback?: ((data: any) => void) | undefined;
                onOpenCallback?: (() => void) | undefined;
                onErrorCallback?: ((error: string) => void) | undefined;
                hasPendingMessage: boolean;
                enableHeartbeat: boolean;
                heartbeatInterval: number;
                heartbeatMessage?: string | object | undefined;
                heartbeatTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                enableResponseCheck: boolean;
                reconnect: (onReceiveMessage?: (data: any) => void) => void;
                localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
                onopen: () => void;
                onclose: () => void;
                sendMsg: (msg: string | object, isBuffer?: boolean) => void;
            } | null, _screenwright_composables.WebSocketConfig | {
                limitConnect: number;
                longConnect: boolean;
                websocketServerUrl: string;
                token: string | null;
                socketOpen?: null | string | undefined;
                ws?: {
                    binaryType: BinaryType;
                    readonly bufferedAmount: number;
                    readonly extensions: string;
                    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                    onerror: ((this: WebSocket, ev: Event) => any) | null;
                    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                    onopen: ((this: WebSocket, ev: Event) => any) | null;
                    readonly protocol: string;
                    readonly readyState: number;
                    readonly url: string;
                    close: (code?: number, reason?: string) => void;
                    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                    readonly CONNECTING: 0;
                    readonly OPEN: 1;
                    readonly CLOSING: 2;
                    readonly CLOSED: 3;
                    addEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    };
                    removeEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | undefined;
                responseTimeout: number;
                responseCheckTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                lastSendTime: number;
                lastReceiveTime: number;
                onReceiveMessageCallback?: ((data: any) => void) | undefined;
                onOpenCallback?: (() => void) | undefined;
                onErrorCallback?: ((error: string) => void) | undefined;
                hasPendingMessage: boolean;
                enableHeartbeat: boolean;
                heartbeatInterval: number;
                heartbeatMessage?: string | object | undefined;
                heartbeatTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                enableResponseCheck: boolean;
                reconnect: (onReceiveMessage?: (data: any) => void) => void;
                localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
                onopen: () => void;
                onclose: () => void;
                sendMsg: (msg: string | object, isBuffer?: boolean) => void;
            } | null>;
            screenCommunicationWs: vue.Ref<{
                limitConnect: number;
                longConnect: boolean;
                websocketServerUrl: string;
                token: string | null;
                socketOpen?: null | string | undefined;
                ws?: {
                    binaryType: BinaryType;
                    readonly bufferedAmount: number;
                    readonly extensions: string;
                    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                    onerror: ((this: WebSocket, ev: Event) => any) | null;
                    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                    onopen: ((this: WebSocket, ev: Event) => any) | null;
                    readonly protocol: string;
                    readonly readyState: number;
                    readonly url: string;
                    close: (code?: number, reason?: string) => void;
                    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                    readonly CONNECTING: 0;
                    readonly OPEN: 1;
                    readonly CLOSING: 2;
                    readonly CLOSED: 3;
                    addEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    };
                    removeEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | undefined;
                responseTimeout: number;
                responseCheckTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                lastSendTime: number;
                lastReceiveTime: number;
                onReceiveMessageCallback?: ((data: any) => void) | undefined;
                onOpenCallback?: (() => void) | undefined;
                onErrorCallback?: ((error: string) => void) | undefined;
                hasPendingMessage: boolean;
                enableHeartbeat: boolean;
                heartbeatInterval: number;
                heartbeatMessage?: string | object | undefined;
                heartbeatTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                enableResponseCheck: boolean;
                reconnect: (onReceiveMessage?: (data: any) => void) => void;
                localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
                onopen: () => void;
                onclose: () => void;
                sendMsg: (msg: string | object, isBuffer?: boolean) => void;
            } | null, _screenwright_composables.WebSocketConfig | {
                limitConnect: number;
                longConnect: boolean;
                websocketServerUrl: string;
                token: string | null;
                socketOpen?: null | string | undefined;
                ws?: {
                    binaryType: BinaryType;
                    readonly bufferedAmount: number;
                    readonly extensions: string;
                    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
                    onerror: ((this: WebSocket, ev: Event) => any) | null;
                    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
                    onopen: ((this: WebSocket, ev: Event) => any) | null;
                    readonly protocol: string;
                    readonly readyState: number;
                    readonly url: string;
                    close: (code?: number, reason?: string) => void;
                    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
                    readonly CONNECTING: 0;
                    readonly OPEN: 1;
                    readonly CLOSING: 2;
                    readonly CLOSED: 3;
                    addEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    };
                    removeEventListener: {
                        <K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | undefined;
                responseTimeout: number;
                responseCheckTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                lastSendTime: number;
                lastReceiveTime: number;
                onReceiveMessageCallback?: ((data: any) => void) | undefined;
                onOpenCallback?: (() => void) | undefined;
                onErrorCallback?: ((error: string) => void) | undefined;
                hasPendingMessage: boolean;
                enableHeartbeat: boolean;
                heartbeatInterval: number;
                heartbeatMessage?: string | object | undefined;
                heartbeatTimer?: {
                    ref: () => NodeJS.Timeout;
                    unref: () => NodeJS.Timeout;
                    hasRef: () => boolean;
                    refresh: () => NodeJS.Timeout;
                    [Symbol.toPrimitive]: () => number;
                } | undefined;
                enableResponseCheck: boolean;
                reconnect: (onReceiveMessage?: (data: any) => void) => void;
                localSocket: (onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void) => void;
                onopen: () => void;
                onclose: () => void;
                sendMsg: (msg: string | object, isBuffer?: boolean) => void;
            } | null>;
            encodedControlValues: vue.WritableComputedRef<_screenwright_composables.EncodedControlItem[], _screenwright_composables.EncodedControlItem[]>;
            getIframeWs: (iframeScreenId: string) => _screenwright_composables.WebSocketConfig | undefined;
            initIframeWs: ({ iframeScreenId, controlWebsocketUrl, heartbeatInterval }: {
                iframeScreenId: string;
                controlWebsocketUrl: string;
                heartbeatInterval: number;
            }) => _screenwright_composables.WebSocketConfig;
            initTerminalCommunication: () => void;
            sendTerminalMessage: ({ largeId, actions }: {
                largeId?: string;
                actions: _screenwright_composables.MessageToSend[];
            }) => void;
            initScreenCommunication: () => void;
            createNewTerminalCommunicationWs: ({ controlWebsocketUrl, heartbeatInterval }: {
                controlWebsocketUrl: string;
                heartbeatInterval: number;
            }) => _screenwright_composables.WebSocketConfig;
            closeTerminalWs: (largeId: string) => void;
            handleActions: (actions: _screenwright_composables.MessageToSend[]) => Promise<void>;
            cleanup: () => void;
        };
        useCreateComponent: typeof useCreateComponent;
        EventTypeEnum: typeof EventTypeEnum;
        CoreType: typeof CoreType;
    };
};
type ScreenwrightSdk = typeof sdk;
type ScreenwrightSdkInstance = typeof screenwright;

export { type ScreenwrightSdk, type ScreenwrightSdkInstance, screenwright, sdk };
