<template>
    <div id="container"></div>

    <el-drawer v-model="drawerOpen" direction="rtl" :with-header="false" :size="'450px'">
        <div class="w-full">
            <div class="text-gray-600 mb-5">点位信息</div>
            <el-form :label-position="'left'" :require-asterisk-position="'right'" label-width="90px">
                <el-form-item label="点位名称" :required="true">
                    <el-input v-model="marker.name" placeholder="点位名称" maxlength="16" clearable />
                </el-form-item>

                <el-form-item label="坐标">
                    <div class="w-[150px]">
                        <el-input v-model="marker.lng" type="number" placeholder="经度" clearable />
                    </div>

                    <div class="w-[150px] ml-auto">
                        <el-input v-model="marker.lat" type="number" placeholder="纬度" clearable />
                    </div>
                </el-form-item>

                <el-form-item label="坐标地址">
                    <el-input v-model="marker.address" placeholder="坐标地址" maxlength="64" clearable />
                </el-form-item>

                <el-form-item label="介绍">
                    <el-input v-model="marker.introduction" type="textarea" placeholder="请介绍一下点位" maxlength="520" clearable />
                </el-form-item>

                <el-form-item label=" ">
                    <el-button v-if="isEditMarker" type="primary" @click="saveEditMarker">确定</el-button>
                    <el-button v-else type="primary" @click="saveAddMarker">确定</el-button>
                </el-form-item>
            </el-form>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";

interface Marker {
    name: string
    lng: number
    lat: number
    address: string
    introduction: string
}

enum MenuLabel {
    ADD = '添加标记',
    EDIT = '修改标记',
    DELETE = '删除标记'
}

const drawerOpen = ref<boolean>(false)
const isEditMarker = ref<boolean>(false)
const marker = ref<Marker>({
    name: '',
    lng: 0,
    lat: 0,
    address: '',
    introduction: ''
})

let map: AMap.Map
let contextMenuPositon: AMap.LngLat
let contextMenu: AMap.ContextMenu
let curMarker: AMap.Marker | null

// 右键菜单
const addContent = `
    <div class='context_menu'>
        <p id="addBtn">${MenuLabel.ADD}</p>
    </div>
    `

const setContent = `
    <div class='context_menu'>
        <p id="editBtn">${MenuLabel.EDIT}</p>
    </div>
    <div class='context_menu'>
        <p id="delBtn">${MenuLabel.DELETE}</p>
    </div>
    `

const demoData: Marker[] = [
    {
        "name": "一嗨租车",
        "lng": 121.334799,
        "lat": 31.240639,
        "address": "",
        "introduction": ""
    },
    {
        "name": "一尺视界",
        "lng": 121.331404,
        "lat": 31.236304,
        "address": "",
        "introduction": ""
    },
    {
        "name": "海底捞",
        "lng": 121.326178,
        "lat": 31.240227,
        "address": "",
        "introduction": ""
    }
]

onMounted(() => {
    AMapLoader.load({
        key: "06d090d6c157fee712fa801a97608d3b", // 申请好的Web端开发者Key，首次调用 load 时必填
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: ['AMap.Scale'], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
    })
        .then(() => {
            map = new AMap.Map("container", {
                // 设置地图容器id
                showLabel: true,
                viewMode: "2D", // 是否为3D地图模式
                zoom: 15.12, // 初始化地图级别
                center: [121.334569, 31.241213], // 初始化地图中心点位置
                mapStyle: "amap://styles/normal",
            });

            if (map) {
                map.addControl(new AMap.Scale())

                // 添加默认中心点标记
                // map.add(new AMap.Marker({
                //     position: map.getCenter()
                // }));

                contextMenu = new AMap.ContextMenu({
                    isCustom: true,
                    content: addContent,
                });

                bindContextMenuEvents()

                // AMap.Event.addListener(contextMenu, 'click', function (e: any) {})

                // 右键添加
                map.on("rightclick", function (e: any) {
                    contextMenuPositon = e.lnglat;

                    doRightclick(addContent, e.lnglat)
                });

                initDemoData()
            }
        })
        .catch((e) => {
            console.log(e);
        });
},)

onUnmounted(() => {
    map?.destroy()
})

function initDemoData() {
    if (map) {
        for (const temp of demoData) {
            const tempPos = new AMap.LngLat(temp.lng, temp.lat)
            const newMarker = new AMap.Marker({
                map: map,
                icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
                label: {
                    direction: "top-center",
                    offset: new AMap.Pixel(0, -8),
                    content: temp.name
                },
                anchor: "bottom-center",
                position: tempPos
            });

            newMarker.setExtData({ ...temp })

            const newCircle = new AMap.CircleMarker({
                center: tempPos, //圆心位置
                radius: 16, //半径
                strokeColor: "#1dbac7", //线颜色
                strokeOpacity: 0.8, //线透明度
                strokeWeight: 1, //线粗细度
                fillColor: "#2ad0c3", //填充颜色
                fillOpacity: 0.35, //填充透明度
            })
            newCircle.setExtData({ ...tempPos })
            map.add(newCircle)


            // 标记右键编辑删除
            newMarker.on('rightclick', onMarkerRightclick)
        }
    }
}

