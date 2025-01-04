//% color=#008C8C icon="\uf26c" block="TFT24"
namespace tft24 {
    /*****************************************************************************************************
     * I2C address 0x11
     ****************************************************************************************************/
    const I2C_ADDR = 0x11;

    const CMD_SET_BACKLIGHT = 0x40;
    const CMD_DRAW_LINE = 0X10;
    const CMD_DRAW_RECT = 0x50;
    const CMD_DRAW_CIRCLE = 0x60;
    const CMD_CLEAR_SCREEN = 0x70;
    const CMD_SET_BACKGROUND_COLOR = 0x80;
    const CMD_SET_PEN_COLOR = 0x90;
    const CMD_DRAW_STRING = 0x30;
    const CMD_COORD_DRAW_STRING = 0x31;
    const CMD_CLEAR_LINE = 0x71;
    const CMD_DRAW_PROGRESS = 0xA0;
    const CMD_DRAW_CIRCULAR_LOADER = 0xA1;
    const CMD_DRAW_HISTOGRAM = 0xC0;
    const CMD_DRAW_HISTOGRAM_DATA = 0xC1;
    const CMD_DRAW_PIE_CHART = 0xC2;

    let currentRow = 0;

    export enum BlkCmdEnum {
        //%block="open"
        BlkOpen,
        //%block="close"
        BlkClose,
    }

    export enum LineNumEnum {
        //% block="1"
        Line_1 = 1,
        //% block="2"
        Line_2 = 2,
        //% block="3"
        Line_3 = 3,
        //% block="4"
        Line_4 = 4,
        //% block="5"
        Line_5 = 5,
        //% block="6"
        Line_6 = 6,
        //% block="7"
        Line_7 = 7,
        //% block="8"
        Line_8 = 8
    }

    export enum ChartNumColmun {
        //% block="1"
        Chart1 = 1,
        //% block="2"
        Chart2 = 2,
        //% block="3"
        Chart3 = 3,
        //% block="4"
        Chart4 = 4,
        //% block="5"
        Chart5 = 5,
        //% block="6"
        Chart6 = 6,
        //% block="7"
        Chart7 = 7,
        //% block="8"
        Chart8 = 8,
        //% block="9"
        Chart9 = 9,
        //% block="10"
        Chart10 = 10
    }

    export enum ChartNumGroup {
        //% block="1"
        Group1 = 1,
        //% block="2"
        Group2 = 2,
        //% block="3"
        Group3 = 3,
        //% block="4"
        Group4 = 4,
        //% block="5"
        Chart5 = 5
    }

    export enum DrawType {
        //% block="Histogram"
        Histogram = 0,
        //% block="Linechart"
        Linechart = 1
    }

    
    //% blockHidden=1
    //% blockId=LineNumEnum block="%value"
    export function selectLineNumEnum(value: LineNumEnum): number {
        return value;
    }

    //% blockHidden=1
    //% blockId=ChartNumColmun block="%value"
    export function selectChartNumColmun(value: ChartNumColmun): number {
        return value;
    }

    //% blockHidden=1
    //% blockId=ChartNumGroup block="%value"
    export function selectChartNumGroup(value: ChartNumGroup): number {
        return value;
    }

    //% blockHidden=true
    //% blockId=colorindexpicker  block="%color"
    //% color.fieldEditor="colornumber"
    //% color.fieldOptions.decompileLiterals = true
    //% color.fieldOptions.valueMode="rgb"
    //% color.fieldOptions.colours='["#000000", "#FFFFFF", "#FF0000", "#00FF00","#0000FF", "#FFFF00", "#FF00FF", "#00FFFF","#C81D31", "#EF949E", "#F5B7BF", "#FADBDF","#249087", "#7DDFD7","#A9E9E4","#D4F4F2","#588E32","#ACD78E","#C8E5B3","#E3F2D9","#B68C02","#FED961","#FEE695","#FFF2CA","#C65F10","#F5B482","#F8CDAC","#FCE6D5","#2E54A1","#91ACE0","#B6C7EA","#DAE3F5","#333F50","#8497B0","#ADB9CA","#D6DCE5", "#767171","#AFABAB","#D0CECE","#E7E6E6"]'
    //% color.fieldOptions.columns=4
    export function colorIndexPicker(color: number) {
        return color;
    }

    // coordinate
    export class DrawCoord {
        public x: number;
        public y: number;
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }
    
    //% blockHidden=1
    //% blockId=drawCoord block="X: %x Y: %y"
    export function drawCoord(x: number, y: number): DrawCoord {
        return new DrawCoord(x, y);
    }
    
