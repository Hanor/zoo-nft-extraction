const { ZooExtractionService } = require('./zoo/zoo-extraction.service');

class Main {
    constructor() {
        this.initialize();
    }

    executeExtraction(covalentApiKey) {
        const zooExtractionService = new ZooExtractionService();
        zooExtractionService.extraction(covalentApiKey).then(
            () => {
                console.log('Extraction Completed.');
            }
        );
    }
    initialize() {
        const arg = process.argv.find((arg) => arg.includes('--covalent-key='));
        if (!arg) {
            throw new Error('You need provide a covalent api key. Ex.: --covalent-key=ckey_absbdhgdh12');
        } else {
            this.executeExtraction(arg.split('=')[1]);
        }
    }
}
new Main();
