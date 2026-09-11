import { cloneDeep } from "lodash-es";

/**
 * 全国城市列表-高德地图
 */
export const aMapGlobalCity = [
  {
    code: "410000",
    label: "河南省",
    identification: "province",
    children: [
      {
        code: "410300",
        label: "洛阳市",
        identification: "city",
        children: [
          { code: "410323", label: "新安县", identification: "district" },
          { code: "410327", label: "宜阳县", identification: "district" },
          { code: "410328", label: "洛宁县", identification: "district" },
          { code: "410324", label: "栾川县", identification: "district" },
          { code: "410329", label: "伊川县", identification: "district" },
          { code: "410307", label: "偃师区", identification: "district" },
          { code: "410308", label: "孟津区", identification: "district" },
          { code: "410305", label: "涧西区", identification: "district" },
          { code: "410311", label: "洛龙区", identification: "district" },
          { code: "410304", label: "瀍河回族区", identification: "district" },
          { code: "410325", label: "嵩县", identification: "district" },
          { code: "410326", label: "汝阳县", identification: "district" },
          { code: "410303", label: "西工区", identification: "district" },
          { code: "410302", label: "老城区", identification: "district" }
        ]
      },
      {
        code: "411200",
        label: "三门峡市",
        identification: "city",
        children: [
          { code: "411202", label: "湖滨区", identification: "district" },
          { code: "411221", label: "渑池县", identification: "district" },
          { code: "411281", label: "义马市", identification: "district" },
          { code: "411203", label: "陕州区", identification: "district" },
          { code: "411224", label: "卢氏县", identification: "district" },
          { code: "411282", label: "灵宝市", identification: "district" }
        ]
      },
      {
        code: "411100",
        label: "漯河市",
        identification: "city",
        children: [
          { code: "411104", label: "召陵区", identification: "district" },
          { code: "411122", label: "临颍县", identification: "district" },
          { code: "411102", label: "源汇区", identification: "district" },
          { code: "411121", label: "舞阳县", identification: "district" },
          { code: "411103", label: "郾城区", identification: "district" }
        ]
      },
      {
        code: "411000",
        label: "许昌市",
        identification: "city",
        children: [
          { code: "411003", label: "建安区", identification: "district" },
          { code: "411025", label: "襄城县", identification: "district" },
          { code: "411002", label: "魏都区", identification: "district" },
          { code: "411024", label: "鄢陵县", identification: "district" },
          { code: "411081", label: "禹州市", identification: "district" },
          { code: "411082", label: "长葛市", identification: "district" }
        ]
      },
      {
        code: "411300",
        label: "南阳市",
        identification: "city",
        children: [
          { code: "411323", label: "西峡县", identification: "district" },
          { code: "411303", label: "卧龙区", identification: "district" },
          { code: "411321", label: "南召县", identification: "district" },
          { code: "411328", label: "唐河县", identification: "district" },
          { code: "411324", label: "镇平县", identification: "district" },
          { code: "411326", label: "淅川县", identification: "district" },
          { code: "411325", label: "内乡县", identification: "district" },
          { code: "411329", label: "新野县", identification: "district" },
          { code: "411327", label: "社旗县", identification: "district" },
          { code: "411322", label: "方城县", identification: "district" },
          { code: "411381", label: "邓州市", identification: "district" },
          { code: "411302", label: "宛城区", identification: "district" },
          { code: "411330", label: "桐柏县", identification: "district" }
        ]
      },
      {
        code: "411500",
        label: "信阳市",
        identification: "city",
        children: [
          { code: "411502", label: "浉河区", identification: "district" },
          { code: "411525", label: "固始县", identification: "district" },
          { code: "411527", label: "淮滨县", identification: "district" },
          { code: "411522", label: "光山县", identification: "district" },
          { code: "411528", label: "息县", identification: "district" },
          { code: "411521", label: "罗山县", identification: "district" },
          { code: "411503", label: "平桥区", identification: "district" },
          { code: "411524", label: "商城县", identification: "district" },
          { code: "411526", label: "潢川县", identification: "district" },
          { code: "411523", label: "新县", identification: "district" }
        ]
      },
      {
        code: "410500",
        label: "安阳市",
        identification: "city",
        children: [
          { code: "410527", label: "内黄县", identification: "district" },
          { code: "410503", label: "北关区", identification: "district" },
          { code: "410523", label: "汤阴县", identification: "district" },
          { code: "410526", label: "滑县", identification: "district" },
          { code: "410522", label: "安阳县", identification: "district" },
          { code: "410502", label: "文峰区", identification: "district" },
          { code: "410505", label: "殷都区", identification: "district" },
          { code: "410506", label: "龙安区", identification: "district" },
          { code: "410581", label: "林州市", identification: "district" }
        ]
      },
      {
        code: "410600",
        label: "鹤壁市",
        identification: "city",
        children: [
          { code: "410622", label: "淇县", identification: "district" },
          { code: "410602", label: "鹤山区", identification: "district" },
          { code: "410603", label: "山城区", identification: "district" },
          { code: "410611", label: "淇滨区", identification: "district" },
          { code: "410621", label: "浚县", identification: "district" }
        ]
      },
      {
        code: "410900",
        label: "濮阳市",
        identification: "city",
        children: [
          { code: "410927", label: "台前县", identification: "district" },
          { code: "410922", label: "清丰县", identification: "district" },
          { code: "410926", label: "范县", identification: "district" },
          { code: "410923", label: "南乐县", identification: "district" },
          { code: "410902", label: "华龙区", identification: "district" },
          { code: "410928", label: "濮阳县", identification: "district" }
        ]
      },
      {
        code: "419001",
        label: "济源市",
        identification: "city",
        children: [
          { code: "419001", label: "坡头镇", identification: "district" },
          { code: "419001", label: "梨林镇", identification: "district" },
          { code: "419001", label: "思礼镇", identification: "district" },
          { code: "419001", label: "五龙口镇", identification: "district" },
          { code: "419001", label: "王屋镇", identification: "district" },
          { code: "419001", label: "玉泉街道", identification: "district" },
          { code: "419001", label: "轵城镇", identification: "district" },
          { code: "419001", label: "济水街道", identification: "district" },
          { code: "419001", label: "沁园街道", identification: "district" },
          { code: "419001", label: "下冶镇", identification: "district" },
          { code: "419001", label: "克井镇", identification: "district" },
          { code: "419001", label: "天坛街道", identification: "district" },
          { code: "419001", label: "邵原镇", identification: "district" },
          { code: "419001", label: "北海街道", identification: "district" },
          { code: "419001", label: "承留镇", identification: "district" },
          { code: "419001", label: "大峪镇", identification: "district" }
        ]
      },
      {
        code: "410400",
        label: "平顶山市",
        identification: "city",
        children: [
          { code: "410403", label: "卫东区", identification: "district" },
          { code: "410423", label: "鲁山县", identification: "district" },
          { code: "410411", label: "湛河区", identification: "district" },
          { code: "410481", label: "舞钢市", identification: "district" },
          { code: "410402", label: "新华区", identification: "district" },
          { code: "410422", label: "叶县", identification: "district" },
          { code: "410425", label: "郏县", identification: "district" },
          { code: "410404", label: "石龙区", identification: "district" },
          { code: "410482", label: "汝州市", identification: "district" },
          { code: "410421", label: "宝丰县", identification: "district" }
        ]
      },
      {
        code: "410200",
        label: "开封市",
        identification: "city",
        children: [
          { code: "410221", label: "杞县", identification: "district" },
          { code: "410205", label: "禹王台区", identification: "district" },
          { code: "410222", label: "通许县", identification: "district" },
          { code: "410223", label: "尉氏县", identification: "district" },
          { code: "410204", label: "鼓楼区", identification: "district" },
          { code: "410225", label: "兰考县", identification: "district" },
          { code: "410212", label: "祥符区", identification: "district" },
          { code: "410203", label: "顺河回族区", identification: "district" },
          { code: "410202", label: "龙亭区", identification: "district" }
        ]
      },
      {
        code: "410100",
        label: "郑州市",
        identification: "city",
        children: [
          { code: "410185", label: "登封市", identification: "district" },
          { code: "410102", label: "中原区", identification: "district" },
          { code: "410105", label: "金水区", identification: "district" },
          { code: "410108", label: "惠济区", identification: "district" },
          { code: "410106", label: "上街区", identification: "district" },
          { code: "410122", label: "中牟县", identification: "district" },
          { code: "410103", label: "二七区", identification: "district" },
          { code: "410181", label: "巩义市", identification: "district" },
          { code: "410183", label: "新密市", identification: "district" },
          { code: "410184", label: "新郑市", identification: "district" },
          { code: "410182", label: "荥阳市", identification: "district" },
          { code: "410104", label: "管城回族区", identification: "district" }
        ]
      },
      {
        code: "410700",
        label: "新乡市",
        identification: "city",
        children: [
          { code: "410724", label: "获嘉县", identification: "district" },
          { code: "410711", label: "牧野区", identification: "district" },
          { code: "410703", label: "卫滨区", identification: "district" },
          { code: "410783", label: "长垣市", identification: "district" },
          { code: "410721", label: "新乡县", identification: "district" },
          { code: "410726", label: "延津县", identification: "district" },
          { code: "410702", label: "红旗区", identification: "district" },
          { code: "410781", label: "卫辉市", identification: "district" },
          { code: "410704", label: "凤泉区", identification: "district" },
          { code: "410782", label: "辉县市", identification: "district" },
          { code: "410727", label: "封丘县", identification: "district" },
          { code: "410725", label: "原阳县", identification: "district" }
        ]
      },
      {
        code: "410800",
        label: "焦作市",
        identification: "city",
        children: [
          { code: "410803", label: "中站区", identification: "district" },
          { code: "410802", label: "解放区", identification: "district" },
          { code: "410804", label: "马村区", identification: "district" },
          { code: "410811", label: "山阳区", identification: "district" },
          { code: "410821", label: "修武县", identification: "district" },
          { code: "410883", label: "孟州市", identification: "district" },
          { code: "410825", label: "温县", identification: "district" },
          { code: "410823", label: "武陟县", identification: "district" },
          { code: "410882", label: "沁阳市", identification: "district" },
          { code: "410822", label: "博爱县", identification: "district" }
        ]
      },
      {
        code: "411400",
        label: "商丘市",
        identification: "city",
        children: [
          { code: "411421", label: "民权县", identification: "district" },
          { code: "411422", label: "睢县", identification: "district" },
          { code: "411424", label: "柘城县", identification: "district" },
          { code: "411426", label: "夏邑县", identification: "district" },
          { code: "411423", label: "宁陵县", identification: "district" },
          { code: "411403", label: "睢阳区", identification: "district" },
          { code: "411402", label: "梁园区", identification: "district" },
          { code: "411425", label: "虞城县", identification: "district" },
          { code: "411481", label: "永城市", identification: "district" }
        ]
      },
      {
        code: "411600",
        label: "周口市",
        identification: "city",
        children: [
          { code: "411623", label: "商水县", identification: "district" },
          { code: "411602", label: "川汇区", identification: "district" },
          { code: "411628", label: "鹿邑县", identification: "district" },
          { code: "411603", label: "淮阳区", identification: "district" },
          { code: "411622", label: "西华县", identification: "district" },
          { code: "411627", label: "太康县", identification: "district" },
          { code: "411624", label: "沈丘县", identification: "district" },
          { code: "411681", label: "项城市", identification: "district" },
          { code: "411621", label: "扶沟县", identification: "district" },
          { code: "411625", label: "郸城县", identification: "district" }
        ]
      },
      {
        code: "411700",
        label: "驻马店市",
        identification: "city",
        children: [
          { code: "411728", label: "遂平县", identification: "district" },
          { code: "411727", label: "汝南县", identification: "district" },
          { code: "411723", label: "平舆县", identification: "district" },
          { code: "411721", label: "西平县", identification: "district" },
          { code: "411729", label: "新蔡县", identification: "district" },
          { code: "411722", label: "上蔡县", identification: "district" },
          { code: "411724", label: "正阳县", identification: "district" },
          { code: "411725", label: "确山县", identification: "district" },
          { code: "411702", label: "驿城区", identification: "district" },
          { code: "411726", label: "泌阳县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "440000",
    label: "广东省",
    identification: "province",
    children: [
      {
        code: "440500",
        label: "汕头市",
        identification: "city",
        children: [
          { code: "440512", label: "濠江区", identification: "district" },
          { code: "440523", label: "南澳县", identification: "district" },
          { code: "440515", label: "澄海区", identification: "district" },
          { code: "440507", label: "龙湖区", identification: "district" },
          { code: "440511", label: "金平区", identification: "district" },
          { code: "440514", label: "潮南区", identification: "district" },
          { code: "440513", label: "潮阳区", identification: "district" }
        ]
      },
      {
        code: "440600",
        label: "佛山市",
        identification: "city",
        children: [
          { code: "440608", label: "高明区", identification: "district" },
          { code: "440607", label: "三水区", identification: "district" },
          { code: "440605", label: "南海区", identification: "district" },
          { code: "440604", label: "禅城区", identification: "district" },
          { code: "440606", label: "顺德区", identification: "district" }
        ]
      },
      {
        code: "441200",
        label: "肇庆市",
        identification: "city",
        children: [
          { code: "441224", label: "怀集县", identification: "district" },
          { code: "441225", label: "封开县", identification: "district" },
          { code: "441223", label: "广宁县", identification: "district" },
          { code: "441284", label: "四会市", identification: "district" },
          { code: "441226", label: "德庆县", identification: "district" },
          { code: "441203", label: "鼎湖区", identification: "district" },
          { code: "441202", label: "端州区", identification: "district" },
          { code: "441204", label: "高要区", identification: "district" }
        ]
      },
      {
        code: "441300",
        label: "惠州市",
        identification: "city",
        children: [
          { code: "441324", label: "龙门县", identification: "district" },
          { code: "441323", label: "惠东县", identification: "district" },
          { code: "441303", label: "惠阳区", identification: "district" },
          { code: "441302", label: "惠城区", identification: "district" },
          { code: "441322", label: "博罗县", identification: "district" }
        ]
      },
      {
        code: "440300",
        label: "深圳市",
        identification: "city",
        children: [
          { code: "440306", label: "宝安区", identification: "district" },
          { code: "440305", label: "南山区", identification: "district" },
          { code: "440304", label: "福田区", identification: "district" },
          { code: "440307", label: "龙岗区", identification: "district" },
          { code: "440311", label: "光明区", identification: "district" },
          { code: "440308", label: "盐田区", identification: "district" },
          { code: "440303", label: "罗湖区", identification: "district" },
          { code: "440309", label: "龙华区", identification: "district" },
          { code: "440310", label: "坪山区", identification: "district" }
        ]
      },
      {
        code: "440400",
        label: "珠海市",
        identification: "city",
        children: [
          { code: "440402", label: "香洲区", identification: "district" },
          { code: "440403", label: "斗门区", identification: "district" },
          { code: "440404", label: "金湾区", identification: "district" },
          { code: "440499", label: "澳门大学横琴校区(由澳门实施管辖)", identification: "district" }
        ]
      },
      {
        code: "440800",
        label: "湛江市",
        identification: "city",
        children: [
          { code: "440881", label: "廉江市", identification: "district" },
          { code: "440883", label: "吴川市", identification: "district" },
          { code: "440811", label: "麻章区", identification: "district" },
          { code: "440825", label: "徐闻县", identification: "district" },
          { code: "440804", label: "坡头区", identification: "district" },
          { code: "440803", label: "霞山区", identification: "district" },
          { code: "440823", label: "遂溪县", identification: "district" },
          { code: "440802", label: "赤坎区", identification: "district" },
          { code: "440882", label: "雷州市", identification: "district" }
        ]
      },
      {
        code: "440700",
        label: "江门市",
        identification: "city",
        children: [
          { code: "440784", label: "鹤山市", identification: "district" },
          { code: "440781", label: "台山市", identification: "district" },
          { code: "440705", label: "新会区", identification: "district" },
          { code: "440704", label: "江海区", identification: "district" },
          { code: "440703", label: "蓬江区", identification: "district" },
          { code: "440783", label: "开平市", identification: "district" },
          { code: "440785", label: "恩平市", identification: "district" }
        ]
      },
      {
        code: "441700",
        label: "阳江市",
        identification: "city",
        children: [
          { code: "441781", label: "阳春市", identification: "district" },
          { code: "441721", label: "阳西县", identification: "district" },
          { code: "441702", label: "江城区", identification: "district" },
          { code: "441704", label: "阳东区", identification: "district" }
        ]
      },
      {
        code: "440900",
        label: "茂名市",
        identification: "city",
        children: [
          { code: "440982", label: "化州市", identification: "district" },
          { code: "440904", label: "电白区", identification: "district" },
          { code: "440981", label: "高州市", identification: "district" },
          { code: "440983", label: "信宜市", identification: "district" },
          { code: "440902", label: "茂南区", identification: "district" }
        ]
      },
      {
        code: "441500",
        label: "汕尾市",
        identification: "city",
        children: [
          { code: "441523", label: "陆河县", identification: "district" },
          { code: "441502", label: "城区", identification: "district" },
          { code: "441581", label: "陆丰市", identification: "district" },
          { code: "441521", label: "海丰县", identification: "district" }
        ]
      },
      {
        code: "445300",
        label: "云浮市",
        identification: "city",
        children: [
          { code: "445322", label: "郁南县", identification: "district" },
          { code: "445381", label: "罗定市", identification: "district" },
          { code: "445321", label: "新兴县", identification: "district" },
          { code: "445302", label: "云城区", identification: "district" },
          { code: "445303", label: "云安区", identification: "district" }
        ]
      },
      {
        code: "441600",
        label: "河源市",
        identification: "city",
        children: [
          { code: "441623", label: "连平县", identification: "district" },
          { code: "441625", label: "东源县", identification: "district" },
          { code: "441602", label: "源城区", identification: "district" },
          { code: "441621", label: "紫金县", identification: "district" },
          { code: "441624", label: "和平县", identification: "district" },
          { code: "441622", label: "龙川县", identification: "district" }
        ]
      },
      {
        code: "445100",
        label: "潮州市",
        identification: "city",
        children: [
          { code: "445122", label: "饶平县", identification: "district" },
          { code: "445103", label: "潮安区", identification: "district" },
          { code: "445102", label: "湘桥区", identification: "district" }
        ]
      },
      {
        code: "445200",
        label: "揭阳市",
        identification: "city",
        children: [
          { code: "445224", label: "惠来县", identification: "district" },
          { code: "445203", label: "揭东区", identification: "district" },
          { code: "445202", label: "榕城区", identification: "district" },
          { code: "445222", label: "揭西县", identification: "district" },
          { code: "445281", label: "普宁市", identification: "district" }
        ]
      },
      {
        code: "440200",
        label: "韶关市",
        identification: "city",
        children: [
          { code: "440224", label: "仁化县", identification: "district" },
          { code: "440282", label: "南雄市", identification: "district" },
          { code: "440232", label: "乳源瑶族自治县", identification: "district" },
          { code: "440222", label: "始兴县", identification: "district" },
          { code: "440204", label: "浈江区", identification: "district" },
          { code: "440203", label: "武江区", identification: "district" },
          { code: "440205", label: "曲江区", identification: "district" },
          { code: "440229", label: "翁源县", identification: "district" },
          { code: "440233", label: "新丰县", identification: "district" },
          { code: "440281", label: "乐昌市", identification: "district" }
        ]
      },
      {
        code: "441800",
        label: "清远市",
        identification: "city",
        children: [
          { code: "441882", label: "连州市", identification: "district" },
          { code: "441825", label: "连山壮族瑶族自治县", identification: "district" },
          { code: "441826", label: "连南瑶族自治县", identification: "district" },
          { code: "441881", label: "英德市", identification: "district" },
          { code: "441823", label: "阳山县", identification: "district" },
          { code: "441821", label: "佛冈县", identification: "district" },
          { code: "441802", label: "清城区", identification: "district" },
          { code: "441803", label: "清新区", identification: "district" }
        ]
      },
      {
        code: "440100",
        label: "广州市",
        identification: "city",
        children: [
          { code: "440105", label: "海珠区", identification: "district" },
          { code: "440114", label: "花都区", identification: "district" },
          { code: "440117", label: "从化区", identification: "district" },
          { code: "440112", label: "黄埔区", identification: "district" },
          { code: "440113", label: "番禺区", identification: "district" },
          { code: "440106", label: "天河区", identification: "district" },
          { code: "440103", label: "荔湾区", identification: "district" },
          { code: "440104", label: "越秀区", identification: "district" },
          { code: "440111", label: "白云区", identification: "district" },
          { code: "440118", label: "增城区", identification: "district" },
          { code: "440115", label: "南沙区", identification: "district" }
        ]
      },
      {
        code: "442000",
        label: "中山市",
        identification: "city",
        children: [
          { code: "442000", label: "横栏镇", identification: "district" },
          { code: "442000", label: "小榄镇", identification: "district" },
          { code: "442000", label: "神湾镇", identification: "district" },
          { code: "442000", label: "古镇镇", identification: "district" },
          { code: "442000", label: "港口镇", identification: "district" },
          { code: "442000", label: "三乡镇", identification: "district" },
          { code: "442000", label: "石岐街道", identification: "district" },
          { code: "442000", label: "大涌镇", identification: "district" },
          { code: "442000", label: "阜沙镇", identification: "district" },
          { code: "442000", label: "西区街道", identification: "district" },
          { code: "442000", label: "沙溪镇", identification: "district" },
          { code: "442000", label: "东凤镇", identification: "district" },
          { code: "442000", label: "坦洲镇", identification: "district" },
          { code: "442000", label: "板芙镇", identification: "district" },
          { code: "442000", label: "南区街道", identification: "district" },
          { code: "442000", label: "三角镇", identification: "district" },
          { code: "442000", label: "黄圃镇", identification: "district" },
          { code: "442000", label: "东区街道", identification: "district" },
          { code: "442000", label: "五桂山街道", identification: "district" },
          { code: "442000", label: "民众街道", identification: "district" },
          { code: "442000", label: "南头镇", identification: "district" },
          { code: "442000", label: "南朗街道", identification: "district" },
          { code: "442000", label: "中山港街道", identification: "district" }
        ]
      },
      {
        code: "441900",
        label: "东莞市",
        identification: "city",
        children: [
          { code: "441900", label: "黄江镇", identification: "district" },
          { code: "441900", label: "清溪镇", identification: "district" },
          { code: "441900", label: "桥头镇", identification: "district" },
          { code: "441900", label: "洪梅镇", identification: "district" },
          { code: "441900", label: "高埗镇", identification: "district" },
          { code: "441900", label: "麻涌镇", identification: "district" },
          { code: "441900", label: "塘厦镇", identification: "district" },
          { code: "441900", label: "莞城街道", identification: "district" },
          { code: "441900", label: "望牛墩镇", identification: "district" },
          { code: "441900", label: "道滘镇", identification: "district" },
          { code: "441900", label: "万江街道", identification: "district" },
          { code: "441900", label: "企石镇", identification: "district" },
          { code: "441900", label: "东坑镇", identification: "district" },
          { code: "441900", label: "大岭山镇", identification: "district" },
          { code: "441900", label: "南城街道", identification: "district" },
          { code: "441900", label: "谢岗镇", identification: "district" },
          { code: "441900", label: "樟木头镇", identification: "district" },
          { code: "441900", label: "东城街道", identification: "district" },
          { code: "441900", label: "常平镇", identification: "district" },
          { code: "441900", label: "凤岗镇", identification: "district" },
          { code: "441900", label: "沙田镇", identification: "district" },
          { code: "441900", label: "茶山镇", identification: "district" },
          { code: "441900", label: "寮步镇", identification: "district" },
          { code: "441900", label: "石排镇", identification: "district" },
          { code: "441900", label: "横沥镇", identification: "district" },
          { code: "441900", label: "大朗镇", identification: "district" },
          { code: "441900", label: "中堂镇", identification: "district" },
          { code: "441900", label: "厚街镇", identification: "district" },
          { code: "441900", label: "长安镇", identification: "district" },
          { code: "441900", label: "虎门镇", identification: "district" },
          { code: "441900", label: "石龙镇", identification: "district" },
          { code: "441900", label: "石碣镇", identification: "district" }
        ]
      },
      {
        code: "441400",
        label: "梅州市",
        identification: "city",
        children: [
          { code: "441426", label: "平远县", identification: "district" },
          { code: "441427", label: "蕉岭县", identification: "district" },
          { code: "441481", label: "兴宁市", identification: "district" },
          { code: "441422", label: "大埔县", identification: "district" },
          { code: "441424", label: "五华县", identification: "district" },
          { code: "441403", label: "梅县区", identification: "district" },
          { code: "441402", label: "梅江区", identification: "district" },
          { code: "441423", label: "丰顺县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "150000",
    label: "内蒙古自治区",
    identification: "province",
    children: [
      {
        code: "150300",
        label: "乌海市",
        identification: "city",
        children: [
          { code: "150302", label: "海勃湾区", identification: "district" },
          { code: "150304", label: "乌达区", identification: "district" },
          { code: "150303", label: "海南区", identification: "district" }
        ]
      },
      {
        code: "150800",
        label: "巴彦淖尔市",
        identification: "city",
        children: [
          { code: "150824", label: "乌拉特中旗", identification: "district" },
          { code: "150821", label: "五原县", identification: "district" },
          { code: "150822", label: "磴口县", identification: "district" },
          { code: "150823", label: "乌拉特前旗", identification: "district" },
          { code: "150825", label: "乌拉特后旗", identification: "district" },
          { code: "150826", label: "杭锦后旗", identification: "district" },
          { code: "150802", label: "临河区", identification: "district" }
        ]
      },
      {
        code: "150200",
        label: "包头市",
        identification: "city",
        children: [
          { code: "150221", label: "土默特右旗", identification: "district" },
          { code: "150223", label: "达尔罕茂明安联合旗", identification: "district" },
          { code: "150206", label: "白云鄂博矿区", identification: "district" },
          { code: "150205", label: "石拐区", identification: "district" },
          { code: "150222", label: "固阳县", identification: "district" },
          { code: "150202", label: "东河区", identification: "district" },
          { code: "150204", label: "青山区", identification: "district" },
          { code: "150207", label: "九原区", identification: "district" },
          { code: "150203", label: "昆都仑区", identification: "district" }
        ]
      },
      {
        code: "150700",
        label: "呼伦贝尔市",
        identification: "city",
        children: [
          { code: "150785", label: "根河市", identification: "district" },
          { code: "150782", label: "牙克石市", identification: "district" },
          { code: "150725", label: "陈巴尔虎旗", identification: "district" },
          { code: "150702", label: "海拉尔区", identification: "district" },
          { code: "150724", label: "鄂温克族自治旗", identification: "district" },
          { code: "150721", label: "阿荣旗", identification: "district" },
          { code: "150783", label: "扎兰屯市", identification: "district" },
          { code: "150703", label: "扎赉诺尔区", identification: "district" },
          { code: "150781", label: "满洲里市", identification: "district" },
          { code: "150727", label: "新巴尔虎右旗", identification: "district" },
          { code: "150723", label: "鄂伦春自治旗", identification: "district" },
          { code: "150784", label: "额尔古纳市", identification: "district" },
          { code: "150722", label: "莫力达瓦达斡尔族自治旗", identification: "district" },
          { code: "150726", label: "新巴尔虎左旗", identification: "district" }
        ]
      },
      {
        code: "152900",
        label: "阿拉善盟",
        identification: "city",
        children: [
          { code: "152923", label: "额济纳旗", identification: "district" },
          { code: "152922", label: "阿拉善右旗", identification: "district" },
          { code: "152921", label: "阿拉善左旗", identification: "district" }
        ]
      },
      {
        code: "152200",
        label: "兴安盟",
        identification: "city",
        children: [
          { code: "152202", label: "阿尔山市", identification: "district" },
          { code: "152222", label: "科尔沁右翼中旗", identification: "district" },
          { code: "152224", label: "突泉县", identification: "district" },
          { code: "152223", label: "扎赉特旗", identification: "district" },
          { code: "152221", label: "科尔沁右翼前旗", identification: "district" },
          { code: "152201", label: "乌兰浩特市", identification: "district" }
        ]
      },
      {
        code: "150100",
        label: "呼和浩特市",
        identification: "city",
        children: [
          { code: "150103", label: "回民区", identification: "district" },
          { code: "150122", label: "托克托县", identification: "district" },
          { code: "150125", label: "武川县", identification: "district" },
          { code: "150121", label: "土默特左旗", identification: "district" },
          { code: "150102", label: "新城区", identification: "district" },
          { code: "150124", label: "清水河县", identification: "district" },
          { code: "150123", label: "和林格尔县", identification: "district" },
          { code: "150104", label: "玉泉区", identification: "district" },
          { code: "150105", label: "赛罕区", identification: "district" }
        ]
      },
      {
        code: "150600",
        label: "鄂尔多斯市",
        identification: "city",
        children: [
          { code: "150625", label: "杭锦旗", identification: "district" },
          { code: "150621", label: "达拉特旗", identification: "district" },
          { code: "150624", label: "鄂托克旗", identification: "district" },
          { code: "150626", label: "乌审旗", identification: "district" },
          { code: "150623", label: "鄂托克前旗", identification: "district" },
          { code: "150627", label: "伊金霍洛旗", identification: "district" },
          { code: "150603", label: "康巴什区", identification: "district" },
          { code: "150602", label: "东胜区", identification: "district" },
          { code: "150622", label: "准格尔旗", identification: "district" }
        ]
      },
      {
        code: "150500",
        label: "通辽市",
        identification: "city",
        children: [
          { code: "150581", label: "霍林郭勒市", identification: "district" },
          { code: "150523", label: "开鲁县", identification: "district" },
          { code: "150525", label: "奈曼旗", identification: "district" },
          { code: "150524", label: "库伦旗", identification: "district" },
          { code: "150526", label: "扎鲁特旗", identification: "district" },
          { code: "150521", label: "科尔沁左翼中旗", identification: "district" },
          { code: "150522", label: "科尔沁左翼后旗", identification: "district" },
          { code: "150502", label: "科尔沁区", identification: "district" }
        ]
      },
      {
        code: "150400",
        label: "赤峰市",
        identification: "city",
        children: [
          { code: "150422", label: "巴林左旗", identification: "district" },
          { code: "150423", label: "巴林右旗", identification: "district" },
          { code: "150424", label: "林西县", identification: "district" },
          { code: "150430", label: "敖汉旗", identification: "district" },
          { code: "150402", label: "红山区", identification: "district" },
          { code: "150426", label: "翁牛特旗", identification: "district" },
          { code: "150425", label: "克什克腾旗", identification: "district" },
          { code: "150429", label: "宁城县", identification: "district" },
          { code: "150421", label: "阿鲁科尔沁旗", identification: "district" },
          { code: "150403", label: "元宝山区", identification: "district" },
          { code: "150404", label: "松山区", identification: "district" },
          { code: "150428", label: "喀喇沁旗", identification: "district" }
        ]
      },
      {
        code: "152500",
        label: "锡林郭勒盟",
        identification: "city",
        children: [
          { code: "152525", label: "东乌珠穆沁旗", identification: "district" },
          { code: "152526", label: "西乌珠穆沁旗", identification: "district" },
          { code: "152523", label: "苏尼特左旗", identification: "district" },
          { code: "152502", label: "锡林浩特市", identification: "district" },
          { code: "152522", label: "阿巴嘎旗", identification: "district" },
          { code: "152524", label: "苏尼特右旗", identification: "district" },
          { code: "152501", label: "二连浩特市", identification: "district" },
          { code: "152530", label: "正蓝旗", identification: "district" },
          { code: "152529", label: "正镶白旗", identification: "district" },
          { code: "152531", label: "多伦县", identification: "district" },
          { code: "152528", label: "镶黄旗", identification: "district" },
          { code: "152527", label: "太仆寺旗", identification: "district" }
        ]
      },
      {
        code: "150900",
        label: "乌兰察布市",
        identification: "city",
        children: [
          { code: "150929", label: "四子王旗", identification: "district" },
          { code: "150922", label: "化德县", identification: "district" },
          { code: "150923", label: "商都县", identification: "district" },
          { code: "150928", label: "察哈尔右翼后旗", identification: "district" },
          { code: "150927", label: "察哈尔右翼中旗", identification: "district" },
          { code: "150921", label: "卓资县", identification: "district" },
          { code: "150981", label: "丰镇市", identification: "district" },
          { code: "150902", label: "集宁区", identification: "district" },
          { code: "150926", label: "察哈尔右翼前旗", identification: "district" },
          { code: "150925", label: "凉城县", identification: "district" },
          { code: "150924", label: "兴和县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "230000",
    label: "黑龙江省",
    identification: "province",
    children: [
      {
        code: "232700",
        label: "大兴安岭地区",
        identification: "city",
        children: [
          { code: "232701", label: "漠河市", identification: "district" },
          { code: "232722", label: "塔河县", identification: "district" },
          { code: "232721", label: "呼玛县", identification: "district" },
          { code: "232718", label: "加格达奇区", identification: "district" }
        ]
      },
      {
        code: "230900",
        label: "七台河市",
        identification: "city",
        children: [
          { code: "230903", label: "桃山区", identification: "district" },
          { code: "230921", label: "勃利县", identification: "district" },
          { code: "230904", label: "茄子河区", identification: "district" },
          { code: "230902", label: "新兴区", identification: "district" }
        ]
      },
      {
        code: "230400",
        label: "鹤岗市",
        identification: "city",
        children: [
          { code: "230422", label: "绥滨县", identification: "district" },
          { code: "230403", label: "工农区", identification: "district" },
          { code: "230407", label: "兴山区", identification: "district" },
          { code: "230402", label: "向阳区", identification: "district" },
          { code: "230404", label: "南山区", identification: "district" },
          { code: "230405", label: "兴安区", identification: "district" },
          { code: "230406", label: "东山区", identification: "district" },
          { code: "230421", label: "萝北县", identification: "district" }
        ]
      },
      {
        code: "230100",
        label: "哈尔滨市",
        identification: "city",
        children: [
          { code: "230126", label: "巴彦县", identification: "district" },
          { code: "230123", label: "依兰县", identification: "district" },
          { code: "230128", label: "通河县", identification: "district" },
          { code: "230127", label: "木兰县", identification: "district" },
          { code: "230125", label: "宾县", identification: "district" },
          { code: "230124", label: "方正县", identification: "district" },
          { code: "230129", label: "延寿县", identification: "district" },
          { code: "230108", label: "平房区", identification: "district" },
          { code: "230183", label: "尚志市", identification: "district" },
          { code: "230184", label: "五常市", identification: "district" },
          { code: "230112", label: "阿城区", identification: "district" },
          { code: "230111", label: "呼兰区", identification: "district" },
          { code: "230109", label: "松北区", identification: "district" },
          { code: "230113", label: "双城区", identification: "district" },
          { code: "230104", label: "道外区", identification: "district" },
          { code: "230110", label: "香坊区", identification: "district" },
          { code: "230102", label: "道里区", identification: "district" },
          { code: "230103", label: "南岗区", identification: "district" }
        ]
      },
      {
        code: "230800",
        label: "佳木斯市",
        identification: "city",
        children: [
          { code: "230826", label: "桦川县", identification: "district" },
          { code: "230828", label: "汤原县", identification: "district" },
          { code: "230803", label: "向阳区", identification: "district" },
          { code: "230804", label: "前进区", identification: "district" },
          { code: "230805", label: "东风区", identification: "district" },
          { code: "230811", label: "郊区", identification: "district" },
          { code: "230822", label: "桦南县", identification: "district" },
          { code: "230882", label: "富锦市", identification: "district" },
          { code: "230881", label: "同江市", identification: "district" },
          { code: "230883", label: "抚远市", identification: "district" }
        ]
      },
      {
        code: "230500",
        label: "双鸭山市",
        identification: "city",
        children: [
          { code: "230522", label: "友谊县", identification: "district" },
          { code: "230502", label: "尖山区", identification: "district" },
          { code: "230503", label: "岭东区", identification: "district" },
          { code: "230506", label: "宝山区", identification: "district" },
          { code: "230523", label: "宝清县", identification: "district" },
          { code: "230521", label: "集贤县", identification: "district" },
          { code: "230505", label: "四方台区", identification: "district" },
          { code: "230524", label: "饶河县", identification: "district" }
        ]
      },
      {
        code: "231100",
        label: "黑河市",
        identification: "city",
        children: [
          { code: "231102", label: "爱辉区", identification: "district" },
          { code: "231181", label: "北安市", identification: "district" },
          { code: "231124", label: "孙吴县", identification: "district" },
          { code: "231123", label: "逊克县", identification: "district" },
          { code: "231182", label: "五大连池市", identification: "district" },
          { code: "231183", label: "嫩江市", identification: "district" }
        ]
      },
      {
        code: "231000",
        label: "牡丹江市",
        identification: "city",
        children: [
          { code: "231004", label: "爱民区", identification: "district" },
          { code: "231002", label: "东安区", identification: "district" },
          { code: "231081", label: "绥芬河市", identification: "district" },
          { code: "231003", label: "阳明区", identification: "district" },
          { code: "231085", label: "穆棱市", identification: "district" },
          { code: "231025", label: "林口县", identification: "district" },
          { code: "231083", label: "海林市", identification: "district" },
          { code: "231086", label: "东宁市", identification: "district" },
          { code: "231084", label: "宁安市", identification: "district" },
          { code: "231005", label: "西安区", identification: "district" }
        ]
      },
      {
        code: "231200",
        label: "绥化市",
        identification: "city",
        children: [
          { code: "231226", label: "绥棱县", identification: "district" },
          { code: "231283", label: "海伦市", identification: "district" },
          { code: "231224", label: "庆安县", identification: "district" },
          { code: "231202", label: "北林区", identification: "district" },
          { code: "231221", label: "望奎县", identification: "district" },
          { code: "231223", label: "青冈县", identification: "district" },
          { code: "231225", label: "明水县", identification: "district" },
          { code: "231222", label: "兰西县", identification: "district" },
          { code: "231282", label: "肇东市", identification: "district" },
          { code: "231281", label: "安达市", identification: "district" }
        ]
      },
      {
        code: "230700",
        label: "伊春市",
        identification: "city",
        children: [
          { code: "230722", label: "嘉荫县", identification: "district" },
          { code: "230723", label: "汤旺县", identification: "district" },
          { code: "230724", label: "丰林县", identification: "district" },
          { code: "230717", label: "伊美区", identification: "district" },
          { code: "230718", label: "乌翠区", identification: "district" },
          { code: "230719", label: "友好区", identification: "district" },
          { code: "230751", label: "金林区", identification: "district" },
          { code: "230781", label: "铁力市", identification: "district" },
          { code: "230725", label: "大箐山县", identification: "district" },
          { code: "230726", label: "南岔县", identification: "district" }
        ]
      },
      {
        code: "230600",
        label: "大庆市",
        identification: "city",
        children: [
          { code: "230605", label: "红岗区", identification: "district" },
          { code: "230606", label: "大同区", identification: "district" },
          { code: "230623", label: "林甸县", identification: "district" },
          { code: "230621", label: "肇州县", identification: "district" },
          { code: "230604", label: "让胡路区", identification: "district" },
          { code: "230624", label: "杜尔伯特蒙古族自治县", identification: "district" },
          { code: "230622", label: "肇源县", identification: "district" },
          { code: "230602", label: "萨尔图区", identification: "district" },
          { code: "230603", label: "龙凤区", identification: "district" }
        ]
      },
      {
        code: "230300",
        label: "鸡西市",
        identification: "city",
        children: [
          { code: "230304", label: "滴道区", identification: "district" },
          { code: "230307", label: "麻山区", identification: "district" },
          { code: "230303", label: "恒山区", identification: "district" },
          { code: "230306", label: "城子河区", identification: "district" },
          { code: "230302", label: "鸡冠区", identification: "district" },
          { code: "230305", label: "梨树区", identification: "district" },
          { code: "230321", label: "鸡东县", identification: "district" },
          { code: "230381", label: "虎林市", identification: "district" },
          { code: "230382", label: "密山市", identification: "district" }
        ]
      },
      {
        code: "230200",
        label: "齐齐哈尔市",
        identification: "city",
        children: [
          { code: "230229", label: "克山县", identification: "district" },
          { code: "230225", label: "甘南县", identification: "district" },
          { code: "230230", label: "克东县", identification: "district" },
          { code: "230223", label: "依安县", identification: "district" },
          { code: "230227", label: "富裕县", identification: "district" },
          { code: "230208", label: "梅里斯达斡尔族区", identification: "district" },
          { code: "230207", label: "碾子山区", identification: "district" },
          { code: "230221", label: "龙江县", identification: "district" },
          { code: "230204", label: "铁锋区", identification: "district" },
          { code: "230203", label: "建华区", identification: "district" },
          { code: "230206", label: "富拉尔基区", identification: "district" },
          { code: "230202", label: "龙沙区", identification: "district" },
          { code: "230205", label: "昂昂溪区", identification: "district" },
          { code: "230224", label: "泰来县", identification: "district" },
          { code: "230231", label: "拜泉县", identification: "district" },
          { code: "230281", label: "讷河市", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "650000",
    label: "新疆维吾尔自治区",
    identification: "province",
    children: [
      {
        code: "659005",
        label: "北屯市",
        identification: "city",
        children: [
          { code: "659005", label: "海川镇", identification: "district" },
          { code: "659005", label: "丰庆镇", identification: "district" },
          { code: "659005", label: "双渠镇", identification: "district" },
          { code: "659005", label: "北屯镇", identification: "district" }
        ]
      },
      {
        code: "659006",
        label: "铁门关市",
        identification: "city",
        children: [
          { code: "659006", label: "博古其镇", identification: "district" },
          { code: "659006", label: "双丰镇", identification: "district" }
        ]
      },
      {
        code: "659007",
        label: "双河市",
        identification: "city",
        children: [
          { code: "659007", label: "兵团八十九团", identification: "district" },
          { code: "659007", label: "博河镇", identification: "district" },
          { code: "659007", label: "双桥镇", identification: "district" },
          { code: "659007", label: "石峪镇", identification: "district" },
          { code: "659007", label: "双乐镇", identification: "district" }
        ]
      },
      {
        code: "652700",
        label: "博尔塔拉蒙古自治州",
        identification: "city",
        children: [
          { code: "652723", label: "温泉县", identification: "district" },
          { code: "652702", label: "阿拉山口市", identification: "district" },
          { code: "652701", label: "博乐市", identification: "district" },
          { code: "652722", label: "精河县", identification: "district" }
        ]
      },
      {
        code: "659008",
        label: "可克达拉市",
        identification: "city",
        children: [
          { code: "659008", label: "长丰镇", identification: "district" },
          { code: "659008", label: "金屯镇", identification: "district" },
          { code: "659008", label: "都拉塔口岸", identification: "district" },
          { code: "659008", label: "榆树庄镇", identification: "district" },
          { code: "659008", label: "苇湖镇", identification: "district" },
          { code: "659008", label: "金梁镇", identification: "district" }
        ]
      },
      {
        code: "654200",
        label: "塔城地区",
        identification: "city",
        children: [
          { code: "654226", label: "和布克赛尔蒙古自治县", identification: "district" },
          { code: "654201", label: "塔城市", identification: "district" },
          { code: "654221", label: "额敏县", identification: "district" },
          { code: "654225", label: "裕民县", identification: "district" },
          { code: "654224", label: "托里县", identification: "district" },
          { code: "654202", label: "乌苏市", identification: "district" },
          { code: "654203", label: "沙湾市", identification: "district" }
        ]
      },
      {
        code: "659009",
        label: "昆玉市",
        identification: "city",
        children: [
          { code: "659009", label: "昆牧镇", identification: "district" },
          { code: "659009", label: "老兵镇", identification: "district" },
          { code: "659009", label: "昆泉镇", identification: "district" },
          { code: "659009", label: "兵团二二四团", identification: "district" }
        ]
      },
      {
        code: "653200",
        label: "和田地区",
        identification: "city",
        children: [
          { code: "653227", label: "民丰县", identification: "district" },
          { code: "653226", label: "于田县", identification: "district" },
          { code: "653201", label: "和田市", identification: "district" },
          { code: "653224", label: "洛浦县", identification: "district" },
          { code: "653223", label: "皮山县", identification: "district" },
          { code: "653222", label: "墨玉县", identification: "district" },
          { code: "653225", label: "策勒县", identification: "district" },
          { code: "653221", label: "和田县", identification: "district" }
        ]
      },
      {
        code: "654300",
        label: "阿勒泰地区",
        identification: "city",
        children: [
          { code: "654321", label: "布尔津县", identification: "district" },
          { code: "654324", label: "哈巴河县", identification: "district" },
          { code: "654322", label: "富蕴县", identification: "district" },
          { code: "654326", label: "吉木乃县", identification: "district" },
          { code: "654325", label: "青河县", identification: "district" },
          { code: "654323", label: "福海县", identification: "district" },
          { code: "654301", label: "阿勒泰市", identification: "district" }
        ]
      },
      {
        code: "659001",
        label: "石河子市",
        identification: "city",
        children: [
          { code: "659001", label: "兵团一五二团", identification: "district" },
          { code: "659001", label: "向阳街道", identification: "district" },
          { code: "659001", label: "红山街道", identification: "district" },
          { code: "659001", label: "兵团一四四团", identification: "district" },
          { code: "659001", label: "东城街道", identification: "district" },
          { code: "659001", label: "石河子镇", identification: "district" },
          { code: "659001", label: "老街街道", identification: "district" },
          { code: "659001", label: "新城街道", identification: "district" },
          { code: "659001", label: "北泉镇", identification: "district" }
        ]
      },
      {
        code: "652300",
        label: "昌吉回族自治州",
        identification: "city",
        children: [
          { code: "652325", label: "奇台县", identification: "district" },
          { code: "652324", label: "玛纳斯县", identification: "district" },
          { code: "652323", label: "呼图壁县", identification: "district" },
          { code: "652328", label: "木垒哈萨克自治县", identification: "district" },
          { code: "652302", label: "阜康市", identification: "district" },
          { code: "652327", label: "吉木萨尔县", identification: "district" },
          { code: "652301", label: "昌吉市", identification: "district" }
        ]
      },
      {
        code: "652800",
        label: "巴音郭楞蒙古自治州",
        identification: "city",
        children: [
          { code: "652827", label: "和静县", identification: "district" },
          { code: "652828", label: "和硕县", identification: "district" },
          { code: "652826", label: "焉耆回族自治县", identification: "district" },
          { code: "652829", label: "博湖县", identification: "district" },
          { code: "652824", label: "若羌县", identification: "district" },
          { code: "652825", label: "且末县", identification: "district" },
          { code: "652801", label: "库尔勒市", identification: "district" },
          { code: "652822", label: "轮台县", identification: "district" },
          { code: "652823", label: "尉犁县", identification: "district" }
        ]
      },
      {
        code: "654000",
        label: "伊犁哈萨克自治州",
        identification: "city",
        children: [
          { code: "654021", label: "伊宁县", identification: "district" },
          { code: "654028", label: "尼勒克县", identification: "district" },
          { code: "654024", label: "巩留县", identification: "district" },
          { code: "654025", label: "新源县", identification: "district" },
          { code: "654026", label: "昭苏县", identification: "district" },
          { code: "654027", label: "特克斯县", identification: "district" },
          { code: "654023", label: "霍城县", identification: "district" },
          { code: "654022", label: "察布查尔锡伯自治县", identification: "district" },
          { code: "654004", label: "霍尔果斯市", identification: "district" },
          { code: "654002", label: "伊宁市", identification: "district" },
          { code: "654003", label: "奎屯市", identification: "district" }
        ]
      },
      {
        code: "659002",
        label: "阿拉尔市",
        identification: "city",
        children: [
          { code: "659002", label: "玛滩镇", identification: "district" },
          { code: "659002", label: "花桥镇", identification: "district" },
          { code: "659002", label: "沙河镇", identification: "district" },
          { code: "659002", label: "青松路街道", identification: "district" },
          { code: "659002", label: "托喀依乡", identification: "district" },
          { code: "659002", label: "塔门镇", identification: "district" },
          { code: "659002", label: "南口街道", identification: "district" },
          { code: "659002", label: "金杨镇", identification: "district" },
          { code: "659002", label: "双城镇", identification: "district" },
          { code: "659002", label: "新井子镇", identification: "district" },
          { code: "659002", label: "兵团农一师沙井子水利管理处", identification: "district" },
          { code: "659002", label: "金银川镇", identification: "district" },
          { code: "659002", label: "甘泉镇", identification: "district" },
          { code: "659002", label: "新开岭镇", identification: "district" },
          { code: "659002", label: "昌安镇", identification: "district" },
          { code: "659002", label: "幸福镇", identification: "district" },
          { code: "659002", label: "塔南镇", identification: "district" },
          { code: "659002", label: "幸福路街道", identification: "district" },
          { code: "659002", label: "金银川路街道", identification: "district" }
        ]
      },
      {
        code: "653100",
        label: "喀什地区",
        identification: "city",
        children: [
          { code: "653129", label: "伽师县", identification: "district" },
          { code: "653122", label: "疏勒县", identification: "district" },
          { code: "653127", label: "麦盖提县", identification: "district" },
          { code: "653125", label: "莎车县", identification: "district" },
          { code: "653126", label: "叶城县", identification: "district" },
          { code: "653131", label: "塔什库尔干塔吉克自治县", identification: "district" },
          { code: "653124", label: "泽普县", identification: "district" },
          { code: "653130", label: "巴楚县", identification: "district" },
          { code: "653123", label: "英吉沙县", identification: "district" },
          { code: "653128", label: "岳普湖县", identification: "district" },
          { code: "653101", label: "喀什市", identification: "district" },
          { code: "653121", label: "疏附县", identification: "district" }
        ]
      },
      {
        code: "653000",
        label: "克孜勒苏柯尔克孜自治州",
        identification: "city",
        children: [
          { code: "653001", label: "阿图什市", identification: "district" },
          { code: "653024", label: "乌恰县", identification: "district" },
          { code: "653023", label: "阿合奇县", identification: "district" },
          { code: "653022", label: "阿克陶县", identification: "district" }
        ]
      },
      {
        code: "650200",
        label: "克拉玛依市",
        identification: "city",
        children: [
          { code: "650205", label: "乌尔禾区", identification: "district" },
          { code: "650202", label: "独山子区", identification: "district" },
          { code: "650204", label: "白碱滩区", identification: "district" },
          { code: "650203", label: "克拉玛依区", identification: "district" }
        ]
      },
      {
        code: "650400",
        label: "吐鲁番市",
        identification: "city",
        children: [
          { code: "650402", label: "高昌区", identification: "district" },
          { code: "650421", label: "鄯善县", identification: "district" },
          { code: "650422", label: "托克逊县", identification: "district" }
        ]
      },
      {
        code: "650500",
        label: "哈密市",
        identification: "city",
        children: [
          { code: "650522", label: "伊吾县", identification: "district" },
          { code: "650521", label: "巴里坤哈萨克自治县", identification: "district" },
          { code: "650502", label: "伊州区", identification: "district" }
        ]
      },
      {
        code: "659011",
        label: "新星市",
        identification: "city",
        children: [
          { code: "659011", label: "兵团红星四场", identification: "district" },
          { code: "659011", label: "兵团红星一场", identification: "district" },
          { code: "659011", label: "兵团黄田农场", identification: "district" }
        ]
      },
      {
        code: "659003",
        label: "图木舒克市",
        identification: "city",
        children: [
          { code: "659003", label: "海安镇", identification: "district" },
          { code: "659003", label: "唐驿镇", identification: "district" },
          { code: "659003", label: "前海街道", identification: "district" },
          { code: "659003", label: "喀拉拜勒镇", identification: "district" },
          { code: "659003", label: "齐干却勒街道", identification: "district" },
          { code: "659003", label: "金胡杨镇", identification: "district" },
          { code: "659003", label: "夏河镇", identification: "district" },
          { code: "659003", label: "永安镇", identification: "district" },
          { code: "659003", label: "永安坝街道", identification: "district" }
        ]
      },
      {
        code: "652900",
        label: "阿克苏地区",
        identification: "city",
        children: [
          { code: "652926", label: "拜城县", identification: "district" },
          { code: "652902", label: "库车市", identification: "district" },
          { code: "652925", label: "新和县", identification: "district" },
          { code: "652924", label: "沙雅县", identification: "district" },
          { code: "652901", label: "阿克苏市", identification: "district" },
          { code: "652927", label: "乌什县", identification: "district" },
          { code: "652928", label: "阿瓦提县", identification: "district" },
          { code: "652929", label: "柯坪县", identification: "district" },
          { code: "652922", label: "温宿县", identification: "district" }
        ]
      },
      {
        code: "650100",
        label: "乌鲁木齐市",
        identification: "city",
        children: [
          { code: "650107", label: "达坂城区", identification: "district" },
          { code: "650102", label: "天山区", identification: "district" },
          { code: "650105", label: "水磨沟区", identification: "district" },
          { code: "650109", label: "米东区", identification: "district" },
          { code: "650121", label: "乌鲁木齐县", identification: "district" },
          { code: "650103", label: "沙依巴克区", identification: "district" },
          { code: "650106", label: "头屯河区", identification: "district" },
          { code: "650104", label: "新市区", identification: "district" }
        ]
      },
      {
        code: "659010",
        label: "胡杨河市",
        identification: "city",
        children: [
          { code: "659010", label: "兵团一二九团", identification: "district" },
          { code: "659010", label: "兵团一三零团", identification: "district" }
        ]
      },
      {
        code: "659004",
        label: "五家渠市",
        identification: "city",
        children: [
          { code: "659004", label: "梧桐镇", identification: "district" },
          { code: "659004", label: "人民路街道", identification: "district" },
          { code: "659004", label: "兵团一零一团", identification: "district" },
          { code: "659004", label: "蔡家湖镇", identification: "district" },
          { code: "659004", label: "青湖路街道", identification: "district" },
          { code: "659004", label: "军垦路街道", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "420000",
    label: "湖北省",
    identification: "province",
    children: [
      {
        code: "420600",
        label: "襄阳市",
        identification: "city",
        children: [
          { code: "420625", label: "谷城县", identification: "district" },
          { code: "420683", label: "枣阳市", identification: "district" },
          { code: "420626", label: "保康县", identification: "district" },
          { code: "420684", label: "宜城市", identification: "district" },
          { code: "420624", label: "南漳县", identification: "district" },
          { code: "420607", label: "襄州区", identification: "district" },
          { code: "420602", label: "襄城区", identification: "district" },
          { code: "420606", label: "樊城区", identification: "district" },
          { code: "420682", label: "老河口市", identification: "district" }
        ]
      },
      {
        code: "420300",
        label: "十堰市",
        identification: "city",
        children: [
          { code: "420304", label: "郧阳区", identification: "district" },
          { code: "420323", label: "竹山县", identification: "district" },
          { code: "420302", label: "茅箭区", identification: "district" },
          { code: "420303", label: "张湾区", identification: "district" },
          { code: "420324", label: "竹溪县", identification: "district" },
          { code: "420325", label: "房县", identification: "district" },
          { code: "420322", label: "郧西县", identification: "district" },
          { code: "420381", label: "丹江口市", identification: "district" }
        ]
      },
      {
        code: "420500",
        label: "宜昌市",
        identification: "city",
        children: [
          { code: "420526", label: "兴山县", identification: "district" },
          { code: "420527", label: "秭归县", identification: "district" },
          { code: "420504", label: "点军区", identification: "district" },
          { code: "420582", label: "当阳市", identification: "district" },
          { code: "420581", label: "宜都市", identification: "district" },
          { code: "420525", label: "远安县", identification: "district" },
          { code: "420503", label: "伍家岗区", identification: "district" },
          { code: "420505", label: "猇亭区", identification: "district" },
          { code: "420583", label: "枝江市", identification: "district" },
          { code: "420529", label: "五峰土家族自治县", identification: "district" },
          { code: "420502", label: "西陵区", identification: "district" },
          { code: "420506", label: "夷陵区", identification: "district" },
          { code: "420528", label: "长阳土家族自治县", identification: "district" }
        ]
      },
      {
        code: "420100",
        label: "武汉市",
        identification: "city",
        children: [
          { code: "420117", label: "新洲区", identification: "district" },
          { code: "420113", label: "汉南区", identification: "district" },
          { code: "420114", label: "蔡甸区", identification: "district" },
          { code: "420115", label: "江夏区", identification: "district" },
          { code: "420106", label: "武昌区", identification: "district" },
          { code: "420102", label: "江岸区", identification: "district" },
          { code: "420112", label: "东西湖区", identification: "district" },
          { code: "420107", label: "青山区", identification: "district" },
          { code: "420103", label: "江汉区", identification: "district" },
          { code: "420104", label: "硚口区", identification: "district" },
          { code: "420105", label: "汉阳区", identification: "district" },
          { code: "420116", label: "黄陂区", identification: "district" },
          { code: "420111", label: "洪山区", identification: "district" }
        ]
      },
      {
        code: "421100",
        label: "黄冈市",
        identification: "city",
        children: [
          { code: "421181", label: "麻城市", identification: "district" },
          { code: "421102", label: "黄州区", identification: "district" },
          { code: "421124", label: "英山县", identification: "district" },
          { code: "421121", label: "团风县", identification: "district" },
          { code: "421123", label: "罗田县", identification: "district" },
          { code: "421182", label: "武穴市", identification: "district" },
          { code: "421127", label: "黄梅县", identification: "district" },
          { code: "421122", label: "红安县", identification: "district" },
          { code: "421126", label: "蕲春县", identification: "district" },
          { code: "421125", label: "浠水县", identification: "district" }
        ]
      },
      {
        code: "429006",
        label: "天门市",
        identification: "city",
        children: [
          { code: "429006", label: "胡市镇", identification: "district" },
          { code: "429006", label: "黄潭镇", identification: "district" },
          { code: "429006", label: "多祥镇", identification: "district" },
          { code: "429006", label: "沉湖管委会", identification: "district" },
          { code: "429006", label: "干驿镇", identification: "district" },
          { code: "429006", label: "横林镇", identification: "district" },
          { code: "429006", label: "马湾镇", identification: "district" },
          { code: "429006", label: "蒋湖农场", identification: "district" },
          { code: "429006", label: "小板镇", identification: "district" },
          { code: "429006", label: "岳口镇", identification: "district" },
          { code: "429006", label: "蒋场镇", identification: "district" },
          { code: "429006", label: "石家河镇", identification: "district" },
          { code: "429006", label: "彭市镇", identification: "district" },
          { code: "429006", label: "佛子山镇", identification: "district" },
          { code: "429006", label: "九真镇", identification: "district" },
          { code: "429006", label: "竟陵街道", identification: "district" },
          { code: "429006", label: "侯口街道", identification: "district" },
          { code: "429006", label: "麻洋镇", identification: "district" },
          { code: "429006", label: "杨林街道", identification: "district" },
          { code: "429006", label: "汪场镇", identification: "district" },
          { code: "429006", label: "白茅湖农场", identification: "district" },
          { code: "429006", label: "皂市镇", identification: "district" },
          { code: "429006", label: "拖市镇", identification: "district" },
          { code: "429006", label: "卢市镇", identification: "district" },
          { code: "429006", label: "净潭乡", identification: "district" },
          { code: "429006", label: "多宝镇", identification: "district" },
          { code: "429006", label: "张港镇", identification: "district" },
          { code: "429006", label: "渔薪镇", identification: "district" }
        ]
      },
      {
        code: "429005",
        label: "潜江市",
        identification: "city",
        children: [
          { code: "429005", label: "泰丰街道", identification: "district" },
          { code: "429005", label: "广华寺街道", identification: "district" },
          { code: "429005", label: "周矶管理区", identification: "district" },
          { code: "429005", label: "高场街道", identification: "district" },
          { code: "429005", label: "总口管理区", identification: "district" },
          { code: "429005", label: "运粮湖管理区", identification: "district" },
          { code: "429005", label: "王场镇", identification: "district" },
          { code: "429005", label: "白鹭湖管理区", identification: "district" },
          { code: "429005", label: "园林街道", identification: "district" },
          { code: "429005", label: "竹根滩镇", identification: "district" },
          { code: "429005", label: "渔洋镇", identification: "district" },
          { code: "429005", label: "熊口镇", identification: "district" },
          { code: "429005", label: "熊口管理区", identification: "district" },
          { code: "429005", label: "后湖管理区", identification: "district" },
          { code: "429005", label: "张金镇", identification: "district" },
          { code: "429005", label: "杨市街道", identification: "district" },
          { code: "429005", label: "高石碑镇", identification: "district" },
          { code: "429005", label: "周矶街道", identification: "district" },
          { code: "429005", label: "积玉口镇", identification: "district" },
          { code: "429005", label: "泽口街道", identification: "district" },
          { code: "429005", label: "浩口镇", identification: "district" },
          { code: "429005", label: "老新镇", identification: "district" },
          { code: "429005", label: "龙湾镇", identification: "district" }
        ]
      },
      {
        code: "420800",
        label: "荆门市",
        identification: "city",
        children: [
          { code: "420882", label: "京山市", identification: "district" },
          { code: "420822", label: "沙洋县", identification: "district" },
          { code: "420802", label: "东宝区", identification: "district" },
          { code: "420804", label: "掇刀区", identification: "district" },
          { code: "420881", label: "钟祥市", identification: "district" }
        ]
      },
      {
        code: "420900",
        label: "孝感市",
        identification: "city",
        children: [
          { code: "420923", label: "云梦县", identification: "district" },
          { code: "420981", label: "应城市", identification: "district" },
          { code: "420902", label: "孝南区", identification: "district" },
          { code: "420984", label: "汉川市", identification: "district" },
          { code: "420982", label: "安陆市", identification: "district" },
          { code: "420922", label: "大悟县", identification: "district" },
          { code: "420921", label: "孝昌县", identification: "district" }
        ]
      },
      {
        code: "422800",
        label: "恩施土家族苗族自治州",
        identification: "city",
        children: [
          { code: "422822", label: "建始县", identification: "district" },
          { code: "422801", label: "恩施市", identification: "district" },
          { code: "422802", label: "利川市", identification: "district" },
          { code: "422825", label: "宣恩县", identification: "district" },
          { code: "422826", label: "咸丰县", identification: "district" },
          { code: "422827", label: "来凤县", identification: "district" },
          { code: "422828", label: "鹤峰县", identification: "district" },
          { code: "422823", label: "巴东县", identification: "district" }
        ]
      },
      {
        code: "429004",
        label: "仙桃市",
        identification: "city",
        children: [
          { code: "429004", label: "通海口镇", identification: "district" },
          { code: "429004", label: "胡场镇", identification: "district" },
          { code: "429004", label: "干河街道", identification: "district" },
          { code: "429004", label: "杨林尾镇", identification: "district" },
          { code: "429004", label: "彭场镇", identification: "district" },
          { code: "429004", label: "沔城回族镇", identification: "district" },
          { code: "429004", label: "龙华山街道", identification: "district" },
          { code: "429004", label: "沙湖原种场", identification: "district" },
          { code: "429004", label: "郑场镇", identification: "district" },
          { code: "429004", label: "郭河镇", identification: "district" },
          { code: "429004", label: "沙嘴街道", identification: "district" },
          { code: "429004", label: "排湖风景区", identification: "district" },
          { code: "429004", label: "毛嘴镇", identification: "district" },
          { code: "429004", label: "张沟镇", identification: "district" },
          { code: "429004", label: "三伏潭镇", identification: "district" },
          { code: "429004", label: "五湖渔场", identification: "district" },
          { code: "429004", label: "西流河镇", identification: "district" },
          { code: "429004", label: "长埫口镇", identification: "district" },
          { code: "429004", label: "杜湖街道", identification: "district" },
          { code: "429004", label: "剅河镇", identification: "district" },
          { code: "429004", label: "陈场镇", identification: "district" },
          { code: "429004", label: "沙湖镇", identification: "district" }
        ]
      },
      {
        code: "421000",
        label: "荆州市",
        identification: "city",
        children: [
          { code: "421024", label: "江陵县", identification: "district" },
          { code: "421083", label: "洪湖市", identification: "district" },
          { code: "421088", label: "监利市", identification: "district" },
          { code: "421087", label: "松滋市", identification: "district" },
          { code: "421022", label: "公安县", identification: "district" },
          { code: "421003", label: "荆州区", identification: "district" },
          { code: "421002", label: "沙市区", identification: "district" },
          { code: "421081", label: "石首市", identification: "district" }
        ]
      },
      {
        code: "421200",
        label: "咸宁市",
        identification: "city",
        children: [
          { code: "421202", label: "咸安区", identification: "district" },
          { code: "421221", label: "嘉鱼县", identification: "district" },
          { code: "421224", label: "通山县", identification: "district" },
          { code: "421281", label: "赤壁市", identification: "district" },
          { code: "421223", label: "崇阳县", identification: "district" },
          { code: "421222", label: "通城县", identification: "district" }
        ]
      },
      {
        code: "429021",
        label: "神农架林区",
        identification: "city",
        children: [
          { code: "429021", label: "木鱼镇", identification: "district" },
          { code: "429021", label: "新华镇", identification: "district" },
          { code: "429021", label: "宋洛乡", identification: "district" },
          { code: "429021", label: "松柏镇", identification: "district" },
          { code: "429021", label: "红坪镇", identification: "district" },
          { code: "429021", label: "阳日镇", identification: "district" },
          { code: "429021", label: "下谷坪土家族乡", identification: "district" },
          { code: "429021", label: "大九湖镇", identification: "district" }
        ]
      },
      {
        code: "421300",
        label: "随州市",
        identification: "city",
        children: [
          { code: "421321", label: "随县", identification: "district" },
          { code: "421303", label: "曾都区", identification: "district" },
          { code: "421381", label: "广水市", identification: "district" }
        ]
      },
      {
        code: "420700",
        label: "鄂州市",
        identification: "city",
        children: [
          { code: "420703", label: "华容区", identification: "district" },
          { code: "420702", label: "梁子湖区", identification: "district" },
          { code: "420704", label: "鄂城区", identification: "district" }
        ]
      },
      {
        code: "420200",
        label: "黄石市",
        identification: "city",
        children: [
          { code: "420203", label: "西塞山区", identification: "district" },
          { code: "420204", label: "下陆区", identification: "district" },
          { code: "420205", label: "铁山区", identification: "district" },
          { code: "420222", label: "阳新县", identification: "district" },
          { code: "420281", label: "大冶市", identification: "district" },
          { code: "420202", label: "黄石港区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "210000",
    label: "辽宁省",
    identification: "province",
    children: [
      {
        code: "211400",
        label: "葫芦岛市",
        identification: "city",
        children: [
          { code: "211422", label: "建昌县", identification: "district" },
          { code: "211403", label: "龙港区", identification: "district" },
          { code: "211481", label: "兴城市", identification: "district" },
          { code: "211404", label: "南票区", identification: "district" },
          { code: "211402", label: "连山区", identification: "district" },
          { code: "211421", label: "绥中县", identification: "district" }
        ]
      },
      {
        code: "210200",
        label: "大连市",
        identification: "city",
        children: [
          { code: "210283", label: "庄河市", identification: "district" },
          { code: "210281", label: "瓦房店市", identification: "district" },
          { code: "210214", label: "普兰店区", identification: "district" },
          { code: "210213", label: "金州区", identification: "district" },
          { code: "210224", label: "长海县", identification: "district" },
          { code: "210211", label: "甘井子区", identification: "district" },
          { code: "210202", label: "中山区", identification: "district" },
          { code: "210212", label: "旅顺口区", identification: "district" },
          { code: "210203", label: "西岗区", identification: "district" },
          { code: "210204", label: "沙河口区", identification: "district" }
        ]
      },
      {
        code: "210600",
        label: "丹东市",
        identification: "city",
        children: [
          { code: "210682", label: "凤城市", identification: "district" },
          { code: "210604", label: "振安区", identification: "district" },
          { code: "210681", label: "东港市", identification: "district" },
          { code: "210603", label: "振兴区", identification: "district" },
          { code: "210624", label: "宽甸满族自治县", identification: "district" },
          { code: "210602", label: "元宝区", identification: "district" }
        ]
      },
      {
        code: "210700",
        label: "锦州市",
        identification: "city",
        children: [
          { code: "210782", label: "北镇市", identification: "district" },
          { code: "210711", label: "太和区", identification: "district" },
          { code: "210703", label: "凌河区", identification: "district" },
          { code: "210702", label: "古塔区", identification: "district" },
          { code: "210781", label: "凌海市", identification: "district" },
          { code: "210726", label: "黑山县", identification: "district" },
          { code: "210727", label: "义县", identification: "district" }
        ]
      },
      {
        code: "210100",
        label: "沈阳市",
        identification: "city",
        children: [
          { code: "210114", label: "于洪区", identification: "district" },
          { code: "210123", label: "康平县", identification: "district" },
          { code: "210115", label: "辽中区", identification: "district" },
          { code: "210106", label: "铁西区", identification: "district" },
          { code: "210113", label: "沈北新区", identification: "district" },
          { code: "210102", label: "和平区", identification: "district" },
          { code: "210181", label: "新民市", identification: "district" },
          { code: "210124", label: "法库县", identification: "district" },
          { code: "210112", label: "浑南区", identification: "district" },
          { code: "210111", label: "苏家屯区", identification: "district" },
          { code: "210103", label: "沈河区", identification: "district" },
          { code: "210104", label: "大东区", identification: "district" },
          { code: "210105", label: "皇姑区", identification: "district" }
        ]
      },
      {
        code: "211200",
        label: "铁岭市",
        identification: "city",
        children: [
          { code: "211282", label: "开原市", identification: "district" },
          { code: "211204", label: "清河区", identification: "district" },
          { code: "211281", label: "调兵山市", identification: "district" },
          { code: "211221", label: "铁岭县", identification: "district" },
          { code: "211202", label: "银州区", identification: "district" },
          { code: "211223", label: "西丰县", identification: "district" },
          { code: "211224", label: "昌图县", identification: "district" }
        ]
      },
      {
        code: "210900",
        label: "阜新市",
        identification: "city",
        children: [
          { code: "210905", label: "清河门区", identification: "district" },
          { code: "210904", label: "太平区", identification: "district" },
          { code: "210903", label: "新邱区", identification: "district" },
          { code: "210921", label: "阜新蒙古族自治县", identification: "district" },
          { code: "210922", label: "彰武县", identification: "district" },
          { code: "210911", label: "细河区", identification: "district" },
          { code: "210902", label: "海州区", identification: "district" }
        ]
      },
      {
        code: "210500",
        label: "本溪市",
        identification: "city",
        children: [
          { code: "210522", label: "桓仁满族自治县", identification: "district" },
          { code: "210505", label: "南芬区", identification: "district" },
          { code: "210504", label: "明山区", identification: "district" },
          { code: "210521", label: "本溪满族自治县", identification: "district" },
          { code: "210503", label: "溪湖区", identification: "district" },
          { code: "210502", label: "平山区", identification: "district" }
        ]
      },
      {
        code: "211000",
        label: "辽阳市",
        identification: "city",
        children: [
          { code: "211011", label: "太子河区", identification: "district" },
          { code: "211005", label: "弓长岭区", identification: "district" },
          { code: "211003", label: "文圣区", identification: "district" },
          { code: "211081", label: "灯塔市", identification: "district" },
          { code: "211021", label: "辽阳县", identification: "district" },
          { code: "211002", label: "白塔区", identification: "district" },
          { code: "211004", label: "宏伟区", identification: "district" }
        ]
      },
      {
        code: "210400",
        label: "抚顺市",
        identification: "city",
        children: [
          { code: "210422", label: "新宾满族自治县", identification: "district" },
          { code: "210411", label: "顺城区", identification: "district" },
          { code: "210403", label: "东洲区", identification: "district" },
          { code: "210404", label: "望花区", identification: "district" },
          { code: "210421", label: "抚顺县", identification: "district" },
          { code: "210402", label: "新抚区", identification: "district" },
          { code: "210423", label: "清原满族自治县", identification: "district" }
        ]
      },
      {
        code: "210300",
        label: "鞍山市",
        identification: "city",
        children: [
          { code: "210323", label: "岫岩满族自治县", identification: "district" },
          { code: "210311", label: "千山区", identification: "district" },
          { code: "210302", label: "铁东区", identification: "district" },
          { code: "210304", label: "立山区", identification: "district" },
          { code: "210303", label: "铁西区", identification: "district" },
          { code: "210381", label: "海城市", identification: "district" },
          { code: "210321", label: "台安县", identification: "district" }
        ]
      },
      {
        code: "211100",
        label: "盘锦市",
        identification: "city",
        children: [
          { code: "211103", label: "兴隆台区", identification: "district" },
          { code: "211102", label: "双台子区", identification: "district" },
          { code: "211122", label: "盘山县", identification: "district" },
          { code: "211104", label: "大洼区", identification: "district" }
        ]
      },
      {
        code: "210800",
        label: "营口市",
        identification: "city",
        children: [
          { code: "210803", label: "西市区", identification: "district" },
          { code: "210882", label: "大石桥市", identification: "district" },
          { code: "210811", label: "老边区", identification: "district" },
          { code: "210802", label: "站前区", identification: "district" },
          { code: "210804", label: "鲅鱼圈区", identification: "district" },
          { code: "210881", label: "盖州市", identification: "district" }
        ]
      },
      {
        code: "211300",
        label: "朝阳市",
        identification: "city",
        children: [
          { code: "211324", label: "喀喇沁左翼蒙古族自治县", identification: "district" },
          { code: "211382", label: "凌源市", identification: "district" },
          { code: "211381", label: "北票市", identification: "district" },
          { code: "211303", label: "龙城区", identification: "district" },
          { code: "211302", label: "双塔区", identification: "district" },
          { code: "211321", label: "朝阳县", identification: "district" },
          { code: "211322", label: "建平县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "370000",
    label: "山东省",
    identification: "province",
    children: [
      {
        code: "370500",
        label: "东营市",
        identification: "city",
        children: [
          { code: "370522", label: "利津县", identification: "district" },
          { code: "370523", label: "广饶县", identification: "district" },
          { code: "370502", label: "东营区", identification: "district" },
          { code: "370503", label: "河口区", identification: "district" },
          { code: "370505", label: "垦利区", identification: "district" }
        ]
      },
      {
        code: "371600",
        label: "滨州市",
        identification: "city",
        children: [
          { code: "371602", label: "滨城区", identification: "district" },
          { code: "371625", label: "博兴县", identification: "district" },
          { code: "371603", label: "沾化区", identification: "district" },
          { code: "371623", label: "无棣县", identification: "district" },
          { code: "371621", label: "惠民县", identification: "district" },
          { code: "371622", label: "阳信县", identification: "district" },
          { code: "371681", label: "邹平市", identification: "district" }
        ]
      },
      {
        code: "371500",
        label: "聊城市",
        identification: "city",
        children: [
          { code: "371503", label: "茌平区", identification: "district" },
          { code: "371526", label: "高唐县", identification: "district" },
          { code: "371525", label: "冠县", identification: "district" },
          { code: "371522", label: "莘县", identification: "district" },
          { code: "371581", label: "临清市", identification: "district" },
          { code: "371502", label: "东昌府区", identification: "district" },
          { code: "371524", label: "东阿县", identification: "district" },
          { code: "371521", label: "阳谷县", identification: "district" }
        ]
      },
      {
        code: "370700",
        label: "潍坊市",
        identification: "city",
        children: [
          { code: "370783", label: "寿光市", identification: "district" },
          { code: "370702", label: "潍城区", identification: "district" },
          { code: "370782", label: "诸城市", identification: "district" },
          { code: "370786", label: "昌邑市", identification: "district" },
          { code: "370785", label: "高密市", identification: "district" },
          { code: "370703", label: "寒亭区", identification: "district" },
          { code: "370705", label: "奎文区", identification: "district" },
          { code: "370704", label: "坊子区", identification: "district" },
          { code: "370784", label: "安丘市", identification: "district" },
          { code: "370724", label: "临朐县", identification: "district" },
          { code: "370725", label: "昌乐县", identification: "district" },
          { code: "370781", label: "青州市", identification: "district" }
        ]
      },
      {
        code: "370600",
        label: "烟台市",
        identification: "city",
        children: [
          { code: "370683", label: "莱州市", identification: "district" },
          { code: "370602", label: "芝罘区", identification: "district" },
          { code: "370681", label: "龙口市", identification: "district" },
          { code: "370614", label: "蓬莱区", identification: "district" },
          { code: "370612", label: "牟平区", identification: "district" },
          { code: "370613", label: "莱山区", identification: "district" },
          { code: "370686", label: "栖霞市", identification: "district" },
          { code: "370685", label: "招远市", identification: "district" },
          { code: "370687", label: "海阳市", identification: "district" },
          { code: "370611", label: "福山区", identification: "district" },
          { code: "370682", label: "莱阳市", identification: "district" }
        ]
      },
      {
        code: "371000",
        label: "威海市",
        identification: "city",
        children: [
          { code: "371083", label: "乳山市", identification: "district" },
          { code: "371002", label: "环翠区", identification: "district" },
          { code: "371082", label: "荣成市", identification: "district" },
          { code: "371003", label: "文登区", identification: "district" }
        ]
      },
      {
        code: "370200",
        label: "青岛市",
        identification: "city",
        children: [
          { code: "370285", label: "莱西市", identification: "district" },
          { code: "370283", label: "平度市", identification: "district" },
          { code: "370215", label: "即墨区", identification: "district" },
          { code: "370212", label: "崂山区", identification: "district" },
          { code: "370211", label: "黄岛区", identification: "district" },
          { code: "370214", label: "城阳区", identification: "district" },
          { code: "370281", label: "胶州市", identification: "district" },
          { code: "370213", label: "李沧区", identification: "district" },
          { code: "370202", label: "市南区", identification: "district" },
          { code: "370203", label: "市北区", identification: "district" }
        ]
      },
      {
        code: "370800",
        label: "济宁市",
        identification: "city",
        children: [
          { code: "370827", label: "鱼台县", identification: "district" },
          { code: "370826", label: "微山县", identification: "district" },
          { code: "370832", label: "梁山县", identification: "district" },
          { code: "370881", label: "曲阜市", identification: "district" },
          { code: "370883", label: "邹城市", identification: "district" },
          { code: "370828", label: "金乡县", identification: "district" },
          { code: "370829", label: "嘉祥县", identification: "district" },
          { code: "370831", label: "泗水县", identification: "district" },
          { code: "370830", label: "汶上县", identification: "district" },
          { code: "370812", label: "兖州区", identification: "district" },
          { code: "370811", label: "任城区", identification: "district" }
        ]
      },
      {
        code: "370400",
        label: "枣庄市",
        identification: "city",
        children: [
          { code: "370405", label: "台儿庄区", identification: "district" },
          { code: "370402", label: "市中区", identification: "district" },
          { code: "370404", label: "峄城区", identification: "district" },
          { code: "370406", label: "山亭区", identification: "district" },
          { code: "370403", label: "薛城区", identification: "district" },
          { code: "370481", label: "滕州市", identification: "district" }
        ]
      },
      {
        code: "371400",
        label: "德州市",
        identification: "city",
        children: [
          { code: "371422", label: "宁津县", identification: "district" },
          { code: "371481", label: "乐陵市", identification: "district" },
          { code: "371428", label: "武城县", identification: "district" },
          { code: "371426", label: "平原县", identification: "district" },
          { code: "371427", label: "夏津县", identification: "district" },
          { code: "371482", label: "禹城市", identification: "district" },
          { code: "371424", label: "临邑县", identification: "district" },
          { code: "371425", label: "齐河县", identification: "district" },
          { code: "371423", label: "庆云县", identification: "district" },
          { code: "371403", label: "陵城区", identification: "district" },
          { code: "371402", label: "德城区", identification: "district" }
        ]
      },
      {
        code: "371300",
        label: "临沂市",
        identification: "city",
        children: [
          { code: "371321", label: "沂南县", identification: "district" },
          { code: "371312", label: "河东区", identification: "district" },
          { code: "371324", label: "兰陵县", identification: "district" },
          { code: "371322", label: "郯城县", identification: "district" },
          { code: "371328", label: "蒙阴县", identification: "district" },
          { code: "371323", label: "沂水县", identification: "district" },
          { code: "371327", label: "莒南县", identification: "district" },
          { code: "371326", label: "平邑县", identification: "district" },
          { code: "371311", label: "罗庄区", identification: "district" },
          { code: "371325", label: "费县", identification: "district" },
          { code: "371302", label: "兰山区", identification: "district" },
          { code: "371329", label: "临沭县", identification: "district" }
        ]
      },
      {
        code: "370900",
        label: "泰安市",
        identification: "city",
        children: [
          { code: "370902", label: "泰山区", identification: "district" },
          { code: "370982", label: "新泰市", identification: "district" },
          { code: "370983", label: "肥城市", identification: "district" },
          { code: "370921", label: "宁阳县", identification: "district" },
          { code: "370911", label: "岱岳区", identification: "district" },
          { code: "370923", label: "东平县", identification: "district" }
        ]
      },
      {
        code: "370100",
        label: "济南市",
        identification: "city",
        children: [
          { code: "370117", label: "钢城区", identification: "district" },
          { code: "370115", label: "济阳区", identification: "district" },
          { code: "370113", label: "长清区", identification: "district" },
          { code: "370126", label: "商河县", identification: "district" },
          { code: "370102", label: "历下区", identification: "district" },
          { code: "370114", label: "章丘区", identification: "district" },
          { code: "370116", label: "莱芜区", identification: "district" },
          { code: "370124", label: "平阴县", identification: "district" },
          { code: "370103", label: "市中区", identification: "district" },
          { code: "370104", label: "槐荫区", identification: "district" },
          { code: "370112", label: "历城区", identification: "district" },
          { code: "370105", label: "天桥区", identification: "district" }
        ]
      },
      {
        code: "371700",
        label: "菏泽市",
        identification: "city",
        children: [
          { code: "371724", label: "巨野县", identification: "district" },
          { code: "371723", label: "成武县", identification: "district" },
          { code: "371726", label: "鄄城县", identification: "district" },
          { code: "371722", label: "单县", identification: "district" },
          { code: "371725", label: "郓城县", identification: "district" },
          { code: "371721", label: "曹县", identification: "district" },
          { code: "371702", label: "牡丹区", identification: "district" },
          { code: "371703", label: "定陶区", identification: "district" },
          { code: "371728", label: "东明县", identification: "district" }
        ]
      },
      {
        code: "371100",
        label: "日照市",
        identification: "city",
        children: [
          { code: "371121", label: "五莲县", identification: "district" },
          { code: "371102", label: "东港区", identification: "district" },
          { code: "371122", label: "莒县", identification: "district" },
          { code: "371103", label: "岚山区", identification: "district" }
        ]
      },
      {
        code: "370300",
        label: "淄博市",
        identification: "city",
        children: [
          { code: "370304", label: "博山区", identification: "district" },
          { code: "370305", label: "临淄区", identification: "district" },
          { code: "370322", label: "高青县", identification: "district" },
          { code: "370321", label: "桓台县", identification: "district" },
          { code: "370323", label: "沂源县", identification: "district" },
          { code: "370306", label: "周村区", identification: "district" },
          { code: "370303", label: "张店区", identification: "district" },
          { code: "370302", label: "淄川区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "610000",
    label: "陕西省",
    identification: "province",
    children: [
      {
        code: "611000",
        label: "商洛市",
        identification: "city",
        children: [
          { code: "611022", label: "丹凤县", identification: "district" },
          { code: "611023", label: "商南县", identification: "district" },
          { code: "611021", label: "洛南县", identification: "district" },
          { code: "611002", label: "商州区", identification: "district" },
          { code: "611026", label: "柞水县", identification: "district" },
          { code: "611024", label: "山阳县", identification: "district" },
          { code: "611025", label: "镇安县", identification: "district" }
        ]
      },
      {
        code: "610700",
        label: "汉中市",
        identification: "city",
        children: [
          { code: "610723", label: "洋县", identification: "district" },
          { code: "610727", label: "略阳县", identification: "district" },
          { code: "610729", label: "留坝县", identification: "district" },
          { code: "610726", label: "宁强县", identification: "district" },
          { code: "610725", label: "勉县", identification: "district" },
          { code: "610703", label: "南郑区", identification: "district" },
          { code: "610702", label: "汉台区", identification: "district" },
          { code: "610728", label: "镇巴县", identification: "district" },
          { code: "610722", label: "城固县", identification: "district" },
          { code: "610724", label: "西乡县", identification: "district" },
          { code: "610730", label: "佛坪县", identification: "district" }
        ]
      },
      {
        code: "610600",
        label: "延安市",
        identification: "city",
        children: [
          { code: "610681", label: "子长市", identification: "district" },
          { code: "610626", label: "吴起县", identification: "district" },
          { code: "610603", label: "安塞区", identification: "district" },
          { code: "610625", label: "志丹县", identification: "district" },
          { code: "610622", label: "延川县", identification: "district" },
          { code: "610602", label: "宝塔区", identification: "district" },
          { code: "610621", label: "延长县", identification: "district" },
          { code: "610627", label: "甘泉县", identification: "district" },
          { code: "610630", label: "宜川县", identification: "district" },
          { code: "610628", label: "富县", identification: "district" },
          { code: "610629", label: "洛川县", identification: "district" },
          { code: "610632", label: "黄陵县", identification: "district" },
          { code: "610631", label: "黄龙县", identification: "district" }
        ]
      },
      {
        code: "610100",
        label: "西安市",
        identification: "city",
        children: [
          { code: "610115", label: "临潼区", identification: "district" },
          { code: "610111", label: "灞桥区", identification: "district" },
          { code: "610116", label: "长安区", identification: "district" },
          { code: "610118", label: "鄠邑区", identification: "district" },
          { code: "610122", label: "蓝田县", identification: "district" },
          { code: "610124", label: "周至县", identification: "district" },
          { code: "610114", label: "阎良区", identification: "district" },
          { code: "610113", label: "雁塔区", identification: "district" },
          { code: "610117", label: "高陵区", identification: "district" },
          { code: "610112", label: "未央区", identification: "district" },
          { code: "610103", label: "碑林区", identification: "district" },
          { code: "610102", label: "新城区", identification: "district" },
          { code: "610104", label: "莲湖区", identification: "district" }
        ]
      },
      {
        code: "610400",
        label: "咸阳市",
        identification: "city",
        children: [
          { code: "610424", label: "乾县", identification: "district" },
          { code: "610422", label: "三原县", identification: "district" },
          { code: "610430", label: "淳化县", identification: "district" },
          { code: "610403", label: "杨陵区", identification: "district" },
          { code: "610431", label: "武功县", identification: "district" },
          { code: "610429", label: "旬邑县", identification: "district" },
          { code: "610428", label: "长武县", identification: "district" },
          { code: "610426", label: "永寿县", identification: "district" },
          { code: "610482", label: "彬州市", identification: "district" },
          { code: "610404", label: "渭城区", identification: "district" },
          { code: "610425", label: "礼泉县", identification: "district" },
          { code: "610423", label: "泾阳县", identification: "district" },
          { code: "610481", label: "兴平市", identification: "district" },
          { code: "610402", label: "秦都区", identification: "district" }
        ]
      },
      {
        code: "610300",
        label: "宝鸡市",
        identification: "city",
        children: [
          { code: "610327", label: "陇县", identification: "district" },
          { code: "610328", label: "千阳县", identification: "district" },
          { code: "610303", label: "金台区", identification: "district" },
          { code: "610302", label: "渭滨区", identification: "district" },
          { code: "610330", label: "凤县", identification: "district" },
          { code: "610331", label: "太白县", identification: "district" },
          { code: "610304", label: "陈仓区", identification: "district" },
          { code: "610305", label: "凤翔区", identification: "district" },
          { code: "610323", label: "岐山县", identification: "district" },
          { code: "610329", label: "麟游县", identification: "district" },
          { code: "610324", label: "扶风县", identification: "district" },
          { code: "610326", label: "眉县", identification: "district" }
        ]
      },
      {
        code: "610200",
        label: "铜川市",
        identification: "city",
        children: [
          { code: "610222", label: "宜君县", identification: "district" },
          { code: "610203", label: "印台区", identification: "district" },
          { code: "610202", label: "王益区", identification: "district" },
          { code: "610204", label: "耀州区", identification: "district" }
        ]
      },
      {
        code: "610500",
        label: "渭南市",
        identification: "city",
        children: [
          { code: "610581", label: "韩城市", identification: "district" },
          { code: "610527", label: "白水县", identification: "district" },
          { code: "610522", label: "潼关县", identification: "district" },
          { code: "610525", label: "澄城县", identification: "district" },
          { code: "610526", label: "蒲城县", identification: "district" },
          { code: "610524", label: "合阳县", identification: "district" },
          { code: "610582", label: "华阴市", identification: "district" },
          { code: "610523", label: "大荔县", identification: "district" },
          { code: "610502", label: "临渭区", identification: "district" },
          { code: "610503", label: "华州区", identification: "district" },
          { code: "610528", label: "富平县", identification: "district" }
        ]
      },
      {
        code: "610900",
        label: "安康市",
        identification: "city",
        children: [
          { code: "610925", label: "岚皋县", identification: "district" },
          { code: "610927", label: "镇坪县", identification: "district" },
          { code: "610924", label: "紫阳县", identification: "district" },
          { code: "610929", label: "白河县", identification: "district" },
          { code: "610981", label: "旬阳市", identification: "district" },
          { code: "610926", label: "平利县", identification: "district" },
          { code: "610923", label: "宁陕县", identification: "district" },
          { code: "610902", label: "汉滨区", identification: "district" },
          { code: "610921", label: "汉阴县", identification: "district" },
          { code: "610922", label: "石泉县", identification: "district" }
        ]
      },
      {
        code: "610800",
        label: "榆林市",
        identification: "city",
        children: [
          { code: "610802", label: "榆阳区", identification: "district" },
          { code: "610826", label: "绥德县", identification: "district" },
          { code: "610881", label: "神木市", identification: "district" },
          { code: "610831", label: "子洲县", identification: "district" },
          { code: "610827", label: "米脂县", identification: "district" },
          { code: "610824", label: "靖边县", identification: "district" },
          { code: "610829", label: "吴堡县", identification: "district" },
          { code: "610830", label: "清涧县", identification: "district" },
          { code: "610825", label: "定边县", identification: "district" },
          { code: "610828", label: "佳县", identification: "district" },
          { code: "610803", label: "横山区", identification: "district" },
          { code: "610822", label: "府谷县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "310000",
    label: "上海市",
    identification: "province",
    children: [
      {
        code: "310100",
        label: "上海城区",
        identification: "city",
        children: [
          { code: "310151", label: "崇明区", identification: "district" },
          { code: "310115", label: "浦东新区", identification: "district" },
          { code: "310116", label: "金山区", identification: "district" },
          { code: "310101", label: "黄浦区", identification: "district" },
          { code: "310110", label: "杨浦区", identification: "district" },
          { code: "310109", label: "虹口区", identification: "district" },
          { code: "310104", label: "徐汇区", identification: "district" },
          { code: "310106", label: "静安区", identification: "district" },
          { code: "310114", label: "嘉定区", identification: "district" },
          { code: "310117", label: "松江区", identification: "district" },
          { code: "310105", label: "长宁区", identification: "district" },
          { code: "310120", label: "奉贤区", identification: "district" },
          { code: "310118", label: "青浦区", identification: "district" },
          { code: "310113", label: "宝山区", identification: "district" },
          { code: "310107", label: "普陀区", identification: "district" },
          { code: "310112", label: "闵行区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "520000",
    label: "贵州省",
    identification: "province",
    children: [
      {
        code: "520300",
        label: "遵义市",
        identification: "city",
        children: [
          { code: "520323", label: "绥阳县", identification: "district" },
          { code: "520329", label: "余庆县", identification: "district" },
          { code: "520325", label: "道真仡佬族苗族自治县", identification: "district" },
          { code: "520326", label: "务川仡佬族苗族自治县", identification: "district" },
          { code: "520324", label: "正安县", identification: "district" },
          { code: "520330", label: "习水县", identification: "district" },
          { code: "520302", label: "红花岗区", identification: "district" },
          { code: "520382", label: "仁怀市", identification: "district" },
          { code: "520381", label: "赤水市", identification: "district" },
          { code: "520327", label: "凤冈县", identification: "district" },
          { code: "520328", label: "湄潭县", identification: "district" },
          { code: "520304", label: "播州区", identification: "district" },
          { code: "520322", label: "桐梓县", identification: "district" },
          { code: "520303", label: "汇川区", identification: "district" }
        ]
      },
      {
        code: "520600",
        label: "铜仁市",
        identification: "city",
        children: [
          { code: "520623", label: "石阡县", identification: "district" },
          { code: "520626", label: "德江县", identification: "district" },
          { code: "520624", label: "思南县", identification: "district" },
          { code: "520621", label: "江口县", identification: "district" },
          { code: "520628", label: "松桃苗族自治县", identification: "district" },
          { code: "520625", label: "印江土家族苗族自治县", identification: "district" },
          { code: "520602", label: "碧江区", identification: "district" },
          { code: "520603", label: "万山区", identification: "district" },
          { code: "520627", label: "沿河土家族自治县", identification: "district" },
          { code: "520622", label: "玉屏侗族自治县", identification: "district" }
        ]
      },
      {
        code: "520200",
        label: "六盘水市",
        identification: "city",
        children: [
          { code: "520201", label: "钟山区", identification: "district" },
          { code: "520204", label: "水城区", identification: "district" },
          { code: "520281", label: "盘州市", identification: "district" },
          { code: "520203", label: "六枝特区", identification: "district" }
        ]
      },
      {
        code: "522700",
        label: "黔南布依族苗族自治州",
        identification: "city",
        children: [
          { code: "522727", label: "平塘县", identification: "district" },
          { code: "522722", label: "荔波县", identification: "district" },
          { code: "522728", label: "罗甸县", identification: "district" },
          { code: "522702", label: "福泉市", identification: "district" },
          { code: "522725", label: "瓮安县", identification: "district" },
          { code: "522732", label: "三都水族自治县", identification: "district" },
          { code: "522701", label: "都匀市", identification: "district" },
          { code: "522729", label: "长顺县", identification: "district" },
          { code: "522726", label: "独山县", identification: "district" },
          { code: "522723", label: "贵定县", identification: "district" },
          { code: "522731", label: "惠水县", identification: "district" },
          { code: "522730", label: "龙里县", identification: "district" }
        ]
      },
      {
        code: "520400",
        label: "安顺市",
        identification: "city",
        children: [
          { code: "520402", label: "西秀区", identification: "district" },
          { code: "520425", label: "紫云苗族布依族自治县", identification: "district" },
          { code: "520422", label: "普定县", identification: "district" },
          { code: "520423", label: "镇宁布依族苗族自治县", identification: "district" },
          { code: "520403", label: "平坝区", identification: "district" },
          { code: "520424", label: "关岭布依族苗族自治县", identification: "district" }
        ]
      },
      {
        code: "522300",
        label: "黔西南布依族苗族自治州",
        identification: "city",
        children: [
          { code: "522302", label: "兴仁市", identification: "district" },
          { code: "522327", label: "册亨县", identification: "district" },
          { code: "522328", label: "安龙县", identification: "district" },
          { code: "522325", label: "贞丰县", identification: "district" },
          { code: "522326", label: "望谟县", identification: "district" },
          { code: "522301", label: "兴义市", identification: "district" },
          { code: "522323", label: "普安县", identification: "district" },
          { code: "522324", label: "晴隆县", identification: "district" }
        ]
      },
      {
        code: "522600",
        label: "黔东南苗族侗族自治州",
        identification: "city",
        children: [
          { code: "522634", label: "雷山县", identification: "district" },
          { code: "522632", label: "榕江县", identification: "district" },
          { code: "522623", label: "施秉县", identification: "district" },
          { code: "522625", label: "镇远县", identification: "district" },
          { code: "522627", label: "天柱县", identification: "district" },
          { code: "522601", label: "凯里市", identification: "district" },
          { code: "522636", label: "丹寨县", identification: "district" },
          { code: "522631", label: "黎平县", identification: "district" },
          { code: "522633", label: "从江县", identification: "district" },
          { code: "522628", label: "锦屏县", identification: "district" },
          { code: "522622", label: "黄平县", identification: "district" },
          { code: "522630", label: "台江县", identification: "district" },
          { code: "522635", label: "麻江县", identification: "district" },
          { code: "522629", label: "剑河县", identification: "district" },
          { code: "522624", label: "三穗县", identification: "district" },
          { code: "522626", label: "岑巩县", identification: "district" }
        ]
      },
      {
        code: "520500",
        label: "毕节市",
        identification: "city",
        children: [
          { code: "520523", label: "金沙县", identification: "district" },
          { code: "520581", label: "黔西市", identification: "district" },
          { code: "520524", label: "织金县", identification: "district" },
          { code: "520521", label: "大方县", identification: "district" },
          { code: "520525", label: "纳雍县", identification: "district" },
          { code: "520502", label: "七星关区", identification: "district" },
          { code: "520527", label: "赫章县", identification: "district" },
          { code: "520526", label: "威宁彝族回族苗族自治县", identification: "district" }
        ]
      },
      {
        code: "520100",
        label: "贵阳市",
        identification: "city",
        children: [
          { code: "520121", label: "开阳县", identification: "district" },
          { code: "520113", label: "白云区", identification: "district" },
          { code: "520123", label: "修文县", identification: "district" },
          { code: "520181", label: "清镇市", identification: "district" },
          { code: "520102", label: "南明区", identification: "district" },
          { code: "520103", label: "云岩区", identification: "district" },
          { code: "520115", label: "观山湖区", identification: "district" },
          { code: "520111", label: "花溪区", identification: "district" },
          { code: "520122", label: "息烽县", identification: "district" },
          { code: "520112", label: "乌当区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "500000",
    label: "重庆市",
    identification: "province",
    children: [
      {
        code: "500200",
        label: "重庆郊县",
        identification: "city",
        children: [
          { code: "500236", label: "奉节县", identification: "district" },
          { code: "500238", label: "巫溪县", identification: "district" },
          { code: "500243", label: "彭水苗族土家族自治县", identification: "district" },
          { code: "500241", label: "秀山土家族苗族自治县", identification: "district" },
          { code: "500235", label: "云阳县", identification: "district" },
          { code: "500240", label: "石柱土家族自治县", identification: "district" },
          { code: "500237", label: "巫山县", identification: "district" },
          { code: "500230", label: "丰都县", identification: "district" },
          { code: "500229", label: "城口县", identification: "district" },
          { code: "500242", label: "酉阳土家族苗族自治县", identification: "district" },
          { code: "500233", label: "忠县", identification: "district" },
          { code: "500231", label: "垫江县", identification: "district" }
        ]
      },
      {
        code: "500100",
        label: "重庆城区",
        identification: "city",
        children: [
          { code: "500117", label: "合川区", identification: "district" },
          { code: "500152", label: "潼南区", identification: "district" },
          { code: "500115", label: "长寿区", identification: "district" },
          { code: "500104", label: "大渡口区", identification: "district" },
          { code: "500151", label: "铜梁区", identification: "district" },
          { code: "500111", label: "大足区", identification: "district" },
          { code: "500107", label: "九龙坡区", identification: "district" },
          { code: "500114", label: "黔江区", identification: "district" },
          { code: "500108", label: "南岸区", identification: "district" },
          { code: "500156", label: "武隆区", identification: "district" },
          { code: "500110", label: "綦江区", identification: "district" },
          { code: "500102", label: "涪陵区", identification: "district" },
          { code: "500109", label: "北碚区", identification: "district" },
          { code: "500119", label: "南川区", identification: "district" },
          { code: "500101", label: "万州区", identification: "district" },
          { code: "500118", label: "永川区", identification: "district" },
          { code: "500153", label: "荣昌区", identification: "district" },
          { code: "500112", label: "渝北区", identification: "district" },
          { code: "500105", label: "江北区", identification: "district" },
          { code: "500154", label: "开州区", identification: "district" },
          { code: "500116", label: "江津区", identification: "district" },
          { code: "500113", label: "巴南区", identification: "district" },
          { code: "500106", label: "沙坪坝区", identification: "district" },
          { code: "500120", label: "璧山区", identification: "district" },
          { code: "500103", label: "渝中区", identification: "district" },
          { code: "500155", label: "梁平区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "340000",
    label: "安徽省",
    identification: "province",
    children: [
      {
        code: "340700",
        label: "铜陵市",
        identification: "city",
        children: [
          { code: "340711", label: "郊区", identification: "district" },
          { code: "340705", label: "铜官区", identification: "district" },
          { code: "340722", label: "枞阳县", identification: "district" },
          { code: "340706", label: "义安区", identification: "district" }
        ]
      },
      {
        code: "341700",
        label: "池州市",
        identification: "city",
        children: [
          { code: "341702", label: "贵池区", identification: "district" },
          { code: "341723", label: "青阳县", identification: "district" },
          { code: "341721", label: "东至县", identification: "district" },
          { code: "341722", label: "石台县", identification: "district" }
        ]
      },
      {
        code: "340800",
        label: "安庆市",
        identification: "city",
        children: [
          { code: "340881", label: "桐城市", identification: "district" },
          { code: "340802", label: "迎江区", identification: "district" },
          { code: "340828", label: "岳西县", identification: "district" },
          { code: "340811", label: "宜秀区", identification: "district" },
          { code: "340803", label: "大观区", identification: "district" },
          { code: "340825", label: "太湖县", identification: "district" },
          { code: "340827", label: "望江县", identification: "district" },
          { code: "340826", label: "宿松县", identification: "district" },
          { code: "340822", label: "怀宁县", identification: "district" },
          { code: "340882", label: "潜山市", identification: "district" }
        ]
      },
      {
        code: "340600",
        label: "淮北市",
        identification: "city",
        children: [
          { code: "340602", label: "杜集区", identification: "district" },
          { code: "340603", label: "相山区", identification: "district" },
          { code: "340604", label: "烈山区", identification: "district" },
          { code: "340621", label: "濉溪县", identification: "district" }
        ]
      },
      {
        code: "340500",
        label: "马鞍山市",
        identification: "city",
        children: [
          { code: "340506", label: "博望区", identification: "district" },
          { code: "340523", label: "和县", identification: "district" },
          { code: "340522", label: "含山县", identification: "district" },
          { code: "340503", label: "花山区", identification: "district" },
          { code: "340504", label: "雨山区", identification: "district" },
          { code: "340521", label: "当涂县", identification: "district" }
        ]
      },
      {
        code: "341600",
        label: "亳州市",
        identification: "city",
        children: [
          { code: "341622", label: "蒙城县", identification: "district" },
          { code: "341602", label: "谯城区", identification: "district" },
          { code: "341623", label: "利辛县", identification: "district" },
          { code: "341621", label: "涡阳县", identification: "district" }
        ]
      },
      {
        code: "341000",
        label: "黄山市",
        identification: "city",
        children: [
          { code: "341023", label: "黟县", identification: "district" },
          { code: "341003", label: "黄山区", identification: "district" },
          { code: "341002", label: "屯溪区", identification: "district" },
          { code: "341022", label: "休宁县", identification: "district" },
          { code: "341024", label: "祁门县", identification: "district" },
          { code: "341004", label: "徽州区", identification: "district" },
          { code: "341021", label: "歙县", identification: "district" }
        ]
      },
      {
        code: "340300",
        label: "蚌埠市",
        identification: "city",
        children: [
          { code: "340311", label: "淮上区", identification: "district" },
          { code: "340322", label: "五河县", identification: "district" },
          { code: "340304", label: "禹会区", identification: "district" },
          { code: "340302", label: "龙子湖区", identification: "district" },
          { code: "340303", label: "蚌山区", identification: "district" },
          { code: "340321", label: "怀远县", identification: "district" },
          { code: "340323", label: "固镇县", identification: "district" }
        ]
      },
      {
        code: "341100",
        label: "滁州市",
        identification: "city",
        children: [
          { code: "341181", label: "天长市", identification: "district" },
          { code: "341126", label: "凤阳县", identification: "district" },
          { code: "341125", label: "定远县", identification: "district" },
          { code: "341124", label: "全椒县", identification: "district" },
          { code: "341182", label: "明光市", identification: "district" },
          { code: "341103", label: "南谯区", identification: "district" },
          { code: "341102", label: "琅琊区", identification: "district" },
          { code: "341122", label: "来安县", identification: "district" }
        ]
      },
      {
        code: "341200",
        label: "阜阳市",
        identification: "city",
        children: [
          { code: "341202", label: "颍州区", identification: "district" },
          { code: "341221", label: "临泉县", identification: "district" },
          { code: "341204", label: "颍泉区", identification: "district" },
          { code: "341226", label: "颍上县", identification: "district" },
          { code: "341203", label: "颍东区", identification: "district" },
          { code: "341225", label: "阜南县", identification: "district" },
          { code: "341222", label: "太和县", identification: "district" },
          { code: "341282", label: "界首市", identification: "district" }
        ]
      },
      {
        code: "340400",
        label: "淮南市",
        identification: "city",
        children: [
          { code: "340406", label: "潘集区", identification: "district" },
          { code: "340405", label: "八公山区", identification: "district" },
          { code: "340404", label: "谢家集区", identification: "district" },
          { code: "340421", label: "凤台县", identification: "district" },
          { code: "340402", label: "大通区", identification: "district" },
          { code: "340403", label: "田家庵区", identification: "district" },
          { code: "340422", label: "寿县", identification: "district" }
        ]
      },
      {
        code: "341300",
        label: "宿州市",
        identification: "city",
        children: [
          { code: "341324", label: "泗县", identification: "district" },
          { code: "341323", label: "灵璧县", identification: "district" },
          { code: "341302", label: "埇桥区", identification: "district" },
          { code: "341322", label: "萧县", identification: "district" },
          { code: "341321", label: "砀山县", identification: "district" }
        ]
      },
      {
        code: "341500",
        label: "六安市",
        identification: "city",
        children: [
          { code: "341503", label: "裕安区", identification: "district" },
          { code: "341522", label: "霍邱县", identification: "district" },
          { code: "341504", label: "叶集区", identification: "district" },
          { code: "341525", label: "霍山县", identification: "district" },
          { code: "341524", label: "金寨县", identification: "district" },
          { code: "341523", label: "舒城县", identification: "district" },
          { code: "341502", label: "金安区", identification: "district" }
        ]
      },
      {
        code: "341800",
        label: "宣城市",
        identification: "city",
        children: [
          { code: "341825", label: "旌德县", identification: "district" },
          { code: "341802", label: "宣州区", identification: "district" },
          { code: "341881", label: "宁国市", identification: "district" },
          { code: "341824", label: "绩溪县", identification: "district" },
          { code: "341821", label: "郎溪县", identification: "district" },
          { code: "341823", label: "泾县", identification: "district" },
          { code: "341882", label: "广德市", identification: "district" }
        ]
      },
      {
        code: "340200",
        label: "芜湖市",
        identification: "city",
        children: [
          { code: "340202", label: "镜湖区", identification: "district" },
          { code: "340209", label: "弋江区", identification: "district" },
          { code: "340212", label: "繁昌区", identification: "district" },
          { code: "340207", label: "鸠江区", identification: "district" },
          { code: "340210", label: "湾沚区", identification: "district" },
          { code: "340223", label: "南陵县", identification: "district" },
          { code: "340281", label: "无为市", identification: "district" }
        ]
      },
      {
        code: "340100",
        label: "合肥市",
        identification: "city",
        children: [
          { code: "340111", label: "包河区", identification: "district" },
          { code: "340103", label: "庐阳区", identification: "district" },
          { code: "340181", label: "巢湖市", identification: "district" },
          { code: "340102", label: "瑶海区", identification: "district" },
          { code: "340122", label: "肥东县", identification: "district" },
          { code: "340104", label: "蜀山区", identification: "district" },
          { code: "340123", label: "肥西县", identification: "district" },
          { code: "340121", label: "长丰县", identification: "district" },
          { code: "340124", label: "庐江县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "350000",
    label: "福建省",
    identification: "province",
    children: [
      {
        code: "350900",
        label: "宁德市",
        identification: "city",
        children: [
          { code: "350982", label: "福鼎市", identification: "district" },
          { code: "350921", label: "霞浦县", identification: "district" },
          { code: "350902", label: "蕉城区", identification: "district" },
          { code: "350922", label: "古田县", identification: "district" },
          { code: "350981", label: "福安市", identification: "district" },
          { code: "350926", label: "柘荣县", identification: "district" },
          { code: "350923", label: "屏南县", identification: "district" },
          { code: "350925", label: "周宁县", identification: "district" },
          { code: "350924", label: "寿宁县", identification: "district" }
        ]
      },
      {
        code: "350100",
        label: "福州市",
        identification: "city",
        children: [
          { code: "350124", label: "闽清县", identification: "district" },
          { code: "350123", label: "罗源县", identification: "district" },
          { code: "350122", label: "连江县", identification: "district" },
          { code: "350181", label: "福清市", identification: "district" },
          { code: "350112", label: "长乐区", identification: "district" },
          { code: "350128", label: "平潭县", identification: "district" },
          { code: "350103", label: "台江区", identification: "district" },
          { code: "350125", label: "永泰县", identification: "district" },
          { code: "350111", label: "晋安区", identification: "district" },
          { code: "350102", label: "鼓楼区", identification: "district" },
          { code: "350121", label: "闽侯县", identification: "district" },
          { code: "350104", label: "仓山区", identification: "district" },
          { code: "350105", label: "马尾区", identification: "district" }
        ]
      },
      {
        code: "350300",
        label: "莆田市",
        identification: "city",
        children: [
          { code: "350305", label: "秀屿区", identification: "district" },
          { code: "350304", label: "荔城区", identification: "district" },
          { code: "350322", label: "仙游县", identification: "district" },
          { code: "350303", label: "涵江区", identification: "district" },
          { code: "350302", label: "城厢区", identification: "district" }
        ]
      },
      {
        code: "350500",
        label: "泉州市",
        identification: "city",
        children: [
          { code: "350521", label: "惠安县", identification: "district" },
          { code: "350527", label: "金门县", identification: "district" },
          { code: "350583", label: "南安市", identification: "district" },
          { code: "350504", label: "洛江区", identification: "district" },
          { code: "350582", label: "晋江市", identification: "district" },
          { code: "350581", label: "石狮市", identification: "district" },
          { code: "350505", label: "泉港区", identification: "district" },
          { code: "350525", label: "永春县", identification: "district" },
          { code: "350524", label: "安溪县", identification: "district" },
          { code: "350502", label: "鲤城区", identification: "district" },
          { code: "350526", label: "德化县", identification: "district" },
          { code: "350503", label: "丰泽区", identification: "district" }
        ]
      },
      {
        code: "350200",
        label: "厦门市",
        identification: "city",
        children: [
          { code: "350206", label: "湖里区", identification: "district" },
          { code: "350203", label: "思明区", identification: "district" },
          { code: "350213", label: "翔安区", identification: "district" },
          { code: "350205", label: "海沧区", identification: "district" },
          { code: "350211", label: "集美区", identification: "district" },
          { code: "350212", label: "同安区", identification: "district" }
        ]
      },
      {
        code: "350600",
        label: "漳州市",
        identification: "city",
        children: [
          { code: "350604", label: "龙海区", identification: "district" },
          { code: "350623", label: "漳浦县", identification: "district" },
          { code: "350626", label: "东山县", identification: "district" },
          { code: "350627", label: "南靖县", identification: "district" },
          { code: "350628", label: "平和县", identification: "district" },
          { code: "350629", label: "华安县", identification: "district" },
          { code: "350605", label: "长泰区", identification: "district" },
          { code: "350603", label: "龙文区", identification: "district" },
          { code: "350602", label: "芗城区", identification: "district" },
          { code: "350624", label: "诏安县", identification: "district" },
          { code: "350622", label: "云霄县", identification: "district" }
        ]
      },
      {
        code: "350800",
        label: "龙岩市",
        identification: "city",
        children: [
          { code: "350824", label: "武平县", identification: "district" },
          { code: "350821", label: "长汀县", identification: "district" },
          { code: "350802", label: "新罗区", identification: "district" },
          { code: "350881", label: "漳平市", identification: "district" },
          { code: "350803", label: "永定区", identification: "district" },
          { code: "350823", label: "上杭县", identification: "district" },
          { code: "350825", label: "连城县", identification: "district" }
        ]
      },
      {
        code: "350700",
        label: "南平市",
        identification: "city",
        children: [
          { code: "350722", label: "浦城县", identification: "district" },
          { code: "350723", label: "光泽县", identification: "district" },
          { code: "350724", label: "松溪县", identification: "district" },
          { code: "350703", label: "建阳区", identification: "district" },
          { code: "350725", label: "政和县", identification: "district" },
          { code: "350783", label: "建瓯市", identification: "district" },
          { code: "350721", label: "顺昌县", identification: "district" },
          { code: "350702", label: "延平区", identification: "district" },
          { code: "350782", label: "武夷山市", identification: "district" },
          { code: "350781", label: "邵武市", identification: "district" }
        ]
      },
      {
        code: "350400",
        label: "三明市",
        identification: "city",
        children: [
          { code: "350405", label: "沙县区", identification: "district" },
          { code: "350430", label: "建宁县", identification: "district" },
          { code: "350421", label: "明溪县", identification: "district" },
          { code: "350428", label: "将乐县", identification: "district" },
          { code: "350424", label: "宁化县", identification: "district" },
          { code: "350404", label: "三元区", identification: "district" },
          { code: "350423", label: "清流县", identification: "district" },
          { code: "350481", label: "永安市", identification: "district" },
          { code: "350426", label: "尤溪县", identification: "district" },
          { code: "350429", label: "泰宁县", identification: "district" },
          { code: "350425", label: "大田县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "430000",
    label: "湖南省",
    identification: "province",
    children: [
      {
        code: "430600",
        label: "岳阳市",
        identification: "city",
        children: [
          { code: "430623", label: "华容县", identification: "district" },
          { code: "430681", label: "汨罗市", identification: "district" },
          { code: "430603", label: "云溪区", identification: "district" },
          { code: "430624", label: "湘阴县", identification: "district" },
          { code: "430602", label: "岳阳楼区", identification: "district" },
          { code: "430626", label: "平江县", identification: "district" },
          { code: "430611", label: "君山区", identification: "district" },
          { code: "430621", label: "岳阳县", identification: "district" },
          { code: "430682", label: "临湘市", identification: "district" }
        ]
      },
      {
        code: "431200",
        label: "怀化市",
        identification: "city",
        children: [
          { code: "431228", label: "芷江侗族自治县", identification: "district" },
          { code: "431230", label: "通道侗族自治县", identification: "district" },
          { code: "431224", label: "溆浦县", identification: "district" },
          { code: "431222", label: "沅陵县", identification: "district" },
          { code: "431223", label: "辰溪县", identification: "district" },
          { code: "431225", label: "会同县", identification: "district" },
          { code: "431229", label: "靖州苗族侗族自治县", identification: "district" },
          { code: "431227", label: "新晃侗族自治县", identification: "district" },
          { code: "431226", label: "麻阳苗族自治县", identification: "district" },
          { code: "431202", label: "鹤城区", identification: "district" },
          { code: "431221", label: "中方县", identification: "district" },
          { code: "431281", label: "洪江市", identification: "district" }
        ]
      },
      {
        code: "433100",
        label: "湘西土家族苗族自治州",
        identification: "city",
        children: [
          { code: "433125", label: "保靖县", identification: "district" },
          { code: "433127", label: "永顺县", identification: "district" },
          { code: "433124", label: "花垣县", identification: "district" },
          { code: "433101", label: "吉首市", identification: "district" },
          { code: "433126", label: "古丈县", identification: "district" },
          { code: "433122", label: "泸溪县", identification: "district" },
          { code: "433123", label: "凤凰县", identification: "district" },
          { code: "433130", label: "龙山县", identification: "district" }
        ]
      },
      {
        code: "430900",
        label: "益阳市",
        identification: "city",
        children: [
          { code: "430902", label: "资阳区", identification: "district" },
          { code: "430922", label: "桃江县", identification: "district" },
          { code: "430923", label: "安化县", identification: "district" },
          { code: "430921", label: "南县", identification: "district" },
          { code: "430981", label: "沅江市", identification: "district" },
          { code: "430903", label: "赫山区", identification: "district" }
        ]
      },
      {
        code: "430400",
        label: "衡阳市",
        identification: "city",
        children: [
          { code: "430423", label: "衡山县", identification: "district" },
          { code: "430421", label: "衡阳县", identification: "district" },
          { code: "430412", label: "南岳区", identification: "district" },
          { code: "430405", label: "珠晖区", identification: "district" },
          { code: "430406", label: "雁峰区", identification: "district" },
          { code: "430407", label: "石鼓区", identification: "district" },
          { code: "430408", label: "蒸湘区", identification: "district" },
          { code: "430482", label: "常宁市", identification: "district" },
          { code: "430424", label: "衡东县", identification: "district" },
          { code: "430426", label: "祁东县", identification: "district" },
          { code: "430481", label: "耒阳市", identification: "district" },
          { code: "430422", label: "衡南县", identification: "district" }
        ]
      },
      {
        code: "430300",
        label: "湘潭市",
        identification: "city",
        children: [
          { code: "430304", label: "岳塘区", identification: "district" },
          { code: "430302", label: "雨湖区", identification: "district" },
          { code: "430382", label: "韶山市", identification: "district" },
          { code: "430321", label: "湘潭县", identification: "district" },
          { code: "430381", label: "湘乡市", identification: "district" }
        ]
      },
      {
        code: "431100",
        label: "永州市",
        identification: "city",
        children: [
          { code: "431122", label: "东安县", identification: "district" },
          { code: "431103", label: "冷水滩区", identification: "district" },
          { code: "431102", label: "零陵区", identification: "district" },
          { code: "431128", label: "新田县", identification: "district" },
          { code: "431126", label: "宁远县", identification: "district" },
          { code: "431123", label: "双牌县", identification: "district" },
          { code: "431125", label: "江永县", identification: "district" },
          { code: "431124", label: "道县", identification: "district" },
          { code: "431129", label: "江华瑶族自治县", identification: "district" },
          { code: "431181", label: "祁阳市", identification: "district" },
          { code: "431127", label: "蓝山县", identification: "district" }
        ]
      },
      {
        code: "430500",
        label: "邵阳市",
        identification: "city",
        children: [
          { code: "430524", label: "隆回县", identification: "district" },
          { code: "430502", label: "双清区", identification: "district" },
          { code: "430511", label: "北塔区", identification: "district" },
          { code: "430523", label: "邵阳县", identification: "district" },
          { code: "430503", label: "大祥区", identification: "district" },
          { code: "430527", label: "绥宁县", identification: "district" },
          { code: "430582", label: "邵东市", identification: "district" },
          { code: "430528", label: "新宁县", identification: "district" },
          { code: "430581", label: "武冈市", identification: "district" },
          { code: "430525", label: "洞口县", identification: "district" },
          { code: "430529", label: "城步苗族自治县", identification: "district" },
          { code: "430522", label: "新邵县", identification: "district" }
        ]
      },
      {
        code: "430100",
        label: "长沙市",
        identification: "city",
        children: [
          { code: "430104", label: "岳麓区", identification: "district" },
          { code: "430112", label: "望城区", identification: "district" },
          { code: "430121", label: "长沙县", identification: "district" },
          { code: "430182", label: "宁乡市", identification: "district" },
          { code: "430105", label: "开福区", identification: "district" },
          { code: "430102", label: "芙蓉区", identification: "district" },
          { code: "430181", label: "浏阳市", identification: "district" },
          { code: "430111", label: "雨花区", identification: "district" },
          { code: "430103", label: "天心区", identification: "district" }
        ]
      },
      {
        code: "431300",
        label: "娄底市",
        identification: "city",
        children: [
          { code: "431321", label: "双峰县", identification: "district" },
          { code: "431382", label: "涟源市", identification: "district" },
          { code: "431322", label: "新化县", identification: "district" },
          { code: "431381", label: "冷水江市", identification: "district" },
          { code: "431302", label: "娄星区", identification: "district" }
        ]
      },
      {
        code: "431000",
        label: "郴州市",
        identification: "city",
        children: [
          { code: "431026", label: "汝城县", identification: "district" },
          { code: "431027", label: "桂东县", identification: "district" },
          { code: "431081", label: "资兴市", identification: "district" },
          { code: "431022", label: "宜章县", identification: "district" },
          { code: "431025", label: "临武县", identification: "district" },
          { code: "431003", label: "苏仙区", identification: "district" },
          { code: "431023", label: "永兴县", identification: "district" },
          { code: "431024", label: "嘉禾县", identification: "district" },
          { code: "431028", label: "安仁县", identification: "district" },
          { code: "431021", label: "桂阳县", identification: "district" },
          { code: "431002", label: "北湖区", identification: "district" }
        ]
      },
      {
        code: "430200",
        label: "株洲市",
        identification: "city",
        children: [
          { code: "430202", label: "荷塘区", identification: "district" },
          { code: "430223", label: "攸县", identification: "district" },
          { code: "430225", label: "炎陵县", identification: "district" },
          { code: "430211", label: "天元区", identification: "district" },
          { code: "430212", label: "渌口区", identification: "district" },
          { code: "430203", label: "芦淞区", identification: "district" },
          { code: "430204", label: "石峰区", identification: "district" },
          { code: "430224", label: "茶陵县", identification: "district" },
          { code: "430281", label: "醴陵市", identification: "district" }
        ]
      },
      {
        code: "430800",
        label: "张家界市",
        identification: "city",
        children: [
          { code: "430802", label: "永定区", identification: "district" },
          { code: "430811", label: "武陵源区", identification: "district" },
          { code: "430822", label: "桑植县", identification: "district" },
          { code: "430821", label: "慈利县", identification: "district" }
        ]
      },
      {
        code: "430700",
        label: "常德市",
        identification: "city",
        children: [
          { code: "430723", label: "澧县", identification: "district" },
          { code: "430722", label: "汉寿县", identification: "district" },
          { code: "430703", label: "鼎城区", identification: "district" },
          { code: "430781", label: "津市市", identification: "district" },
          { code: "430721", label: "安乡县", identification: "district" },
          { code: "430724", label: "临澧县", identification: "district" },
          { code: "430702", label: "武陵区", identification: "district" },
          { code: "430725", label: "桃源县", identification: "district" },
          { code: "430726", label: "石门县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "460000",
    label: "海南省",
    identification: "province",
    children: [
      {
        code: "469024",
        label: "临高县",
        identification: "city",
        children: [
          { code: "469024", label: "博厚镇", identification: "district" },
          { code: "469024", label: "南宝镇", identification: "district" },
          { code: "469024", label: "和舍镇", identification: "district" },
          { code: "469024", label: "调楼镇", identification: "district" },
          { code: "469024", label: "东英镇", identification: "district" },
          { code: "469024", label: "加来镇", identification: "district" },
          { code: "469024", label: "临城镇", identification: "district" },
          { code: "469024", label: "多文镇", identification: "district" },
          { code: "469024", label: "新盈镇", identification: "district" },
          { code: "469024", label: "波莲镇", identification: "district" },
          { code: "469024", label: "皇桐镇", identification: "district" }
        ]
      },
      {
        code: "469007",
        label: "东方市",
        identification: "city",
        children: [
          { code: "469007", label: "八所镇", identification: "district" },
          { code: "469007", label: "三家镇", identification: "district" },
          { code: "469007", label: "四更镇", identification: "district" },
          { code: "469007", label: "大田镇", identification: "district" },
          { code: "469007", label: "感城镇", identification: "district" },
          { code: "469007", label: "新龙镇", identification: "district" },
          { code: "469007", label: "天安乡", identification: "district" },
          { code: "469007", label: "板桥镇", identification: "district" },
          { code: "469007", label: "东河镇", identification: "district" },
          { code: "469007", label: "江边乡", identification: "district" }
        ]
      },
      {
        code: "469027",
        label: "乐东黎族自治县",
        identification: "city",
        children: [
          { code: "469027", label: "莺歌海镇", identification: "district" },
          { code: "469027", label: "黄流镇", identification: "district" },
          { code: "469027", label: "佛罗镇", identification: "district" },
          { code: "469027", label: "大安镇", identification: "district" },
          { code: "469027", label: "抱由镇", identification: "district" },
          { code: "469027", label: "千家镇", identification: "district" },
          { code: "469027", label: "尖峰镇", identification: "district" },
          { code: "469027", label: "志仲镇", identification: "district" },
          { code: "469027", label: "万冲镇", identification: "district" },
          { code: "469027", label: "利国镇", identification: "district" },
          { code: "469027", label: "九所镇", identification: "district" }
        ]
      },
      {
        code: "469025",
        label: "白沙黎族自治县",
        identification: "city",
        children: [
          { code: "469025", label: "南开乡", identification: "district" },
          { code: "469025", label: "阜龙乡", identification: "district" },
          { code: "469025", label: "细水乡", identification: "district" },
          { code: "469025", label: "打安镇", identification: "district" },
          { code: "469025", label: "青松乡", identification: "district" },
          { code: "469025", label: "元门乡", identification: "district" },
          { code: "469025", label: "金波乡", identification: "district" },
          { code: "469025", label: "牙叉镇", identification: "district" },
          { code: "469025", label: "七坊镇", identification: "district" },
          { code: "469025", label: "邦溪镇", identification: "district" },
          { code: "469025", label: "荣邦乡", identification: "district" }
        ]
      },
      {
        code: "469030",
        label: "琼中黎族苗族自治县",
        identification: "city",
        children: [
          { code: "469030", label: "什运乡", identification: "district" },
          { code: "469030", label: "湾岭镇", identification: "district" },
          { code: "469030", label: "上安乡", identification: "district" },
          { code: "469030", label: "和平镇", identification: "district" },
          { code: "469030", label: "黎母山镇", identification: "district" },
          { code: "469030", label: "红毛镇", identification: "district" },
          { code: "469030", label: "吊罗山乡", identification: "district" },
          { code: "469030", label: "长征镇", identification: "district" },
          { code: "469030", label: "中平镇", identification: "district" },
          { code: "469030", label: "营根镇", identification: "district" }
        ]
      },
      {
        code: "469022",
        label: "屯昌县",
        identification: "city",
        children: [
          { code: "469022", label: "枫木镇", identification: "district" },
          { code: "469022", label: "乌坡镇", identification: "district" },
          { code: "469022", label: "南吕镇", identification: "district" },
          { code: "469022", label: "新兴镇", identification: "district" },
          { code: "469022", label: "西昌镇", identification: "district" },
          { code: "469022", label: "坡心镇", identification: "district" },
          { code: "469022", label: "南坤镇", identification: "district" },
          { code: "469022", label: "屯城镇", identification: "district" }
        ]
      },
      {
        code: "469006",
        label: "万宁市",
        identification: "city",
        children: [
          { code: "469006", label: "后安镇", identification: "district" },
          { code: "469006", label: "和乐镇", identification: "district" },
          { code: "469006", label: "东澳镇", identification: "district" },
          { code: "469006", label: "龙滚镇", identification: "district" },
          { code: "469006", label: "山根镇", identification: "district" },
          { code: "469006", label: "北大镇", identification: "district" },
          { code: "469006", label: "南桥镇", identification: "district" },
          { code: "469006", label: "大茂镇", identification: "district" },
          { code: "469006", label: "万城镇", identification: "district" },
          { code: "469006", label: "礼纪镇", identification: "district" },
          { code: "469006", label: "三更罗镇", identification: "district" },
          { code: "469006", label: "长丰镇", identification: "district" }
        ]
      },
      {
        code: "469028",
        label: "陵水黎族自治县",
        identification: "city",
        children: [
          { code: "469028", label: "椰林镇", identification: "district" },
          { code: "469028", label: "黎安镇", identification: "district" },
          { code: "469028", label: "新村镇", identification: "district" },
          { code: "469028", label: "文罗镇", identification: "district" },
          { code: "469028", label: "群英乡", identification: "district" },
          { code: "469028", label: "提蒙乡", identification: "district" },
          { code: "469028", label: "三才镇", identification: "district" },
          { code: "469028", label: "隆广镇", identification: "district" },
          { code: "469028", label: "英州镇", identification: "district" },
          { code: "469028", label: "本号镇", identification: "district" },
          { code: "469028", label: "光坡镇", identification: "district" }
        ]
      },
      {
        code: "469002",
        label: "琼海市",
        identification: "city",
        children: [
          { code: "469002", label: "长坡镇", identification: "district" },
          { code: "469002", label: "阳江镇", identification: "district" },
          { code: "469002", label: "石壁镇", identification: "district" },
          { code: "469002", label: "会山镇", identification: "district" },
          { code: "469002", label: "龙江镇", identification: "district" },
          { code: "469002", label: "塔洋镇", identification: "district" },
          { code: "469002", label: "大路镇", identification: "district" },
          { code: "469002", label: "潭门镇", identification: "district" },
          { code: "469002", label: "万泉镇", identification: "district" },
          { code: "469002", label: "嘉积镇", identification: "district" },
          { code: "469002", label: "中原镇", identification: "district" },
          { code: "469002", label: "博鳌镇", identification: "district" }
        ]
      },
      {
        code: "460300",
        label: "三沙市",
        identification: "city",
        children: [
          { code: "460301", label: "西沙区", identification: "district" },
          { code: "460302", label: "南沙区", identification: "district" }
        ]
      },
      {
        code: "469005",
        label: "文昌市",
        identification: "city",
        children: [
          { code: "469005", label: "文教镇", identification: "district" },
          { code: "469005", label: "铺前镇", identification: "district" },
          { code: "469005", label: "东郊镇", identification: "district" },
          { code: "469005", label: "龙楼镇", identification: "district" },
          { code: "469005", label: "昌洒镇", identification: "district" },
          { code: "469005", label: "锦山镇", identification: "district" },
          { code: "469005", label: "冯坡镇", identification: "district" },
          { code: "469005", label: "翁田镇", identification: "district" },
          { code: "469005", label: "抱罗镇", identification: "district" },
          { code: "469005", label: "公坡镇", identification: "district" },
          { code: "469005", label: "东阁镇", identification: "district" },
          { code: "469005", label: "潭牛镇", identification: "district" },
          { code: "469005", label: "东路镇", identification: "district" },
          { code: "469005", label: "文城镇", identification: "district" },
          { code: "469005", label: "蓬莱镇", identification: "district" },
          { code: "469005", label: "重兴镇", identification: "district" },
          { code: "469005", label: "会文镇", identification: "district" }
        ]
      },
      {
        code: "460400",
        label: "儋州市",
        identification: "city",
        children: [
          { code: "460400", label: "光村镇", identification: "district" },
          { code: "460400", label: "海头镇", identification: "district" },
          { code: "460400", label: "新州镇", identification: "district" },
          { code: "460400", label: "中和镇", identification: "district" },
          { code: "460400", label: "峨蔓镇", identification: "district" },
          { code: "460400", label: "三都镇", identification: "district" },
          { code: "460400", label: "王五镇", identification: "district" },
          { code: "460400", label: "南丰镇", identification: "district" },
          { code: "460400", label: "雅星镇", identification: "district" },
          { code: "460400", label: "那大镇", identification: "district" },
          { code: "460400", label: "和庆镇", identification: "district" },
          { code: "460400", label: "白马井镇", identification: "district" },
          { code: "460400", label: "兰洋镇", identification: "district" },
          { code: "460400", label: "大成镇", identification: "district" },
          { code: "460400", label: "排浦镇", identification: "district" },
          { code: "460400", label: "东成镇", identification: "district" },
          { code: "460400", label: "木棠镇", identification: "district" }
        ]
      },
      {
        code: "460200",
        label: "三亚市",
        identification: "city",
        children: [
          { code: "460205", label: "崖州区", identification: "district" },
          { code: "460202", label: "海棠区", identification: "district" },
          { code: "460203", label: "吉阳区", identification: "district" },
          { code: "460204", label: "天涯区", identification: "district" }
        ]
      },
      {
        code: "469029",
        label: "保亭黎族苗族自治县",
        identification: "city",
        children: [
          { code: "469029", label: "南林乡", identification: "district" },
          { code: "469029", label: "毛感乡", identification: "district" },
          { code: "469029", label: "六弓乡", identification: "district" },
          { code: "469029", label: "什玲镇", identification: "district" },
          { code: "469029", label: "保城镇", identification: "district" },
          { code: "469029", label: "新政镇", identification: "district" },
          { code: "469029", label: "响水镇", identification: "district" },
          { code: "469029", label: "三道镇", identification: "district" },
          { code: "469029", label: "加茂镇", identification: "district" }
        ]
      },
      {
        code: "469001",
        label: "五指山市",
        identification: "city",
        children: [
          { code: "469001", label: "毛阳镇", identification: "district" },
          { code: "469001", label: "水满乡", identification: "district" },
          { code: "469001", label: "番阳镇", identification: "district" },
          { code: "469001", label: "毛道乡", identification: "district" },
          { code: "469001", label: "畅好乡", identification: "district" },
          { code: "469001", label: "通什镇", identification: "district" },
          { code: "469001", label: "南圣镇", identification: "district" }
        ]
      },
      {
        code: "469021",
        label: "定安县",
        identification: "city",
        children: [
          { code: "469021", label: "岭口镇", identification: "district" },
          { code: "469021", label: "龙门镇", identification: "district" },
          { code: "469021", label: "黄竹镇", identification: "district" },
          { code: "469021", label: "新竹镇", identification: "district" },
          { code: "469021", label: "翰林镇", identification: "district" },
          { code: "469021", label: "定城镇", identification: "district" },
          { code: "469021", label: "龙湖镇", identification: "district" },
          { code: "469021", label: "龙河镇", identification: "district" },
          { code: "469021", label: "富文镇", identification: "district" },
          { code: "469021", label: "雷鸣镇", identification: "district" }
        ]
      },
      {
        code: "469026",
        label: "昌江黎族自治县",
        identification: "city",
        children: [
          { code: "469026", label: "乌烈镇", identification: "district" },
          { code: "469026", label: "叉河镇", identification: "district" },
          { code: "469026", label: "石碌镇", identification: "district" },
          { code: "469026", label: "昌化镇", identification: "district" },
          { code: "469026", label: "王下乡", identification: "district" },
          { code: "469026", label: "十月田镇", identification: "district" },
          { code: "469026", label: "七叉镇", identification: "district" },
          { code: "469026", label: "海尾镇", identification: "district" }
        ]
      },
      {
        code: "469023",
        label: "澄迈县",
        identification: "city",
        children: [
          { code: "469023", label: "老城镇", identification: "district" },
          { code: "469023", label: "大丰镇", identification: "district" },
          { code: "469023", label: "瑞溪镇", identification: "district" },
          { code: "469023", label: "加乐镇", identification: "district" },
          { code: "469023", label: "中兴镇", identification: "district" },
          { code: "469023", label: "仁兴镇", identification: "district" },
          { code: "469023", label: "金江镇", identification: "district" },
          { code: "469023", label: "桥头镇", identification: "district" },
          { code: "469023", label: "文儒镇", identification: "district" },
          { code: "469023", label: "福山镇", identification: "district" },
          { code: "469023", label: "永发镇", identification: "district" }
        ]
      },
      {
        code: "460100",
        label: "海口市",
        identification: "city",
        children: [
          { code: "460108", label: "美兰区", identification: "district" },
          { code: "460107", label: "琼山区", identification: "district" },
          { code: "460106", label: "龙华区", identification: "district" },
          { code: "460105", label: "秀英区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "320000",
    label: "江苏省",
    identification: "province",
    children: [
      {
        code: "320700",
        label: "连云港市",
        identification: "city",
        children: [
          { code: "320724", label: "灌南县", identification: "district" },
          { code: "320703", label: "连云区", identification: "district" },
          { code: "320707", label: "赣榆区", identification: "district" },
          { code: "320723", label: "灌云县", identification: "district" },
          { code: "320706", label: "海州区", identification: "district" },
          { code: "320722", label: "东海县", identification: "district" }
        ]
      },
      {
        code: "320600",
        label: "南通市",
        identification: "city",
        children: [
          { code: "320623", label: "如东县", identification: "district" },
          { code: "320613", label: "崇川区", identification: "district" },
          { code: "320681", label: "启东市", identification: "district" },
          { code: "320614", label: "海门区", identification: "district" },
          { code: "320612", label: "通州区", identification: "district" },
          { code: "320682", label: "如皋市", identification: "district" },
          { code: "320685", label: "海安市", identification: "district" }
        ]
      },
      {
        code: "321300",
        label: "宿迁市",
        identification: "city",
        children: [
          { code: "321323", label: "泗阳县", identification: "district" },
          { code: "321324", label: "泗洪县", identification: "district" },
          { code: "321311", label: "宿豫区", identification: "district" },
          { code: "321302", label: "宿城区", identification: "district" },
          { code: "321322", label: "沭阳县", identification: "district" }
        ]
      },
      {
        code: "320800",
        label: "淮安市",
        identification: "city",
        children: [
          { code: "320804", label: "淮阴区", identification: "district" },
          { code: "320830", label: "盱眙县", identification: "district" },
          { code: "320826", label: "涟水县", identification: "district" },
          { code: "320831", label: "金湖县", identification: "district" },
          { code: "320813", label: "洪泽区", identification: "district" },
          { code: "320803", label: "淮安区", identification: "district" },
          { code: "320812", label: "清江浦区", identification: "district" }
        ]
      },
      {
        code: "321100",
        label: "镇江市",
        identification: "city",
        children: [
          { code: "321182", label: "扬中市", identification: "district" },
          { code: "321111", label: "润州区", identification: "district" },
          { code: "321112", label: "丹徒区", identification: "district" },
          { code: "321183", label: "句容市", identification: "district" },
          { code: "321102", label: "京口区", identification: "district" },
          { code: "321181", label: "丹阳市", identification: "district" }
        ]
      },
      {
        code: "320100",
        label: "南京市",
        identification: "city",
        children: [
          { code: "320115", label: "江宁区", identification: "district" },
          { code: "320114", label: "雨花台区", identification: "district" },
          { code: "320118", label: "高淳区", identification: "district" },
          { code: "320117", label: "溧水区", identification: "district" },
          { code: "320105", label: "建邺区", identification: "district" },
          { code: "320116", label: "六合区", identification: "district" },
          { code: "320106", label: "鼓楼区", identification: "district" },
          { code: "320104", label: "秦淮区", identification: "district" },
          { code: "320111", label: "浦口区", identification: "district" },
          { code: "320102", label: "玄武区", identification: "district" },
          { code: "320113", label: "栖霞区", identification: "district" }
        ]
      },
      {
        code: "320900",
        label: "盐城市",
        identification: "city",
        children: [
          { code: "320922", label: "滨海县", identification: "district" },
          { code: "320924", label: "射阳县", identification: "district" },
          { code: "320921", label: "响水县", identification: "district" },
          { code: "320981", label: "东台市", identification: "district" },
          { code: "320925", label: "建湖县", identification: "district" },
          { code: "320923", label: "阜宁县", identification: "district" },
          { code: "320904", label: "大丰区", identification: "district" },
          { code: "320903", label: "盐都区", identification: "district" },
          { code: "320902", label: "亭湖区", identification: "district" }
        ]
      },
      {
        code: "320400",
        label: "常州市",
        identification: "city",
        children: [
          { code: "320413", label: "金坛区", identification: "district" },
          { code: "320481", label: "溧阳市", identification: "district" },
          { code: "320411", label: "新北区", identification: "district" },
          { code: "320404", label: "钟楼区", identification: "district" },
          { code: "320402", label: "天宁区", identification: "district" },
          { code: "320412", label: "武进区", identification: "district" }
        ]
      },
      {
        code: "321200",
        label: "泰州市",
        identification: "city",
        children: [
          { code: "321202", label: "海陵区", identification: "district" },
          { code: "321282", label: "靖江市", identification: "district" },
          { code: "321204", label: "姜堰区", identification: "district" },
          { code: "321203", label: "高港区", identification: "district" },
          { code: "321283", label: "泰兴市", identification: "district" },
          { code: "321281", label: "兴化市", identification: "district" }
        ]
      },
      {
        code: "321000",
        label: "扬州市",
        identification: "city",
        children: [
          { code: "321023", label: "宝应县", identification: "district" },
          { code: "321002", label: "广陵区", identification: "district" },
          { code: "321003", label: "邗江区", identification: "district" },
          { code: "321081", label: "仪征市", identification: "district" },
          { code: "321012", label: "江都区", identification: "district" },
          { code: "321084", label: "高邮市", identification: "district" }
        ]
      },
      {
        code: "320300",
        label: "徐州市",
        identification: "city",
        children: [
          { code: "320305", label: "贾汪区", identification: "district" },
          { code: "320312", label: "铜山区", identification: "district" },
          { code: "320311", label: "泉山区", identification: "district" },
          { code: "320324", label: "睢宁县", identification: "district" },
          { code: "320302", label: "鼓楼区", identification: "district" },
          { code: "320303", label: "云龙区", identification: "district" },
          { code: "320322", label: "沛县", identification: "district" },
          { code: "320321", label: "丰县", identification: "district" },
          { code: "320381", label: "新沂市", identification: "district" },
          { code: "320382", label: "邳州市", identification: "district" }
        ]
      },
      {
        code: "320200",
        label: "无锡市",
        identification: "city",
        children: [
          { code: "320282", label: "宜兴市", identification: "district" },
          { code: "320281", label: "江阴市", identification: "district" },
          { code: "320214", label: "新吴区", identification: "district" },
          { code: "320205", label: "锡山区", identification: "district" },
          { code: "320211", label: "滨湖区", identification: "district" },
          { code: "320206", label: "惠山区", identification: "district" },
          { code: "320213", label: "梁溪区", identification: "district" }
        ]
      },
      {
        code: "320500",
        label: "苏州市",
        identification: "city",
        children: [
          { code: "320505", label: "虎丘区", identification: "district" },
          { code: "320585", label: "太仓市", identification: "district" },
          { code: "320507", label: "相城区", identification: "district" },
          { code: "320509", label: "吴江区", identification: "district" },
          { code: "320508", label: "姑苏区", identification: "district" },
          { code: "320581", label: "常熟市", identification: "district" },
          { code: "320582", label: "张家港市", identification: "district" },
          { code: "320583", label: "昆山市", identification: "district" },
          { code: "320506", label: "吴中区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "630000",
    label: "青海省",
    identification: "province",
    children: [
      {
        code: "632500",
        label: "海南藏族自治州",
        identification: "city",
        children: [
          { code: "632523", label: "贵德县", identification: "district" },
          { code: "632525", label: "贵南县", identification: "district" },
          { code: "632522", label: "同德县", identification: "district" },
          { code: "632524", label: "兴海县", identification: "district" },
          { code: "632521", label: "共和县", identification: "district" }
        ]
      },
      {
        code: "630200",
        label: "海东市",
        identification: "city",
        children: [
          { code: "630222", label: "民和回族土族自治县", identification: "district" },
          { code: "630202", label: "乐都区", identification: "district" },
          { code: "630225", label: "循化撒拉族自治县", identification: "district" },
          { code: "630203", label: "平安区", identification: "district" },
          { code: "630223", label: "互助土族自治县", identification: "district" },
          { code: "630224", label: "化隆回族自治县", identification: "district" }
        ]
      },
      {
        code: "632800",
        label: "海西蒙古族藏族自治州",
        identification: "city",
        children: [
          { code: "632823", label: "天峻县", identification: "district" },
          { code: "632802", label: "德令哈市", identification: "district" },
          { code: "632801", label: "格尔木市", identification: "district" },
          { code: "632822", label: "都兰县", identification: "district" },
          { code: "632821", label: "乌兰县", identification: "district" },
          { code: "632825", label: "海西蒙古族藏族自治州直辖", identification: "district" },
          { code: "632803", label: "茫崖市", identification: "district" }
        ]
      },
      {
        code: "632700",
        label: "玉树藏族自治州",
        identification: "city",
        children: [
          { code: "632724", label: "治多县", identification: "district" },
          { code: "632726", label: "曲麻莱县", identification: "district" },
          { code: "632723", label: "称多县", identification: "district" },
          { code: "632722", label: "杂多县", identification: "district" },
          { code: "632701", label: "玉树市", identification: "district" },
          { code: "632725", label: "囊谦县", identification: "district" }
        ]
      },
      {
        code: "632300",
        label: "黄南藏族自治州",
        identification: "city",
        children: [
          { code: "632301", label: "同仁市", identification: "district" },
          { code: "632323", label: "泽库县", identification: "district" },
          { code: "632322", label: "尖扎县", identification: "district" },
          { code: "632324", label: "河南蒙古族自治县", identification: "district" }
        ]
      },
      {
        code: "632600",
        label: "果洛藏族自治州",
        identification: "city",
        children: [
          { code: "632623", label: "甘德县", identification: "district" },
          { code: "632621", label: "玛沁县", identification: "district" },
          { code: "632624", label: "达日县", identification: "district" },
          { code: "632625", label: "久治县", identification: "district" },
          { code: "632622", label: "班玛县", identification: "district" },
          { code: "632626", label: "玛多县", identification: "district" }
        ]
      },
      {
        code: "630100",
        label: "西宁市",
        identification: "city",
        children: [
          { code: "630123", label: "湟源县", identification: "district" },
          { code: "630121", label: "大通回族土族自治县", identification: "district" },
          { code: "630104", label: "城西区", identification: "district" },
          { code: "630105", label: "城北区", identification: "district" },
          { code: "630102", label: "城东区", identification: "district" },
          { code: "630103", label: "城中区", identification: "district" },
          { code: "630106", label: "湟中区", identification: "district" }
        ]
      },
      {
        code: "632200",
        label: "海北藏族自治州",
        identification: "city",
        children: [
          { code: "632223", label: "海晏县", identification: "district" },
          { code: "632221", label: "门源回族自治县", identification: "district" },
          { code: "632224", label: "刚察县", identification: "district" },
          { code: "632222", label: "祁连县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "450000",
    label: "广西壮族自治区",
    identification: "province",
    children: [
      {
        code: "451000",
        label: "百色市",
        identification: "city",
        children: [
          { code: "451028", label: "乐业县", identification: "district" },
          { code: "451031", label: "隆林各族自治县", identification: "district" },
          { code: "451030", label: "西林县", identification: "district" },
          { code: "451027", label: "凌云县", identification: "district" },
          { code: "451002", label: "右江区", identification: "district" },
          { code: "451082", label: "平果市", identification: "district" },
          { code: "451081", label: "靖西市", identification: "district" },
          { code: "451029", label: "田林县", identification: "district" },
          { code: "451003", label: "田阳区", identification: "district" },
          { code: "451024", label: "德保县", identification: "district" },
          { code: "451026", label: "那坡县", identification: "district" },
          { code: "451022", label: "田东县", identification: "district" }
        ]
      },
      {
        code: "450700",
        label: "钦州市",
        identification: "city",
        children: [
          { code: "450702", label: "钦南区", identification: "district" },
          { code: "450703", label: "钦北区", identification: "district" },
          { code: "450721", label: "灵山县", identification: "district" },
          { code: "450722", label: "浦北县", identification: "district" }
        ]
      },
      {
        code: "450500",
        label: "北海市",
        identification: "city",
        children: [
          { code: "450503", label: "银海区", identification: "district" },
          { code: "450512", label: "铁山港区", identification: "district" },
          { code: "450502", label: "海城区", identification: "district" },
          { code: "450521", label: "合浦县", identification: "district" }
        ]
      },
      {
        code: "450400",
        label: "梧州市",
        identification: "city",
        children: [
          { code: "450423", label: "蒙山县", identification: "district" },
          { code: "450406", label: "龙圩区", identification: "district" },
          { code: "450481", label: "岑溪市", identification: "district" },
          { code: "450405", label: "长洲区", identification: "district" },
          { code: "450422", label: "藤县", identification: "district" },
          { code: "450403", label: "万秀区", identification: "district" },
          { code: "450421", label: "苍梧县", identification: "district" }
        ]
      },
      {
        code: "450600",
        label: "防城港市",
        identification: "city",
        children: [
          { code: "450602", label: "港口区", identification: "district" },
          { code: "450681", label: "东兴市", identification: "district" },
          { code: "450621", label: "上思县", identification: "district" },
          { code: "450603", label: "防城区", identification: "district" }
        ]
      },
      {
        code: "451300",
        label: "来宾市",
        identification: "city",
        children: [
          { code: "451324", label: "金秀瑶族自治县", identification: "district" },
          { code: "451322", label: "象州县", identification: "district" },
          { code: "451381", label: "合山市", identification: "district" },
          { code: "451323", label: "武宣县", identification: "district" },
          { code: "451321", label: "忻城县", identification: "district" },
          { code: "451302", label: "兴宾区", identification: "district" }
        ]
      },
      {
        code: "450300",
        label: "桂林市",
        identification: "city",
        children: [
          { code: "450305", label: "七星区", identification: "district" },
          { code: "450327", label: "灌阳县", identification: "district" },
          { code: "450332", label: "恭城瑶族自治县", identification: "district" },
          { code: "450330", label: "平乐县", identification: "district" },
          { code: "450324", label: "全州县", identification: "district" },
          { code: "450326", label: "永福县", identification: "district" },
          { code: "450328", label: "龙胜各族自治县", identification: "district" },
          { code: "450321", label: "阳朔县", identification: "district" },
          { code: "450381", label: "荔浦市", identification: "district" },
          { code: "450312", label: "临桂区", identification: "district" },
          { code: "450302", label: "秀峰区", identification: "district" },
          { code: "450311", label: "雁山区", identification: "district" },
          { code: "450304", label: "象山区", identification: "district" },
          { code: "450303", label: "叠彩区", identification: "district" },
          { code: "450323", label: "灵川县", identification: "district" },
          { code: "450329", label: "资源县", identification: "district" },
          { code: "450325", label: "兴安县", identification: "district" }
        ]
      },
      {
        code: "451100",
        label: "贺州市",
        identification: "city",
        children: [
          { code: "451123", label: "富川瑶族自治县", identification: "district" },
          { code: "451122", label: "钟山县", identification: "district" },
          { code: "451102", label: "八步区", identification: "district" },
          { code: "451103", label: "平桂区", identification: "district" },
          { code: "451121", label: "昭平县", identification: "district" }
        ]
      },
      {
        code: "450800",
        label: "贵港市",
        identification: "city",
        children: [
          { code: "450803", label: "港南区", identification: "district" },
          { code: "450821", label: "平南县", identification: "district" },
          { code: "450881", label: "桂平市", identification: "district" },
          { code: "450802", label: "港北区", identification: "district" },
          { code: "450804", label: "覃塘区", identification: "district" }
        ]
      },
      {
        code: "451200",
        label: "河池市",
        identification: "city",
        children: [
          { code: "451222", label: "天峨县", identification: "district" },
          { code: "451225", label: "罗城仫佬族自治县", identification: "district" },
          { code: "451223", label: "凤山县", identification: "district" },
          { code: "451224", label: "东兰县", identification: "district" },
          { code: "451229", label: "大化瑶族自治县", identification: "district" },
          { code: "451228", label: "都安瑶族自治县", identification: "district" },
          { code: "451226", label: "环江毛南族自治县", identification: "district" },
          { code: "451221", label: "南丹县", identification: "district" },
          { code: "451202", label: "金城江区", identification: "district" },
          { code: "451203", label: "宜州区", identification: "district" },
          { code: "451227", label: "巴马瑶族自治县", identification: "district" }
        ]
      },
      {
        code: "450200",
        label: "柳州市",
        identification: "city",
        children: [
          { code: "450226", label: "三江侗族自治县", identification: "district" },
          { code: "450225", label: "融水苗族自治县", identification: "district" },
          { code: "450224", label: "融安县", identification: "district" },
          { code: "450222", label: "柳城县", identification: "district" },
          { code: "450206", label: "柳江区", identification: "district" },
          { code: "450223", label: "鹿寨县", identification: "district" },
          { code: "450202", label: "城中区", identification: "district" },
          { code: "450205", label: "柳北区", identification: "district" },
          { code: "450203", label: "鱼峰区", identification: "district" },
          { code: "450204", label: "柳南区", identification: "district" }
        ]
      },
      {
        code: "450100",
        label: "南宁市",
        identification: "city",
        children: [
          { code: "450124", label: "马山县", identification: "district" },
          { code: "450125", label: "上林县", identification: "district" },
          { code: "450110", label: "武鸣区", identification: "district" },
          { code: "450109", label: "邕宁区", identification: "district" },
          { code: "450105", label: "江南区", identification: "district" },
          { code: "450108", label: "良庆区", identification: "district" },
          { code: "450107", label: "西乡塘区", identification: "district" },
          { code: "450123", label: "隆安县", identification: "district" },
          { code: "450181", label: "横州市", identification: "district" },
          { code: "450102", label: "兴宁区", identification: "district" },
          { code: "450103", label: "青秀区", identification: "district" },
          { code: "450126", label: "宾阳县", identification: "district" }
        ]
      },
      {
        code: "450900",
        label: "玉林市",
        identification: "city",
        children: [
          { code: "450903", label: "福绵区", identification: "district" },
          { code: "450922", label: "陆川县", identification: "district" },
          { code: "450902", label: "玉州区", identification: "district" },
          { code: "450923", label: "博白县", identification: "district" },
          { code: "450921", label: "容县", identification: "district" },
          { code: "450924", label: "兴业县", identification: "district" },
          { code: "450981", label: "北流市", identification: "district" }
        ]
      },
      {
        code: "451400",
        label: "崇左市",
        identification: "city",
        children: [
          { code: "451421", label: "扶绥县", identification: "district" },
          { code: "451402", label: "江州区", identification: "district" },
          { code: "451423", label: "龙州县", identification: "district" },
          { code: "451481", label: "凭祥市", identification: "district" },
          { code: "451422", label: "宁明县", identification: "district" },
          { code: "451424", label: "大新县", identification: "district" },
          { code: "451425", label: "天等县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "640000",
    label: "宁夏回族自治区",
    identification: "province",
    children: [
      {
        code: "640400",
        label: "固原市",
        identification: "city",
        children: [
          { code: "640423", label: "隆德县", identification: "district" },
          { code: "640422", label: "西吉县", identification: "district" },
          { code: "640424", label: "泾源县", identification: "district" },
          { code: "640402", label: "原州区", identification: "district" },
          { code: "640425", label: "彭阳县", identification: "district" }
        ]
      },
      {
        code: "640200",
        label: "石嘴山市",
        identification: "city",
        children: [
          { code: "640205", label: "惠农区", identification: "district" },
          { code: "640202", label: "大武口区", identification: "district" },
          { code: "640221", label: "平罗县", identification: "district" }
        ]
      },
      {
        code: "640300",
        label: "吴忠市",
        identification: "city",
        children: [
          { code: "640381", label: "青铜峡市", identification: "district" },
          { code: "640323", label: "盐池县", identification: "district" },
          { code: "640324", label: "同心县", identification: "district" },
          { code: "640302", label: "利通区", identification: "district" },
          { code: "640303", label: "红寺堡区", identification: "district" }
        ]
      },
      {
        code: "640100",
        label: "银川市",
        identification: "city",
        children: [
          { code: "640105", label: "西夏区", identification: "district" },
          { code: "640121", label: "永宁县", identification: "district" },
          { code: "640181", label: "灵武市", identification: "district" },
          { code: "640106", label: "金凤区", identification: "district" },
          { code: "640122", label: "贺兰县", identification: "district" },
          { code: "640104", label: "兴庆区", identification: "district" }
        ]
      },
      {
        code: "640500",
        label: "中卫市",
        identification: "city",
        children: [
          { code: "640522", label: "海原县", identification: "district" },
          { code: "640521", label: "中宁县", identification: "district" },
          { code: "640502", label: "沙坡头区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "330000",
    label: "浙江省",
    identification: "province",
    children: [
      {
        code: "330900",
        label: "舟山市",
        identification: "city",
        children: [
          { code: "330922", label: "嵊泗县", identification: "district" },
          { code: "330921", label: "岱山县", identification: "district" },
          { code: "330902", label: "定海区", identification: "district" },
          { code: "330903", label: "普陀区", identification: "district" }
        ]
      },
      {
        code: "330400",
        label: "嘉兴市",
        identification: "city",
        children: [
          { code: "330482", label: "平湖市", identification: "district" },
          { code: "330411", label: "秀洲区", identification: "district" },
          { code: "330481", label: "海宁市", identification: "district" },
          { code: "330424", label: "海盐县", identification: "district" },
          { code: "330402", label: "南湖区", identification: "district" },
          { code: "330421", label: "嘉善县", identification: "district" },
          { code: "330483", label: "桐乡市", identification: "district" }
        ]
      },
      {
        code: "330200",
        label: "宁波市",
        identification: "city",
        children: [
          { code: "330206", label: "北仑区", identification: "district" },
          { code: "330225", label: "象山县", identification: "district" },
          { code: "330205", label: "江北区", identification: "district" },
          { code: "330211", label: "镇海区", identification: "district" },
          { code: "330203", label: "海曙区", identification: "district" },
          { code: "330212", label: "鄞州区", identification: "district" },
          { code: "330213", label: "奉化区", identification: "district" },
          { code: "330282", label: "慈溪市", identification: "district" },
          { code: "330226", label: "宁海县", identification: "district" },
          { code: "330281", label: "余姚市", identification: "district" }
        ]
      },
      {
        code: "331000",
        label: "台州市",
        identification: "city",
        children: [
          { code: "331082", label: "临海市", identification: "district" },
          { code: "331002", label: "椒江区", identification: "district" },
          { code: "331004", label: "路桥区", identification: "district" },
          { code: "331083", label: "玉环市", identification: "district" },
          { code: "331081", label: "温岭市", identification: "district" },
          { code: "331022", label: "三门县", identification: "district" },
          { code: "331024", label: "仙居县", identification: "district" },
          { code: "331023", label: "天台县", identification: "district" },
          { code: "331003", label: "黄岩区", identification: "district" }
        ]
      },
      {
        code: "330300",
        label: "温州市",
        identification: "city",
        children: [
          { code: "330327", label: "苍南县", identification: "district" },
          { code: "330305", label: "洞头区", identification: "district" },
          { code: "330326", label: "平阳县", identification: "district" },
          { code: "330381", label: "瑞安市", identification: "district" },
          { code: "330383", label: "龙港市", identification: "district" },
          { code: "330329", label: "泰顺县", identification: "district" },
          { code: "330328", label: "文成县", identification: "district" },
          { code: "330324", label: "永嘉县", identification: "district" },
          { code: "330382", label: "乐清市", identification: "district" },
          { code: "330303", label: "龙湾区", identification: "district" },
          { code: "330304", label: "瓯海区", identification: "district" },
          { code: "330302", label: "鹿城区", identification: "district" }
        ]
      },
      {
        code: "330700",
        label: "金华市",
        identification: "city",
        children: [
          { code: "330784", label: "永康市", identification: "district" },
          { code: "330723", label: "武义县", identification: "district" },
          { code: "330703", label: "金东区", identification: "district" },
          { code: "330782", label: "义乌市", identification: "district" },
          { code: "330702", label: "婺城区", identification: "district" },
          { code: "330783", label: "东阳市", identification: "district" },
          { code: "330727", label: "磐安县", identification: "district" },
          { code: "330726", label: "浦江县", identification: "district" },
          { code: "330781", label: "兰溪市", identification: "district" }
        ]
      },
      {
        code: "330100",
        label: "杭州市",
        identification: "city",
        children: [
          { code: "330108", label: "滨江区", identification: "district" },
          { code: "330122", label: "桐庐县", identification: "district" },
          { code: "330111", label: "富阳区", identification: "district" },
          { code: "330102", label: "上城区", identification: "district" },
          { code: "330114", label: "钱塘区", identification: "district" },
          { code: "330182", label: "建德市", identification: "district" },
          { code: "330113", label: "临平区", identification: "district" },
          { code: "330109", label: "萧山区", identification: "district" },
          { code: "330127", label: "淳安县", identification: "district" },
          { code: "330112", label: "临安区", identification: "district" },
          { code: "330110", label: "余杭区", identification: "district" },
          { code: "330106", label: "西湖区", identification: "district" },
          { code: "330105", label: "拱墅区", identification: "district" }
        ]
      },
      {
        code: "330500",
        label: "湖州市",
        identification: "city",
        children: [
          { code: "330523", label: "安吉县", identification: "district" },
          { code: "330521", label: "德清县", identification: "district" },
          { code: "330502", label: "吴兴区", identification: "district" },
          { code: "330522", label: "长兴县", identification: "district" },
          { code: "330503", label: "南浔区", identification: "district" }
        ]
      },
      {
        code: "331100",
        label: "丽水市",
        identification: "city",
        children: [
          { code: "331124", label: "松阳县", identification: "district" },
          { code: "331181", label: "龙泉市", identification: "district" },
          { code: "331125", label: "云和县", identification: "district" },
          { code: "331127", label: "景宁畲族自治县", identification: "district" },
          { code: "331122", label: "缙云县", identification: "district" },
          { code: "331121", label: "青田县", identification: "district" },
          { code: "331102", label: "莲都区", identification: "district" },
          { code: "331126", label: "庆元县", identification: "district" },
          { code: "331123", label: "遂昌县", identification: "district" }
        ]
      },
      {
        code: "330800",
        label: "衢州市",
        identification: "city",
        children: [
          { code: "330802", label: "柯城区", identification: "district" },
          { code: "330881", label: "江山市", identification: "district" },
          { code: "330822", label: "常山县", identification: "district" },
          { code: "330803", label: "衢江区", identification: "district" },
          { code: "330824", label: "开化县", identification: "district" },
          { code: "330825", label: "龙游县", identification: "district" }
        ]
      },
      {
        code: "330600",
        label: "绍兴市",
        identification: "city",
        children: [
          { code: "330681", label: "诸暨市", identification: "district" },
          { code: "330603", label: "柯桥区", identification: "district" },
          { code: "330602", label: "越城区", identification: "district" },
          { code: "330683", label: "嵊州市", identification: "district" },
          { code: "330624", label: "新昌县", identification: "district" },
          { code: "330604", label: "上虞区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "130000",
    label: "河北省",
    identification: "province",
    children: [
      {
        code: "130200",
        label: "唐山市",
        identification: "city",
        children: [
          { code: "130225", label: "乐亭县", identification: "district" },
          { code: "130229", label: "玉田县", identification: "district" },
          { code: "130202", label: "路南区", identification: "district" },
          { code: "130209", label: "曹妃甸区", identification: "district" },
          { code: "130224", label: "滦南县", identification: "district" },
          { code: "130205", label: "开平区", identification: "district" },
          { code: "130204", label: "古冶区", identification: "district" },
          { code: "130227", label: "迁西县", identification: "district" },
          { code: "130284", label: "滦州市", identification: "district" },
          { code: "130281", label: "遵化市", identification: "district" },
          { code: "130207", label: "丰南区", identification: "district" },
          { code: "130203", label: "路北区", identification: "district" },
          { code: "130208", label: "丰润区", identification: "district" },
          { code: "130283", label: "迁安市", identification: "district" }
        ]
      },
      {
        code: "130300",
        label: "秦皇岛市",
        identification: "city",
        children: [
          { code: "130303", label: "山海关区", identification: "district" },
          { code: "130306", label: "抚宁区", identification: "district" },
          { code: "130302", label: "海港区", identification: "district" },
          { code: "130304", label: "北戴河区", identification: "district" },
          { code: "130321", label: "青龙满族自治县", identification: "district" },
          { code: "130322", label: "昌黎县", identification: "district" },
          { code: "130324", label: "卢龙县", identification: "district" }
        ]
      },
      {
        code: "130800",
        label: "承德市",
        identification: "city",
        children: [
          { code: "130828", label: "围场满族蒙古族自治县", identification: "district" },
          { code: "130826", label: "丰宁满族自治县", identification: "district" },
          { code: "130825", label: "隆化县", identification: "district" },
          { code: "130827", label: "宽城满族自治县", identification: "district" },
          { code: "130804", label: "鹰手营子矿区", identification: "district" },
          { code: "130824", label: "滦平县", identification: "district" },
          { code: "130803", label: "双滦区", identification: "district" },
          { code: "130802", label: "双桥区", identification: "district" },
          { code: "130821", label: "承德县", identification: "district" },
          { code: "130822", label: "兴隆县", identification: "district" },
          { code: "130881", label: "平泉市", identification: "district" }
        ]
      },
      {
        code: "130100",
        label: "石家庄市",
        identification: "city",
        children: [
          { code: "130126", label: "灵寿县", identification: "district" },
          { code: "130183", label: "晋州市", identification: "district" },
          { code: "130132", label: "元氏县", identification: "district" },
          { code: "130127", label: "高邑县", identification: "district" },
          { code: "130121", label: "井陉县", identification: "district" },
          { code: "130181", label: "辛集市", identification: "district" },
          { code: "130123", label: "正定县", identification: "district" },
          { code: "130184", label: "新乐市", identification: "district" },
          { code: "130107", label: "井陉矿区", identification: "district" },
          { code: "130128", label: "深泽县", identification: "district" },
          { code: "130133", label: "赵县", identification: "district" },
          { code: "130125", label: "行唐县", identification: "district" },
          { code: "130105", label: "新华区", identification: "district" },
          { code: "130131", label: "平山县", identification: "district" },
          { code: "130110", label: "鹿泉区", identification: "district" },
          { code: "130104", label: "桥西区", identification: "district" },
          { code: "130108", label: "裕华区", identification: "district" },
          { code: "130111", label: "栾城区", identification: "district" },
          { code: "130109", label: "藁城区", identification: "district" },
          { code: "130102", label: "长安区", identification: "district" },
          { code: "130130", label: "无极县", identification: "district" },
          { code: "130129", label: "赞皇县", identification: "district" }
        ]
      },
      {
        code: "131000",
        label: "廊坊市",
        identification: "city",
        children: [
          { code: "131028", label: "大厂回族自治县", identification: "district" },
          { code: "131026", label: "文安县", identification: "district" },
          { code: "131082", label: "三河市", identification: "district" },
          { code: "131081", label: "霸州市", identification: "district" },
          { code: "131022", label: "固安县", identification: "district" },
          { code: "131025", label: "大城县", identification: "district" },
          { code: "131002", label: "安次区", identification: "district" },
          { code: "131023", label: "永清县", identification: "district" },
          { code: "131003", label: "广阳区", identification: "district" },
          { code: "131024", label: "香河县", identification: "district" }
        ]
      },
      {
        code: "131100",
        label: "衡水市",
        identification: "city",
        children: [
          { code: "131102", label: "桃城区", identification: "district" },
          { code: "131182", label: "深州市", identification: "district" },
          { code: "131128", label: "阜城县", identification: "district" },
          { code: "131103", label: "冀州区", identification: "district" },
          { code: "131126", label: "故城县", identification: "district" },
          { code: "131122", label: "武邑县", identification: "district" },
          { code: "131123", label: "武强县", identification: "district" },
          { code: "131121", label: "枣强县", identification: "district" },
          { code: "131124", label: "饶阳县", identification: "district" },
          { code: "131125", label: "安平县", identification: "district" },
          { code: "131127", label: "景县", identification: "district" }
        ]
      },
      {
        code: "130700",
        label: "张家口市",
        identification: "city",
        children: [
          { code: "130723", label: "康保县", identification: "district" },
          { code: "130709", label: "崇礼区", identification: "district" },
          { code: "130732", label: "赤城县", identification: "district" },
          { code: "130706", label: "下花园区", identification: "district" },
          { code: "130731", label: "涿鹿县", identification: "district" },
          { code: "130705", label: "宣化区", identification: "district" },
          { code: "130702", label: "桥东区", identification: "district" },
          { code: "130726", label: "蔚县", identification: "district" },
          { code: "130728", label: "怀安县", identification: "district" },
          { code: "130703", label: "桥西区", identification: "district" },
          { code: "130725", label: "尚义县", identification: "district" },
          { code: "130722", label: "张北县", identification: "district" },
          { code: "130708", label: "万全区", identification: "district" },
          { code: "130730", label: "怀来县", identification: "district" },
          { code: "130727", label: "阳原县", identification: "district" },
          { code: "130724", label: "沽源县", identification: "district" }
        ]
      },
      {
        code: "130600",
        label: "保定市",
        identification: "city",
        children: [
          { code: "130636", label: "顺平县", identification: "district" },
          { code: "130632", label: "安新县", identification: "district" },
          { code: "130683", label: "安国市", identification: "district" },
          { code: "130623", label: "涞水县", identification: "district" },
          { code: "130624", label: "阜平县", identification: "district" },
          { code: "130631", label: "望都县", identification: "district" },
          { code: "130627", label: "唐县", identification: "district" },
          { code: "130684", label: "高碑店市", identification: "district" },
          { code: "130626", label: "定兴县", identification: "district" },
          { code: "130629", label: "容城县", identification: "district" },
          { code: "130638", label: "雄县", identification: "district" },
          { code: "130634", label: "曲阳县", identification: "district" },
          { code: "130637", label: "博野县", identification: "district" },
          { code: "130635", label: "蠡县", identification: "district" },
          { code: "130628", label: "高阳县", identification: "district" },
          { code: "130681", label: "涿州市", identification: "district" },
          { code: "130630", label: "涞源县", identification: "district" },
          { code: "130607", label: "满城区", identification: "district" },
          { code: "130602", label: "竞秀区", identification: "district" },
          { code: "130606", label: "莲池区", identification: "district" },
          { code: "130608", label: "清苑区", identification: "district" },
          { code: "130682", label: "定州市", identification: "district" },
          { code: "130609", label: "徐水区", identification: "district" },
          { code: "130633", label: "易县", identification: "district" }
        ]
      },
      {
        code: "130500",
        label: "邢台市",
        identification: "city",
        children: [
          { code: "130524", label: "柏乡县", identification: "district" },
          { code: "130581", label: "南宫市", identification: "district" },
          { code: "130506", label: "南和区", identification: "district" },
          { code: "130534", label: "清河县", identification: "district" },
          { code: "130530", label: "新河县", identification: "district" },
          { code: "130528", label: "宁晋县", identification: "district" },
          { code: "130535", label: "临西县", identification: "district" },
          { code: "130533", label: "威县", identification: "district" },
          { code: "130582", label: "沙河市", identification: "district" },
          { code: "130523", label: "内丘县", identification: "district" },
          { code: "130505", label: "任泽区", identification: "district" },
          { code: "130522", label: "临城县", identification: "district" },
          { code: "130529", label: "巨鹿县", identification: "district" },
          { code: "130525", label: "隆尧县", identification: "district" },
          { code: "130531", label: "广宗县", identification: "district" },
          { code: "130532", label: "平乡县", identification: "district" },
          { code: "130503", label: "信都区", identification: "district" },
          { code: "130502", label: "襄都区", identification: "district" }
        ]
      },
      {
        code: "130400",
        label: "邯郸市",
        identification: "city",
        children: [
          { code: "130407", label: "肥乡区", identification: "district" },
          { code: "130431", label: "鸡泽县", identification: "district" },
          { code: "130408", label: "永年区", identification: "district" },
          { code: "130423", label: "临漳县", identification: "district" },
          { code: "130434", label: "魏县", identification: "district" },
          { code: "130427", label: "磁县", identification: "district" },
          { code: "130406", label: "峰峰矿区", identification: "district" },
          { code: "130402", label: "邯山区", identification: "district" },
          { code: "130425", label: "大名县", identification: "district" },
          { code: "130403", label: "丛台区", identification: "district" },
          { code: "130404", label: "复兴区", identification: "district" },
          { code: "130435", label: "曲周县", identification: "district" },
          { code: "130481", label: "武安市", identification: "district" },
          { code: "130432", label: "广平县", identification: "district" },
          { code: "130424", label: "成安县", identification: "district" },
          { code: "130433", label: "馆陶县", identification: "district" },
          { code: "130430", label: "邱县", identification: "district" },
          { code: "130426", label: "涉县", identification: "district" }
        ]
      },
      {
        code: "130900",
        label: "沧州市",
        identification: "city",
        children: [
          { code: "130923", label: "东光县", identification: "district" },
          { code: "130982", label: "任丘市", identification: "district" },
          { code: "130924", label: "海兴县", identification: "district" },
          { code: "130928", label: "吴桥县", identification: "district" },
          { code: "130902", label: "新华区", identification: "district" },
          { code: "130903", label: "运河区", identification: "district" },
          { code: "130921", label: "沧县", identification: "district" },
          { code: "130930", label: "孟村回族自治县", identification: "district" },
          { code: "130927", label: "南皮县", identification: "district" },
          { code: "130925", label: "盐山县", identification: "district" },
          { code: "130922", label: "青县", identification: "district" },
          { code: "130926", label: "肃宁县", identification: "district" },
          { code: "130984", label: "河间市", identification: "district" },
          { code: "130981", label: "泊头市", identification: "district" },
          { code: "130929", label: "献县", identification: "district" },
          { code: "130983", label: "黄骅市", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "810000",
    label: "香港特别行政区",
    identification: "province",
    children: [
      { code: "810013", label: "北区", identification: "city", children: [] },
      { code: "810014", label: "大埔区", identification: "city", children: [] },
      { code: "810015", label: "西贡区", identification: "city", children: [] },
      { code: "810016", label: "沙田区", identification: "city", children: [] },
      { code: "810011", label: "屯门区", identification: "city", children: [] },
      { code: "810008", label: "黄大仙区", identification: "city", children: [] },
      { code: "810007", label: "九龙城区", identification: "city", children: [] },
      { code: "810006", label: "深水埗区", identification: "city", children: [] },
      { code: "810009", label: "观塘区", identification: "city", children: [] },
      { code: "810005", label: "油尖旺区", identification: "city", children: [] },
      { code: "810003", label: "东区", identification: "city", children: [] },
      { code: "810001", label: "中西区", identification: "city", children: [] },
      { code: "810018", label: "离岛区", identification: "city", children: [] },
      { code: "810002", label: "湾仔区", identification: "city", children: [] },
      { code: "810004", label: "南区", identification: "city", children: [] },
      { code: "810012", label: "元朗区", identification: "city", children: [] },
      { code: "810010", label: "荃湾区", identification: "city", children: [] },
      { code: "810017", label: "葵青区", identification: "city", children: [] }
    ]
  },
  { code: "710000", label: "台湾省", identification: "province", children: [] },
  {
    code: "820000",
    label: "澳门特别行政区",
    identification: "province",
    children: [
      { code: "820002", label: "花王堂区", identification: "city", children: [] },
      { code: "820003", label: "望德堂区", identification: "city", children: [] },
      { code: "820006", label: "嘉模堂区", identification: "city", children: [] },
      { code: "820008", label: "圣方济各堂区", identification: "city", children: [] },
      { code: "820001", label: "花地玛堂区", identification: "city", children: [] },
      { code: "820007", label: "路氹填海区", identification: "city", children: [] },
      { code: "820005", label: "风顺堂区", identification: "city", children: [] },
      { code: "820004", label: "大堂区", identification: "city", children: [] }
    ]
  },
  {
    code: "620000",
    label: "甘肃省",
    identification: "province",
    children: [
      {
        code: "620200",
        label: "嘉峪关市",
        identification: "city",
        children: [
          { code: "620200", label: "峪泉镇", identification: "district" },
          { code: "620200", label: "新城镇", identification: "district" },
          { code: "620200", label: "文殊镇", identification: "district" },
          { code: "620200", label: "雄关街道", identification: "district" },
          { code: "620200", label: "钢城街道", identification: "district" }
        ]
      },
      {
        code: "620300",
        label: "金昌市",
        identification: "city",
        children: [
          { code: "620302", label: "金川区", identification: "district" },
          { code: "620321", label: "永昌县", identification: "district" }
        ]
      },
      {
        code: "620900",
        label: "酒泉市",
        identification: "city",
        children: [
          { code: "620981", label: "玉门市", identification: "district" },
          { code: "620921", label: "金塔县", identification: "district" },
          { code: "620982", label: "敦煌市", identification: "district" },
          { code: "620923", label: "肃北蒙古族自治县", identification: "district" },
          { code: "620902", label: "肃州区", identification: "district" },
          { code: "620922", label: "瓜州县", identification: "district" },
          { code: "620924", label: "阿克塞哈萨克族自治县", identification: "district" }
        ]
      },
      {
        code: "620100",
        label: "兰州市",
        identification: "city",
        children: [
          { code: "620111", label: "红古区", identification: "district" },
          { code: "620104", label: "西固区", identification: "district" },
          { code: "620103", label: "七里河区", identification: "district" },
          { code: "620123", label: "榆中县", identification: "district" },
          { code: "620105", label: "安宁区", identification: "district" },
          { code: "620102", label: "城关区", identification: "district" },
          { code: "620122", label: "皋兰县", identification: "district" },
          { code: "620121", label: "永登县", identification: "district" }
        ]
      },
      {
        code: "620800",
        label: "平凉市",
        identification: "city",
        children: [
          { code: "620802", label: "崆峒区", identification: "district" },
          { code: "620825", label: "庄浪县", identification: "district" },
          { code: "620823", label: "崇信县", identification: "district" },
          { code: "620881", label: "华亭市", identification: "district" },
          { code: "620826", label: "静宁县", identification: "district" },
          { code: "620822", label: "灵台县", identification: "district" },
          { code: "620821", label: "泾川县", identification: "district" }
        ]
      },
      {
        code: "620700",
        label: "张掖市",
        identification: "city",
        children: [
          { code: "620724", label: "高台县", identification: "district" },
          { code: "620721", label: "肃南裕固族自治县", identification: "district" },
          { code: "620725", label: "山丹县", identification: "district" },
          { code: "620722", label: "民乐县", identification: "district" },
          { code: "620702", label: "甘州区", identification: "district" },
          { code: "620723", label: "临泽县", identification: "district" }
        ]
      },
      {
        code: "620400",
        label: "白银市",
        identification: "city",
        children: [
          { code: "620402", label: "白银区", identification: "district" },
          { code: "620422", label: "会宁县", identification: "district" },
          { code: "620403", label: "平川区", identification: "district" },
          { code: "620421", label: "靖远县", identification: "district" },
          { code: "620423", label: "景泰县", identification: "district" }
        ]
      },
      {
        code: "620600",
        label: "武威市",
        identification: "city",
        children: [
          { code: "620622", label: "古浪县", identification: "district" },
          { code: "620602", label: "凉州区", identification: "district" },
          { code: "620621", label: "民勤县", identification: "district" },
          { code: "620623", label: "天祝藏族自治县", identification: "district" }
        ]
      },
      {
        code: "623000",
        label: "甘南藏族自治州",
        identification: "city",
        children: [
          { code: "623027", label: "夏河县", identification: "district" },
          { code: "623001", label: "合作市", identification: "district" },
          { code: "623021", label: "临潭县", identification: "district" },
          { code: "623022", label: "卓尼县", identification: "district" },
          { code: "623024", label: "迭部县", identification: "district" },
          { code: "623026", label: "碌曲县", identification: "district" },
          { code: "623025", label: "玛曲县", identification: "district" },
          { code: "623023", label: "舟曲县", identification: "district" }
        ]
      },
      {
        code: "621200",
        label: "陇南市",
        identification: "city",
        children: [
          { code: "621202", label: "武都区", identification: "district" },
          { code: "621222", label: "文县", identification: "district" },
          { code: "621225", label: "西和县", identification: "district" },
          { code: "621224", label: "康县", identification: "district" },
          { code: "621223", label: "宕昌县", identification: "district" },
          { code: "621228", label: "两当县", identification: "district" },
          { code: "621227", label: "徽县", identification: "district" },
          { code: "621226", label: "礼县", identification: "district" },
          { code: "621221", label: "成县", identification: "district" }
        ]
      },
      {
        code: "620500",
        label: "天水市",
        identification: "city",
        children: [
          { code: "620525", label: "张家川回族自治县", identification: "district" },
          { code: "620524", label: "武山县", identification: "district" },
          { code: "620503", label: "麦积区", identification: "district" },
          { code: "620502", label: "秦州区", identification: "district" },
          { code: "620523", label: "甘谷县", identification: "district" },
          { code: "620521", label: "清水县", identification: "district" },
          { code: "620522", label: "秦安县", identification: "district" }
        ]
      },
      {
        code: "621100",
        label: "定西市",
        identification: "city",
        children: [
          { code: "621123", label: "渭源县", identification: "district" },
          { code: "621124", label: "临洮县", identification: "district" },
          { code: "621126", label: "岷县", identification: "district" },
          { code: "621125", label: "漳县", identification: "district" },
          { code: "621102", label: "安定区", identification: "district" },
          { code: "621122", label: "陇西县", identification: "district" },
          { code: "621121", label: "通渭县", identification: "district" }
        ]
      },
      {
        code: "622900",
        label: "临夏回族自治州",
        identification: "city",
        children: [
          { code: "622924", label: "广河县", identification: "district" },
          { code: "622925", label: "和政县", identification: "district" },
          { code: "622923", label: "永靖县", identification: "district" },
          { code: "622927", label: "积石山保安族东乡族撒拉族自治县", identification: "district" },
          { code: "622901", label: "临夏市", identification: "district" },
          { code: "622921", label: "临夏县", identification: "district" },
          { code: "622922", label: "康乐县", identification: "district" },
          { code: "622926", label: "东乡族自治县", identification: "district" }
        ]
      },
      {
        code: "621000",
        label: "庆阳市",
        identification: "city",
        children: [
          { code: "621025", label: "正宁县", identification: "district" },
          { code: "621027", label: "镇原县", identification: "district" },
          { code: "621022", label: "环县", identification: "district" },
          { code: "621026", label: "宁县", identification: "district" },
          { code: "621024", label: "合水县", identification: "district" },
          { code: "621002", label: "西峰区", identification: "district" },
          { code: "621021", label: "庆城县", identification: "district" },
          { code: "621023", label: "华池县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "510000",
    label: "四川省",
    identification: "province",
    children: [
      {
        code: "510800",
        label: "广元市",
        identification: "city",
        children: [
          { code: "510812", label: "朝天区", identification: "district" },
          { code: "510824", label: "苍溪县", identification: "district" },
          { code: "510811", label: "昭化区", identification: "district" },
          { code: "510823", label: "剑阁县", identification: "district" },
          { code: "510822", label: "青川县", identification: "district" },
          { code: "510821", label: "旺苍县", identification: "district" },
          { code: "510802", label: "利州区", identification: "district" }
        ]
      },
      {
        code: "511300",
        label: "南充市",
        identification: "city",
        children: [
          { code: "511321", label: "南部县", identification: "district" },
          { code: "511322", label: "营山县", identification: "district" },
          { code: "511304", label: "嘉陵区", identification: "district" },
          { code: "511325", label: "西充县", identification: "district" },
          { code: "511324", label: "仪陇县", identification: "district" },
          { code: "511302", label: "顺庆区", identification: "district" },
          { code: "511381", label: "阆中市", identification: "district" },
          { code: "511323", label: "蓬安县", identification: "district" },
          { code: "511303", label: "高坪区", identification: "district" }
        ]
      },
      {
        code: "511900",
        label: "巴中市",
        identification: "city",
        children: [
          { code: "511921", label: "通江县", identification: "district" },
          { code: "511902", label: "巴州区", identification: "district" },
          { code: "511922", label: "南江县", identification: "district" },
          { code: "511923", label: "平昌县", identification: "district" },
          { code: "511903", label: "恩阳区", identification: "district" }
        ]
      },
      {
        code: "510600",
        label: "德阳市",
        identification: "city",
        children: [
          { code: "510623", label: "中江县", identification: "district" },
          { code: "510682", label: "什邡市", identification: "district" },
          { code: "510604", label: "罗江区", identification: "district" },
          { code: "510683", label: "绵竹市", identification: "district" },
          { code: "510681", label: "广汉市", identification: "district" },
          { code: "510603", label: "旌阳区", identification: "district" }
        ]
      },
      {
        code: "510700",
        label: "绵阳市",
        identification: "city",
        children: [
          { code: "510781", label: "江油市", identification: "district" },
          { code: "510725", label: "梓潼县", identification: "district" },
          { code: "510704", label: "游仙区", identification: "district" },
          { code: "510722", label: "三台县", identification: "district" },
          { code: "510703", label: "涪城区", identification: "district" },
          { code: "510727", label: "平武县", identification: "district" },
          { code: "510726", label: "北川羌族自治县", identification: "district" },
          { code: "510723", label: "盐亭县", identification: "district" },
          { code: "510705", label: "安州区", identification: "district" }
        ]
      },
      {
        code: "510100",
        label: "成都市",
        identification: "city",
        children: [
          { code: "510182", label: "彭州市", identification: "district" },
          { code: "510185", label: "简阳市", identification: "district" },
          { code: "510131", label: "蒲江县", identification: "district" },
          { code: "510116", label: "双流区", identification: "district" },
          { code: "510181", label: "都江堰市", identification: "district" },
          { code: "510117", label: "郫都区", identification: "district" },
          { code: "510115", label: "温江区", identification: "district" },
          { code: "510105", label: "青羊区", identification: "district" },
          { code: "510108", label: "成华区", identification: "district" },
          { code: "510107", label: "武侯区", identification: "district" },
          { code: "510113", label: "青白江区", identification: "district" },
          { code: "510184", label: "崇州市", identification: "district" },
          { code: "510104", label: "锦江区", identification: "district" },
          { code: "510112", label: "龙泉驿区", identification: "district" },
          { code: "510118", label: "新津区", identification: "district" },
          { code: "510183", label: "邛崃市", identification: "district" },
          { code: "510129", label: "大邑县", identification: "district" },
          { code: "510121", label: "金堂县", identification: "district" },
          { code: "510114", label: "新都区", identification: "district" },
          { code: "510106", label: "金牛区", identification: "district" }
        ]
      },
      {
        code: "511600",
        label: "广安市",
        identification: "city",
        children: [
          { code: "511623", label: "邻水县", identification: "district" },
          { code: "511602", label: "广安区", identification: "district" },
          { code: "511621", label: "岳池县", identification: "district" },
          { code: "511622", label: "武胜县", identification: "district" },
          { code: "511603", label: "前锋区", identification: "district" },
          { code: "511681", label: "华蓥市", identification: "district" }
        ]
      },
      {
        code: "511700",
        label: "达州市",
        identification: "city",
        children: [
          { code: "511724", label: "大竹县", identification: "district" },
          { code: "511725", label: "渠县", identification: "district" },
          { code: "511702", label: "通川区", identification: "district" },
          { code: "511703", label: "达川区", identification: "district" },
          { code: "511722", label: "宣汉县", identification: "district" },
          { code: "511781", label: "万源市", identification: "district" },
          { code: "511723", label: "开江县", identification: "district" }
        ]
      },
      {
        code: "510900",
        label: "遂宁市",
        identification: "city",
        children: [
          { code: "510923", label: "大英县", identification: "district" },
          { code: "510981", label: "射洪市", identification: "district" },
          { code: "510921", label: "蓬溪县", identification: "district" },
          { code: "510904", label: "安居区", identification: "district" },
          { code: "510903", label: "船山区", identification: "district" }
        ]
      },
      {
        code: "512000",
        label: "资阳市",
        identification: "city",
        children: [
          { code: "512022", label: "乐至县", identification: "district" },
          { code: "512002", label: "雁江区", identification: "district" },
          { code: "512021", label: "安岳县", identification: "district" }
        ]
      },
      {
        code: "511400",
        label: "眉山市",
        identification: "city",
        children: [
          { code: "511421", label: "仁寿县", identification: "district" },
          { code: "511424", label: "丹棱县", identification: "district" },
          { code: "511423", label: "洪雅县", identification: "district" },
          { code: "511403", label: "彭山区", identification: "district" },
          { code: "511402", label: "东坡区", identification: "district" },
          { code: "511425", label: "青神县", identification: "district" }
        ]
      },
      {
        code: "511000",
        label: "内江市",
        identification: "city",
        children: [
          { code: "511025", label: "资中县", identification: "district" },
          { code: "511024", label: "威远县", identification: "district" },
          { code: "511011", label: "东兴区", identification: "district" },
          { code: "511083", label: "隆昌市", identification: "district" },
          { code: "511002", label: "市中区", identification: "district" }
        ]
      },
      {
        code: "511100",
        label: "乐山市",
        identification: "city",
        children: [
          { code: "511126", label: "夹江县", identification: "district" },
          { code: "511111", label: "沙湾区", identification: "district" },
          { code: "511124", label: "井研县", identification: "district" },
          { code: "511112", label: "五通桥区", identification: "district" },
          { code: "511113", label: "金口河区", identification: "district" },
          { code: "511123", label: "犍为县", identification: "district" },
          { code: "511132", label: "峨边彝族自治县", identification: "district" },
          { code: "511129", label: "沐川县", identification: "district" },
          { code: "511133", label: "马边彝族自治县", identification: "district" },
          { code: "511102", label: "市中区", identification: "district" },
          { code: "511181", label: "峨眉山市", identification: "district" }
        ]
      },
      {
        code: "510300",
        label: "自贡市",
        identification: "city",
        children: [
          { code: "510321", label: "荣县", identification: "district" },
          { code: "510322", label: "富顺县", identification: "district" },
          { code: "510302", label: "自流井区", identification: "district" },
          { code: "510311", label: "沿滩区", identification: "district" },
          { code: "510304", label: "大安区", identification: "district" },
          { code: "510303", label: "贡井区", identification: "district" }
        ]
      },
      {
        code: "510500",
        label: "泸州市",
        identification: "city",
        children: [
          { code: "510521", label: "泸县", identification: "district" },
          { code: "510504", label: "龙马潭区", identification: "district" },
          { code: "510503", label: "纳溪区", identification: "district" },
          { code: "510524", label: "叙永县", identification: "district" },
          { code: "510525", label: "古蔺县", identification: "district" },
          { code: "510502", label: "江阳区", identification: "district" },
          { code: "510522", label: "合江县", identification: "district" }
        ]
      },
      {
        code: "511500",
        label: "宜宾市",
        identification: "city",
        children: [
          { code: "511524", label: "长宁县", identification: "district" },
          { code: "511503", label: "南溪区", identification: "district" },
          { code: "511526", label: "珙县", identification: "district" },
          { code: "511528", label: "兴文县", identification: "district" },
          { code: "511523", label: "江安县", identification: "district" },
          { code: "511527", label: "筠连县", identification: "district" },
          { code: "511502", label: "翠屏区", identification: "district" },
          { code: "511529", label: "屏山县", identification: "district" },
          { code: "511504", label: "叙州区", identification: "district" },
          { code: "511525", label: "高县", identification: "district" }
        ]
      },
      {
        code: "513400",
        label: "凉山彝族自治州",
        identification: "city",
        children: [
          { code: "513435", label: "甘洛县", identification: "district" },
          { code: "513422", label: "木里藏族自治县", identification: "district" },
          { code: "513436", label: "美姑县", identification: "district" },
          { code: "513434", label: "越西县", identification: "district" },
          { code: "513437", label: "雷波县", identification: "district" },
          { code: "513429", label: "布拖县", identification: "district" },
          { code: "513433", label: "冕宁县", identification: "district" },
          { code: "513430", label: "金阳县", identification: "district" },
          { code: "513428", label: "普格县", identification: "district" },
          { code: "513423", label: "盐源县", identification: "district" },
          { code: "513402", label: "会理市", identification: "district" },
          { code: "513424", label: "德昌县", identification: "district" },
          { code: "513401", label: "西昌市", identification: "district" },
          { code: "513431", label: "昭觉县", identification: "district" },
          { code: "513426", label: "会东县", identification: "district" },
          { code: "513432", label: "喜德县", identification: "district" },
          { code: "513427", label: "宁南县", identification: "district" }
        ]
      },
      {
        code: "510400",
        label: "攀枝花市",
        identification: "city",
        children: [
          { code: "510421", label: "米易县", identification: "district" },
          { code: "510422", label: "盐边县", identification: "district" },
          { code: "510411", label: "仁和区", identification: "district" },
          { code: "510402", label: "东区", identification: "district" },
          { code: "510403", label: "西区", identification: "district" }
        ]
      },
      {
        code: "513300",
        label: "甘孜藏族自治州",
        identification: "city",
        children: [
          { code: "513332", label: "石渠县", identification: "district" },
          { code: "513328", label: "甘孜县", identification: "district" },
          { code: "513330", label: "德格县", identification: "district" },
          { code: "513327", label: "炉霍县", identification: "district" },
          { code: "513329", label: "新龙县", identification: "district" },
          { code: "513331", label: "白玉县", identification: "district" },
          { code: "513326", label: "道孚县", identification: "district" },
          { code: "513301", label: "康定市", identification: "district" },
          { code: "513334", label: "理塘县", identification: "district" },
          { code: "513335", label: "巴塘县", identification: "district" },
          { code: "513325", label: "雅江县", identification: "district" },
          { code: "513337", label: "稻城县", identification: "district" },
          { code: "513336", label: "乡城县", identification: "district" },
          { code: "513324", label: "九龙县", identification: "district" },
          { code: "513338", label: "得荣县", identification: "district" },
          { code: "513323", label: "丹巴县", identification: "district" },
          { code: "513333", label: "色达县", identification: "district" },
          { code: "513322", label: "泸定县", identification: "district" }
        ]
      },
      {
        code: "513200",
        label: "阿坝藏族羌族自治州",
        identification: "city",
        children: [
          { code: "513225", label: "九寨沟县", identification: "district" },
          { code: "513231", label: "阿坝县", identification: "district" },
          { code: "513233", label: "红原县", identification: "district" },
          { code: "513228", label: "黑水县", identification: "district" },
          { code: "513201", label: "马尔康市", identification: "district" },
          { code: "513226", label: "金川县", identification: "district" },
          { code: "513222", label: "理县", identification: "district" },
          { code: "513224", label: "松潘县", identification: "district" },
          { code: "513230", label: "壤塘县", identification: "district" },
          { code: "513227", label: "小金县", identification: "district" },
          { code: "513221", label: "汶川县", identification: "district" },
          { code: "513223", label: "茂县", identification: "district" },
          { code: "513232", label: "若尔盖县", identification: "district" }
        ]
      },
      {
        code: "511800",
        label: "雅安市",
        identification: "city",
        children: [
          { code: "511827", label: "宝兴县", identification: "district" },
          { code: "511802", label: "雨城区", identification: "district" },
          { code: "511822", label: "荥经县", identification: "district" },
          { code: "511824", label: "石棉县", identification: "district" },
          { code: "511803", label: "名山区", identification: "district" },
          { code: "511823", label: "汉源县", identification: "district" },
          { code: "511826", label: "芦山县", identification: "district" },
          { code: "511825", label: "天全县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "120000",
    label: "天津市",
    identification: "province",
    children: [
      {
        code: "120100",
        label: "天津城区",
        identification: "city",
        children: [
          { code: "120115", label: "宝坻区", identification: "district" },
          { code: "120105", label: "河北区", identification: "district" },
          { code: "120118", label: "静海区", identification: "district" },
          { code: "120119", label: "蓟州区", identification: "district" },
          { code: "120117", label: "宁河区", identification: "district" },
          { code: "120112", label: "津南区", identification: "district" },
          { code: "120101", label: "和平区", identification: "district" },
          { code: "120113", label: "北辰区", identification: "district" },
          { code: "120106", label: "红桥区", identification: "district" },
          { code: "120103", label: "河西区", identification: "district" },
          { code: "120114", label: "武清区", identification: "district" },
          { code: "120111", label: "西青区", identification: "district" },
          { code: "120104", label: "南开区", identification: "district" },
          { code: "120102", label: "河东区", identification: "district" },
          { code: "120110", label: "东丽区", identification: "district" },
          { code: "120116", label: "滨海新区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "140000",
    label: "山西省",
    identification: "province",
    children: [
      {
        code: "140300",
        label: "阳泉市",
        identification: "city",
        children: [
          { code: "140321", label: "平定县", identification: "district" },
          { code: "140322", label: "盂县", identification: "district" },
          { code: "140311", label: "郊区", identification: "district" },
          { code: "140302", label: "城区", identification: "district" },
          { code: "140303", label: "矿区", identification: "district" }
        ]
      },
      {
        code: "140400",
        label: "长治市",
        identification: "city",
        children: [
          { code: "140425", label: "平顺县", identification: "district" },
          { code: "140428", label: "长子县", identification: "district" },
          { code: "140405", label: "屯留区", identification: "district" },
          { code: "140426", label: "黎城县", identification: "district" },
          { code: "140404", label: "上党区", identification: "district" },
          { code: "140403", label: "潞州区", identification: "district" },
          { code: "140427", label: "壶关县", identification: "district" },
          { code: "140423", label: "襄垣县", identification: "district" },
          { code: "140406", label: "潞城区", identification: "district" },
          { code: "140429", label: "武乡县", identification: "district" },
          { code: "140431", label: "沁源县", identification: "district" },
          { code: "140430", label: "沁县", identification: "district" }
        ]
      },
      {
        code: "140600",
        label: "朔州市",
        identification: "city",
        children: [
          { code: "140623", label: "右玉县", identification: "district" },
          { code: "140681", label: "怀仁市", identification: "district" },
          { code: "140602", label: "朔城区", identification: "district" },
          { code: "140603", label: "平鲁区", identification: "district" },
          { code: "140622", label: "应县", identification: "district" },
          { code: "140621", label: "山阴县", identification: "district" }
        ]
      },
      {
        code: "140500",
        label: "晋城市",
        identification: "city",
        children: [
          { code: "140502", label: "城区", identification: "district" },
          { code: "140525", label: "泽州县", identification: "district" },
          { code: "140581", label: "高平市", identification: "district" },
          { code: "140524", label: "陵川县", identification: "district" },
          { code: "140521", label: "沁水县", identification: "district" },
          { code: "140522", label: "阳城县", identification: "district" }
        ]
      },
      {
        code: "140900",
        label: "忻州市",
        identification: "city",
        children: [
          { code: "140928", label: "五寨县", identification: "district" },
          { code: "140925", label: "宁武县", identification: "district" },
          { code: "140922", label: "五台县", identification: "district" },
          { code: "140929", label: "岢岚县", identification: "district" },
          { code: "140902", label: "忻府区", identification: "district" },
          { code: "140926", label: "静乐县", identification: "district" },
          { code: "140921", label: "定襄县", identification: "district" },
          { code: "140927", label: "神池县", identification: "district" },
          { code: "140924", label: "繁峙县", identification: "district" },
          { code: "140931", label: "保德县", identification: "district" },
          { code: "140930", label: "河曲县", identification: "district" },
          { code: "140981", label: "原平市", identification: "district" },
          { code: "140923", label: "代县", identification: "district" },
          { code: "140932", label: "偏关县", identification: "district" }
        ]
      },
      {
        code: "140800",
        label: "运城市",
        identification: "city",
        children: [
          { code: "140802", label: "盐湖区", identification: "district" },
          { code: "140823", label: "闻喜县", identification: "district" },
          { code: "140822", label: "万荣县", identification: "district" },
          { code: "140828", label: "夏县", identification: "district" },
          { code: "140821", label: "临猗县", identification: "district" },
          { code: "140829", label: "平陆县", identification: "district" },
          { code: "140827", label: "垣曲县", identification: "district" },
          { code: "140824", label: "稷山县", identification: "district" },
          { code: "140882", label: "河津市", identification: "district" },
          { code: "140881", label: "永济市", identification: "district" },
          { code: "140826", label: "绛县", identification: "district" },
          { code: "140830", label: "芮城县", identification: "district" },
          { code: "140825", label: "新绛县", identification: "district" }
        ]
      },
      {
        code: "141000",
        label: "临汾市",
        identification: "city",
        children: [
          { code: "141025", label: "古县", identification: "district" },
          { code: "141030", label: "大宁县", identification: "district" },
          { code: "141026", label: "安泽县", identification: "district" },
          { code: "141028", label: "吉县", identification: "district" },
          { code: "141031", label: "隰县", identification: "district" },
          { code: "141029", label: "乡宁县", identification: "district" },
          { code: "141032", label: "永和县", identification: "district" },
          { code: "141033", label: "蒲县", identification: "district" },
          { code: "141027", label: "浮山县", identification: "district" },
          { code: "141021", label: "曲沃县", identification: "district" },
          { code: "141034", label: "汾西县", identification: "district" },
          { code: "141082", label: "霍州市", identification: "district" },
          { code: "141022", label: "翼城县", identification: "district" },
          { code: "141023", label: "襄汾县", identification: "district" },
          { code: "141081", label: "侯马市", identification: "district" },
          { code: "141024", label: "洪洞县", identification: "district" },
          { code: "141002", label: "尧都区", identification: "district" }
        ]
      },
      {
        code: "140200",
        label: "大同市",
        identification: "city",
        children: [
          { code: "140223", label: "广灵县", identification: "district" },
          { code: "140225", label: "浑源县", identification: "district" },
          { code: "140221", label: "阳高县", identification: "district" },
          { code: "140215", label: "云州区", identification: "district" },
          { code: "140226", label: "左云县", identification: "district" },
          { code: "140224", label: "灵丘县", identification: "district" },
          { code: "140214", label: "云冈区", identification: "district" },
          { code: "140212", label: "新荣区", identification: "district" },
          { code: "140213", label: "平城区", identification: "district" },
          { code: "140222", label: "天镇县", identification: "district" }
        ]
      },
      {
        code: "140700",
        label: "晋中市",
        identification: "city",
        children: [
          { code: "140724", label: "昔阳县", identification: "district" },
          { code: "140721", label: "榆社县", identification: "district" },
          { code: "140725", label: "寿阳县", identification: "district" },
          { code: "140729", label: "灵石县", identification: "district" },
          { code: "140781", label: "介休市", identification: "district" },
          { code: "140722", label: "左权县", identification: "district" },
          { code: "140723", label: "和顺县", identification: "district" },
          { code: "140728", label: "平遥县", identification: "district" },
          { code: "140727", label: "祁县", identification: "district" },
          { code: "140702", label: "榆次区", identification: "district" },
          { code: "140703", label: "太谷区", identification: "district" }
        ]
      },
      {
        code: "141100",
        label: "吕梁市",
        identification: "city",
        children: [
          { code: "141128", label: "方山县", identification: "district" },
          { code: "141127", label: "岚县", identification: "district" },
          { code: "141129", label: "中阳县", identification: "district" },
          { code: "141130", label: "交口县", identification: "district" },
          { code: "141123", label: "兴县", identification: "district" },
          { code: "141126", label: "石楼县", identification: "district" },
          { code: "141102", label: "离石区", identification: "district" },
          { code: "141125", label: "柳林县", identification: "district" },
          { code: "141124", label: "临县", identification: "district" },
          { code: "141182", label: "汾阳市", identification: "district" },
          { code: "141181", label: "孝义市", identification: "district" },
          { code: "141121", label: "文水县", identification: "district" },
          { code: "141122", label: "交城县", identification: "district" }
        ]
      },
      {
        code: "140100",
        label: "太原市",
        identification: "city",
        children: [
          { code: "140123", label: "娄烦县", identification: "district" },
          { code: "140122", label: "阳曲县", identification: "district" },
          { code: "140181", label: "古交市", identification: "district" },
          { code: "140107", label: "杏花岭区", identification: "district" },
          { code: "140106", label: "迎泽区", identification: "district" },
          { code: "140110", label: "晋源区", identification: "district" },
          { code: "140121", label: "清徐县", identification: "district" },
          { code: "140105", label: "小店区", identification: "district" },
          { code: "140109", label: "万柏林区", identification: "district" },
          { code: "140108", label: "尖草坪区", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "540000",
    label: "西藏自治区",
    identification: "province",
    children: [
      {
        code: "540300",
        label: "昌都市",
        identification: "city",
        children: [
          { code: "540321", label: "江达县", identification: "district" },
          { code: "540324", label: "丁青县", identification: "district" },
          { code: "540302", label: "卡若区", identification: "district" },
          { code: "540323", label: "类乌齐县", identification: "district" },
          { code: "540330", label: "边坝县", identification: "district" },
          { code: "540322", label: "贡觉县", identification: "district" },
          { code: "540325", label: "察雅县", identification: "district" },
          { code: "540329", label: "洛隆县", identification: "district" },
          { code: "540326", label: "八宿县", identification: "district" },
          { code: "540327", label: "左贡县", identification: "district" },
          { code: "540328", label: "芒康县", identification: "district" }
        ]
      },
      {
        code: "540600",
        label: "那曲市",
        identification: "city",
        children: [
          { code: "540624", label: "安多县", identification: "district" },
          { code: "540623", label: "聂荣县", identification: "district" },
          { code: "540628", label: "巴青县", identification: "district" },
          { code: "540625", label: "申扎县", identification: "district" },
          { code: "540627", label: "班戈县", identification: "district" },
          { code: "540622", label: "比如县", identification: "district" },
          { code: "540626", label: "索县", identification: "district" },
          { code: "540602", label: "色尼区", identification: "district" },
          { code: "540621", label: "嘉黎县", identification: "district" },
          { code: "540629", label: "尼玛县", identification: "district" },
          { code: "540630", label: "双湖县", identification: "district" }
        ]
      },
      {
        code: "540100",
        label: "拉萨市",
        identification: "city",
        children: [
          { code: "540122", label: "当雄县", identification: "district" },
          { code: "540103", label: "堆龙德庆区", identification: "district" },
          { code: "540127", label: "墨竹工卡县", identification: "district" },
          { code: "540104", label: "达孜区", identification: "district" },
          { code: "540121", label: "林周县", identification: "district" },
          { code: "540123", label: "尼木县", identification: "district" },
          { code: "540124", label: "曲水县", identification: "district" },
          { code: "540102", label: "城关区", identification: "district" }
        ]
      },
      {
        code: "540200",
        label: "日喀则市",
        identification: "city",
        children: [
          { code: "540232", label: "仲巴县", identification: "district" },
          { code: "540226", label: "昂仁县", identification: "district" },
          { code: "540227", label: "谢通门县", identification: "district" },
          { code: "540221", label: "南木林县", identification: "district" },
          { code: "540236", label: "萨嘎县", identification: "district" },
          { code: "540202", label: "桑珠孜区", identification: "district" },
          { code: "540225", label: "拉孜县", identification: "district" },
          { code: "540234", label: "吉隆县", identification: "district" },
          { code: "540229", label: "仁布县", identification: "district" },
          { code: "540224", label: "萨迦县", identification: "district" },
          { code: "540228", label: "白朗县", identification: "district" },
          { code: "540230", label: "康马县", identification: "district" },
          { code: "540235", label: "聂拉木县", identification: "district" },
          { code: "540222", label: "江孜县", identification: "district" },
          { code: "540237", label: "岗巴县", identification: "district" },
          { code: "540223", label: "定日县", identification: "district" },
          { code: "540233", label: "亚东县", identification: "district" },
          { code: "540231", label: "定结县", identification: "district" }
        ]
      },
      {
        code: "540500",
        label: "山南市",
        identification: "city",
        children: [
          { code: "540523", label: "桑日县", identification: "district" },
          { code: "540528", label: "加查县", identification: "district" },
          { code: "540502", label: "乃东区", identification: "district" },
          { code: "540522", label: "贡嘎县", identification: "district" },
          { code: "540531", label: "浪卡子县", identification: "district" },
          { code: "540521", label: "扎囊县", identification: "district" },
          { code: "540525", label: "曲松县", identification: "district" },
          { code: "540524", label: "琼结县", identification: "district" },
          { code: "540526", label: "措美县", identification: "district" },
          { code: "540527", label: "洛扎县", identification: "district" },
          { code: "540529", label: "隆子县", identification: "district" },
          { code: "540530", label: "错那市", identification: "district" }
        ]
      },
      {
        code: "540400",
        label: "林芝市",
        identification: "city",
        children: [
          { code: "540424", label: "波密县", identification: "district" },
          { code: "540421", label: "工布江达县", identification: "district" },
          { code: "540402", label: "巴宜区", identification: "district" },
          { code: "540423", label: "墨脱县", identification: "district" },
          { code: "540422", label: "米林市", identification: "district" },
          { code: "540425", label: "察隅县", identification: "district" },
          { code: "540426", label: "朗县", identification: "district" }
        ]
      },
      {
        code: "542500",
        label: "阿里地区",
        identification: "city",
        children: [
          { code: "542526", label: "改则县", identification: "district" },
          { code: "542522", label: "札达县", identification: "district" },
          { code: "542527", label: "措勤县", identification: "district" },
          { code: "542521", label: "普兰县", identification: "district" },
          { code: "542524", label: "日土县", identification: "district" },
          { code: "542523", label: "噶尔县", identification: "district" },
          { code: "542525", label: "革吉县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "220000",
    label: "吉林省",
    identification: "province",
    children: [
      {
        code: "220200",
        label: "吉林市",
        identification: "city",
        children: [
          { code: "220283", label: "舒兰市", identification: "district" },
          { code: "220282", label: "桦甸市", identification: "district" },
          { code: "220281", label: "蛟河市", identification: "district" },
          { code: "220221", label: "永吉县", identification: "district" },
          { code: "220284", label: "磐石市", identification: "district" },
          { code: "220203", label: "龙潭区", identification: "district" },
          { code: "220211", label: "丰满区", identification: "district" },
          { code: "220204", label: "船营区", identification: "district" },
          { code: "220202", label: "昌邑区", identification: "district" }
        ]
      },
      {
        code: "220100",
        label: "长春市",
        identification: "city",
        children: [
          { code: "220183", label: "德惠市", identification: "district" },
          { code: "220182", label: "榆树市", identification: "district" },
          { code: "220112", label: "双阳区", identification: "district" },
          { code: "220122", label: "农安县", identification: "district" },
          { code: "220184", label: "公主岭市", identification: "district" },
          { code: "220106", label: "绿园区", identification: "district" },
          { code: "220104", label: "朝阳区", identification: "district" },
          { code: "220113", label: "九台区", identification: "district" },
          { code: "220105", label: "二道区", identification: "district" },
          { code: "220103", label: "宽城区", identification: "district" },
          { code: "220102", label: "南关区", identification: "district" }
        ]
      },
      {
        code: "220800",
        label: "白城市",
        identification: "city",
        children: [
          { code: "220881", label: "洮南市", identification: "district" },
          { code: "220882", label: "大安市", identification: "district" },
          { code: "220822", label: "通榆县", identification: "district" },
          { code: "220802", label: "洮北区", identification: "district" },
          { code: "220821", label: "镇赉县", identification: "district" }
        ]
      },
      {
        code: "220700",
        label: "松原市",
        identification: "city",
        children: [
          { code: "220723", label: "乾安县", identification: "district" },
          { code: "220722", label: "长岭县", identification: "district" },
          { code: "220781", label: "扶余市", identification: "district" },
          { code: "220721", label: "前郭尔罗斯蒙古族自治县", identification: "district" },
          { code: "220702", label: "宁江区", identification: "district" }
        ]
      },
      {
        code: "222400",
        label: "延边朝鲜族自治州",
        identification: "city",
        children: [
          { code: "222404", label: "珲春市", identification: "district" },
          { code: "222402", label: "图们市", identification: "district" },
          { code: "222406", label: "和龙市", identification: "district" },
          { code: "222424", label: "汪清县", identification: "district" },
          { code: "222401", label: "延吉市", identification: "district" },
          { code: "222426", label: "安图县", identification: "district" },
          { code: "222403", label: "敦化市", identification: "district" },
          { code: "222405", label: "龙井市", identification: "district" }
        ]
      },
      {
        code: "220300",
        label: "四平市",
        identification: "city",
        children: [
          { code: "220303", label: "铁东区", identification: "district" },
          { code: "220382", label: "双辽市", identification: "district" },
          { code: "220322", label: "梨树县", identification: "district" },
          { code: "220302", label: "铁西区", identification: "district" },
          { code: "220323", label: "伊通满族自治县", identification: "district" }
        ]
      },
      {
        code: "220500",
        label: "通化市",
        identification: "city",
        children: [
          { code: "220503", label: "二道江区", identification: "district" },
          { code: "220502", label: "东昌区", identification: "district" },
          { code: "220521", label: "通化县", identification: "district" },
          { code: "220524", label: "柳河县", identification: "district" },
          { code: "220523", label: "辉南县", identification: "district" },
          { code: "220581", label: "梅河口市", identification: "district" },
          { code: "220582", label: "集安市", identification: "district" }
        ]
      },
      {
        code: "220600",
        label: "白山市",
        identification: "city",
        children: [
          { code: "220622", label: "靖宇县", identification: "district" },
          { code: "220605", label: "江源区", identification: "district" },
          { code: "220621", label: "抚松县", identification: "district" },
          { code: "220623", label: "长白朝鲜族自治县", identification: "district" },
          { code: "220681", label: "临江市", identification: "district" },
          { code: "220602", label: "浑江区", identification: "district" }
        ]
      },
      {
        code: "220400",
        label: "辽源市",
        identification: "city",
        children: [
          { code: "220403", label: "西安区", identification: "district" },
          { code: "220422", label: "东辽县", identification: "district" },
          { code: "220402", label: "龙山区", identification: "district" },
          { code: "220421", label: "东丰县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "530000",
    label: "云南省",
    identification: "province",
    children: [
      {
        code: "530600",
        label: "昭通市",
        identification: "city",
        children: [
          { code: "530626", label: "绥江县", identification: "district" },
          { code: "530681", label: "水富市", identification: "district" },
          { code: "530625", label: "永善县", identification: "district" },
          { code: "530624", label: "大关县", identification: "district" },
          { code: "530629", label: "威信县", identification: "district" },
          { code: "530622", label: "巧家县", identification: "district" },
          { code: "530628", label: "彝良县", identification: "district" },
          { code: "530621", label: "鲁甸县", identification: "district" },
          { code: "530623", label: "盐津县", identification: "district" },
          { code: "530627", label: "镇雄县", identification: "district" },
          { code: "530602", label: "昭阳区", identification: "district" }
        ]
      },
      {
        code: "530300",
        label: "曲靖市",
        identification: "city",
        children: [
          { code: "530326", label: "会泽县", identification: "district" },
          { code: "530304", label: "马龙区", identification: "district" },
          { code: "530325", label: "富源县", identification: "district" },
          { code: "530381", label: "宣威市", identification: "district" },
          { code: "530303", label: "沾益区", identification: "district" },
          { code: "530323", label: "师宗县", identification: "district" },
          { code: "530324", label: "罗平县", identification: "district" },
          { code: "530322", label: "陆良县", identification: "district" },
          { code: "530302", label: "麒麟区", identification: "district" }
        ]
      },
      {
        code: "532500",
        label: "红河哈尼族彝族自治州",
        identification: "city",
        children: [
          { code: "532504", label: "弥勒市", identification: "district" },
          { code: "532524", label: "建水县", identification: "district" },
          { code: "532502", label: "开远市", identification: "district" },
          { code: "532529", label: "红河县", identification: "district" },
          { code: "532523", label: "屏边苗族自治县", identification: "district" },
          { code: "532528", label: "元阳县", identification: "district" },
          { code: "532531", label: "绿春县", identification: "district" },
          { code: "532530", label: "金平苗族瑶族傣族自治县", identification: "district" },
          { code: "532501", label: "个旧市", identification: "district" },
          { code: "532532", label: "河口瑶族自治县", identification: "district" },
          { code: "532525", label: "石屏县", identification: "district" },
          { code: "532503", label: "蒙自市", identification: "district" },
          { code: "532527", label: "泸西县", identification: "district" }
        ]
      },
      {
        code: "533300",
        label: "怒江傈僳族自治州",
        identification: "city",
        children: [
          { code: "533324", label: "贡山独龙族怒族自治县", identification: "district" },
          { code: "533323", label: "福贡县", identification: "district" },
          { code: "533325", label: "兰坪白族普米族自治县", identification: "district" },
          { code: "533301", label: "泸水市", identification: "district" }
        ]
      },
      {
        code: "530400",
        label: "玉溪市",
        identification: "city",
        children: [
          { code: "530425", label: "易门县", identification: "district" },
          { code: "530424", label: "华宁县", identification: "district" },
          { code: "530402", label: "红塔区", identification: "district" },
          { code: "530426", label: "峨山彝族自治县", identification: "district" },
          { code: "530403", label: "江川区", identification: "district" },
          { code: "530423", label: "通海县", identification: "district" },
          { code: "530481", label: "澄江市", identification: "district" },
          { code: "530428", label: "元江哈尼族彝族傣族自治县", identification: "district" },
          { code: "530427", label: "新平彝族傣族自治县", identification: "district" }
        ]
      },
      {
        code: "532900",
        label: "大理白族自治州",
        identification: "city",
        children: [
          { code: "532932", label: "鹤庆县", identification: "district" },
          { code: "532929", label: "云龙县", identification: "district" },
          { code: "532930", label: "洱源县", identification: "district" },
          { code: "532931", label: "剑川县", identification: "district" },
          { code: "532924", label: "宾川县", identification: "district" },
          { code: "532901", label: "大理市", identification: "district" },
          { code: "532922", label: "漾濞彝族自治县", identification: "district" },
          { code: "532928", label: "永平县", identification: "district" },
          { code: "532927", label: "巍山彝族回族自治县", identification: "district" },
          { code: "532923", label: "祥云县", identification: "district" },
          { code: "532926", label: "南涧彝族自治县", identification: "district" },
          { code: "532925", label: "弥渡县", identification: "district" }
        ]
      },
      {
        code: "530800",
        label: "普洱市",
        identification: "city",
        children: [
          { code: "530825", label: "镇沅彝族哈尼族拉祜族自治县", identification: "district" },
          { code: "530822", label: "墨江哈尼族自治县", identification: "district" },
          { code: "530824", label: "景谷傣族彝族自治县", identification: "district" },
          { code: "530828", label: "澜沧拉祜族自治县", identification: "district" },
          { code: "530829", label: "西盟佤族自治县", identification: "district" },
          { code: "530826", label: "江城哈尼族彝族自治县", identification: "district" },
          { code: "530823", label: "景东彝族自治县", identification: "district" },
          { code: "530827", label: "孟连傣族拉祜族佤族自治县", identification: "district" },
          { code: "530802", label: "思茅区", identification: "district" },
          { code: "530821", label: "宁洱哈尼族彝族自治县", identification: "district" }
        ]
      },
      {
        code: "533400",
        label: "迪庆藏族自治州",
        identification: "city",
        children: [
          { code: "533422", label: "德钦县", identification: "district" },
          { code: "533401", label: "香格里拉市", identification: "district" },
          { code: "533423", label: "维西傈僳族自治县", identification: "district" }
        ]
      },
      {
        code: "532300",
        label: "楚雄彝族自治州",
        identification: "city",
        children: [
          { code: "532326", label: "大姚县", identification: "district" },
          { code: "532328", label: "元谋县", identification: "district" },
          { code: "532325", label: "姚安县", identification: "district" },
          { code: "532323", label: "牟定县", identification: "district" },
          { code: "532302", label: "禄丰市", identification: "district" },
          { code: "532301", label: "楚雄市", identification: "district" },
          { code: "532322", label: "双柏县", identification: "district" },
          { code: "532329", label: "武定县", identification: "district" },
          { code: "532327", label: "永仁县", identification: "district" },
          { code: "532324", label: "南华县", identification: "district" }
        ]
      },
      {
        code: "530100",
        label: "昆明市",
        identification: "city",
        children: [
          { code: "530113", label: "东川区", identification: "district" },
          { code: "530129", label: "寻甸回族彝族自治县", identification: "district" },
          { code: "530102", label: "五华区", identification: "district" },
          { code: "530125", label: "宜良县", identification: "district" },
          { code: "530115", label: "晋宁区", identification: "district" },
          { code: "530124", label: "富民县", identification: "district" },
          { code: "530181", label: "安宁市", identification: "district" },
          { code: "530112", label: "西山区", identification: "district" },
          { code: "530127", label: "嵩明县", identification: "district" },
          { code: "530111", label: "官渡区", identification: "district" },
          { code: "530114", label: "呈贡区", identification: "district" },
          { code: "530128", label: "禄劝彝族苗族自治县", identification: "district" },
          { code: "530103", label: "盘龙区", identification: "district" },
          { code: "530126", label: "石林彝族自治县", identification: "district" }
        ]
      },
      {
        code: "530900",
        label: "临沧市",
        identification: "city",
        children: [
          { code: "530921", label: "凤庆县", identification: "district" },
          { code: "530922", label: "云县", identification: "district" },
          { code: "530902", label: "临翔区", identification: "district" },
          { code: "530926", label: "耿马傣族佤族自治县", identification: "district" },
          { code: "530925", label: "双江拉祜族佤族布朗族傣族自治县", identification: "district" },
          { code: "530927", label: "沧源佤族自治县", identification: "district" },
          { code: "530924", label: "镇康县", identification: "district" },
          { code: "530923", label: "永德县", identification: "district" }
        ]
      },
      {
        code: "533100",
        label: "德宏傣族景颇族自治州",
        identification: "city",
        children: [
          { code: "533122", label: "梁河县", identification: "district" },
          { code: "533103", label: "芒市", identification: "district" },
          { code: "533123", label: "盈江县", identification: "district" },
          { code: "533124", label: "陇川县", identification: "district" },
          { code: "533102", label: "瑞丽市", identification: "district" }
        ]
      },
      {
        code: "530500",
        label: "保山市",
        identification: "city",
        children: [
          { code: "530581", label: "腾冲市", identification: "district" },
          { code: "530502", label: "隆阳区", identification: "district" },
          { code: "530521", label: "施甸县", identification: "district" },
          { code: "530523", label: "龙陵县", identification: "district" },
          { code: "530524", label: "昌宁县", identification: "district" }
        ]
      },
      {
        code: "530700",
        label: "丽江市",
        identification: "city",
        children: [
          { code: "530724", label: "宁蒗彝族自治县", identification: "district" },
          { code: "530722", label: "永胜县", identification: "district" },
          { code: "530702", label: "古城区", identification: "district" },
          { code: "530721", label: "玉龙纳西族自治县", identification: "district" },
          { code: "530723", label: "华坪县", identification: "district" }
        ]
      },
      {
        code: "532600",
        label: "文山壮族苗族自治州",
        identification: "city",
        children: [
          { code: "532626", label: "丘北县", identification: "district" },
          { code: "532627", label: "广南县", identification: "district" },
          { code: "532622", label: "砚山县", identification: "district" },
          { code: "532601", label: "文山市", identification: "district" },
          { code: "532623", label: "西畴县", identification: "district" },
          { code: "532624", label: "麻栗坡县", identification: "district" },
          { code: "532625", label: "马关县", identification: "district" },
          { code: "532628", label: "富宁县", identification: "district" }
        ]
      },
      {
        code: "532800",
        label: "西双版纳傣族自治州",
        identification: "city",
        children: [
          { code: "532822", label: "勐海县", identification: "district" },
          { code: "532823", label: "勐腊县", identification: "district" },
          { code: "532801", label: "景洪市", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "360000",
    label: "江西省",
    identification: "province",
    children: [
      {
        code: "360500",
        label: "新余市",
        identification: "city",
        children: [
          { code: "360502", label: "渝水区", identification: "district" },
          { code: "360521", label: "分宜县", identification: "district" }
        ]
      },
      {
        code: "360100",
        label: "南昌市",
        identification: "city",
        children: [
          { code: "360104", label: "青云谱区", identification: "district" },
          { code: "360111", label: "青山湖区", identification: "district" },
          { code: "360124", label: "进贤县", identification: "district" },
          { code: "360102", label: "东湖区", identification: "district" },
          { code: "360113", label: "红谷滩区", identification: "district" },
          { code: "360112", label: "新建区", identification: "district" },
          { code: "360123", label: "安义县", identification: "district" },
          { code: "360103", label: "西湖区", identification: "district" },
          { code: "360121", label: "南昌县", identification: "district" }
        ]
      },
      {
        code: "360800",
        label: "吉安市",
        identification: "city",
        children: [
          { code: "360802", label: "吉州区", identification: "district" },
          { code: "360822", label: "吉水县", identification: "district" },
          { code: "360825", label: "永丰县", identification: "district" },
          { code: "360830", label: "永新县", identification: "district" },
          { code: "360828", label: "万安县", identification: "district" },
          { code: "360823", label: "峡江县", identification: "district" },
          { code: "360881", label: "井冈山市", identification: "district" },
          { code: "360824", label: "新干县", identification: "district" },
          { code: "360821", label: "吉安县", identification: "district" },
          { code: "360827", label: "遂川县", identification: "district" },
          { code: "360803", label: "青原区", identification: "district" },
          { code: "360826", label: "泰和县", identification: "district" },
          { code: "360829", label: "安福县", identification: "district" }
        ]
      },
      {
        code: "360900",
        label: "宜春市",
        identification: "city",
        children: [
          { code: "360981", label: "丰城市", identification: "district" },
          { code: "360926", label: "铜鼓县", identification: "district" },
          { code: "360922", label: "万载县", identification: "district" },
          { code: "360902", label: "袁州区", identification: "district" },
          { code: "360921", label: "奉新县", identification: "district" },
          { code: "360983", label: "高安市", identification: "district" },
          { code: "360982", label: "樟树市", identification: "district" },
          { code: "360925", label: "靖安县", identification: "district" },
          { code: "360924", label: "宜丰县", identification: "district" },
          { code: "360923", label: "上高县", identification: "district" }
        ]
      },
      {
        code: "360700",
        label: "赣州市",
        identification: "city",
        children: [
          { code: "360730", label: "宁都县", identification: "district" },
          { code: "360781", label: "瑞金市", identification: "district" },
          { code: "360735", label: "石城县", identification: "district" },
          { code: "360731", label: "于都县", identification: "district" },
          { code: "360734", label: "寻乌县", identification: "district" },
          { code: "360725", label: "崇义县", identification: "district" },
          { code: "360783", label: "龙南市", identification: "district" },
          { code: "360729", label: "全南县", identification: "district" },
          { code: "360726", label: "安远县", identification: "district" },
          { code: "360733", label: "会昌县", identification: "district" },
          { code: "360722", label: "信丰县", identification: "district" },
          { code: "360704", label: "赣县区", identification: "district" },
          { code: "360728", label: "定南县", identification: "district" },
          { code: "360724", label: "上犹县", identification: "district" },
          { code: "360702", label: "章贡区", identification: "district" },
          { code: "360703", label: "南康区", identification: "district" },
          { code: "360723", label: "大余县", identification: "district" },
          { code: "360732", label: "兴国县", identification: "district" }
        ]
      },
      {
        code: "360200",
        label: "景德镇市",
        identification: "city",
        children: [
          { code: "360222", label: "浮梁县", identification: "district" },
          { code: "360202", label: "昌江区", identification: "district" },
          { code: "360203", label: "珠山区", identification: "district" },
          { code: "360281", label: "乐平市", identification: "district" }
        ]
      },
      {
        code: "361100",
        label: "上饶市",
        identification: "city",
        children: [
          { code: "361125", label: "横峰县", identification: "district" },
          { code: "361130", label: "婺源县", identification: "district" },
          { code: "361123", label: "玉山县", identification: "district" },
          { code: "361181", label: "德兴市", identification: "district" },
          { code: "361124", label: "铅山县", identification: "district" },
          { code: "361103", label: "广丰区", identification: "district" },
          { code: "361126", label: "弋阳县", identification: "district" },
          { code: "361127", label: "余干县", identification: "district" },
          { code: "361104", label: "广信区", identification: "district" },
          { code: "361102", label: "信州区", identification: "district" },
          { code: "361129", label: "万年县", identification: "district" },
          { code: "361128", label: "鄱阳县", identification: "district" }
        ]
      },
      {
        code: "360300",
        label: "萍乡市",
        identification: "city",
        children: [
          { code: "360302", label: "安源区", identification: "district" },
          { code: "360321", label: "莲花县", identification: "district" },
          { code: "360322", label: "上栗县", identification: "district" },
          { code: "360323", label: "芦溪县", identification: "district" },
          { code: "360313", label: "湘东区", identification: "district" }
        ]
      },
      {
        code: "361000",
        label: "抚州市",
        identification: "city",
        children: [
          { code: "361024", label: "崇仁县", identification: "district" },
          { code: "361028", label: "资溪县", identification: "district" },
          { code: "361021", label: "南城县", identification: "district" },
          { code: "361025", label: "乐安县", identification: "district" },
          { code: "361022", label: "黎川县", identification: "district" },
          { code: "361030", label: "广昌县", identification: "district" },
          { code: "361027", label: "金溪县", identification: "district" },
          { code: "361002", label: "临川区", identification: "district" },
          { code: "361023", label: "南丰县", identification: "district" },
          { code: "361026", label: "宜黄县", identification: "district" },
          { code: "361003", label: "东乡区", identification: "district" }
        ]
      },
      {
        code: "360600",
        label: "鹰潭市",
        identification: "city",
        children: [
          { code: "360603", label: "余江区", identification: "district" },
          { code: "360602", label: "月湖区", identification: "district" },
          { code: "360681", label: "贵溪市", identification: "district" }
        ]
      },
      {
        code: "360400",
        label: "九江市",
        identification: "city",
        children: [
          { code: "360404", label: "柴桑区", identification: "district" },
          { code: "360483", label: "庐山市", identification: "district" },
          { code: "360402", label: "濂溪区", identification: "district" },
          { code: "360428", label: "都昌县", identification: "district" },
          { code: "360426", label: "德安县", identification: "district" },
          { code: "360481", label: "瑞昌市", identification: "district" },
          { code: "360403", label: "浔阳区", identification: "district" },
          { code: "360423", label: "武宁县", identification: "district" },
          { code: "360424", label: "修水县", identification: "district" },
          { code: "360430", label: "彭泽县", identification: "district" },
          { code: "360429", label: "湖口县", identification: "district" },
          { code: "360482", label: "共青城市", identification: "district" },
          { code: "360425", label: "永修县", identification: "district" }
        ]
      }
    ]
  },
  {
    code: "110000",
    label: "北京市",
    identification: "province",
    children: [
      {
        code: "110100",
        label: "北京城区",
        identification: "city",
        children: [
          { code: "110116", label: "怀柔区", identification: "district" },
          { code: "110109", label: "门头沟区", identification: "district" },
          { code: "110117", label: "平谷区", identification: "district" },
          { code: "110118", label: "密云区", identification: "district" },
          { code: "110107", label: "石景山区", identification: "district" },
          { code: "110102", label: "西城区", identification: "district" },
          { code: "110108", label: "海淀区", identification: "district" },
          { code: "110113", label: "顺义区", identification: "district" },
          { code: "110114", label: "昌平区", identification: "district" },
          { code: "110119", label: "延庆区", identification: "district" },
          { code: "110111", label: "房山区", identification: "district" },
          { code: "110105", label: "朝阳区", identification: "district" },
          { code: "110106", label: "丰台区", identification: "district" },
          { code: "110101", label: "东城区", identification: "district" },
          { code: "110115", label: "大兴区", identification: "district" },
          { code: "110112", label: "通州区", identification: "district" }
        ]
      }
    ]
  }
];

export const setGlobalCity = (data: any) => {
  const treeData = cloneDeep(data);
  if (!treeData || !treeData.length) return [];
  const traverseTrees = (data: any) => {
    for (const item of data) {
      Object.assign(item, {
        label: item.label,
        value: item.code,
        children: item.children
      });
      // 处理没有 children 或 children 为空的情况
      if (!item.children || item.children.length === 0) {
        item.children = [
          {
            code: `${item.code}_placeholder`,
            label: "暂无数据",
            identification: "placeholder",
            value: `${item.code}_placeholder`,
            disabled: true
          }
        ];
        item.disabled = true;
      } else {
        traverseTrees(item.children);
      }
    }
  };
  traverseTrees(treeData);
  return treeData;
};
