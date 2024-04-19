import './App.css';
import './services/EpicFhirApi';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import { generateCodeChallengeFromVerifier, generateCodeVerifier } from './services/CodeVerifier';
import React, { useState } from 'react';
import EpicFhirApi from './services/EpicFhirApi';
import GetPatient from './GetPatient';
import { TokenData } from './CommonTypes';
import GetMedications from './GetMedications';
import { Alert } from 'react-bootstrap';
import GetResults from './GetResults';
import config from './Config';

function App() {

  const navigate = useNavigate();

  const { epicAuthEndpoint, epicTokenEndpoint, epicBaseUrl, codeVerifierLocalStorageKey, 
    state, redirectUri, clientId } = config;

  const [searchParams, setSearchParams] = useSearchParams();
  const authCode = searchParams.get('code');
  let smartCodeVerifier = window.localStorage.getItem(codeVerifierLocalStorageKey);
  const tokenDataString = window.localStorage.getItem('tokenData');

  const epicFhirApi = new EpicFhirApi(epicBaseUrl);

  const [ error, setError ] = useState('');
  const [ tokenData, setTokenData ] = useState<TokenData | null>(tokenDataString ? JSON.parse(tokenDataString) : null);

  const generateAuthUrl = (smartChallengeCode: string) => {
    const authEndpoint = new URL(epicAuthEndpoint);
    authEndpoint.searchParams.append('client_id', clientId);
    authEndpoint.searchParams.append('state', state);
    authEndpoint.searchParams.append('redirect_uri', redirectUri);
    authEndpoint.searchParams.append('response_type', 'code');
    authEndpoint.searchParams.append('aud', epicBaseUrl);
    authEndpoint.searchParams.append('code_challenge', smartChallengeCode);
    authEndpoint.searchParams.append('code_challenge_method', 'S256');

    return authEndpoint;
  }

  const getCodeVerifierCodeChallenge = async (smartCodeVerifier: string) => {
    const codeVerifierChallenge = await generateCodeChallengeFromVerifier(smartCodeVerifier);
    return codeVerifierChallenge;
  }

  const makeTokenRequest = async (code: string, codeVerifier: string) => {

    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('client_id', clientId);
    formData.append('code_verifier', codeVerifier);
    formData.append('redirect_uri', redirectUri);

    try {
      const response = await fetch(epicTokenEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) throw Error('Error fetching token. ' + response.statusText);
      const responseData = await response.text();
  
      return responseData;
    } catch (error) {
      setError('Error logging in to EPIC.')
      console.log(error);
    }

  }

  const handleLogin = async () => {
    
    setError('');
    if (!smartCodeVerifier) {
      smartCodeVerifier = window.localStorage.getItem(codeVerifierLocalStorageKey) || generateCodeVerifier();
    
      window.localStorage.setItem(codeVerifierLocalStorageKey, smartCodeVerifier);
    }

    const smartChallengeCode = await getCodeVerifierCodeChallenge(smartCodeVerifier);
    const authUrl = generateAuthUrl(smartChallengeCode);

    window.location.assign(authUrl);

  }

  const handleLogout = async () => {
    
    setError('');
    setTokenData(null);
    window.localStorage.clear();

    navigate('/');
  }

  if (!tokenData) {
    if (authCode && smartCodeVerifier) {
      makeTokenRequest(authCode, smartCodeVerifier)
        .then((res) => {
          setTokenData(res as any as TokenData);
          
          localStorage.setItem('tokenData', JSON.stringify(res));
          localStorage.removeItem(codeVerifierLocalStorageKey);
      });
    } else {
      const codeVerifier = window.localStorage.getItem(codeVerifierLocalStorageKey) || generateCodeVerifier();
    
      window.localStorage.setItem(codeVerifierLocalStorageKey, codeVerifier);
    }
  }

  return (
    <div className='App'>
      <Header tokenData={tokenData} handleLogout={handleLogout}/>
      {tokenData && 
        <GetPatient epicFhirApi={epicFhirApi} setError={setError} />
      }
      <Container>
          <Routes>
            <Route path='/' element={
              <div>
                {((!authCode && !tokenData) || error) && 
                  <Button onClick={handleLogin} className='mx-auto mt-5'>Login to EPIC</Button>
                }
              </div>
            } />
            <Route path='/get-medications' element={<GetMedications epicFhirApi={epicFhirApi} setError={setError} key={'medications'} />} />
            <Route path='/get-lab-results' element={<GetResults epicFhirApi={epicFhirApi} setError={setError} category='laboratory' key={'lab-results'} />} />
            <Route path='/get-vital-signs' element={<GetResults epicFhirApi={epicFhirApi} setError={setError} category='vital-signs' key={'vital-signs'} />} />
          </Routes>
          {error && 
            <Alert variant='danger' className='p-2 my-5'>
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>}
      </Container>
    </div>
  );
}

export default App;
