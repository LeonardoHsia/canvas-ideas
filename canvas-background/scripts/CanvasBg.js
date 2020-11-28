const NODE_GEOMS = [
    // {
    //     geom: "rect",
    // },
    {
        geom: "circle",
        ratio: 50
    }, 
    {
        geom: "arc",
        ratio: 5
    }
]

const CONNECT_LENGTH = 150
const CONNECT_NUM = 2

class CanvasBg {
    constructor(options) {
        let { dom = null } = options
        if (dom instanceof HTMLCanvasElement) {
            this.init(options)
        } else {
            throw new Error("请传入Canvas对象")
        }
    }

    init(options) {
        this.uuid = 0
        let { dom } = options
        Object.assign(this, {
            $dom: dom
        })

        let ctx = dom.getContext("2d")
        this.$options = {
            ctx
        }

        this.setExtent(options)

        let defaultOptions = {
            node: {
                number: 150,
                sizeRange: [2, 6],
                fill: "rgba(210,210,210, 1)",
                stroke: "rgba(210,210,210, 0.7)"
            },
            line: {
                stroke: "rgba(200, 200, 200, 0.5)"
            }
        }
        Object.assign(this.$options, defaultOptions, options)
        this.getRandomNodes().draw()
        
        this.onResize()
    }

    setExtent () {
        let { $dom: dom } = this
        let width = dom.offsetWidth,
            height = dom.offsetHeight

        // 刷新canvas的宽高
        dom.setAttribute("width", width)
        dom.setAttribute("height", height)

        Object.assign(this.$options, {
            width, height
        })

        return this
    }

    getRandomNodes() {
        // 根据定义的参数生成随机的对象
        const { number } = this.getOption("node")
        // 获取canvas的宽高
        Object.assign(this, {
            nodes: (() => {
                let nodes = []
                for (let i = 0; i < number; i++) {
                    nodes.push(this.createNode())
                }
                return nodes
            })()
        })
        return this
    }

    createNode() {
        const { width, height } = this.getOption()
        const { size = undefined, sizeRange } = this.getOption("node")
        return Object.assign({},
            {
                uuid: this.uuid++
            },
            getRandomOptions({ width, height, size, sizeRange })
        )
    }

    createLine(x1, y1, x2, y2) {
        return Object.assign({},
        {
            x1,
            x2,
            y1,
            y2
        })
    }

    draw() {
        this.clear()

        let { nodes = [], lines = [] } = this
        lines.forEach(line => {
            this.drawSingleLine(line)
        })
        nodes.forEach(node => {
            this.drawSingleNode(node)
        })
        this.animate()
    }

    drawSingleNode(node) {
        const { geom } = node
        switch (geom) {
        case "rect":
            return this.drawSingleNodeRect(node)
        case "arc":
            return this.drawSingleNodeWithArc(node)
        default:
            return this.drawSingleNodeCircle(node)
        }
    }

    drawSingleNodeCircle(node) {
        const { left: x, top: y, size, deep = 1 } = node
        const { ctx } = this.getOption()
        // 绘制尾迹
        // this.drawNodeTail(node)

        ctx.save()
        ctx.beginPath()
        this.setNodeStyle(node)
        let $size = size * (1 + deep)
        ctx.arc(x, y, $size, 0, Math.PI * 2, 1)
        ctx.fill()
        ctx.restore()

        // 状态回写
        this.saveCurrentSize(node)
    }

    drawSingleNodeWithArc(node) {
        const { left: x, top: y, size, deep = 1 } = node
        const { ctx } = this.getOption()

        ctx.save()
        ctx.beginPath()
        this.setNodeStyle(node)
        let $size = size * (1 + deep)
        ctx.arc(x, y, $size, 0, Math.PI * 2, 1)
        ctx.fill()
        ctx.restore()

        // 绘制描边
        this.drawNodeArcs(node, $size)

        // 状态回写
        this.saveCurrentSize(node)
    }

    // /**
    //  * @deprecated
    //  */
    // drawNodeTail(node) {
    //     const tailFactor = 10
    //     const { ctx, node: { fill } } = this.getOption()
    //     const { left: x, top: y, size, deltaX, deltaY} = node
    //     ctx.save()

