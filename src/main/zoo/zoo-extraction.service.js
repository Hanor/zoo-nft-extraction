const axios = require('axios');
const fs = require('fs')

class ZooExtractionService {
    static ZOO_API = 'https://api2.zoogame.finance/api/zoo';
    static COVALENT_API = 'https://api.covalenthq.com/v1';

    exportNftsInformation(collectedWalletsAndNfts) {
        let csv = 'WALLET;NFT ID;LEVEL;RARITY;ILLEGAL STATUS\n';
        for (let owner in collectedWalletsAndNfts) {
            const nfts = collectedWalletsAndNfts[owner];
            for (let nft of nfts) {
                csv += `${nft.owner};${nft.id};${nft.level};${nft.rarity};${nft.illegal}\n`;
            }
        }
        fs.writeFileSync('zoo-nft-report.csv', csv);
    }
    extraction(covalentApiKey) {
        return new Promise(async (resolve) => {
            const holders = await this.getAllHolders(covalentApiKey);
            const nftsByWallet = await this.getAllNftsByHolders(holders);
            this.exportNftsInformation(nftsByWallet);
            resolve();
        });
    }
    async getAllHolders(covalentApiKey) {
        console.log('Searching all holders...');
        const nftContract = '0x48f9f93ba55852f7ba5beb55ad9d9cee373c0ad4';
        const collectedHolders = [];
        let pageNumber = 0;
        let hasNextPage = true;

        while(hasNextPage) {
            try {
                const { holders, hasMorePages } = await this.getHoldersByPage(pageNumber, nftContract, covalentApiKey);
                hasNextPage = (pageNumber > 1) ? false : hasMorePages;
                collectedHolders.push(...holders);
                pageNumber++;
            } catch (ex) {
                console.error('Error in holders search. Will retry.');
            }
        }

        console.log(`Collected all holders of contract: ${nftContract}.`);
        return collectedHolders;
    }
    async getHoldersByPage(page, nftContract, covalentApiKey) {
        console.log(`Searching page: ${(page + 1)} of holders...`);
        let url = `${ZooExtractionService.COVALENT_API}/56/tokens/${nftContract}/token_holders/?key=${covalentApiKey}&page-number=${page}`
        const result = (await axios.get(url)).data.data;
        const pagination = result.pagination;
        console.log(`Collected page: ${page}.`);
        return { holders: result.items, hasMorePages: pagination.has_more };
    }
    async getAllNftsByHolders(holders) {
        console.log(`Searching NFT's for holders: ${holders.length}`);
        const nftByWallet = {};
        const size = holders.length;
        for (let i = 0; i < size; i++) {
            const holder = holders[i];
            const address = holder.address;
            nftByWallet[address] = await this.getNftByWallet(address, 10);
            console.log(`[${parseInt(((i + 1)/(size + 1)) * 100)}%] Collected NFTs wallet: ${address}`);
        }
        console.log('Collected all NFT metadata.');
        return nftByWallet;
    }
    async getNftByWallet(address, itemsPerPage) {
        let hasMore = true;
        const nfts = [];
        let page = 1;
        let maxPage;
        console.log(`Searching NFT's for holder: ${address}`);
        while (hasMore) {
            const url = `${ZooExtractionService.ZOO_API}/nft?currentPage=${page}&perPage=${itemsPerPage}&owner=${address}`;
            const zooOwnerData = (await axios.get(url)).data;
            const total = zooOwnerData.total;

            nfts.push(...zooOwnerData.data);

            if (!maxPage) {
                maxPage = parseInt(total/itemsPerPage);
            }

            console.log(`Collected ${nfts.length} NFT's of holder: ${address}`);
            page++;
            console.log(maxPage, total)
            hasMore = page < maxPage;
        }

        return nfts;
    }
}
module.exports.ZooExtractionService = ZooExtractionService;
