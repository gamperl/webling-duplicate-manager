<template>
	<section class="hero is-light is-fullheight">
		<div class="hero-body">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-5-tablet is-4-desktop is-3-widescreen">
						<div class="box">
							<b-field label="Enter some tags">
								<b-taginput
									v-model="comparable"
									:data="filteredProperties"
									autocomplete
									:allow-new="false"
									:open-on-focus="true"
									field="title"
									:ellipsis="true"
									placeholder="Feld hinzufügen"
									@typing="filterProperties"
									@add="filterProperties('')"
								>
									<template slot-scope="props">{{ props.option.title }}</template>
								</b-taginput>
							</b-field>
							<b-button type="is-primary" @click="submit">Weiter</b-button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script lang="ts">
import { createComponent, ref } from '@vue/composition-api';
import { useDefinitionss } from '@/lib/definitions';

export default createComponent({
	setup() {
		const { get } = useDefinitionss();

		const definitions = get('member');
		const comparable = ref<typeof definitions.properties>([]);
		const filteredProperties = ref<any>(definitions.properties);

		// TODO: save comparable in storage
		// TODO: if no comparable provided, use first and lastname

		return {
			comparable,
			filteredProperties,
			filterProperties: (value: string) => {
				filteredProperties.value = definitions.properties.filter(
					property => property.title.toLowerCase().indexOf(value.toLowerCase()) > -1
				);
			},
			submit: () => console.log(comparable.value)
		};
	}
});
</script>
