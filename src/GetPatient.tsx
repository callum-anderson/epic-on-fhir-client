import { useEffect, useState } from "react";
import Loader from "./Loader";
import EpicFhirApi from "./services/EpicFhirApi";
import { Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { TokenData } from "./CommonTypes";
import { Patient } from "fhir/r4";

const GetPatient = ({epicFhirApi}: {epicFhirApi: EpicFhirApi}) => {

    const navigate = useNavigate();

    const [ tokenData, setTokenData ] = useState<TokenData | null>();
    const [ error, setError] = useState('');
    const [ isLoading, setIsLoading ] = useState(false);
    const [ patient, setPatient ] = useState<Patient>();

    useEffect(() => {
        let tokenDataString = localStorage.getItem('tokenData');
        if (!tokenDataString) navigate("/");
        tokenDataString = JSON.parse(tokenDataString as string);
        setTokenData(JSON.parse(tokenDataString as string)); // double JSON parse needed as tokenData wrapped in ""
    }, []);

    if (tokenData && !patient && !isLoading) {

        setIsLoading(true);
        epicFhirApi.getResourceById('Patient', tokenData.patient, tokenData.access_token)
            .then((res) => {
                if (res.status === 401) throw Error('Error logging in to EPIC: ' + res.statusText);
                return res.json();
            })
            .then((res) => {
                setPatient(res);
            }).catch(err => {
                console.log(err);
                setError('Error logging in to EPIC.')
                window.localStorage.removeItem('tokenData');
                setTokenData(null);
            }).finally(() => setIsLoading(false));
    }

return (
    <div>
        <div className='heading'>
            <h4 className="my-5">Patient Profile</h4>
        </div>
        { patient && 
        <div>
            <table className="table">
                <thead>
                    <tr>
                    <th>User ID</th>
                    <th>First Name(s)</th>
                    <th>Family Name</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Phone Number</th>
                    </tr>
                </thead>
                <tbody>
                    <tr key={patient.id}>
                        <td>{patient.id}</td>
                        <td>{patient.name?.at(0)?.given?.join(' ')}</td>
                        <td>{patient.name?.at(0)?.family}</td>
                        <td>{patient.gender? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : undefined}</td>
                        <td>{patient.birthDate}</td>
                        <td>{patient.telecom?.filter((x: any) => x.system === 'phone')?.at(0)?.value}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        }
        {isLoading && <Loader />}
        {error && 
            <Alert variant="danger" className="p-2 my-5">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>}
    </div>
)
};
export default GetPatient;