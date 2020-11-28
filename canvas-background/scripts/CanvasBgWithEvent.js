import CanvasBg from './CanvasBg'
import { getDistance } from './CanvasBg'

const TOLERANCE = 200
// 点击聚拢失效时间
const TIME_INTERVAL = 1.5 * 1000
const SPEED = 0.01

/**
 * 点击事件
*/
class CanvasBgWithEvent extends CanvasBg {
    constructor(options) {
        super(options)

        this.bindEvents()
    }

    update() {
        const { nodes, clickPoint } = this
        nodes.forEach(node => {
            let { top, left, deltaX, deltaY, size } = node
            // 运动系数根据尺寸成反比：越大移动越慢
            let speed_factor = 1 / size * 5
            if (clickPoint) {
                const {pos: { left: $left, top: $top } } = clickPoint
                let distance = getDistance(top, left, $top, $left)
                if (distance > 0 && distance < TOLERANCE) {
                    deltaY = ($top - top) * SPEED * speed_factor
                    deltaX = ($left - left) * SPEED * speed_factor
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
}

export default CanvasBgWithEvent