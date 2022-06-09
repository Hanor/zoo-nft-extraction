const axios = require('axios');
const fs = require('fs');

class ZooExtractionService {
    static ZOO_API = 'https://api2.zoogame.finance/api/zoo';
    static COVALENT_API = 'https://api.covalenthq.com/v1';
    static REPORT_FILE_NAME = 'zoo-nft-report.csv';
    static CACHE_FILE_NAME = 'zoo-cache.json';
    static NFT_CONTRACT = '0x48f9f93ba55852f7ba5beb55ad9d9cee373c0ad4';
    static ZOO_API_PAGE_SIZE = 1000;
    static ZOO_RETRYING_TIME = 2000;
    static COVALENT_RETRYING_TIME = 2000;

    async createReportFile() {
        const csv = 'WALLET;NFT ID;LEVEL;RARITY;ILLEGAL STATUS\n';
        fs.writeFileSync(ZooExtractionService.REPORT_FILE_NAME, csv);
    }
    async collectHoldersAndTheirsNfts(covalentApiKey) {
        console.log('Searching all holders...');
        let pageNumber = 0;
        let hasNextPage = true;

        while(hasNextPage) {
            const { holders, hasMorePages } = await this.getHoldersByPage(pageNumber, ZooExtractionService.NFT_CONTRACT, covalentApiKey);
            await this.collectHoldersNfts(holders, pageNumber);
            hasNextPage = hasMorePages;
            pageNumber++;
        }

        console.log(`Collected all holders of contract: ${ZooExtractionService.NFT_CONTRACT} and theirs NFTs.`);
    }

    async exportNftsInformation(nfts) {
        let lines = '';

        for (let nft of nfts) {
            lines += `${nft.owner};${nft.id};${nft.level};${nft.rarity};${nft.illegal}\n`;
        }

        return new Promise((resolve, reject) => {
            fs.appendFile(ZooExtractionService.REPORT_FILE_NAME, lines, (err) => {
                if (!err) {
                    resolve();
                } else {
                    console.log(err)
                    reject(err);
                }
            });
        });
    }
    extraction(covalentApiKey) {
        return new Promise(async (resolve) => {
            await this.createReportFile();
            await this.collectHoldersAndTheirsNfts(covalentApiKey);
            resolve();
        });
    }
    async collectHoldersNfts(holders, page) {
        console.log(`Page ${page} -> Searching Holders NFTs...`);
        const size = holders.length;
        for (let i = 0; i < size; i++) {
            const holder = holders[i];
            const address = holder.address;
            await this.collectHolderNftsAndSave(address, ZooExtractionService.ZOO_API_PAGE_SIZE);
            console.log(`Page ${page} -> Collected NFTs of wallet: ${address}.`);
        }
        console.log(`Page ${page} -> Collected all NFT metadata of holders.`);
    }
    async collectHolderNftsAndSave(address, itemsPerPage) {
        let hasMore = true;
        let page = 1;
        let maxPage;
        let processed = 0;
        console.log(`Searching NFTs for holder: ${address}`);
        while (hasMore) {
            const { nfts, total } = await this.getNFTsByAddress(address, page, itemsPerPage);
            await this.exportNftsInformation(nfts);

            processed += nfts.length;

            if (!maxPage) {
                maxPage = parseInt(total/itemsPerPage);
            }

            console.log(`Collected [${(processed/total) * 100}%] NFTs of holder: ${address}`);
            page++;
            hasMore = page < maxPage;
        }
    }
    async getHoldersByPage(page, nftContract, covalentApiKey) {
        while (true) {
            try {
                console.log(`Page ${page} -> Searching holders...`);
                let url = `${ZooExtractionService.COVALENT_API}/56/tokens/${nftContract}/token_holders/?key=${covalentApiKey}&page-number=${page}`
                const result = (await axios.get(url)).data.data;
                const pagination = result.pagination;
                console.log(`Page ${page} -> Collected.`);
                return { holders: result.items, hasMorePages: pagination.has_more };
            } catch (ex) {
                console.log(`Page ${page} -> Error in search of holders. Retrying...`, ex);
                await this.sleep(ZooExtractionService.COVALENT_RETRYING_TIME);
            }
        }
    }
    async getNFTsByAddress(address, page, itemsPerPage) {
        while (true) {
            try {
                const url = `${ZooExtractionService.ZOO_API}/nft?currentPage=${page}&perPage=${itemsPerPage}&owner=${address}`;
                const zooOwnerData = (await axios.get(url)).data;
                const total = zooOwnerData.meta.total;

                return { nfts: zooOwnerData.data, total };
            } catch (ex) {
                console.log(`Address ${address} -> Error in search of NFT'S. Retrying...`, ex);
                await this.sleep(ZooExtractionService.ZOO_RETRYING_TIME);
            }
        }
    }
    async sleep(time) {
        return new Promise((resolve) => {
           setTimeout(() => {
               resolve();
           }, time);
        });
    }
}
module.exports.ZooExtractionService = ZooExtractionService;
