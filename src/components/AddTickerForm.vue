<template>
    <section>
        <div class="flex">
            <div class="max-w-xs">
                <label
                    for="wallet"
                    class="block text-sm font-medium text-gray-700"
                >
                    Тикер
                </label>
                <div class="mt-1 relative rounded-md shadow-md">
                    <input
                        id="wallet"
                        v-model="ticker"
                        type="text"
                        name="wallet"
                        class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                        placeholder="Например DOGE"
                        @keydown.enter="addFromField(ticker)"
                        @input="onFieldInput"
                    />
                </div>
                <div
                    v-if="relevantCoins.length"
                    class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
                >
                    <span
                        v-for="coin in relevantCoins"
                        :key="coin.Name"
                        class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
                        @click="onHintClick(coin.Name)"
                    >
                        {{ coin.Name }}
                    </span>
                </div>
                <div
                    v-if="isTickerIncluded || !isTickerExist"
                    class="text-sm text-red-600"
                >
                    <template v-if="isTickerIncluded">
                        Такой тикер уже добавлен
                    </template>
                    <template v-if="!isTickerExist">
                        Тикер не существует
                    </template>
                </div>
            </div>
        </div>
        <AddButton
            class="my-4"
            :disabled="disabled"
            @click="addFromField(ticker)"
        />
    </section>
</template>

<script>
import AddButton from './AddButton.vue';

export default {
    name: 'AddTickerForm',
    components: { AddButton },
    props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false,
        },
        coinList: {
            type: Array,
            required: true,
        },
        tickers: {
            type: Array,
            required: true,
        },
    },
    emits: { 'add-ticker': v => typeof v === 'string' },
    data() {
        return {
            ticker: '',
            relevantCoins: [],
            isTickerIncluded: false,
            isTickerExist: true,
        };
    },
    computed: {
        isErrorShowed() {
            return this.isTickerIncluded || !this.isTickerExist;
        },
    },
    methods: {
        add(addedTicker) {
            this.$emit('add-ticker', addedTicker);
            this.ticker = '';
            this.relevantCoins = [];
        },
        addFromField(t) {
            this.isTickerExist = this.coinList.some(
                c => c.Name.toUpperCase() === t.toUpperCase()
            );

            if (!this.isTickerExist) {
                console.log('Нет такого тикера');
                return;
            }

            this.checkIncluded(t);
            if (!this.isTickerIncluded) {
                this.add(t);
            }
        },
        onHintClick(t) {
            this.checkIncluded(t);
            if (this.isTickerIncluded) {
                this.ticker = t;
                return;
            }

            this.add(t);
        },
        checkIncluded(checkingTicker) {
            this.isTickerIncluded = this.tickers.some(
                t => t.name.toUpperCase() === checkingTicker.toUpperCase()
            );
        },
        onFieldInput() {
            this.isTickerExist = true;
            this.isTickerIncluded = false;

            if (this.ticker) {
                this.relevantCoins = this.coinList
                    .filter(coin =>
                        coin.FullName.toUpperCase().includes(
                            this.ticker.toUpperCase()
                        )
                    )
                    .slice(0, 4);
            } else {
                this.relevantCoins = [];
            }
        },
    },
};
</script>

<style scoped></style>
