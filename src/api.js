const API_KEY = '3b917d8dbbf3a883965c773264ef075e7b3e580edbda9f6d5e85059d900b0fd8'

const tickersHandlers = new Map();

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

socket.addEventListener('message', (e) => {
	const { FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(e.data);
	if (newPrice) {
		const handlers = tickersHandlers.get(currency) || [];
		handlers.forEach(fn => fn(newPrice));
	}
});

function sendToWs(message) {
	// const subs = tickers.map(t => `5~CCCAGG~${t}~USD`);
	const stringifiedMessage = JSON.stringify(message);

	if (socket.readyState === WebSocket.OPEN) {
		socket.send(stringifiedMessage);
		return;
	}
	socket.addEventListener('open', () => socket.send(stringifiedMessage), { once: true });

}

function subscribeToTickerOnWs(ticker) {
	sendToWs({
		"action": "SubAdd",
		"subs": [`5~CCCAGG~${ticker}~USD`],
	});
}

function unsubscribeToTickerOnWs(ticker) {
	sendToWs({
		"action": "SubRemove",
		"subs": [`5~CCCAGG~${ticker}~USD`],
	});
}

export const subscribeToTicker = (ticker, cb) => {
	const subscribers = tickersHandlers.get(ticker) || [];
	tickersHandlers.set(ticker, [...subscribers, cb]);
	// subscribeToTickerOnWs([...tickersHandlers.keys()]);
	subscribeToTickerOnWs(ticker);

}


export const unsubscribeFromTicker = (ticker) => {
	tickersHandlers.delete(ticker);
	unsubscribeToTickerOnWs(ticker);
}