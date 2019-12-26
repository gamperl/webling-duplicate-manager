<template>
	<section class="hero is-dark is-fullheight">
		<div class="hero-body">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-5-tablet is-4-desktop is-3-widescreen">
						<div class="box">
							<b-field label="Domain">
								<div class="field-body">
									<b-input v-model="domain" validation-message="Die Domain muss angegeben werden" expanded required />
									<p class="control">
										<span class="button is-static">.webling.ch</span>
									</p>
								</div>
							</b-field>
							<b-field label="API Key">
								<b-input v-model="apikey" validation-message="Ein API Key hat 32 Zeichen" minlength="32" maxlength="32" required />
							</b-field>
							<b-field>
								<b-checkbox v-model="persistent">Auf diesem Computer merken</b-checkbox>
							</b-field>
							<b-field>
								<b-button type="is-success" @click="submit">Login</b-button>
							</b-field>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import { useStore } from '@/lib/store';

export default createComponent({
	setup() {
		const { state, domain, apikey, persistent } = useStore();
		return {
			domain,
			apikey,
			persistent,
			submit: () => {
				if (domain.value.length > 0 && apikey.value.length === 32) {
					state.value = 'authorizing';
				}
			}
		};
	}
});
</script>
