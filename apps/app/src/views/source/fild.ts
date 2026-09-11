import { DataSourceType } from "./type";

export const Table_Label = (key: string): any[] => {
  let label: any[] = [];
  switch (key) {
    case "local":
      label = [
        {
          prop: "name",
          label: "数据名称",
          align: "left",
          width: 420,
          icon: true
        },
        { prop: "type", label: "格式", align: "center" },
        // {prop: 'dataNum',label: '数据量',align:'center'},
        { prop: "description", label: "描述", align: "left", width: 420 },

        { prop: "createdTime", label: "上传时间", align: "center", width: 200 }
      ];
      break;
    case "db":
      label = [
        {
          prop: "name",
          label: "数据名称",
          align: "left",
          width: 300,
          icon: true
        },
        { prop: "dbname", label: "数据库名", align: "center" },
        { prop: "type", label: "类型", align: "center" },
        { prop: "dbip", label: "IP", align: "center" },
        { prop: "port", label: "端口号", align: "center" },
        { prop: "username", label: "账号", align: "center" },
        // {prop: 'password',label: '密码',align:'center'},
        { prop: "description", label: "描述", align: "left", width: 300 }
      ];
      break;
    case "api":
      label = [
        {
          prop: "name",
          label: "接口名称",
          align: "left",
          width: 300,
          icon: true
        },
        { prop: "baseUrl", label: "BaseURL", align: "center", width: 400 },
        { prop: "description", label: "描述", align: "left", width: 400 }
      ];
      break;
    case "tcpudp":
      label = [
        {
          prop: "name",
          label: "名称",
          align: "left",
          width: 300
        },
        { prop: "description", label: "描述", align: "left", width: 800 },
        // { prop: 'type', label: '类型', align: 'center' },
        { prop: "typeLabel", label: "类型", align: "center" }
      ];
      break;
  }
  return label;
};

