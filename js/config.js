const DEFAULTS = {
  acoes: [
    {ticker:'BBAS3',  preco:22.21, lpa:2.39, payout:34.90,  cagr:10, dy:8, tempo:5},
    {ticker:'EGIE3',  preco:35.05, lpa:2.26, payout:113.86, cagr:10, dy:8, tempo:5},
    {ticker:'VALE3',  preco:81.10, lpa:3.51, payout:155.83, cagr:10, dy:8, tempo:5},
    {ticker:'WEGE3',  preco:45.20, lpa:1.50, payout:60.71,  cagr:10, dy:8, tempo:5},
    {ticker:'RADL3',  preco:21.99, lpa:0.74, payout:56.01,  cagr:10, dy:8, tempo:5},
    {ticker:'BBSE3',  preco:33.85, lpa:4.64, payout:97.94,  cagr:10, dy:8, tempo:5},
    {ticker:'TAEE11', preco:42.54, lpa:4.58, payout:70.42,  cagr:10, dy:8, tempo:5},
    {ticker:'KLBN3',  preco:3.51,  lpa:0.26, payout:74.08,  cagr:10, dy:8, tempo:5},
    {ticker:'LEVE3',  preco:34.09, lpa:4.49, payout:60.27,  cagr:10, dy:8, tempo:5},
    {ticker:'PETR4',  preco:48.95, lpa:8.55, payout:38.56,  cagr:10, dy:8, tempo:5},
    {ticker:'ITSA3',  preco:13.87, lpa:1.47, payout:75.66,  cagr:10, dy:8, tempo:5},
    {ticker:'PSSA3',  preco:50.06, lpa:5.23, payout:7.60,   cagr:10, dy:8, tempo:5},
  ],
  fiis: [
    {ticker:'MXRF11', pvp:1.06, preco:9.93,   div12m:1.30,  ipca:5.0, ipcaMais:7, premio:1},
    {ticker:'VGHF11', pvp:0.79, preco:6.83,   div12m:0.96,  ipca:2.5, ipcaMais:7, premio:3},
    {ticker:'XPCA11', pvp:0.86, preco:8.25,   div12m:1.31,  ipca:2.5, ipcaMais:7, premio:3},
    {ticker:'BRCO11', pvp:1.02, preco:118.51, div12m:10.76, ipca:0.0, ipcaMais:7, premio:3},
    {ticker:'BTCI11', pvp:0.94, preco:9.46,   div12m:1.16,  ipca:5.0, ipcaMais:7, premio:2},
    {ticker:'XPML11', pvp:1.01, preco:111.25, div12m:11.04, ipca:0.0, ipcaMais:7, premio:2},
    {ticker:'VISC11', pvp:0.94, preco:110.35, div12m:10.65, ipca:0.0, ipcaMais:7, premio:3},
    {ticker:'GARE11', pvp:0.89, preco:8.42,   div12m:0.99,  ipca:0.0, ipcaMais:7, premio:3},
    {ticker:'KNCR11', pvp:1.04, preco:106.53, div12m:15.79, ipca:5.0, ipcaMais:7, premio:1},
    {ticker:'HGLG11', pvp:0.94, preco:156.60, div12m:14.31, ipca:0.0, ipcaMais:7, premio:3},
  ]
};

const JB_BIN_ID  = '69fb3f0736566621a8309e16';
const JB_API_KEY = '$2a$10$k4/ONwopA2v/Zg7xxhdG2.GuKxho4qTJrlCNVGFriVsPaq5UTLs82';
const JB_URL     = `https://api.jsonbin.io/v3/b/${JB_BIN_ID}`;
const LS_KEY     = 'precoteto_v2';
const LS_THEME   = 'precoteto_theme';
const LS_TAB     = 'precoteto_tab';

const jbHeaders = {
  'Content-Type': 'application/json',
  'X-Access-Key':  JB_API_KEY,
  'X-Bin-Versioning': 'false'
};
