<template>
	<section class="hero is-light is-fullheight">
		<div class="hero-body">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-5-tablet is-4-desktop is-3-widescreen">
						<form action="" class="box">
							<b-field label="Domain">
								<div class="field-body">
									<b-input validation-message="Die Domain muss angegeben werden" expanded required />
									<p class="control">
										<span class="button is-static">.webling.ch</span>
									</p>
								</div>
							</b-field>
							<b-field label="API Key">
								<b-input validation-message="Ein API Key hat 32 Zeichen" minlength="32" maxlength="32" required />
							</b-field>
							<b-field>
								<b-checkbox>Auf diesem Computer merken</b-checkbox>
							</b-field>
							<div class="field">
								<button class="button is-success">
									Login
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
});
</script>
