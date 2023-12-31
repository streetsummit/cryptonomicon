<!-- refact error show -->

<template>
    <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
        <div
            v-if="isLoading"
            class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
        >
            <svg
                class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                ></circle>
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
        </div>
        <div
            v-else
            class="container"
        >
            <AddTickerForm
                :disabled="isTooManyTickersAdded"
                :coin-list="coinList"
                :tickers="tickers"
                @add-ticker="add"
            />

            <template v-if="tickers.length">
                <div>
                    <button
                        v-if="page > 1"
                        class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        @click="page > 1 ? (page = page - 1) : ''"
                    >
                        Назад
                    </button>
                    <span class="my-4 mx-2 inline-flex items-center py-2 px-4">
                        Страница {{ page }}
                    </span>
                    <button
                        v-if="hasNextPage"
                        class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        @click="page = page + 1"
                    >
                        Вперёд
                    </button>
                    Фильтр:
                    <input
                        v-model="filter"
                        type="text"
                        class="pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                    />
                </div>
                <hr
                    v-if="paginatedTickers.length"
                    class="w-full border-t border-gray-600 my-4"
                />
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div
                        v-for="t in paginatedTickers"
                        :key="t.name"
                        :class="[
                            { 'border-4': selectedTicker === t },
                            t.isAvailable ? 'bg-white' : 'bg-red-100',
                        ]"
                        class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
                        @click="selectTicker(t)"
                    >
                        <div class="px-4 py-5 sm:p-6 text-center">
                            <dt
                                class="text-sm font-medium text-gray-500 truncate"
                            >
                                {{ t.name }} - USD
                            </dt>
                            <dd
                                class="mt-1 text-3xl font-semibold text-gray-900"
                            >
                                {{ t.price }}
                            </dd>
                        </div>
                        <div class="w-full border-t border-gray-200"></div>
                        <button
                            class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
                            @click.stop="remove(t)"
                        >
                            <svg
                                class="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="#718096"
                                aria-hidden="true"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                ></path>
                            </svg>
                            Удалить
                        </button>
                    </div>
                </dl>
            </template>
            <hr class="w-full border-t border-gray-600 my-4" />
            <PriceGraph
                v-if="selectedTicker"
                :graph="graph"
                :ticker-name="selectedTicker.name"
                @close-graph="selectedTicker = null"
            />
        </div>
    </div>
</template>

<script>
import {
    loadAllCoinsList,
    subscribeToTicker,
    unsubscribeFromTicker,
} from './api';

import AddTickerForm from './components/AddTickerForm.vue';
import PriceGraph from './components/PriceGraph.vue';

export default {
    components: { AddTickerForm, PriceGraph },
    data() {
        return {
            tickers: [],
            selectedTicker: null,
            graph: [],
            coinList: [],
            isLoading: true,
            filter: '',
            page: 1,
            tickersPerPage: 10,
        };
    },
    computed: {
        isTooManyTickersAdded() {
            return this.tickers.length > 15;
        },
        startIndex() {
            return this.tickersPerPage * (this.page - 1);
        },
        endIndex() {
            return this.page * this.tickersPerPage;
        },
        hasNextPage() {
            return this.filteredTickers.length > this.endIndex;
        },
        filteredTickers() {
            return this.tickers.filter(t =>
                t.name.toUpperCase().includes(this.filter.toUpperCase())
            );
        },
        paginatedTickers() {
            return this.filteredTickers.slice(this.startIndex, this.endIndex);
        },

        pageStateOptions() {
            return {
                page: this.page,
                filter: this.filter,
            };
        },
    },
    watch: {
        selectedTicker() {
            this.graph = [];
        },
        tickers() {
            localStorage.setItem(
                'cryptonomicon-list',
                JSON.stringify(this.tickers)
            );
        },
        pageStateOptions(v) {
            window.history.pushState(
                null,
                '',
                `${window.location.pathname}?filter=${v.filter}&page=${v.page}`
            );
        },
        filter() {
            this.page = 1;
        },

        paginatedTickers() {
            if (this.paginatedTickers.length === 0 && this.page > 1) {
                this.page--;
            }
        },
    },

    async created() {
        const tickersData = localStorage.getItem('cryptonomicon-list');
        if (tickersData) {
            this.tickers = JSON.parse(tickersData);
            this.tickers.forEach(t =>
                subscribeToTicker(t.name, price =>
                    this.updateTicker(t.name, price)
                )
            );
        }

        const windowData = Object.fromEntries(
            new URL(window.location).searchParams.entries()
        );

        if (windowData.filter) {
            this.filter = windowData.filter;
        }

        if (windowData.page) {
            this.page = windowData.page;
        }

        this.coinList = await loadAllCoinsList();
        this.isLoading = false;
    },
    methods: {
        updateTicker(tickerName, price) {
            this.tickers
                .filter(t => t.name.toUpperCase() === tickerName.toUpperCase())
                .forEach(async t => {
                    if (!price) {
                        t.price = '-';
                        t.isAvailable = false;
                        return;
                    }
                    t.price =
                        price > 1 ? price.toFixed(2) : price.toPrecision(2);

                    if (this.selectedTicker?.name === t.name) {
                        this.graph.push(price);
                    }
                });
        },
        add(addedTicker) {
            const currentTicker = {
                name: addedTicker.toUpperCase(),
                price: '-',
                isAvailable: true,
            };
            this.tickers = [...this.tickers, currentTicker];
            subscribeToTicker(currentTicker.name, price =>
                this.updateTicker(currentTicker.name, price)
            );
            this.filter = '';
        },
        remove(tickerToRemove) {
            if (this.selectedTicker?.name === tickerToRemove.name) {
                this.selectedTicker = null;
            }

            this.tickers = this.tickers.filter(
                t => t.name !== tickerToRemove.name
            );

            unsubscribeFromTicker(tickerToRemove.name);
        },

        selectTicker(ticker) {
            this.selectedTicker = ticker;
        },
    },
};
</script>

<style></style>
