<template>
  <div
    class="sheetjs-excel"
    :style="{
      width: `${width ? width + 'px' : '100%'}`,
      height: `${height ? height + 'px' : '100%'}`
    }"
  >
    <div
      ref="xspreadsheet"
      id="xspreadsheet"
      :style="{ height: button ? `${height - 30}px` : `${height}px` }"
      :class="[showOverlayer ? '' : 'not-overlayer']"
    />
    <div class="button-bottom flex flex-center" v-if="button" style="width: 100%">
      <div v-if="button" class="confirm-btn" @click.stop="onConfirm">完成</div>
    </div>
  </div>
</template>
<script lang="ts">
// @ts-nocheck
import Spreadsheet from "./x-data-spreadsheet/index"
import zhCN from "./x-data-spreadsheet/locale/zh-cn.js"
import { cloneDeep, isPlainObject } from "lodash-es"
Spreadsheet.locale("zh-cn", zhCN)
export default {
  name: "sheet-excel",
  props: {
    dataTable: {
      type: Array || Object,
      default: () => {
        return [
          { id: 1, name: "广州", value: 10 },
          { id: 2, name: "深圳", value: 10 }
        ]
      }
    },
    mode: {
      // edit | read
      type: String,
      default: "edit"
    },
    button: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    showOverlayer: {
      type: Boolean,
      default: true
    },
    showContextmenu: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      spread: null,
      view: {},
      typeofFields: {},
      options: {
        mode: this.mode || "read", // edit | read
        showToolbar: false, // 顶部工具栏
        showBottomBar: false, // 底部工具栏
        showGrid: true, // 网格
        showContextmenu: this.showContextmenu, // 右键菜单栏
        row: {
          len: this.dataTable.length > 100 ? this.dataTable.length + 10 : 100,
          height: 25
        },
        col: {
          len: 26,
          width: 85,
          indexWidth: 60,
          minWidth: 60
        },
        style: {
          bgcolor: "#232630",
          align: "center",
          valign: "middle",
          textwrap: false,
          strike: false,
          underline: false,
          color: "#ffffff",
          font: {
            name: "Arial",
            size: 10,
            bold: false,
            italic: false
          }
        }
      }
    }
  },
  watch: {
    dataTable: {
      handler(v) {
        //空数组也要更新
        if (!v) return
        this.setValue() // 初始化数据
      },
      deep: true
    }
  },
  beforeUnmount() {
    this.spread.destroy()
    this.spread = null
    this.typeofFields = {}
  },
  mounted() {
    this.initSpread()
  },
  methods: {
    initSpread() {
      const options = {
        ...this.options,
        view: {
          height: () =>
            this.button
              ? (this.height || this.$refs.xspreadsheet?.clientHeight) - 30
              : this.height || this.$refs.xspreadsheet?.clientHeight,
          width: () => (this.$refs.xspreadsheet?.clientWidth || this.width) - 20
        }
      }
      const ele = this.$refs.xspreadsheet
      this.spread = new Spreadsheet(ele, options)
        .loadData({}) // load data
        .change(() => {
          // save data to db
        })
        .on("cell-selected", (cell, ri, ci) => {
          if (this.mode) {
            // console.log(cell, ri, ci)
            this.$emit("select", { cell, ri, ci })
          }
        })
      this.setValue(true) // 初始化数据
    },
    // 设置数据
    setValue(isInit) {
      const dataTable = isPlainObject(this.dataTable) ? [this.dataTable] : this.dataTable || []
      const sheet = this.spread
      if (!isInit && sheet) {
        sheet.loadData({}) // 先清空原数据再重新赋值
      }
      // 记录输入字段类型-object-string-number-boolean-undefined， 若字段被修改则默认类型
      for (const key in dataTable[0]) {
        this.typeofFields[key] = typeof dataTable[0][key]
      }
      // 字段名
      const fields = dataTable[0] ? Object.keys(dataTable[0]) : []
      fields.forEach((key, index) => {
        sheet.cellText(0, index, key)
      })
      // 字段值
      for (let i = 0; i < dataTable.length; i++) {
        for (let j = 0; j < fields.length; j++) {
          let value = dataTable[i][fields[j]]
          if (this.typeofFields[fields[j]] === "object") {
            value = JSON.stringify(dataTable[i][fields[j]])
          }
          sheet.cellText(i + 1, j, value)
        }
      }
      // 刷新表格
      sheet.reRender()
    },
    // 获取数据
    getValue() {
      const sheetData = this.spread.getData()[0] || {}
      const export_data = cloneDeep(sheetData?.rows) || []
      // 输出格式调整
      let exportData = []
      for (const i in export_data) {
        if (export_data[i].cells) exportData.push(export_data[i].cells)
      }
      // 对输出格式二次过滤-由于行数据清空操作节点仍然存在的问题（删除行不会）
      exportData = exportData.filter((a) => {
        return Object.values(a).filter((b) => b.text)?.length
      })

      const dataTable = []
      const field = exportData[0] || {} // 字段名对象
      const fieldValue = Object.values(field) // 字段名集合
      const fieldLen = Object.keys(field)?.length || 0
      const pattern = /(\{.+\})|(\[.+\])/
      //处理只有key没有value的情况，保持格式
      if (exportData.length === 1) {
        const obj = {}
        fieldValue.forEach((a) => {
          if (a?.text) obj[a.text] = ""
        })
        return [obj]
      }
      for (let j = 1; j < exportData.length; j++) {
        const obj = {}
        const currentArr = Object.values(exportData[j] || {})
        if (!currentArr || !currentArr.length) continue
        for (let k = 0; k < fieldLen; k++) {
          let value = currentArr[k]?.text ?? ""
          if (value === "true" || value === "TRUE") {
            value = true
          } else if (value === "false" || value === "FALSE") {
            value = false
          } else if (typeof value === "string" && !Number.isNaN(parseFloat(value))) {
            const nValue = parseFloat(value)
            if (nValue.toString().length == value.length) {
              value = nValue
            }
          } else if (typeof value === "string" && pattern.test(value)) {
            let nValue
            try {
              nValue = JSON.parse(value)
            } catch (e) {
              console.log("error：" + e)
            }
            if (nValue) value = nValue
          }
          if (fieldValue[k].text && value !== "") {
            if (this.typeofFields[fieldValue[k].text] === typeof value) {
              obj[fieldValue[k].text] = value // 字段值
            } else if (this.typeofFields[fieldValue[k].text] === "string") {
              obj[fieldValue[k].text] = value + ""
            } else if (this.typeofFields[fieldValue[k].text] === "number") {
              obj[fieldValue[k].text] = Number.isNaN(parseFloat(value)) ? value : parseFloat(value)
            } else if (this.typeofFields[fieldValue[k].text] === "object" && value) {
              obj[fieldValue[k].text] = JSON.parse(value)
            } else if (this.typeofFields[fieldValue[k].text] === "boolean") {
              obj[fieldValue[k].text] = JSON.parse(value)
            } else {
              obj[fieldValue[k].text] = value // 不存在该字段，或者字段被修改
            }
          }
        }
        dataTable.push(obj)
      }
      return dataTable
    },
    onConfirm() {
      const data = this.getValue()
      console.log(data)
      this.$emit("confirm", data)
    }
  }
}
</script>
<style lang="scss">
.sheetjs-excel {
  min-height: 200px;
  position: relative;
  z-index: 99;
  .confirm-btn {
    height: 24px;
    line-height: 20px;
    padding: 2px 16px;
    text-align: center;
    color: #ffffff;
    border-radius: 4px 4px;
    letter-spacing: 2px;
    cursor: pointer;
    z-index: 999;
    background-image: linear-gradient(180deg, #8b58e7, #642cff);
    width: 64px;
    text-align: center;
  }
  .not-overlayer {
    .x-spreadsheet-selector .x-spreadsheet-selector-area {
      border: none !important;
      background: none !important;
    }
  }
}
</style>
