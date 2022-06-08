# ZooNftExtraction

ZooNftExtraction is a tool built with Javascript that allow us to retrieve informations of the holders of Zoo NFT contract, collecting NFT metadata and informations about the Holders.

## Requirements to RUN

**NodeJs**

The first thing that you need to execute this tool is a Node.JS installed in the host machine.
[Click here](https://nodejs.org/en/download/) to access the Node.JS download page.

**Command for install dependencies**

After the node installed we must execute some commands to install the dependencies that the project needs.

1. Installing Yarn

`npm i yarn -g`

2. Installing all dependencies of the procject

`yarn install`

Now, you can run the tool baby!

## How to Execute

To execute the application you need to have a COVALENT API KEY, because we use the COVALENT API to get all the holders of the contract.
When you have a COVALENT API KEY you can run the command below:

`yarn start --covalent-key=ckey_xxxxxxx`

The output of this execution will be a file with the holders and theirs NFT's.

## Workflow of the tool

### Step 1: Find The Holders

The first goal of this tool is find all the holders of the contract: 0x48f9f93ba55852f7ba5beb55ad9d9cee373c0ad4, and for this we use the COVALENT API that allow us to read some informations of the blockchain.

### Step 2: Find The NFT's

The second goal is find the NFT'S for each holder that we found in the [step 1](#step-1-find-the-holders). To do that we use the ZooApi that retrieve for each wallet theirs NFT's.

### Step 3: The report FILE

The thirty goal is push all the information found in the report file. The report file will generated as "zoo-nft-report.csv" and will contain: wallet, nft id, level, rarity and illegal status.
