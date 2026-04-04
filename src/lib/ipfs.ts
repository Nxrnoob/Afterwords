/**
 * IPFS Service Abstraction
 * Uses Pinata API if PINATA_JWT is present. Otherwise, it acts as a mock locally.
 */

export async function uploadToIPFS(base64Data: string, filename: string = "SecureVaultItem"): Promise<string> {
    const jwt = process.env.PINATA_JWT;
    
    if (!jwt) {
        console.warn("PINATA_JWT not found in environment. Mocking IPFS upload... Please configure Pinata for production Web3 pipelines.");
        // Simulate a 1 second upload delay to mock real network condition
        await new Promise(res => setTimeout(res, 1000));
        return `ipfs://mock_cid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    try {
        // Convert base64 data to Blob
        const blobRaw = Buffer.from(base64Data, 'base64');
        const file = new Blob([blobRaw]);
        
        const formData = new FormData();
        formData.append("file", file, filename);
        
        const pinataMetadata = JSON.stringify({
            name: `Afterword Vault Item: ${filename}`,
        });
        formData.append("pinataMetadata", pinataMetadata);

        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Pinata API Error: ${err}`);
        }

        const data = await res.json();
        return `ipfs://${data.IpfsHash}`;
    } catch (e) {
        console.error("Failed to upload to IPFS:", e);
        throw e;
    }
}
