const API_KEY = '3b917d8dbbf3a883965c773264ef075e7b3e580edbda9f6d5e85059d900b0fd8'

const tickersHandlers = new Map();

export const loadTickers = () => {
	if (tickersHandlers.size === 0) {
		return;
	}
	fetch(
		`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD`
	)
		.then(res => res.json())
		.then(rawData => {
			const updatedPrices = Object.fromEntries(
				Object.entries(rawData).map(([key, value]) => [key, value.USD])
			);
			Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
				const handlers = tickersHandlers.get(currency) || [];
				handlers.forEach(fn => fn(newPrice));
			});
		});
}

export const subscribeToTicker = (ticker, cb) => {
	const subscribers = tickersHandlers.get(ticker) || [];
	tickersHandlers.set(ticker, [...subscribers, cb]);
}

export const unsubscribeFromTicker = (ticker) => {
	tickersHandlers.delete(ticker);
}

setInterval(loadTickers, 5000);

window.tickers = tickersHandlers;