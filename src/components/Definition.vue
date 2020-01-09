<template>
	<span>
		<b-navbar type="is-light">
			<template slot="end">
				<b-navbar-item tag="div">
					<b-button @click="logout">Abmelden</b-button>
				</b-navbar-item>
			</template>
		</b-navbar>

		<section class="hero is-light is-fullheight">
			<div class="hero-body">
				<div class="container">
					<div class="columns is-centered">
						<div class="column is-5-tablet is-4-desktop is-3-widescreen">
							<div class="box">
								<b-field label="Felder, die verglichen werden sollen">
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
								<b-button type="is-primary" @click="submit" :disabled="isLoading">Weiter</b-button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</span>
</template>

<script lang="ts">
import { createComponent, ref } from '@vue/composition-api';
import { useDefinitions } from '@/lib/definitions';
import { useAggregator } from '@/lib/aggregator';
import { useHttp } from '@/lib/http';
import { useStorage } from '@/lib/storage';

export default createComponent({
	setup() {
		const { getRequest } = useHttp();
		const { getDefinition } = useDefinitions();
		const { aggregate } = useAggregator();
		const { clearItems, getItem, setItem } = useStorage();

		const definitions = getDefinition('member');
		const comparable = ref<typeof definitions.properties>([]);
		const filteredProperties = ref<any>(definitions.properties);
		const isLoading = ref(false);

		if (Array.isArray(getItem('properties', null))) {
			comparable.value = definitions.properties.filter(property => getItem('properties', []).indexOf(property.id) > -1);
		}

		return {
			comparable,
			filteredProperties,
			filterProperties: (value: string) => {
				filteredProperties.value = definitions.properties.filter(
					property => property.title.toLowerCase().indexOf(value.toLowerCase()) > -1
				);
			},
			isLoading,
			submit: async () => {
				isLoading.value = true;
				const propertyIds = comparable.value.map(property => property.id);
				setItem('properties', propertyIds);
				const response = await getRequest('member');
				await aggregate(response.objects, 'member', propertyIds);
			},
			logout: () => {
				clearItems();
				location.reload();
			}
		};
	}
});
</script>
