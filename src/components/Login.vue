<template>
	<section class="hero is-light is-fullheight">
		<div class="hero-body">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-5-tablet is-4-desktop is-3-widescreen">
						<div class="box">
							<b-message v-if="isError" type="is-danger">
								Domain oder apikey ungültig
							</b-message>
							<b-field label="Domain">
								<div class="field has-addons">
									<b-input v-model="domain" validation-message="Die Domain muss angegeben werden" expanded required />
									<p class="control">
										<span class="button is-static">.webling.ch</span>
									</p>
								</div>
							</b-field>
							<b-field label="API Key">
								<b-input v-model="apikey" validation-message="Ein API Key hat 32 Zeichen" minlength="32" maxlength="32" :has-counter="false" required />
							</b-field>
							<b-field>
								<b-checkbox v-model="persistent">Auf diesem Computer merken</b-checkbox>
							</b-field>
							<b-button type="is-primary" @click="submit" :disabled="isLoading">Login</b-button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script lang="ts">
import { createComponent, ref } from '@vue/composition-api';
import { useHttp } from '@/lib/http';
import { useStorage } from '@/lib/storage';
import { useDefinitions } from '@/lib/definitions';

export default createComponent({
	setup() {
		const { domain, apikey } = useHttp();
		const { persistent, getItem, setItem } = useStorage();
		const { fetchDefinition } = useDefinitions();
		const isLoading = ref(false);
		const isError = ref(false);

		domain.value = getItem('domain', '');
		apikey.value = getItem('apikey', '');
		persistent.value = domain.value.length > 0 || apikey.value.length > 0;

		return {
			domain,
			apikey,
			persistent,
			isLoading,
			isError,
			submit: async () => {
				if (domain.value.length > 0 && apikey.value.length === 32) {
					isLoading.value = true;
					try {
						await fetchDefinition('member');
						isError.value = false;
						setItem('domain', domain);
						setItem('apikey', apikey);
					} catch (e) {
						isLoading.value = false;
						isError.value = true;
					}
				}
			}
		};
	}
});
</script>
