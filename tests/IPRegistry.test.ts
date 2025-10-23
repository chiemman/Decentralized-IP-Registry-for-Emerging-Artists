import { describe, it, expect, beforeEach } from "vitest";
import { buffCV, stringAsciiCV, uintCV, tupleCV, listCV, noneCV, someCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_HASH = 101;
const ERR_INVALID_TITLE = 102;
const ERR_INVALID_DESCRIPTION = 103;
const ERR_INVALID_METADATA = 104;
const ERR_ARTWORK_ALREADY_EXISTS = 105;
const ERR_ARTWORK_NOT_FOUND = 106;
const ERR_INVALID_CATEGORY = 107;
const ERR_INVALID_CREATED_AT = 108;
const ERR_INVALID_OWNER = 109;
const ERR_TRANSFER_NOT_ALLOWED = 110;
const ERR_INVALID_RECIPIENT = 111;
const ERR_MAX_ARTWORKS_EXCEEDED = 112;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_UPDATE_NOT_AUTHORIZED = 114;
const ERR_INVALID_STATUS = 115;
const ERR_INVALID_TAG = 116;
const ERR_INVALID_MEDIUM = 117;
const ERR_INVALID_DIMENSIONS = 118;
const ERR_INVALID_FILE_TYPE = 119;
const ERR_INVALID_ROYALTY_RATE = 120;

interface Metadata { category: string; createdAt: number; tags: string[]; medium: string; dimensions: { width: number; height: number } | null; fileType: string; royaltyRate: number }
interface Artwork { id: number; owner: string; title: string; description: string; metadata: Metadata; timestamp: number; status: boolean }
interface ArtworkUpdate { updateTitle: string; updateDescription: string; updateTimestamp: number; updater: string }
interface Result<T> { ok: boolean; value: T }

class IPRegistryMock {
  state: { nextArtworkId: number; maxArtworks: number; registrationFee: number; authorityContract: string | null; artworks: Map<string, Artwork>; artworksById: Map<number, string>; ownerArtworks: Map<string, number[]>; artworkUpdates: Map<number, ArtworkUpdate> } = {
    nextArtworkId: 0, maxArtworks: 1000000, registrationFee: 100, authorityContract: null, artworks: new Map(), artworksById: new Map(), ownerArtworks: new Map(), artworkUpdates: new Map()
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  events: Array<{ event: string; id?: number; hash?: string; newOwner?: string }> = [];

  reset() { this.state = { nextArtworkId: 0, maxArtworks: 1000000, registrationFee: 100, authorityContract: null, artworks: new Map(), artworksById: new Map(), ownerArtworks: new Map(), artworkUpdates: new Map() }; this.blockHeight = 0; this.caller = "ST1TEST"; this.stxTransfers = []; this.events = []; }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (this.state.authorityContract !== null) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setRegistrationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.registrationFee = newFee;
    return { ok: true, value: true };
  }

  setMaxArtworks(newMax: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    this.state.maxArtworks = newMax;
    return { ok: true, value: true };
  }

  registerArtwork(hash: string, title: string, description: string, metadata: Metadata): Result<number> {
    if (this.state.nextArtworkId >= this.state.maxArtworks) return { ok: false, value: ERR_MAX_ARTWORKS_EXCEEDED };
    if (hash.length !== 64) return { ok: false, value: ERR_INVALID_HASH };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (!metadata.category || metadata.category.length > 50) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (metadata.createdAt > this.blockHeight) return { ok: false, value: ERR_INVALID_CREATED_AT };
    if (metadata.tags.some(tag => tag.length > 20)) return { ok: false, value: ERR_INVALID_TAG };
    if (metadata.medium.length > 50) return { ok: false, value: ERR_INVALID_MEDIUM };
    if (metadata.dimensions && (metadata.dimensions.width <= 0 || metadata.dimensions.height <= 0)) return { ok: false, value: ERR_INVALID_DIMENSIONS };
    if (!["image/jpeg", "image/png", "audio/mp3", "video/mp4"].includes(metadata.fileType)) return { ok: false, value: ERR_INVALID_FILE_TYPE };
    if (metadata.royaltyRate > 50) return { ok: false, value: ERR_INVALID_ROYALTY_RATE };
    if (this.state.artworks.has(hash)) return { ok: false, value: ERR_ARTWORK_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };

    this.stxTransfers.push({ amount: this.state.registrationFee, from: this.caller, to: this.state.authorityContract });
    const id = this.state.nextArtworkId;
    const artwork: Artwork = { id, owner: this.caller, title, description, metadata, timestamp: this.blockHeight, status: true };
    this.state.artworks.set(hash, artwork);
    this.state.artworksById.set(id, hash);
    const ownerArts = this.state.ownerArtworks.get(this.caller) || [];
    this.state.ownerArtworks.set(this.caller, [...ownerArts, id]);
    this.state.nextArtworkId++;
    this.events.push({ event: "artwork-registered", id, hash });
    return { ok: true, value: id };
  }

  getArtwork(hash: string): Artwork | null { return this.state.artworks.get(hash) || null; }
  getArtworkById(id: number): Artwork | null { const hash = this.state.artworksById.get(id); return hash ? this.getArtwork(hash) : null; }
  getOwnerArtworks(owner: string): { artworks: number[] } { return { artworks: this.state.ownerArtworks.get(owner) || [] }; }
  getArtworkCount(): Result<number> { return { ok: true, value: this.state.nextArtworkId }; }
  checkArtworkExistence(hash: string): Result<boolean> { return { ok: true, value: this.state.artworks.has(hash) }; }

  updateArtwork(hash: string, updateTitle: string, updateDescription: string): Result<boolean> {
    const artwork = this.state.artworks.get(hash);
    if (!artwork) return { ok: false, value: ERR_ARTWORK_NOT_FOUND };
    if (artwork.owner !== this.caller) return { ok: false, value: ERR_UPDATE_NOT_AUTHORIZED };
    if (!updateTitle || updateTitle.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (updateDescription.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    const updated: Artwork = { ...artwork, title: updateTitle, description: updateDescription, timestamp: this.blockHeight };
    this.state.artworks.set(hash, updated);
    this.state.artworkUpdates.set(artwork.id, { updateTitle, updateDescription, updateTimestamp: this.blockHeight, updater: this.caller });
    this.events.push({ event: "artwork-updated", id: artwork.id, hash });
    return { ok: true, value: true };
  }

  transferArtworkOwnership(hash: string, recipient: string): Result<boolean> {
    const artwork = this.state.artworks.get(hash);
    if (!artwork) return { ok: false, value: ERR_ARTWORK_NOT_FOUND };
    if (artwork.owner !== this.caller) return { ok: false, value: ERR_TRANSFER_NOT_ALLOWED };
    const updated: Artwork = { ...artwork, owner: recipient };
    this.state.artworks.set(hash, updated);
    const oldOwnerArts = this.state.ownerArtworks.get(this.caller) || [];
    this.state.ownerArtworks.set(this.caller, oldOwnerArts.filter(id => id !== artwork.id));
    const newOwnerArts = this.state.ownerArtworks.get(recipient) || [];
    this.state.ownerArtworks.set(recipient, [...newOwnerArts, artwork.id]);
    this.events.push({ event: "artwork-transferred", id: artwork.id, hash, newOwner: recipient });
    return { ok: true, value: true };
  }
}

describe("IPRegistry", () => {
  let contract: IPRegistryMock;

  beforeEach(() => { contract = new IPRegistryMock(); contract.reset(); });

  it("registers an artwork successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const metadata: Metadata = { category: "digital", createdAt: 0, tags: ["art", "nft"], medium: "pixel", dimensions: { width: 1024, height: 768 }, fileType: "image/png", royaltyRate: 10 };
    const result = contract.registerArtwork("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "My Art", "Description", metadata);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const artwork = contract.getArtwork("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    expect(artwork?.title).toBe("My Art");
    expect(artwork?.metadata.category).toBe("digital");
    expect(contract.stxTransfers).toEqual([{ amount: 100, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects invalid hash length", () => {
    contract.setAuthorityContract("ST2TEST");
    const metadata: Metadata = { category: "digital", createdAt: 0, tags: [], medium: "pixel", dimensions: null, fileType: "image/png", royaltyRate: 10 };
    const result = contract.registerArtwork("short", "Title", "Desc", metadata);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_HASH);
  });

  it("rejects invalid title", () => {
    contract.setAuthorityContract("ST2TEST");
    const metadata: Metadata = { category: "digital", createdAt: 0, tags: [], medium: "pixel", dimensions: null, fileType: "image/png", royaltyRate: 10 };
    const result = contract.registerArtwork("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "", "Desc", metadata);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_TITLE);
  });

  it("rejects update for non-existent artwork", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.updateArtwork("nonexistent", "New Title", "New Desc");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ARTWORK_NOT_FOUND);
  });

  it("rejects transfer for non-existent artwork", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.transferArtworkOwnership("nonexistent", "ST4NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ARTWORK_NOT_FOUND);
  });

  it("sets registration fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setRegistrationFee(200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.registrationFee).toBe(200);
  });
});