    //% blockHidden=1
    //% blockId=setMinMax block="min %min max %max"
    //% min.defl=0
    //% min.min=-32767 ymin.max=32767
    //% max.defl=0
    //% max.min=-32767 ymax.max=32767
    export function setMinMax(min: number, max: number): DrawCoord {
        return new DrawCoord(min, max);
    }
    
    /**
     * 校准运行时间,防止屏还未初始化就调用函数
     */
    function blockForTask() {
        let time = 0;
        while (!pins.i2cReadNumber(I2C_ADDR, NumberFormat.Int8LE)) {
            time = input.runningTime() + 5;
            while (input.runningTime() < time) { }
        }
    }
    
    function adjustCharcode(code: number): number {
        return code < 0x20 || code > 0x7F ? 0x20 : code;
    }
    
    /******************************************************************************************************
     * 工具函数
     ******************************************************************************************************/
    export function i2cCommandSend(command: number, params: number[]) {
        let buff = pins.createBuffer(params.length + 4);
        buff[0] = 0xFF; // 帧头
        buff[1] = 0xF9; // 帧头
        buff[2] = command; // 指令
        buff[3] = params.length; // 参数长度
        for (let i = 0; i < params.length; i++) {
            buff[i + 4] = params[i];
        }
        pins.i2cWriteBuffer(I2C_ADDR, buff);
    }
    
    //% block="set backlight %cmd"
    //% weight=100
    //% group="Basic"
    export function backlightCtrl(cmd: BlkCmdEnum) {
        blockForTask();
        i2cCommandSend(CMD_SET_BACKLIGHT, [cmd == BlkCmdEnum.BlkOpen ? 0x01 : 0x00]);
    }

    //% block="clear screen"
    //% weight=98
    //% group="Basic"
    export function clearScreen() {
        blockForTask();
        i2cCommandSend(CMD_CLEAR_SCREEN, [0]);
    }