    //     let tailLength = tailFactor * 10
    //     let gradient = ctx.createLinearGradient(x, y, x - deltaX * tailLength, y - deltaY * tailLength)
    //     gradient.addColorStop(0, fill)
    //     gradient.addColorStop(0.5, 'transparent')
    //     gradient.addColorStop(1, 'transparent')

    //     let k = deltaY / deltaX
    //     ctx.fillStyle = gradient
    //     ctx.beginPath()
    //     // ctx.moveTo(x, y)
    //     ctx.lineTo(x - k * size / (1 + Math.pow(k, 2)), y - size / (1 + Math.pow(k, 2)))
    //     ctx.lineTo(x - deltaX * tailLength, y - deltaY * tailLength)
    //     ctx.lineTo(x + k * size / (1 + Math.pow(k, 2)), y + size / (1 + Math.pow(k, 2)))
    //     // ctx.lineTo(x, y)
    //     ctx.strokeStyle = "#000"
    //     ctx.stroke()
    //     ctx.fill()
    //     ctx.restore()
    // }

    saveCurrentSize(node) {
        const { size, deep, defaultSize } = node
        let $size = size * (1 + deep)
        if (typeof defaultSize == "undefined") {
            Object.assign(node, {
                defaultSize: size
            })
        }
        Object.assign(node, {
            size: $size
        })
        let maxSize = defaultSize * 2,
            minSize = defaultSize / 2
        if (size >= maxSize) {
            Object.assign(node, {
                defaultSize: maxSize,
                deep: -deep,
                size: maxSize
            })
        } else if (size <= minSize) {
            Object.assign(node, {
                defaultSize: minSize,
                deep: -deep,
                size: minSize
            })
        }
    }

    drawSingleNodeRect(node) {
        const { left: x, top: y, size, angle } = node
        const { ctx } = this.getOption()
        ctx.save()
        ctx.beginPath()
        let centerX = x - size / 2,
            centerY = y - size / 2
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)
        this.setNodeStyle(node)
        ctx.fillRect(centerX, centerY, size, size)
        ctx.restore()
    }

    drawSingleLine(line) {
        const { ctx } = this.getOption()
        const { x1, y1, x2, y2 } = line
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        this.setLineStyle(line)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.restore()
    }

    setNodeStyle(node) {
        const { fill } = node
        const { fill: defaultFill } = this.getOption("node")
        const { ctx } = this.getOption()
        ctx.fillStyle = fill || defaultFill
    }

    drawNodeArcs (node, size) {
        const { ctx } = this.getOption()
        let { uuid: _uuid, left: x, top: y, "start-angle": startAngle = 0, "stroke-angle": angle = 360, "line-width": lineWidth = 4, stroke, direction = 1} = node
        ctx.save()
        ctx.beginPath()
        const { stroke: defaultStroke } = this.getOption("node")
        ctx.strokeStyle = stroke || defaultStroke
        lineWidth = Math.min(lineWidth, size)
        ctx.lineWidth = lineWidth
        // console.log(startAngle, startAngle + angle)
        let min = startAngle 
        ctx.arc(x, y, size + lineWidth * 2, startAngle,startAngle + angle, true)
        ctx.stroke()
        ctx.restore()

        // 回写开始角度和填充角度
        Object.assign(node, {
            "start-angle": startAngle + 0.02,
            // "stroke-angle": angle + direction * 0.001,
            direction
        })
    }

    setLineStyle(line) {
        const { stroke } = line
        const { stroke: defaultStroke } = this.getOption("line")
        const { ctx } = this.getOption()
        ctx.strokeStyle = stroke || defaultStroke
    }

    update() {
        const { nodes } = this
        nodes.forEach(node => {
            const { deltaX, deltaY } = node
            node["top"] += deltaY
            node["left"] += deltaX
        })
        this.refreshNodes()
        return this
    }

    refreshNodes() {
        const { width, height } = this.getOption()
        const { nodes } = this
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i]
            if (this.isOutOfContext(node, width, height)) {
                nodes.splice(i, 1)
                i--
                nodes.push(this.createNode())
                
                // 统计节点类型
                this.calculateNodesGeom()
            }
        }
        this.refreshLines()
    }

    calculateNodesGeom () {
        return this
        const { nodes } = this
        let arr = nodes.reduce((a, {geom}) => {
            let matched = a.find(({type}) => type == geom)
            if(matched) {
                let {count} = matched
                Object.assign(matched, {
                    count: ++count
                })
            } else {
                a.push({
                    type: geom,
                    count: 1
                })
            }
            return a
        }, [])
        console.log(arr, nodes)
    }

    refreshLines() {
        let { nodes } = this
        let lines = [], connected_count = 0
        for (let i = 0; i < nodes.length; i++) {
            connected_count = 0
            let node = nodes[i]
            const { top, left } = node
            for (let j = i + 1; j < nodes.length; j++) {
                const $node = nodes[j]
                const { top: $top, left: $left } = $node
                if (getDistance(top, left, $top, $left) < CONNECT_LENGTH && (CONNECT_NUM && CONNECT_NUM > connected_count)) {
                    connected_count++
                    lines.push(
                        this.createLine(left, top, $left, $top)
                    )
                }
            }
        }
        Object.assign(this, {
            lines
        })
    }

    isOutOfContext(node, width, height) {
        width = width || this.getOption("width")
        height = height || this.getOption("height")
        const { top, left, size } = node
        return top + size < 0 || top - size > height || left + size < 0 || left - size > width
    }

    animate() {
        window.requestAnimationFrame(this.update().draw.bind(this))
    }

    getOption(key = null) {
        return key ? this.$options[key] : this.$options
    }

    clear() {
        let { width, height, ctx } = this.getOption()
        ctx.clearRect(0, 0, width, height)
    }

    onResize () {
        window.addEventListener("resize", (e) => {
            this.setExtent()
        })
    }
}