function saveEditMarker() {
    if (!marker.value.name) {
        ElMessage({
            message: '请填写点位名称',
            type: 'warning',
        })
        return
    }

    drawerOpen.value = false

    if (curMarker) {
        curMarker.setLabel({
            direction: "top-center",
            offset: new AMap.Pixel(0, -8),
            content: marker.value.name,
        })
        curMarker.setExtData({ ...marker.value })
    }
}

function saveAddMarker() {
    if (!marker.value.name) {
        ElMessage({
            message: '请填写点位名称',
            type: 'warning',
        })
        return
    }

    drawerOpen.value = false

    const newMarker = new AMap.Marker({
        map: map,
        icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
        label: {
            direction: "top-center",
            offset: new AMap.Pixel(0, -8),
            content: marker.value.name,
        },
        anchor: "bottom-center",
        position: contextMenuPositon
    });

    newMarker.setExtData({ ...marker.value })

    const newCircle = new AMap.CircleMarker({
        center: contextMenuPositon, //圆心位置
        radius: 16, //半径
        strokeColor: "#1dbac7", //线颜色
        strokeOpacity: 0.8, //线透明度
        strokeWeight: 1, //线粗细度
        fillColor: "#2ad0c3", //填充颜色
        fillOpacity: 0.35, //填充透明度
    })
    newCircle.setExtData({ ...contextMenuPositon })
    map.add(newCircle)


    // 标记右键编辑删除
    newMarker.on('rightclick', onMarkerRightclick)
}

function onMarkerRightclick(e: any) {
    curMarker = e.target

    doRightclick(setContent, e.lnglat)
}

function doRightclick(content: string, lnglat: AMap.Vector2) {
    unbindContextMenuEvents()

    contextMenu?.setContent(content)

    contextMenu?.open(map, lnglat);

    bindContextMenuEvents()
}

function bindContextMenuEvents() {
    nextTick(() => {
        document.getElementById('addBtn')?.addEventListener('click', addHandler)
        document.getElementById('editBtn')?.addEventListener('click', editHandler)
        document.getElementById('delBtn')?.addEventListener('click', delHandler)
    })
}

function unbindContextMenuEvents() {
    document.getElementById('addBtn')?.removeEventListener('click', addHandler)
    document.getElementById('editBtn')?.removeEventListener('click', editHandler)
    document.getElementById('delBtn')?.removeEventListener('click', delHandler)
}

function addHandler() {
    contextMenu?.close()

    isEditMarker.value = false

    marker.value = {
        name: '',
        lng: contextMenuPositon.lng,
        lat: contextMenuPositon.lat,
        address: '',
        introduction: ''
    }
    drawerOpen.value = true
}

function editHandler() {
    contextMenu?.close()

    isEditMarker.value = true

    const data = curMarker?.getExtData()
    if (data) {
        marker.value = { ...data }

        drawerOpen.value = true
    }
}

function delHandler() {
    contextMenu?.close()

    curMarker?.off('rightclick', onMarkerRightclick)

    curMarker?.setMap(null)

    // 删除对应的圆形覆盖物
    const markers = map.getAllOverlays('marker')
    for (const temp of markers) {
        if (temp.className === 'Overlay.CircleMarker') {
            const tempPos: AMap.LngLat = temp.getExtData()
            const curPos: AMap.LngLat | null | undefined = curMarker?.getPosition()
            if (tempPos && curPos && tempPos.lat === curPos.lat && tempPos.lng === curPos.lng) {
                map.remove(temp)
            }
        }
    }

    curMarker = null
}

function fun1() {
    //获取所有已经添加的覆盖物
    const s1 = map.getAllOverlays();
    console.log(s1)
    //只获取所有已经添加的 marker
    const s2 = map.getAllOverlays('marker');
    console.log(s2)
}

function fun2() {
    map.clearMap();
}

function fun3() {
    const list = []
    const markers = map.getAllOverlays('marker')
    for (const temp of markers) {
        if (temp.className === 'AMap.Marker') {
            list.push(temp.getExtData())
        }
    }
    console.log(list)
    console.log(JSON.stringify(list))
}
</script>

<!-- 自定义点标记 https://lbs.amap.com/api/javascript-api-v2/guide/amap-marker/custom-marker -->
<!-- 点标记偏移量 https://lbs.amap.com/api/javascript-api-v2/guide/amap-marker/marker-anchor-offset -->

<style>
#container {
    width: 100%;
    height: 100vh;
}

/* 右键菜单的样式 */
.amap-menu {
    margin-left: 20px;
    margin-top: -14px;
    box-shadow: 0 2px 6px 0 rgba(114, 124, 245, .5);
    background-color: white;
    border-radius: 4px;
}

.context_menu {
    position: relative;
    min-width: 100px;
}

.context_menu p {
    cursor: pointer;
    font-size: 12px;
    padding: 6px 12px 4px 12px;
    caret-color: transparent;
    border-radius: 4px;
    background-color: white;
}

.context_menu p:hover {
    background: #ccc;
}

/* label 的样式 */
.amap-marker-label {
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
}
</style>