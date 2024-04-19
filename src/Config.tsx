 
 // TODO: dynamically populate the endpoints from /.well-known config
 const config = {
    epicAuthEndpoint: process.env.EPIC_AUTH_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    epicTokenEndpoint: process.env.EPIC_TOKEN_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    epicBaseUrl: process.env.EPIC_BASE_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    codeVerifierLocalStorageKey: process.env.CODE_VERIFIER_LOCAL_STORAGE_KEY || 'smart_code_verifier',
    state: process.env.STATE || '12345678',
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000',
    clientId: process.env.CLIENT_ID || ''
 }

 export default config;
