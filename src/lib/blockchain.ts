/**
 * Blockchain Notarization Service
 * 
 * Records SHA-256 hashes of actions (check-ins, item creation) on the
 * Polygon Amoy testnet as immutable proof-of-existence.
 * 
 * Uses a single server-side "notary wallet" — no user wallets needed.
 */
import { ethers } from "ethers";
import crypto from "crypto";

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;

/**
 * Creates a SHA-256 hash of the given data string
 */
export function createDataHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Records an action on the blockchain by sending a micro-transaction
 * with the action metadata encoded in the transaction's `data` field.
 * 
 * @param actionType - e.g. "CHECKIN", "ITEM_CREATED"
 * @param dataHash - SHA-256 hash of the action's payload
 * @returns Transaction hash string, or null if blockchain is not configured
 */
export async function notarizeAction(
    actionType: string,
    dataHash: string
): Promise<string | null> {
    if (!PRIVATE_KEY) {
        console.warn("[BLOCKCHAIN] No BLOCKCHAIN_PRIVATE_KEY configured. Skipping on-chain notarization.");
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        // Encode action metadata as hex in the transaction data field
        // Format: "AFTERWORD:{actionType}:{dataHash}:{timestamp}"
        const payload = `AFTERWORD:${actionType}:${dataHash}:${Date.now()}`;
        const hexData = ethers.hexlify(ethers.toUtf8Bytes(payload));

        // Send a zero-value transaction to ourselves with the data payload
        const tx = await wallet.sendTransaction({
            to: wallet.address,   // self-transaction (cheapest possible)
            value: 0,
            data: hexData,
        });

        console.log(`[BLOCKCHAIN] Notarized ${actionType}: tx=${tx.hash}`);

        // Don't await confirmation — return immediately for speed
        // The tx will confirm in ~2-5 seconds on Polygon
        return tx.hash;
    } catch (err) {
        console.error("[BLOCKCHAIN] Notarization failed:", err);
        // Non-blocking: blockchain failure should never break core app functionality
        return null;
    }
}

/**
 * Fetches a transaction receipt from the blockchain for verification.
 */
export async function getTransactionProof(txHash: string) {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) return null;

        const tx = await provider.getTransaction(txHash);
        let decodedData = null;
        if (tx?.data) {
            try {
                decodedData = ethers.toUtf8String(tx.data);
            } catch {
                decodedData = tx.data;
            }
        }

        return {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? "confirmed" : "failed",
            from: receipt.from,
            timestamp: null, // Would need block.timestamp lookup
            decodedData,
            explorerUrl: `https://amoy.polygonscan.com/tx/${receipt.hash}`,
        };
    } catch (err) {
        console.error("[BLOCKCHAIN] Failed to fetch proof:", err);
        return null;
    }
}

/**
 * Returns the public wallet address of the notary wallet.
 * Useful for displaying in the UI or for faucet funding.
 */
export function getNotaryAddress(): string | null {
    if (!PRIVATE_KEY) return null;
    try {
        const wallet = new ethers.Wallet(PRIVATE_KEY);
        return wallet.address;
    } catch {
        return null;
    }
}
