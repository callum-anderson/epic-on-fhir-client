import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";
import { BundleEntry, Observation } from 'fhir/r4';
import { TokenData } from "./CommonTypes";
import EpicFhirApi from "./services/EpicFhirApi";
import { Col, Form, Row } from "react-bootstrap";

const GetResults = ({epicFhirApi, setError, category}: {epicFhirApi: EpicFhirApi, setError: Function, category: string}) => {

  const navigate = useNavigate();

    const [ tokenData, setTokenData ] = useState<TokenData | null>();
    const [ isLoading, setIsLoading ] = useState(false);
    const [ filterField, setFilterField ] = useState('');
    const [ results, setResults ] = useState<Observation[]>();

    useEffect(() => {
        let tokenDataString = localStorage.getItem('tokenData');
        if (!tokenDataString) navigate('/');
        tokenDataString = JSON.parse(tokenDataString as string);
        setTokenData(JSON.parse(tokenDataString as string)); // double JSON parse needed as tokenData wrapped in ""
    }, []);

    if (tokenData && !results && !isLoading) {

        setIsLoading(true);
        const queryParams = new URLSearchParams({
          subject: tokenData.patient,
          category: category
        });
        epicFhirApi.searchResourceWithQueryParams('Observation', queryParams, tokenData.access_token)
            .then((res) => {
                if (res.status === 401) throw Error('Error logging in to EPIC: ' + res.statusText);
                return res.json();
            })
            .then((res) => {
                setResults(res.entry?.filter(
                  (x: any) => x.resource.resourceType === 'Observation'
                  ).map((bundleEntry: BundleEntry) => bundleEntry.resource));
            }).catch(err => {
                console.log(err);
                setError('Error logging in to EPIC.')
                window.localStorage.removeItem('tokenData');
                setTokenData(null);
            }).finally(() => setIsLoading(false));
    }

    const mapResultValue = (result: Observation): string => {
      switch (result.code.text) {
        case 'Blood Pressure':
          return result.component ? 
            result.component.map(component => `${component.code?.text}: ${component.valueQuantity?.value} ${component.valueQuantity?.unit}`).join(' | ')
            : '';
        default:
            return result.valueQuantity ? `${result.valueQuantity.value || ''} ${result.valueQuantity.unit || ''}` : ''
      }

    }

    const handleSortFilter = (event: any) => {
      setFilterField(event.target.value);
    }

return (
    <div>
        { results && 
        <div>
            <div className='heading'>
              <h4 className='my-5'>{category === 'vital-signs' ? 'Vital Signs' : 'Lab Results' }</h4>
            </div>
            <Row className='my-4 align-items-center justify-content-md-center'>
              <Col sm={3}>
                <strong>Filter</strong>
              </Col>
              <Col sm={5}>
                <Form.Select aria-label='Sort filter' onChange={handleSortFilter}>
                  <option value=''></option>
                  {
                    Array.from(new Set(results.map(x => x.code.text))).map(x => {
                      return (<option key={x} value={x}>{x}</option>)
                    })
                  }
                </Form.Select>
              </Col>
            </Row>
            <table className='table'>
                <thead>
                    <tr>
                    <th>Description</th>
                    <th>Value</th>
                    <th>Date</th>
                    <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                  {results.filter((x: any) => {
                    if (!filterField) return true;
                    return (x.code.text === filterField);
                  })
                    .map((result: Observation, i) => {
                    return (
                      <tr key={result.id}>
                        <td>{result.code?.text}</td>
                        <td>{mapResultValue(result)}</td>
                        <td>{result.effectiveDateTime ? new Date(result.effectiveDateTime).toLocaleDateString() : ''}</td>
                        <td>{result.status || 'unknown'}</td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
        </div>
        }
        {isLoading && <Loader />}
    </div>
)
};

export default GetResults;
