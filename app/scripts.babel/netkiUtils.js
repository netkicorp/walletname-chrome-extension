var NETKI_PUBAPI_HOST = 'https://pubapi.netki.com';
var NETKI_API_HOST = 'https://api.netki.com';

var SHORTCODES = {
  'btc': 'Bitcoin',
  'tbtc': 'Bitcoin Testnet',
  'ltc': 'Litecoin',
  'dgc': 'Dogecoin',
  'nmc': 'Namecoin',
  'tusd': 'tetherUSD',
  'teur': 'tetherEUR',
  'tjpy': 'tetherJPY',
  'oap': 'Open Asset',
  'fct': 'Factom Factoid',
  'fec': 'Factom Entry Credit',
  'eth': 'Ethereum Ether'
};

function isWalletName(walletName) {
  var pattern = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,24}?$/i;
  return pattern.test(walletName);
}