const API_KEY = '3b917d8dbbf3a883965c773264ef075e7b3e580edbda9f6d5e85059d900b0fd8';
const USD = 'USD';
const BTC = 'BTC';
const MessageType = {
	INVALID_SUB: 'INVALID_SUB',
}

const tickersHandlers = new Map();
const crossTradedTickerPrices = new Map(); //In BTC
// DANK, AVA

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

socket.addEventListener('open', () => {
	console.log(`Подписываемся на usd`);
	socket.send(JSON.stringify({
		"action": "SubAdd",
		"subs": [`5~CCCAGG~${BTC}~${USD}`],
	}));
},
	{ once: true }
);

socket.addEventListener('message', (e) => {
	const { FROMSYMBOL: currency, TOSYMBOL: tosymbol, PRICE: newPrice, PARAMETER: parameter, MESSAGE: message } = JSON.parse(e.data);

	if (message === MessageType.INVALID_SUB) {
		const [, , base, quote] = parameter.split('~');

		if (quote === USD) {
			subscribeToTickerOnWs(base, BTC);
			return;
		}

		runHandlers(base, null);
		return;
	}

	if (newPrice) {
		if (currency === BTC) {
			[...crossTradedTickerPrices.keys()].forEach(t => {
				const price = crossTradedTickerPrices.get(t);
				runHandlers(t, price * newPrice);
			})
		}

		if (tosymbol === BTC) {
			crossTradedTickerPrices.set(currency, newPrice);
			return;
		}

		runHandlers(currency, newPrice);
	}
});

function runHandlers(currency, price) {
	const handlers = tickersHandlers.get(currency) || [];
	handlers.forEach(fn => fn(price));
}

function sendToWs(message) {
	const stringifiedMessage = JSON.stringify(message);

	if (socket.readyState === WebSocket.OPEN) {
		socket.send(stringifiedMessage);
		return;
	}
	socket.addEventListener('open', () => {
		socket.send(stringifiedMessage);
	},
		{ once: true }
	);

}

function subscribeToTickerOnWs(ticker, tosymbol = USD) {
	if (ticker === BTC) {
		return;
	}
	sendToWs({
		"action": "SubAdd",
		"subs": [`5~CCCAGG~${ticker}~${tosymbol}`],
	});
}

function unsubscribeToTickerOnWs(ticker, tosymbol = USD) {
	sendToWs({
		"action": "SubRemove",
		"subs": [`5~CCCAGG~${ticker}~${tosymbol}`],
	});
}


function setHandler(ticker, cb) {
	const subscribers = tickersHandlers.get(ticker) || [];
	tickersHandlers.set(ticker, [...subscribers, cb]);
}

export const subscribeToTicker = (ticker, cb) => {
	setHandler(ticker, cb);
	subscribeToTickerOnWs(ticker);
}

export const unsubscribeFromTicker = (ticker) => {
	tickersHandlers.delete(ticker);
	unsubscribeToTickerOnWs(ticker);
}

export const loadAllCoinsList = () => {
	return fetch('https://min-api.cryptocompare.com/data/all/coinlist')
		.then(r => r.json())
		.then(rawData => Object.values(rawData.Data));
}