export const Source_Form = (key: string): any => {
  const defaultForm = {
      name: "",
      group: "",
      groupId: "",
      description: ""
    },
    defaultRules = {
      name: [
        {
          required: true,
          message: "长度要在20字符内",
          max: 20,
          trigger: ["blur", "change"]
        },
        {
          required: true,
          message: "开头或者结尾不能为纯空格",
          max: 20,
          trigger: ["blur", "change"],
          pattern: /(^\s*)|(\s*$)/
        }
      ],
      type: [{ required: true, message: "请选择数据类型", trigger: "blur" }],
      description: [
        {
          required: false,
          message: "开头或者结尾不能为纯空格",
          trigger: ["blur", "change"],
          pattern: /(^\s*)|(\s*$)/
        }
      ]
    };
  switch (key) {
    case "local":
      return {
        form: {
          ...defaultForm,
          type: "csv",
          charsetName: "UTF-8",
          file: "",
          fileName: ""
        },
        label: [
          {
            prop: "type",
            label: "类型:",
            type: "select",
            opts: [
              { label: "CSV文件", value: "csv", disabled: false },
              // { label: 'JSON文件', value: 'json', disabled: true },
              // { label: 'SHP文件', value: 'shp', disabled: true },
              { label: "EXCEL文件", value: "excel", disabled: false }
            ]
          },
          {
            prop: "name",
            label: "数据源名称:",
            type: "input"
          },
          {
            prop: "description",
            label: "描述:",
            type: "textarea"
          },
          {
            prop: "charsetName",
            label: "编码格式:",
            type: "radio",
            opts: [
              { label: "UTF-8", value: "UTF-8" },
              { label: "GBK", value: "GBK", disabled: false }
            ]
          },
          {
            prop: "fileName",
            label: "上传文件:",
            type: "upload"
          },
          {
            prop: "group",
            label: "分组:",
            type: "select",
            hasTree: false,
            opts: []
          }
        ],
        rules: {
          ...defaultRules,
          charsetName: [{ required: true, message: "请选择编码类型", trigger: "blur" }],
          fileName: [
            {
              required: true,
              message: "请选择上传文件",
              trigger: ["blur", "change"]
            }
          ]
        }
      };
    case "db":
      return {
        form: {
          ...defaultForm,
          type: "mysql",
          url: "",
          port: 8088,
          username: "",
          password: ""
        },
        label: [
          {
            prop: "type",
            label: "类型:",
            type: "select",
            opts: [
              {
                label: "MySQL数据库",
                value: "mysql",
                disabled: false,
                example: "连接地址: jdbc:mysql://<hostname>:<port>/<db>"
              },
              {
                label: "Oracle数据库",
                value: "oracle",
                disabled: false,
                example: "连接地址: jdbc:oracle:thin:@<host>:<port>:<db>"
              },
              {
                label: "SQL Server",
                value: "sqlServer",
                disabled: false,
                example: "连接地址: jdbc:sqlserver://<server_name>:<port>"
              },
              {
                label: "达梦数据库",
                value: "dm",
                disabled: false,
                example: "连接地址: jdbc:dm://<server_name>:<port>"
              }
            ]
          },
          {
            prop: "name",
            label: "数据源名称:",
            type: "input"
          },
          {
            prop: "description",
            label: "描述:",
            type: "textarea"
          },
          {
            prop: "url",
            label: "连接地址:",
            type: "input"
          },
          // {
          //   prop: 'port',
          //   label: '端口:',
          //   type: 'input',
          //   precision: 0,
          //   min: 1,
          // },
          {
            prop: "username",
            label: "用户名:",
            type: "input"
          },
          {
            prop: "password",
            label: "密码:",
            type: "password"
          },
          {
            prop: "group",
            label: "分组:",
            type: "select",
            hasTree: false,
            opts: []
          }
        ],
        rules: {
          ...defaultRules,
          url: [
            {
              required: true,
              message: "连接地址不包含中文、特殊字符",
              trigger: ["blur", "change"],
              pattern: /^[A-Za-z0-9_@.\-:/]+$/
            }
          ],
          port: [{ required: true, message: "请输入端口", trigger: "blur" }],
          username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
          password: [
            {
              required: true,
              message: "密码不包含中文字符",
              trigger: ["blur", "change"],
              pattern: /^[^\u4e00-\u9fa5]+$/
            }
          ]
        }
      };
    case "api":
      return {
        form: {
          ...defaultForm,
          type: "api",
          baseUrl: ""
          // file: '',
          // fileName: '',
          // charsetName: 'GBK',
        },
        label: [
          {
            prop: "type",
            label: "类型:",
            type: "select",
            opts: [
              { label: "API接口", value: "api" },
              { label: "Websocket", value: "websocket" },
              // { label: 'BIM属性JSON转API', value: 'bimPropertyData' },
              { label: "BIM属性JSON转API", value: "json" }
            ]
          },
          {
            prop: "name",
            label: "数据源名称:",
            type: "input"
          },
          {
            prop: "description",
            label: "描述:",
            type: "textarea"
          },
          {
            prop: "baseUrl",
            label: "Base URL:",
            type: "input",
            placeholder: "http[s]://hostname[:port][/pathname]"
          },
          {
            prop: "jsonFile",
            label: "上传文件:",
            type: "upload"
          },
          {
            prop: "charsetName",
            label: "编码格式:",
            type: "radio",
            opts: [
              { label: "UTF-8", value: "UTF-8" },
              { label: "GBK", value: "GBK", disabled: false }
            ]
          },
          {
            prop: "group",
            label: "分组:",
            type: "select",
            hasTree: false,
            opts: []
          }
        ],
        rules: {
          ...defaultRules,
          baseUrl: [
            {
              required: true,
              message: "Base URL不包含中文、特殊字符",
              trigger: ["blur", "change"],
              pattern: /^[A-Za-z0-9_\\.\-\\:\\/]+$/
            },
            {
              required: true,
              message: "Base URL址填写格式错误",
              trigger: "change",
              pattern: /^http[s]?:\/\/([\w-]+\.)+[\w-]+([\w\-\\.,@?^=%&:/~\\+#]*[\w\-\\@?^=%&/~\\+#])/
            }
          ],
          charsetName: [{ required: true, message: "请选择编码类型", trigger: "blur" }]
        }
      };
    case "tcpudp":
      return {
        form: {
          ...defaultForm,
          type: "1",
          charsetName: "GBK",
          desIp: "",
          desPort: 1,
          localPort: 1,
          layerIds: ""
        },
        label: [
          {
            prop: "type",
            label: "类型:",
            type: "select",
            opts: [
              { label: "TCP", value: "1" },
              { label: "UDP", value: "2" }
            ]
          },
          {
            prop: "name",
            label: "名称:",
            type: "input"
          },
          {
            prop: "layerIds",
            label: "layerIds:",
            type: "input",
            hidden: true
          },
          {
            prop: "description",
            label: "描述:",
            type: "textarea"
          },
          {
            prop: "charsetName",
            label: "编码格式:",
            type: "radio",
            opts: [
              { label: "UTF-8", value: "UTF-8" },
              { label: "GBK", value: "GBK", disabled: false },
              { label: "HEX", value: "HEX", disabled: false }
            ]
          },
          {
            prop: "desIp",
            label: "对方IP:",
            type: "input"
          },
          {
            prop: "desPort",
            label: "对方端口:",
            type: "number",
            controls: false,
            placeholder: "端口范围：1-65535"
            // min: 1,
            // max: 65535,
          },
          {
            prop: "localPort",
            label: "本地端口:",
            type: "number",
            controls: false,
            placeholder: "端口范围：1-65535"
            // min: 1,
            // max: 65535,
          },
          {
            prop: "group",
            label: "分组:",
            type: "select",
            hasTree: false,
            opts: []
          }
        ],
        rules: {
          ...defaultRules,
          charsetName: [{ required: true, message: "请选择编码类型", trigger: "blur" }],
          desIp: [{ required: true, message: "请输入对方IP", trigger: "blur" }],
          desPort: [
            {
              required: true,
              trigger: "blur",
              validator: (rule: any, value: any, callback: any) => {
                if (value !== null && value !== undefined) {
                  if (value >= 1 && value <= 65535) {
                    callback();
                  } else {
                    callback(new Error("请正确输入端口"));
                  }
                } else {
                  callback(new Error("请正确输入端口"));
                }
              }
            }
          ],
          localPort: [
            {
              required: false,
              trigger: "blur",
              validator: (rule: any, value: any, callback: any) => {
                if (value !== null && value !== undefined) {
                  if (value >= 1 && value <= 65535) {
                    callback();
                  } else {
                    callback(new Error("请正确输入端口"));
                  }
                }
              }
            }
          ]
        }
      };
  }
};

export const getTypeOptions = (value: DataSourceType) => {
  if (value === DataSourceType.LOCAL) {
    return [
      { label: "CSV", value: "csv" },
      { label: "Excel", value: "excel" }
    ];
  } else if (value === DataSourceType.API || value === DataSourceType.WEBSOCKET) {
    return [
      { label: "API接口", value: "api" },
      { label: "Websocket", value: "websocket" },
      { label: "BIM属性JSON转API", value: "bimPropertyData" }
    ];
  } else if (value === DataSourceType.TCPUDP) {
    return [
      { label: "TCP", value: "1" },
      { label: "UDP", value: "2" },
      { label: "物联设备", value: "3" }
    ];
  }
  return [
    {
      label: "MySQL数据库",
      value: "mysql",
      disabled: false,
      example: "连接地址: jdbc:mysql://<hostname>:<port>/<db>"
    },
    {
      label: "Oracle数据库",
      value: "oracle",
      disabled: false,
      example: "连接地址: jdbc:oracle:thin:@<host>:<port>:<db>"
    },
    {
      label: "SQL Server",
      value: "sqlServer",
      disabled: false,
      example: "连接地址: jdbc:sqlserver://<server_name>:<port>"
    },
    {
      label: "达梦数据库",
      value: "dm",
      disabled: false,
      example: "连接地址: jdbc:dm://<server_name>:<port>"
    }
  ];
};
