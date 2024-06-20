<template>
  <div class="swiper" ref="swiperRef">
    <div class="swiper-container" ref="swiperContainerRef">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { throttle } from '../utils'

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(['input']);
// 设备宽度
let clientWidth = 0;
// 记录手势按下时swiper的left值
let posX = 0;
// 滑动的坐标
const x: number[] = [];
const y: number[] = [];
const resizeObservers: { ob: ResizeObserver; el: Element }[] = [];
const swiperRef = ref<HTMLDivElement>();
const swiperContainerRef = ref<HTMLDivElement>();
const activeIndex = computed({
  get() {
    return props.value;
  },
  set(v) {
    emit('input', v);
  },
});
const handleChange = async (index = 0) => {
  activeIndex.value = index;
};
const handleToActiveLeft = (index: number) => {
  if (swiperContainerRef.value) {
    const children = swiperContainerRef.value.children;
    const list = children.length ? [...children] : [];
    const currentItem = list[index] as HTMLDivElement;
    const height = currentItem.offsetHeight;
    handleUpdateHeight(height);
    swiperContainerRef.value.style.left = -clientWidth * index + 'px';
  }
};
const handleUpdateHeight = (height: number) => {
  swiperContainerRef.value &&
    (swiperContainerRef.value.style.height = height + 'px');
};
const handleTouchStart = (e: TouchEvent) => {
  x[0] = e.touches[0].clientX;
  y[0] = e.touches[0].clientY;
  if (swiperContainerRef.value) {
    const leftCss =
      (swiperContainerRef.value
        .computedStyleMap()
        .get('left') as CSSUnitValue) || {};
    posX = leftCss?.value || 0;
    console.log('posX', posX);
  }
};
const handleTouchMove = (e: TouchEvent) => {
  if (Math.abs(e.touches[0].clientY - y[0]) > 60) {
    return;
  }
  x[1] = e.touches[0].clientX;
  y[1] = e.touches[0].clientY;
  const diffX = x[1] - x[0];
  if (swiperContainerRef.value) {
    if (posX + diffX >= 0) {
      swiperContainerRef.value.style.left = '0px';
      return;
    }
    if (posX + diffX <= -clientWidth * 2) {
      const children = swiperContainerRef.value.children;
      const list = children.length ? [...children] : [];
      console.log(list);
      swiperContainerRef.value.style.left = -clientWidth * 2 + 'px';
      return;
    }
    swiperContainerRef.value &&
      (swiperContainerRef.value.style.left = posX + diffX + 'px');
  }
};
const handleTouchEnd = () => {
  const diffX = x[1] - x[0];
  if (swiperContainerRef.value) {
    if (Math.abs(diffX) < 100) {
      swiperContainerRef.value.style.left =
        -clientWidth * activeIndex.value + 'px';
      return;
    }
    if (diffX < 0) {
      const index = activeIndex.value + 1 < 2 ? activeIndex.value + 1 : 2;
      handleChange(index);
    } else {
      const index = activeIndex.value - 1 > 0 ? activeIndex.value - 1 : 0;
      handleChange(index);
    }
  }
};
const handleThrottleUpdateHeight = throttle(handleUpdateHeight, 1000, {
  trailing: true,
});
const handleRegisterResize = () => {
  if (swiperContainerRef.value) {
    const children = swiperContainerRef.value.children;
    const list = children.length ? [...children] : [];
    list.forEach((el, i) => {
      const ob = new ResizeObserver(_resizeObservers => {
        if (i === activeIndex.value) {
          const currentResizeOb = _resizeObservers[0];
          handleThrottleUpdateHeight(currentResizeOb.contentRect.height);
        }
      });
      ob.observe(el);
      resizeObservers.push({
        ob,
        el,
      });
    });
  }
};
const handleDestroyResize = () => {
  resizeObservers.forEach(item => {
    item.ob.unobserve(item.el);
  });
};
const handleRegisterTouchEvent = () => {
  if (swiperRef.value) {
    swiperRef.value.addEventListener('touchstart', handleTouchStart);
    swiperRef.value.addEventListener('touchmove', handleTouchMove);
    swiperRef.value.addEventListener('touchend', handleTouchEnd);
  }
};
const handleDestroyTouchEvent = () => {
  if (swiperRef.value) {
    swiperRef.value.removeEventListener('touchstart', handleTouchStart);
    swiperRef.value.removeEventListener('touchmove', handleTouchMove);
    swiperRef.value.removeEventListener('touchend', handleTouchEnd);
  }
};

watch(activeIndex, v => {
  handleToActiveLeft(v);
});
onMounted(() => {
  clientWidth = document.body.clientWidth;
  handleRegisterTouchEvent();
  handleRegisterResize();
});
onUnmounted(() => {
  handleDestroyTouchEvent();
  handleDestroyResize();
});
</script>
<style lang="scss">
.swiper {
  overflow-x: clip;
  overflow-y: hidden;
  .swiper-container {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    min-height: calc(100vh - 34px);
    left: 0;
    transition: all 0.3s ease-out;
  }
}
</style>