    //% block="R:%r G:%g B:%b"
    //% weight=97
    //% r.min=0 r.max=255 r.defl=255
    //% g.min=0 g.max=255 g.defl=255
    //% b.min=0 b.max=255 b.defl=255
    //% group="Basic"
    export function rgb(r: number, g: number, b: number): number {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    //% block="set background color %color"
    //% color.shadow="colorindexpicker"
    //% color.defl="#FFFFFF"
    //% group="Basic"
    //% weight=96
    export function setBackgroundColor(color: number) {
        blockForTask();
        i2cCommandSend(CMD_SET_BACKGROUND_COLOR, [
            (color >> 16) & 0xff,
            (color >> 8) & 0xff,
            color & 0xff
        ]);
    }

    //% block="set draw pen color %color"
    //% color.shadow="colorindexpicker"
    //% color.defl="#000000"
    //% weight=95
    //% group="Basic"
    export function setPenColor(color: number) {
        blockForTask();
        i2cCommandSend(CMD_SET_PEN_COLOR, [
            (color >> 16) & 0xff,
            (color >> 8) & 0xff,
            color & 0xff
        ]);
    }

    // block="show string %str"
    // weight=94
    // group="Basic"
    function showString(str: string) {
        blockForTask();
        let arr = [];
        arr.push(currentRow);
        for (let i = 0; i < str.length; i++) {
            arr.push(adjustCharcode(str.charCodeAt(i)));
        }
        arr.push(0);
        i2cCommandSend(CMD_DRAW_STRING, arr);
    }

    // block="show number %num"
    // num.defl=20
    // weight=93
    // group="Basic"
    function showNum(num: number) {
        let str = "" + num;
        showString(str);
    }

    // block="Line breaks"
    // weight=91
    // group="Basic"
    function newLine() {
        blockForTask();
        currentRow = 0;
    };

    //% block="select line %num=LineNumEnum and write string %str"
    //% weight=92
    //% group="Basic"
    export function selectLineWriteString(num: number, str: string) {
        blockForTask();
        currentRow = num - 1;
        showString(str);
    };

    //% block="select line %num=LineNumEnum clear"
    //% weight=93
    //% group="Basic"
    export function selectLineClear(num: number) {
        blockForTask();
        selectLineWriteString(num, "");
    };

    //% block="select line %num=LineNumEnum and write num %wnum"
    //% weight=90
    //% group="Basic"
    export function selectLineWriteNum(num: number, wnum: number) {
        blockForTask();
        currentRow = num - 1;
        showNum(wnum);
    };

    export function clearLine(num: number) {
        blockForTask();
        i2cCommandSend(CMD_CLEAR_LINE, [num]);
    };

    //% block="select %coord=drawCoord|write string %str"
    //% weight=85
    //% group="Basic"
    export function selectCoordWriteString(coord: DrawCoord, str: string) {
        blockForTask();
        let arr = [
            coord.x >> 8 & 0xff,
            coord.x & 0xff,
            coord.y >> 8 & 0xff,
            coord.y & 0xff,
        ];
        for (let i = 0; i < str.length; i++) {
            arr.push(adjustCharcode(str.charCodeAt(i)));
        }
        arr.push(0);
        i2cCommandSend(CMD_COORD_DRAW_STRING, arr);
    };

    //% block="select %coord=drawCoord|write num %num"
    //% weight=80
    //% group="Basic"
    export function selectCoordWriteNum(coord: DrawCoord, num: number) {
        blockForTask();
        let str = "" + num;
        selectCoordWriteString(coord, str);
    };

    //% block="draw line |start %start=drawCoord|end %end=drawCoord"
    //% weight=55
    //% group="shape"
    //% inlineInputMode=external
    export function drawLine(start: DrawCoord, end: DrawCoord) {
        blockForTask();
        i2cCommandSend(CMD_DRAW_LINE, [
            start.x >> 8 & 0xff,
            start.x & 0xff,
            start.y >> 8 & 0xff,
            start.y & 0xff,
            end.x >> 8 & 0xff,
            end.x & 0xff,
            end.y >> 8 & 0xff,
            end.y & 0xff
        ]);
    }

    //% block="draw rectange |start %start=drawCoord|end %end=drawCoord|fill:%fill"
    //% fill.defl=false
    //% weight=50
    //% group="shape"
    //% inlineInputMode=external
    export function drawRect(start: DrawCoord, end: DrawCoord, fill: boolean) {
        blockForTask();
        i2cCommandSend(CMD_DRAW_RECT, [
            start.x >> 8 & 0xff,
            start.x & 0xff,
            start.y >> 8 & 0xff,
            start.y & 0xff,
            end.x >> 8 & 0xff,
            end.x & 0xff,
            end.y >> 8 & 0xff,
            end.y & 0xff,
            fill ? 0x01 : 0x00
        ]);
    }

    //% block="draw circle|cen %cen=drawCoord|radius %r fill %fill"
    //% weight=45
    //% group="shape"
    //% inlineInputMode=external
    export function drawCircle(cen: DrawCoord, r: number, fill: boolean) {
        blockForTask();
        i2cCommandSend(CMD_DRAW_CIRCLE, [
            cen.x >> 8 & 0xff,
            cen.x & 0xff,
            cen.y >> 8 & 0xff,
            cen.y & 0xff,
            r >> 8 & 0xff,
            r & 0xff,
            fill ? 0x01 : 0x00
        ])
    }

    //% block="draw a circular loadercolor  %color"
    //% color.shadow="colorindexpicker"
    //% color.defl="#E7E6E6"
    //% weight=40
    //% group="shape"
    export function drawCircularLoader(color: number) {
        blockForTask();
        //color RGB888位转RGB565
        i2cCommandSend(CMD_DRAW_CIRCULAR_LOADER, [
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ]);
    }

    //% block="Show loading bar %percent \\%"
    //% percent.defl=50
    //% percent.min=0 percent.max=100
    //% weight=30
    //% group="shape"
    export function showLoadingBar(percent: number) {
        blockForTask();
        i2cCommandSend(CMD_DRAW_PROGRESS, [percent]);
    };

    export class GroupInfo {
        public color: number;
        public name: string;
        constructor(color: number, name: string) {
            this.color = color;
            this.name = name;
        }
    }

    //% blockHidden=1
    //% blockId=createGroupInfo block="color %color label %name"
    //% color.shadow="colorindexpicker"
    //% color.defl="#FF0000"
    export function createGroupInfo(color: number, name: string): GroupInfo {
        return new GroupInfo(color, name);
    }

    //% block="draw %drawtype|set Y %yarray=setMinMax|set column %column=ChartNumColmun|group1 %group1=createGroupInfo||group2 %group2=createGroupInfo|group3 %group3=createGroupInfo|group4 %group4=createGroupInfo|group5 %group5=createGroupInfo|"
    //% expandableArgumentMode="enabled"
    //% weight=21
    //% column.defl=1
    //% column.min=1 column.max=10
    //% group="chart"
    //% inlineInputMode=external
    export function drawChart(drawtype: DrawType, yarray: DrawCoord, column: number,
        group1: GroupInfo = null,
        group2: GroupInfo = null,
        group3: GroupInfo = null,
        group4: GroupInfo = null,
        group5: GroupInfo = null) {
        blockForTask();
        let arr = [
            yarray.x >> 8 & 0xff,
            yarray.x & 0xff,
            yarray.y >> 8 & 0xff,
            yarray.y & 0xff,
            column & 0xff,
            0,
            drawtype & 0xff
        ];
        let group_arr = [group1, group2, group3, group4, group5];
        let group_cnt = 0;
        for (let i = 0; i < 5; i++) {
            if (group_arr[i] == null) {
                break;
            }
            let len = group_arr[i].name.length;
            for (let j = 0; j < (len > 6 ? 3 : len); j++) {
                arr.push(group_arr[i].name.charCodeAt(j));
            }
            if (len > 6) {
                arr.push(".".charCodeAt(0))
                arr.push(".".charCodeAt(0))
                arr.push(".".charCodeAt(0))
            }
            arr.push(0)
            arr.push(group_arr[i].color >> 16 & 0xff)
            arr.push(group_arr[i].color >> 8 & 0xff)
            arr.push(group_arr[i].color & 0xff)
            group_cnt++;
        }
        arr[5] = group_cnt;

        i2cCommandSend(CMD_DRAW_HISTOGRAM, arr)
    }

    //% block="write chart data|set column %column=ChartNumColmun name as %name|data1 = %num1||data2 = %num2|data3 = %num3|data4 = %num4|data5 = %num5"
    //% expandableArgumentMode="enabled"
    //% weight=20
    //% column.defl=1
    //% column.min=1 column.max=10
    //% group="chart"
    //% inlineInputMode=external
    export function drawChartData(column: number, name: string, num1: number, num2: number = null, num3: number = null, num4: number = null, num5: number = null) {
        blockForTask();
        let arr = [column & 0xFF];
        let nums = [num1, num2, num3, num4, num5];
        for (let i = 0; i < 5; i++) {
            if (nums[i] != null) {
                arr.push(nums[i] >> 8 & 0xff);
                arr.push(nums[i] & 0xff);
            } else {
                arr.push(0);
                arr.push(0);
            }
        }
        for (let i = 0; i < name.length; i++) {
            arr.push(adjustCharcode(name.charCodeAt(i)));
        }
        arr.push(0);
        i2cCommandSend(CMD_DRAW_HISTOGRAM_DATA, arr)
    }

    export class PartInfo {
        public value: number;
        public name: string;
        public color: number;
        constructor(value: number, name: string, color: number) {
            this.name = name;
            this.value = value;
            this.color = color;
        }
    }

    //% blockHidden=1
    //% blockId=createPartInfo block="value %value label %name color %color"
    //% color.shadow="colorindexpicker"
    //% color.defl="#FF0000"
    export function createPartInfo(value: number, name: string, color: number): PartInfo {
        return new PartInfo(value, name, color);
    }

    //% blockId=pie block="draw pie chart|part1 %part1=createPartInfo||part2 %part2=createPartInfo|part3 %part3=createPartInfo|part4 %part4=createPartInfo|part5 %part5=createPartInfo| part6 %part6=createPartInfo|part7 %part7=createPartInfo|part8 %part8=createPartInfo|part9 %part9=createPartInfo|pie10 %part10=createPartInfo"
    //% expandableArgumentMode="enabled"
    //% weight=10
    //% group="chart"
    //% inlineInputMode=external
    export function drawPie(
        part1: PartInfo = null,
        part2: PartInfo = null,
        part3: PartInfo = null,
        part4: PartInfo = null,
        part5: PartInfo = null,
        part6: PartInfo = null,
        part7: PartInfo = null,
        part8: PartInfo = null,
        part9: PartInfo = null,
        part10: PartInfo = null) {
        blockForTask();
        let part_cnt = 0;
        let arr = [0];
        let part_arr = [part1, part2, part3, part4, part5, part6, part7, part8, part9, part10];

        for (let i = 0; i < 10; i++) {
            if (part_arr[i] == null) {
                break;
            }
            arr.push(part_arr[i].value >> 8 & 0xff);
            arr.push(part_arr[i].value & 0xff);
            let len = part_arr[i].name.length;
            for (let j = 0; j < (len > 6 ? 3 : len); j++) {
                arr.push(adjustCharcode(part_arr[i].name.charCodeAt(j)));
            }
            if (len > 6) {
                arr.push(".".charCodeAt(0))
                arr.push(".".charCodeAt(0))
                arr.push(".".charCodeAt(0))
            }
            arr.push(0)
            arr.push(part_arr[i].color >> 16 & 0xff)
            arr.push(part_arr[i].color >> 8 & 0xff)
            arr.push(part_arr[i].color & 0xff)
            part_cnt++;
        }
        arr[0] = part_cnt;

        i2cCommandSend(CMD_DRAW_PIE_CHART, arr)
    }
}