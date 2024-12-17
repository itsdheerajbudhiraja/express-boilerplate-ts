import type { Browser } from "puppeteer";

import puppeteer from "puppeteer";

import { logger } from "../winston_logger.js";

const minimal_args = [
	"--autoplay-policy=user-gesture-required",
	"--disable-background-networking",
	"--disable-background-timer-throttling",
	"--disable-backgrounding-occluded-windows",
	"--disable-breakpad",
	"--disable-client-side-phishing-detection",
	"--disable-component-update",
	"--disable-default-apps",
	"--disable-dev-shm-usage",
	"--disable-domain-reliability",
	"--disable-extensions",
	"--disable-features=AudioServiceOutOfProcess",
	"--disable-hang-monitor",
	"--disable-ipc-flooding-protection",
	"--disable-notifications",
	"--disable-offer-store-unmasked-wallet-cards",
	"--disable-popup-blocking",
	"--disable-print-preview",
	"--disable-prompt-on-repost",
	"--disable-renderer-backgrounding",
	"--disable-setuid-sandbox",
	"--disable-speech-api",
	"--disable-sync",
	"--hide-scrollbars",
	"--ignore-gpu-blacklist",
	"--metrics-recording-only",
	"--mute-audio",
	"--no-default-browser-check",
	"--no-first-run",
	"--no-pings",
	"--no-sandbox",
	"--no-zygote",
	"--password-store=basic",
	"--use-gl=swiftshader",
	"--use-mock-keychain",
	"--font-render-hinting=none",
	"--disable-web-security"
];

process.setMaxListeners(1000);

let browser: Browser;

/**
 * Creates Puppeteer Browser Instance with specified configurations
 */
async function getPuppeteerBrowser() {
	logger.debug("Creating browser instance");
	browser = await puppeteer.launch({
		headless: true,
		args: minimal_args,
		timeout: 0,
		protocolTimeout: 0
	});
	logger.debug("Created browser instance");
	return browser;
}

export { browser, getPuppeteerBrowser };
