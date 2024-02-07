const solanaWeb3 = require("@solana/web3.js");
const fs = require('fs');


const createWallet = async () => {
    const keyPair = solanaWeb3.Keypair.generate();
    const secretKey = Array.from(keyPair.secretKey);
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('testnet'), 'confirmed');
    const balance = await connection.getBalance(keyPair.publicKey);
    const wallet = {
        publicKey: keyPair.publicKey.toString(),
        secretKey: secretKey,
        balance: balance / solanaWeb3.LAMPORTS_PER_SOL
    };

    fs.writeFileSync('wallet.json', JSON.stringify(wallet));
    console.log('Wallet created and saved to wallet.json');
};


const airdrop = async (amount = 1) => {
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const publicKey = new solanaWeb3.PublicKey(wallet.publicKey);
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('testnet'), 'confirmed');
    const signature = await connection.requestAirdrop(publicKey, amount * solanaWeb3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    wallet.balance += amount;
    console.log(`Airdropped ${amount} SOL to ${publicKey}`);
};


const getBalance = async () => {
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const publicKey = new solanaWeb3.PublicKey(wallet.publicKey);
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('testnet'), 'confirmed');
    const balance = await connection.getBalance(publicKey);
    console.log(`Balance of ${publicKey}: ${balance / solanaWeb3.LAMPORTS_PER_SOL} SOL`);
};


async function transfer(otherPublicKey, amount) {
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const secretKey = new Uint8Array(wallet.secretKey);
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('testnet'), 'confirmed');
    const fromKeypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
    const toPublicKey = new solanaWeb3.PublicKey(otherPublicKey);
    const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: amount * solanaWeb3.LAMPORTS_PER_SOL
        })
    );

    await connection.sendTransaction(transaction, [fromKeypair]);
    console.log(`Transaction sent from ${fromKeypair.publicKey} to ${otherPublicKey}, amount: ${amount} SOL`);
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
    case "new":
        createWallet();
        break;
    case "airdrop":
        airdrop(args[0]);
        break;
    case "balance":
        getBalance();
        break;
    case "transfer":
        transfer(args[0], args[1]);
        break;
    default:
        console.log("Invalid command. Use 'new', 'airdrop', 'balance', or 'transfer'");
}