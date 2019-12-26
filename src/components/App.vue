<template>
	<Login />
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import Login from '@/components/Login.vue';

export default createComponent({
	components: {
		Login
	}
});
</script>
