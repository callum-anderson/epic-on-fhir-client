import { useEffect, useState } from "react";
import Loader from "./Loader";
import EpicFhirApi from "./services/EpicFhirApi";
import { useNavigate } from "react-router-dom";
import { TokenData } from "./CommonTypes";
import { Patient } from "fhir/r4";

const GetPatient = ({epicFhirApi, setError}: {epicFhirApi: EpicFhirApi, setError: Function}) => {

    const navigate = useNavigate();

    const [ tokenData, setTokenData ] = useState<TokenData | null>();
    const [ isLoading, setIsLoading ] = useState(false);
    const [ patient, setPatient ] = useState<Patient>();

    useEffect(() => {
        let tokenDataString = localStorage.getItem('tokenData');
        if (!tokenDataString) navigate('/');
        tokenDataString = JSON.parse(tokenDataString as string);
        setTokenData(JSON.parse(tokenDataString as string)); // double JSON parse needed as tokenData wrapped in ""
    }, []);

    if (tokenData && !patient && !isLoading) {

        setIsLoading(true);
        epicFhirApi.getResourceById('Patient', tokenData.patient, tokenData.access_token)
            .then((res) => {
                if (res.status === 401) throw Error(`Error logging in to EPIC: ${res.statusText} ${res.status}`);
                return res.json();
            })
            .then((res) => {
                setPatient(res);
            }).catch(err => {
                console.log(err);
                if (err.toString().includes('401')) {
                    setError('Token expired, please log in to EPIC.');
                } else {
                    setError('Error fetching data from EPIC.');
                }
                window.localStorage.removeItem('tokenData');
                setTokenData(null);
            }).finally(() => setIsLoading(false));
    }

return (
    <div>
        { patient && 
        <div className='bg-light py-2 border-bottom border-dark'>
            <span className='mx-5'>{patient.name?.at(0)?.family || '[UNKNOWN]'}, {patient.name?.at(0)?.given?.join(' ') || '[UNKNOWN]'}</span>
            <span className='mx-5'>{patient.gender? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : ''}</span>
            <span className='mx-5'>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : ''}</span>
            <span className='mx-5'>{patient.telecom?.filter((x: any) => x.system === 'phone')?.at(0)?.value}</span>
            {/* <table className='table'>
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
                        <td></td>
                        <td>{patient.gender? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : undefined}</td>
                        <td>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : ''}</td>
                        <td>{patient.telecom?.filter((x: any) => x.system === 'phone')?.at(0)?.value}</td>
                    </tr>
                </tbody>
            </table> */}
        </div>
        }
        {isLoading && <Loader />}
    </div>
)
};
export default GetPatient;