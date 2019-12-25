<template>
	<div id="app">
		<img alt="Vue logo" src="./assets/logo.png">
		<HelloWorld msg="hmm? Welcome to Your Vue.js + TypeScript App" />
	</div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import HelloWorld from './components/HelloWorld.vue';

export default createComponent({
	components: {
		HelloWorld
	}
});
</script>

<style>
	#app {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: #2c3e50;
		margin-top: 60px;
	}
</style>
