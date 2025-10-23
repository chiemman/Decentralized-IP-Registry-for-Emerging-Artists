# 🎨 Decentralized IP Registry for Emerging Artists

Welcome to a revolutionary Web3 platform designed to empower emerging artists by providing a decentralized intellectual property (IP) registry on the Stacks blockchain! This project addresses the real-world problem of IP theft, lack of fair compensation, and limited visibility for new artists in traditional centralized systems. By leveraging blockchain, artists can securely register their works, manage licenses, automate royalties, and gain exposure through a community-driven marketplace—all without intermediaries like galleries or agencies that often exploit creators.

Emerging artists frequently face challenges such as proving prior art, enforcing copyrights, tracking unauthorized usage, and receiving timely payments. This decentralized registry solves these by offering immutable proof of ownership, transparent licensing, smart contract-enforced royalties, and peer-to-peer discovery, fostering a fairer creative ecosystem.

Built with Clarity smart contracts on Stacks, this project involves 8 interconnected contracts for robust functionality.

## ✨ Features

🔐 Immutable registration of artworks with unique hashes and metadata  
📜 Dynamic licensing options (e.g., creative commons, exclusive rights)  
💰 Automated royalty splits for sales and secondary markets  
🛡️ Ownership verification and transfer mechanisms  
🏪 Integrated marketplace for discovering and acquiring artist IPs  
🤝 Collaboration tools for joint creations with shared ownership  
⚖️ Basic dispute flagging for community resolution  
🌐 Artist profiles with portfolio showcases and reputation scores  

## 🛠 How It Works

**For Artists (Registration and Management)**  
- Generate a SHA-256 hash of your artwork file (e.g., image, music, or design).  
- Create an artist profile via the ArtistProfile contract.  
- Call the register-artwork function in the IPRegistry contract with your hash, title, description, and metadata (e.g., category, creation date).  
- Use the Licensing contract to set license terms, such as royalty percentages (e.g., 10% on resales).  
- If collaborating, invoke the Collaboration contract to define shared ownership ratios.  

Your artwork is now timestamped on the blockchain, providing irrefutable proof of creation and ownership!

**For Buyers/Licensors**  
- Browse artist profiles and artworks via the Marketplace contract.  
- Verify authenticity using the Verification contract's check-ownership function.  
- Purchase or license via the OwnershipTransfer contract, triggering automatic royalty payments through the RoyaltyDistributor contract.  
- If a dispute arises (e.g., IP infringement), flag it with the DisputeFlagger contract for community review.  

Transactions are seamless, with royalties instantly distributed to creators and collaborators.

**For Verifiers/Community**  
- Query get-artwork-details in the IPRegistry contract to view registration info.  
- Use verify-license in the Licensing contract to confirm usage rights.  
- Check reputation scores in the ArtistProfile contract to discover trusted emerging talents.  

This ensures transparency and trust in the ecosystem.

## 📂 Smart Contracts Overview

This project comprises 8 Clarity smart contracts, each handling a specific aspect for modularity and security:

1. **IPRegistry.clar**: Core contract for registering artworks with hashes, titles, descriptions, and metadata. Prevents duplicates and provides timestamped proofs.  
2. **ArtistProfile.clar**: Manages artist profiles, including bios, portfolios, and reputation scores based on community interactions.  
3. **Licensing.clar**: Handles creation and management of licenses, allowing artists to define terms like usage rights and expiration.  
4. **RoyaltyDistributor.clar**: Automates royalty calculations and distributions for primary/secondary sales, supporting multi-party splits.  
5. **OwnershipTransfer.clar**: Facilitates secure transfers of ownership or licenses, integrated with STX token payments.  
6. **Verification.clar**: Provides read-only functions to verify ownership, licenses, and artwork authenticity without mutating state.  
7. **Marketplace.clar**: Enables listing, searching, and acquiring artworks, with filters for emerging artists (e.g., by reputation or category).  
8. **Collaboration.clar**: Supports joint registrations with predefined ownership shares and royalty splits for collaborative projects.  
9. **DisputeFlagger.clar**: Allows users to flag potential IP issues, storing flags immutably for off-chain resolution (e.g., via DAOs).  

These contracts interact via public functions, ensuring composability. For example, a marketplace sale calls OwnershipTransfer, which triggers RoyaltyDistributor.

## 🚀 Getting Started

1. Install the Clarinet tool for Clarity development.  
2. Clone this repo and deploy the contracts to a Stacks testnet.  
3. Interact via the Stacks Wallet or custom frontend (e.g., built with React and Hiro SDK).  
4. Test registration: Run `clarinet console` and call `(contract-call? .IPRegistry register-artwork "hash123" "My Artwork" "Description" (some {category: "digital"}) )`.  

Join the movement to democratize art—fork, contribute, and build a fairer future for creators! 🚀