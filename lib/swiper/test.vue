<template>
  <div>
    <Swiper v-model="currentIndex">
      <SwiperItem v-for="item in list" :key="item">
        {{ item }}
      </SwiperItem>
    </Swiper>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import Swiper from './swiper.vue';
import SwiperItem from './swiperItem.vue';
const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const currentIndex = ref(0)
</script>
