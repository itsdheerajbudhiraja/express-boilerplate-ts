import type { PDFArray, PDFDocument, PDFRef } from "pdf-lib";

import { PDFDict, PDFName } from "pdf-lib";

export function copyPdfLinks(sources: PDFDocument[], target: PDFDocument) {
	const targetLinksDict = PDFDict.withContext(target.context);

	let currentTargetPage = 0;
	for (const source of sources) {
		const { mapping, targetPage } = mapSourceToTargetPages(source, target, currentTargetPage);
		currentTargetPage = targetPage;

		const links = source.context.lookupMaybe(source.catalog.get(getLinksPDFName()), PDFDict);
		if (links) {
			links.entries().forEach(([destName, destValue]) => {
				const currentRef = (destValue as PDFArray).get(0) as PDFRef;
				(destValue as PDFArray).set(0, mapping[currentRef.tag]);
				targetLinksDict.set(destName, destValue);
			});
		}
	}

	const destinationDestsRef = target.context.register(targetLinksDict);
	target.catalog.set(getLinksPDFName(), destinationDestsRef);
}

function mapSourceToTargetPages(
	source: PDFDocument,
	target: PDFDocument,
	startingTargetPage: number
): { mapping: Record<string, PDFRef>; targetPage: number } {
	const result: Record<string, PDFRef> = {};
	const targetPages = target.getPages();
	let currentTargetPage = startingTargetPage;
	const sourcePages = source.getPages();

	for (let i = 0; i < sourcePages.length; i++) {
		result[sourcePages[i].ref.tag] = targetPages[currentTargetPage].ref;
		currentTargetPage++;
	}

	return { mapping: result, targetPage: currentTargetPage };
}

function getLinksPDFName(): PDFName {
	return PDFName.of("Dests");
}
