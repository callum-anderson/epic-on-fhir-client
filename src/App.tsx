import './App.css';
import './services/EpicFhirApi';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import { Route, Routes, useSearchParams } from "react-router-dom";
import Header from "./Header";
import { generateCodeChallengeFromVerifier, generateCodeVerifier } from './services/CodeVerifier';
import { useState } from 'react';
import EpicFhirApi from './services/EpicFhirApi';
import GetPatient from './GetPatient';
import { TokenData } from './CommonTypes';

function App() {

  // TODO: move these to a config class
  const EPIC_AUTH_ENDPOINT = new URL('https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize');
  const EPIC_TOKEN_ENDPOINT = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
  const EPIC_BASE_URL = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
  const CODE_VERIFIER_LOCAL_STORAGE_KEY = 'smart_code_verifier';
  const STATE = '12345678';
  const REDIRECT_URI = 'http://localhost:3000';
  const CLIENT_ID = 'd4f2a942-75cc-44ee-8046-eaa736a55c9b';

  const [searchParams, setSearchParams] = useSearchParams();
  const authCode = searchParams.get("code");
  const smartCodeVerifier = window.localStorage.getItem(CODE_VERIFIER_LOCAL_STORAGE_KEY);
  const tokenDataString = window.localStorage.getItem('tokenData');

  const epicFhirApi = new EpicFhirApi(EPIC_BASE_URL);

  const [ error, setError ] = useState('');
  const [ tokenData, setTokenData ] = useState<TokenData | null>(tokenDataString ? JSON.parse(tokenDataString) : null);

  const generateAuthUrl = (smartChallengeCode: string) => {
    EPIC_AUTH_ENDPOINT.searchParams.append('client_id', CLIENT_ID);
    EPIC_AUTH_ENDPOINT.searchParams.append('state', STATE);
    EPIC_AUTH_ENDPOINT.searchParams.append('redirect_uri', REDIRECT_URI);
    EPIC_AUTH_ENDPOINT.searchParams.append('response_type', 'code');
    EPIC_AUTH_ENDPOINT.searchParams.append('aud', EPIC_BASE_URL);
    EPIC_AUTH_ENDPOINT.searchParams.append('code_challenge', smartChallengeCode);
    EPIC_AUTH_ENDPOINT.searchParams.append('code_challenge_method', 'S256');

    return EPIC_AUTH_ENDPOINT;
  }

  const getCodeVerifierCodeChallenge = async (smartCodeVerifier: string) => {
    const codeVerifierChallenge = await generateCodeChallengeFromVerifier(smartCodeVerifier);
    return codeVerifierChallenge;
  }

  const makeTokenRequest = async (code: string, codeVerifier: string) => {

    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('client_id', CLIENT_ID);
    formData.append('code_verifier', codeVerifier);
    formData.append('redirect_uri', REDIRECT_URI);

    try {
      const response = await fetch(EPIC_TOKEN_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });
      console.log(response);
      if (!response.ok) throw Error('Error fetching token. ' + response.statusText);
      const responseData = await response.text();
  
      return responseData;
    } catch (error) {
      console.log(error);
    }

  }

  const handleLogin = async () => {
    console.log('handleLogin' + smartCodeVerifier);
    if (smartCodeVerifier) {
      const smartChallengeCode = await getCodeVerifierCodeChallenge(smartCodeVerifier);
      const authUrl = generateAuthUrl(smartChallengeCode);

      window.location.assign(authUrl);
    } else {
      setError('Something went wrong.');
    }
  }

  if (!tokenData) {
    console.log('no token data');
    if (authCode && smartCodeVerifier) {
      makeTokenRequest(authCode, smartCodeVerifier)
        .then((res) => {
          setTokenData(res as any as TokenData);
          localStorage.setItem('tokenData', JSON.stringify(res));
          localStorage.removeItem(CODE_VERIFIER_LOCAL_STORAGE_KEY);
      });
    } else {
      const codeVerifier = window.localStorage.getItem(CODE_VERIFIER_LOCAL_STORAGE_KEY) || generateCodeVerifier();
    
      window.localStorage.setItem(CODE_VERIFIER_LOCAL_STORAGE_KEY, codeVerifier);
    }
  }

  return (
    <div className="App">
      <Header />
      <Container>
          <Routes>
            <Route path="/" element={
              <div>
                {(!authCode && !tokenData) && 
                  <Button onClick={handleLogin} className="mx-auto mt-5">Login to EPIC</Button>
                }
                {tokenData && 
                  <GetPatient epicFhirApi={epicFhirApi} />
                }
              </div>
            } />
            {/* <Route path="/get-patient/" element={<GetPatient epicFhirApi={epicFhirApi} />} /> */}
            {/* <Route path="/get-medications" element={<GetMedications fhirApi={fhirApi} />} /> */}
            {/* <Route path="/get-patients" element={<GetLabResults fhirApi={fhirApi} />} /> */}
          </Routes>
      </Container>
    </div>
  );
}

export default App;