function getRandomOptions({ width, height, size, sizeRange }) {
    const { size: $size } = getRandomSize(size, sizeRange)
    return Object.assign({},
        getRandomGeom(),
        getRandomPos(width, height),
        {size: $size},
        getRandomAngle(),
        getRandomAnim($size),
        getRandomDeep()
    )
}

let IS_GEOM_INITED = false
function getRandomGeom() {
    !IS_GEOM_INITED && initGeomRatio()
    let random = Math.random()
    let {geom} = NODE_GEOMS[0]
    NODE_GEOMS.forEach(({min, max, geom: _geom}) => {
        if((random >= min && random < max) ) {
            geom = _geom
        }
    })
    return Object.assign({}, {
        geom
    }, {
        // 若为arc，则随机一个弧边的描边
        [geom == "arc" ? "line-width": Symbol("unreachable")]: Math.random() * 10,
        [geom == "arc" ? "stroke-angle": Symbol("unreachable")]: Math.random() * 180
    })
}

// 占比归一化
function initGeomRatio () {
    IS_GEOM_INITED = true
    NODE_GEOMS.forEach(geom => {
        let {ratio = 0} = geom
        Object.assign(geom, {
            ratio
        })
    })
    let sum = NODE_GEOMS.reduce((a, {ratio = 1}) => a += ratio, 0)
    NODE_GEOMS.reduce((a, c) => {
        let {ratio} = c
        let min = a, max = a + ratio / sum
        Object.assign(c, {
            min,
            max
        })
        return max
    }, 0)
}

function getRandomPos(w, h) {
    return {
        left: +(Math.random() * w).toFixed(0),
        top: +(Math.random() * h).toFixed(0),
    }
}

function getRandomPos(w, h) {
    return {
        left: +(Math.random() * w).toFixed(0),
        top: +(Math.random() * h).toFixed(0),
    }
}

function getRandomSize(size, sizeRange) {
    if (size == null) {
        let { 0: min, 1: max } = sizeRange.map(s => Math.abs(s)).sort()
        size = (+(Math.random() * (max - min)).toFixed(0) + min)
    }
    return {
        size
    }
}

// 随机旋转角度
function getRandomAngle() {
    return {
        angle: Math.random() * 360
    }
}

function getRandomAnim(size) {
    // 自行运动时，速度和体积成反比
    const step = 1 / size
    let x = +(Math.random() * step).toFixed(2) - step / 2,
        y = +(Math.random() * step).toFixed(2) - step / 2
    return {
        deltaX: x,
        deltaY: y
    }
}

// 随机远近，[-0.001, 0.001]
function getRandomDeep() {
    let abs = Math.pow(0.02, 2)
    return {
        deep: Math.random() * abs * 2 - abs
    }
}

let uuid = 0

export function getDistance(top, left, $top, $left) {
    return Math.sqrt(Math.pow($top - top, 2) + Math.pow($left - left, 2))
}

export default CanvasBg