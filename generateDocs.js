const fs = require('fs');
const docx = require('docx');

const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Afterword: The Modern Dead Man’s Switch",
                heading: HeadingLevel.TITLE,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Project Overview",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "Afterword is a fully functional, modern dead man's switch designed to securely store your most sensitive information—passwords, wills, love letters, and crypto keys—and guarantee they are delivered to your trusted contacts if something happens to you. "
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "We have successfully completed the entire project lifecycle, moving from the core web architecture to a fully decentralized storage pipeline, and finally packaging the ecosystem into a native Android app."
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Features & Achievements",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "1. Zero-Knowledge Cryptography",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "- Local Client-Side Encryption: Your vault items are encrypted in your own browser using AES-GCM before ever touching the network. Our servers never see your raw data, making the platform fully zero-knowledge.",
            }),
            new Paragraph({
                text: "- Server fallback: We also support robust server-side encryption for legacy integrations.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "2. Dual-Pipeline Storage (Web2 & Web3)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "- Database (Web2): Secure, centralized storage on the Afterword platform for immediate reliability.",
            }),
            new Paragraph({
                text: "- Blockchain IPFS (Web3): For maximum decentralization, users can opt to store their encrypted shards on the InterPlanetary File System (IPFS) utilizing Pinata integration. The Afterword backend seamlessly handles the Web3 pinning and gas abstraction so that the user doesn't need a crypto wallet.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "3. Automated Dead Man's Switch Engine",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "- Check-ins: Users stay alive in the system by authenticating periodically.\n- Grace Periods: If a check-in is missed, the system enters a Grace Period, dispatching 'Warning 1' emails to the user, and later 'Warning 2' emails to a verified Trusted Contact.\n- Vault Release: If the threshold is breached, the automated Cron engine physically fires off emails with the encryption keys and payload links directly to the designated Beneficiaries.\n- Emergency Pause: A feature to completely suspend the switch if the user goes 'off-grid' for extended periods."
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "4. Enterprise-Grade Security Center",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "- Real-time Audit Logs that track every IP, user agent, and secure action taken within the vault.\n- Timezone-aware scheduled releases for meticulous timing."
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "5. Mobile Native Android Application",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "- We have successfully wrapped and optimized the Afterword responsive web app into a fully native Android .apk using Capacitor.\n- The mobile app leverages native biometrics for login, persistent background data, and push notifications to remind users of their check-in intervals directly on their home screens."
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Next Steps & Questions",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "The platform is built, the Web3 integrations are live, and the Android package is ready for deployment. To proceed to the finish line:"
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "1. App Store Deployment: Do you have a Google Play Developer account ready for us to upload the verified Android build?"
            }),
            new Paragraph({
                text: "2. Branding Assets: Before we compile the final production .apk, do you have the specific App Icons (Splash screens, 512x512 icons) you want embedded in the Capacitor config?"
            }),
            new Paragraph({
                text: "3. Production Keys: Are we ready to swap out the development SQLite database for a production Postgres instance (e.g., Supabase/Vercel) and inject the production Pinata / Resend API keys?"
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Afterword_Project_Documentation.docx", buffer);
    console.log("Document created successfully!");
});
