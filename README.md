# OXXR

OXXR is an ERC721 UUPS (upgradable) smart contract that allows the creation of unique non-fungible tokens (NFTs). This project contains smart contracts, tests for the contracts, and a deployment script with HARDHAT and Chai.

## Contracts

### OXXR.sol
This is the main contract that represents the diamond NFTs. It includes functionality for minting new diamonds, setting the name of a diamond, getting the name of a diamond, and setting the base URI for diamond metadata.

### OXXRDrop.sol
This is a contract for managing drops for diamond NFT sales. It includes functionality for adding and removing addresses from the whitelist and allowlist, as well as setting the start and end times for the sale.

## Installation

1. Clone the repository and navigate to the project root.
2. Install the project dependencies:

    ```
    npm install
    ```
## Usage

Compile the contracts:
    ```
    npx hardhat compile
    ```


Run the tests:
    ```
    npx hardhat test
    ```

Start a local Ethereum network:
    ```
    npx hardhat node
    ```

Deploy the contracts:
    ```
    npx hardhat run scripts/deploy.js
    ```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.


## License

This project is licensed under the MIT License.
