<template>
    <div class="canvas-bg">
        <canvas id="canvas"></canvas>
    </div>
</template>

<script>
import CanvasBgWithEvent from './scripts/CanvasBgWithEvent'

export default {
    data() {
        return {}
    },
    mounted() {
        let inst = new CanvasBgWithEvent({
            dom: document.querySelector('#canvas')
        })
    }
}
</script>

<style scoped>
.canvas-bg {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
    /* background: #aaa; */
}

#canvas {
    width: 100%;
    height: 100%;
}
</style>
