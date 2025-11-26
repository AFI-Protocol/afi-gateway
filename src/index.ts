/**
 * AFI ↔ Eliza Gateway
 * 
 * This is the entrypoint for the AFI-Eliza integration gateway.
 * 
 * Purpose:
 * - Bootstrap Phoenix/Eliza runtime with AFI-specific character configs
 * - Wire AFI-specific Eliza plugins
 * - Provide client code that calls AFI services (Reactor/Codex/Core) over HTTP/WS
 * 
 * Architecture:
 * - This gateway is an EXTERNAL CLIENT of AFI services
 * - It MUST call AFI APIs (afi-reactor, afi-core) over HTTP/WS
 * - It MUST NOT reimplement AFI scoring, signal logic, or tokenomics
 * - It uses types and client libraries from afi-core
 * 
 * Dependency Direction:
 * - Eliza gateway (this repo) → depends on → AFI services (afi-reactor, afi-core)
 * - AFI services NEVER depend on this gateway
 * 
 * TODO:
 * - Import ElizaOS SDK when ready
 * - Import AFI client libraries from afi-core
 * - Load character configs from ./characters/
 * - Register AFI-specific plugins from ./plugins/
 * - Bootstrap Phoenix/Eliza runtime
 */

console.log('AFI Eliza Gateway - Stub entrypoint');
console.log('TODO: Bootstrap Phoenix/Eliza runtime with AFI integration');

export {};

