export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 按 field 字段将数组拆分为 { name, list } 分组
export const splitArray = (array: any[], field: any) => {
  if (array?.length < 1) {
    return [];
  }
  try {
    const newArr: any[] = [];
    array.map((mapItem) => {
      if (newArr.length == 0) {
        newArr.push({ name: mapItem[field], list: [mapItem] });
      } else {
        const res = newArr.some((item) => {
          //判断相同的部门，有就添加到当前项
          if (item.name === mapItem[field]) {
            item.list.push(mapItem);
            return true;
          }
        });
        if (!res) {
          //如果没找相同的部门添加一个新对象
          newArr.push({ name: mapItem[field], list: [mapItem] });
        }
      }
    });
    return newArr;
  } catch (error) {
    console.log("数组拆分失败:", error);
    return [];
  }
};
