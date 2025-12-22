/**
 * List command handler
 */
import { getGenerator, listGenerators } from "../../generators/index.js";

export function listCommand(): void {
	console.log("Available generators:");
	console.log("");

	const generators = listGenerators();

	for (const name of generators) {
		const metadata = getGenerator(name);
		if (metadata) {
			console.log(`  ${name}`);
			if (metadata.description) {
				console.log(`    ${metadata.description}`);
			}
			console.log(`    Type: ${metadata.type}`);
			console.log(`    Language: ${metadata.language}`);
			if (metadata.libraries && metadata.libraries.length > 0) {
				console.log(`    Libraries: ${metadata.libraries.join(", ")}`);
			}
			console.log("");
		}
	}

	console.log(`Total: ${generators.length} generators available`);
}
