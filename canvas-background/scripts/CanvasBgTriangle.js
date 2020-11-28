import CanvasBg from './CanvasBg'
import { getDistance } from './CanvasBg'

const TOLERANCE = 200
// 点击聚拢失效时间
const TIME_INTERVAL = 1.5 * 1000
const SPEED = 0.01


/**
 * 生成三角形
 */
class CanvasBgTriangle extends CanvasBg {
    constructor(options) {
        super(options)

        this.bindEvents()
    }

    draw() {
        this.clear()

        let { nodes = [], polygons = [] } = this
        polygons.forEach(polygon => {
            this.drawSinglePolygon(polygon)
        })
        nodes.forEach(node => {
            this.drawSingleNode(node)
        })
        this.animate()
    }

    drawSinglePolygon(polygon) {
        const { ctx } = this.getOption()
        ctx.save()
        ctx.beginPath()
        polygon.forEach(({0: y, 1: x}, idx) => {
            !idx ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        this.setPolygonStyle(polygon)
        ctx.fill()
        ctx.restore()
    }

    setPolygonStyle(polygon) {

    }

    update() {
        const { nodes, clickPoint } = this
        nodes.forEach(node => {
            let { top, left, deltaX, deltaY } = node
            if (clickPoint) {
                const { pos: { left: $left, top: $top } } = clickPoint
                let distance = getDistance(top, left, $top, $left)
                if (distance > 0 && distance < TOLERANCE) {
                    deltaY = ($top - top) * SPEED
                    deltaX = ($left - left) * SPEED
                }
            }
            node["top"] += deltaY
            node["left"] += deltaX
        })

        // 超时退出
        if (clickPoint) {
            const { timestamp } = clickPoint
            if (timestamp && (new Date()).getTime() - timestamp > TIME_INTERVAL) {
                delete this.clickPoint
            }
        }

        this.refreshNodes()
        return this
    }

    bindEvents() {
        window.addEventListener("click", this.onSingleClick.bind(this))
        return this
    }

    // 周边的节点往此靠拢
    onSingleClick(e) {
        const { clientX: left, clientY: top } = e
        Object.assign(this, {
            clickPoint: {
                pos: {
                    left,
                    top
                },
                timestamp: (new Date()).getTime()
            }
        })
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
            }
        }
        this.refreshPolygons()
    }

    // 根据节点情况，计算每个节点的最近，任意绘制三角形
    refreshPolygons() {
        let { nodes } = this
        let polygons = [], connected_count = 0
        for (let i = 0; i < nodes.length; i++) {
            connected_count = 0
            let node = nodes[i]
            const { top, left } = node
            let temp = nodes.slice(0, i).concat(nodes.slice(Math.min(i + 1, nodes.length)))
            temp.sort(({ top: $top_a, left: $left_a }, { top: $top_b, left: $left_b }) => getDistance(top, left, $top_a, $left_a) - getDistance(top, left, $top_b, $left_b))
            polygons.push(
                this.createPolygon(temp.slice(0, 2).concat(node))
            )
        }
        Object.assign(this, {
            polygons
        })
    }

    createPolygon(nodes) {
        return nodes.map(({top, left}) => [top, left])
    }
}

export default CanvasBgTriangle